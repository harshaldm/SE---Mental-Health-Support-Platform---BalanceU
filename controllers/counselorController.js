const User = require('../models/User');
const Institute = require('../models/Institute');
const CounselorInstitute = require('../models/CounselorInstitute');
const StudentDetails = require('../models/StudentDetails');
const QuizResult = require('../models/QuizResult');
const AssessmentDetails = require('../models/AssessmentDetails');

// ─── Apply to an Institute ───
// POST /api/counselor/apply
// Body: { institute_id }
const applyToInstitute = async (req, res) => {
  try {
    const counselorId = req.user.id;
    const { institute_id } = req.body;

    if (!institute_id) {
      return res.status(400).json({ error: 'institute_id is required' });
    }

    // Verify the institute exists
    const institute = await Institute.findByPk(institute_id);
    if (!institute) {
      return res.status(404).json({ error: 'Institute not found' });
    }

    // Check for an existing application (pending or active)
    const existing = await CounselorInstitute.findOne({
      where: { counselor_id: counselorId, institute_id },
    });

    if (existing) {
      const statusMsg = existing.status === 'active' ? 'already active at' : 'already applied to';
      return res.status(409).json({ error: `You are ${statusMsg} this institute` });
    }

    const application = await CounselorInstitute.create({
      counselor_id: counselorId,
      institute_id,
      status: 'pending',
    });

    res.status(201).json({
      message: `Application submitted to ${institute.name}. Awaiting admin approval.`,
      application,
    });
  } catch (error) {
    console.error('❌ Error applying to institute:', error.message);
    res.status(500).json({ error: 'Failed to submit application' });
  }
};

// ─── Get My Institutes ───
// GET /api/counselor/my-institutes
// Returns all institutes (with status) for the logged-in counselor
const getMyInstitutes = async (req, res) => {
  try {
    const counselorId = req.user.id;

    const applications = await CounselorInstitute.findAll({
      where: { counselor_id: counselorId },
      include: [
        {
          model: Institute,
          as: 'institute',
          attributes: ['id', 'name', 'type'],
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    res.status(200).json({
      total: applications.length,
      institutes: applications.map(app => ({
        application_id: app.id,
        status: app.status,
        institute: app.institute,
        applied_at: app.createdAt,
      })),
    });
  } catch (error) {
    console.error('❌ Error fetching institutes:', error.message);
    res.status(500).json({ error: 'Failed to fetch institutes' });
  }
};

// ─── Get Students for Active Institute ───
// GET /api/counselor/students
// Reads the X-Active-Institute header to scope results to the counselor's selected institute
const getStudents = async (req, res) => {
  try {
    const counselorId = req.user.id;

    // Multi-tenant: read from header first, fallback to JWT for legacy single-institute counselors
    const activeInstituteId = req.headers['x-active-institute'] || req.user.institute_id;

    if (!activeInstituteId) {
      return res.status(400).json({
        error: 'No active institute selected. Please select an institute from your dashboard.',
      });
    }

    // Verify counselor has an active membership at this institute
    const membership = await CounselorInstitute.findOne({
      where: { counselor_id: counselorId, institute_id: activeInstituteId, status: 'active' },
    });

    if (!membership) {
      return res.status(403).json({
        error: 'You do not have active access to this institute.',
      });
    }

    // 1. Fetch all students from PostgreSQL for this institute
    const students = await User.findAll({
      where: {
        institute_id: activeInstituteId,
        role: 'Student',
      },
      attributes: ['id', 'email', 'createdAt'],
      order: [['createdAt', 'DESC']],
    });

    if (students.length === 0) {
      return res.status(200).json({ message: 'No students found', students: [] });
    }

    // 2. Fetch custom details from MongoDB for those student IDs
    const studentIds = students.map(s => s.id);
    const detailsDocs = await StudentDetails.find({
      user_id: { $in: studentIds },
    });

    // Build a lookup map: user_id → custom data
    const detailsMap = {};
    detailsDocs.forEach(doc => {
      detailsMap[doc.user_id] = doc.data;
    });

    // 3. Merge SQL + NoSQL data
    const merged = students.map(student => ({
      id: student.id,
      email: student.email,
      registered_at: student.createdAt,
      profile_details: detailsMap[student.id] || null,
    }));

    // 4. Filter by search query (if provided)
    const { search } = req.query;
    let results = merged;

    if (search && search.trim()) {
      const term = search.trim().toLowerCase();
      results = merged.filter(student => {
        if (student.email.toLowerCase().includes(term)) return true;
        if (student.profile_details && typeof student.profile_details === 'object') {
          return Object.values(student.profile_details).some(value =>
            String(value).toLowerCase().includes(term)
          );
        }
        return false;
      });
    }

    res.status(200).json({
      institute_id: activeInstituteId,
      search: search || null,
      total: results.length,
      students: results,
    });
  } catch (error) {
    console.error('❌ Error fetching students:', error.message);
    res.status(500).json({ error: 'Failed to fetch students' });
  }
};

// ─── Get Shared Reports for a Student ───
// GET /api/counselor/reports/:student_id
const getStudentReports = async (req, res) => {
  try {
    const counselorId = req.user.id;
    const activeInstituteId = req.headers['x-active-institute'] || req.user.institute_id;
    const studentId = parseInt(req.params.student_id, 10);

    // Verify student exists and belongs to the active institute
    const student = await User.findOne({
      where: { id: studentId, role: 'Student', institute_id: activeInstituteId },
      attributes: ['id', 'email'],
    });

    if (!student) {
      return res.status(404).json({ error: 'Student not found at your active institute' });
    }

    // Verify counselor has active membership
    const membership = await CounselorInstitute.findOne({
      where: { counselor_id: counselorId, institute_id: activeInstituteId, status: 'active' },
    });

    if (!membership) {
      return res.status(403).json({ error: 'You do not have active access to this institute.' });
    }

    // Fetch shared quiz results
    const sharedResults = await QuizResult.findAll({
      where: { user_id: studentId, shared_with_counselor: true },
      order: [['createdAt', 'DESC']],
    });

    if (sharedResults.length === 0) {
      return res.status(200).json({
        student: { id: student.id, email: student.email },
        message: 'No shared assessments found',
        reports: [],
      });
    }

    // Fetch assessment details from MongoDB
    const quizResultIds = sharedResults.map(r => r.id);
    const detailsDocs = await AssessmentDetails.find({
      quiz_result_id: { $in: quizResultIds },
    });

    const detailsMap = {};
    detailsDocs.forEach(doc => {
      detailsMap[doc.quiz_result_id] = {
        question_responses: doc.question_responses,
        ai_sentiment_analysis: doc.ai_sentiment_analysis,
      };
    });

    const reports = sharedResults.map(result => ({
      id: result.id,
      quiz_type: result.quiz_type,
      total_score: result.total_score,
      risk_level: result.risk_level,
      taken_at: result.createdAt,
      details: detailsMap[result.id] || null,
    }));

    res.status(200).json({
      student: { id: student.id, email: student.email },
      total: reports.length,
      reports,
    });
  } catch (error) {
    console.error('❌ Error fetching student reports:', error.message);
    res.status(500).json({ error: 'Failed to fetch student reports' });
  }
};

module.exports = { applyToInstitute, getMyInstitutes, getStudents, getStudentReports };
