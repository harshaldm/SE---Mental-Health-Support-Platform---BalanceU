const User = require('../models/User');
const StudentDetails = require('../models/StudentDetails');
const QuizResult = require('../models/QuizResult');
const AssessmentDetails = require('../models/AssessmentDetails');

// ─── Get Students for Counselor's Institute ───
// GET /api/counselor/students
// Hybrid fetch: PostgreSQL (user basics) + MongoDB (custom details)
const getStudents = async (req, res) => {
  try {
    const counselorInstituteId = req.user.institute_id;

    // 1. Fetch all students from PostgreSQL for this institute
    const students = await User.findAll({
      where: {
        institute_id: counselorInstituteId,
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

    // 3. Merge SQL + NoSQL data into a clean list
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
        // Check email
        if (student.email.toLowerCase().includes(term)) return true;

        // Check all values inside profile_details (custom_data from MongoDB)
        if (student.profile_details && typeof student.profile_details === 'object') {
          return Object.values(student.profile_details).some(value =>
            String(value).toLowerCase().includes(term)
          );
        }

        return false;
      });
    }

    res.status(200).json({
      institute_id: counselorInstituteId,
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
// Hybrid fetch: PostgreSQL (shared quiz results) + MongoDB (responses + AI summaries)
const getStudentReports = async (req, res) => {
  try {
    const counselorInstituteId = req.user.institute_id;
    const studentId = parseInt(req.params.student_id, 10);

    // 1. Verify the student exists and belongs to the same institute
    const student = await User.findOne({
      where: { id: studentId, role: 'Student', institute_id: counselorInstituteId },
      attributes: ['id', 'email'],
    });

    if (!student) {
      return res.status(404).json({ error: 'Student not found at your institute' });
    }

    // 2. Fetch all shared quiz results from PostgreSQL
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

    // 3. Fetch matching assessment details from MongoDB
    const quizResultIds = sharedResults.map(r => r.id);
    const detailsDocs = await AssessmentDetails.find({
      quiz_result_id: { $in: quizResultIds },
    });

    // Build lookup map: quiz_result_id → assessment details
    const detailsMap = {};
    detailsDocs.forEach(doc => {
      detailsMap[doc.quiz_result_id] = {
        question_responses: doc.question_responses,
        ai_sentiment_analysis: doc.ai_sentiment_analysis,
      };
    });

    // 4. Merge into a combined report list
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

module.exports = { getStudents, getStudentReports };
