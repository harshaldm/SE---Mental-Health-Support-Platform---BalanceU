const { Op } = require('sequelize');
const User = require('../models/User');
const Institute = require('../models/Institute');
const CounselorInstitute = require('../models/CounselorInstitute');
const StudentDetails = require('../models/StudentDetails');
const QuizResult = require('../models/QuizResult');
const AssessmentDetails = require('../models/AssessmentDetails');
const CounselingRequest = require('../models/CounselingRequest');

// ─── Apply to an Institute ───
const applyToInstitute = async (req, res) => {
  try {
    const counselorId = req.user.id;
    const { institute_id } = req.body;
    if (!institute_id) return res.status(400).json({ error: 'institute_id is required' });
    const institute = await Institute.findByPk(institute_id);
    if (!institute) return res.status(404).json({ error: 'Institute not found' });
    const existing = await CounselorInstitute.findOne({ where: { counselor_id: counselorId, institute_id } });
    if (existing) return res.status(409).json({ error: `You have already applied/active at this institute` });
    const application = await CounselorInstitute.create({ counselor_id: counselorId, institute_id, status: 'pending' });
    console.log(`[CounselorController.js] -> Received application for Institute ID: ${institute_id}.`);
    res.status(201).json({ message: `Application submitted to ${institute.name}.`, application });
  } catch (error) {
    res.status(500).json({ error: 'Failed to submit application' });
  }
};

// ─── Get My Institutes ───
const getMyInstitutes = async (req, res) => {
  try {
    const counselorId = req.user.id;
    const applications = await CounselorInstitute.findAll({
      where: { counselor_id: counselorId },
      include: [{ model: Institute, as: 'institute', attributes: ['id', 'name', 'type'] }],
      order: [['createdAt', 'DESC']],
    });
    res.status(200).json({ institutes: applications.map(app => ({ application_id: app.id, status: app.status, institute: app.institute, applied_at: app.createdAt })) });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch institutes' });
  }
};

// ─── Get Students (Accepted Caseload Only) ───
const getStudents = async (req, res) => {
  try {
    const counselorId = req.user.id;
    const activeInstituteId = req.headers['x-active-institute'] || req.user.institute_id;

    if (!activeInstituteId) return res.status(400).json({ error: 'No active institute selected.' });

    const membership = await CounselorInstitute.findOne({
      where: { counselor_id: counselorId, institute_id: activeInstituteId, status: 'active' },
    });
    if (!membership) return res.status(403).json({ error: 'You do not have active access to this institute.' });

    console.log(`[counselorController.js] -> Fetching caseload for Counselor ${counselorId} at Institute ${activeInstituteId}.`);

    const students = await User.findAll({
      where: { role: 'Student' },
      include: [
        {
          model: CounselingRequest,
          as: 'studentRequests',
          where: { counselor_id: counselorId, institute_id: activeInstituteId, status: 'accepted' },
          required: true
        },
        {
          model: QuizResult,
          as: 'quizResults',
          limit: 1,
          order: [['createdAt', 'DESC']]
        }
      ],
      attributes: ['id', 'email', 'createdAt', 'full_name'],
      order: [['createdAt', 'DESC']],
    });

    const studentIds = students.map(s => s.id);
    const detailsDocs = await StudentDetails.find({ user_id: { $in: studentIds } });
    const detailsMap = {};
    detailsDocs.forEach(doc => { detailsMap[doc.user_id] = doc.data; });

    const results = students.map(student => {
      const latestQuiz = student.quizResults && student.quizResults[0];
      const activeRequest = student.studentRequests[0];
      return {
        id: student.id,
        email: student.email,
        full_name: student.full_name || (student.profile_metadata?.full_name) || student.email.split('@')[0],
        registered_at: student.createdAt,
        risk_level: latestQuiz ? latestQuiz.risk_level : 'Low',
        total_score: latestQuiz ? latestQuiz.total_score : 0,
        appointment_id: activeRequest.notes ? parseInt(activeRequest.notes, 10) : activeRequest.appointment_id,
        profile_details: detailsMap[student.id] || null,
      };
    });

    res.status(200).json({ students: results });
  } catch (error) {
    console.error('❌ Error fetching caseload:', error.message);
    res.status(500).json({ error: 'Failed to fetch caseload' });
  }
};

// ─── Get Unified Clinical Details for a Student ───
// Mirrored from adminController.js with Caseload Scoping
const getStudentClinicalDetails = async (req, res) => {
  try {
    const counselorId = req.user.id;
    const activeInstituteId = req.headers['x-active-institute'] || req.user.institute_id;
    const studentId = parseInt(req.params.student_id, 10);

    // 1. Security Check: Assigned to this Counselor?
    const activeRequest = await CounselingRequest.findOne({
      where: { 
        counselor_id: counselorId, 
        student_id: studentId, 
        institute_id: activeInstituteId, 
        status: { [Op.or]: ['pending', 'accepted'] }
      }
    });

    if (!activeRequest) {
      return res.status(403).json({ error: 'Data Access Denied: User not in your assigned caseload.' });
    }

    console.log(`[counselorController.js] -> Detailed analysis fetched for Pending Request ${activeRequest.id}.`);

    // 2. Fetch Latest Quiz Result (SQL)
    const latestQuiz = await QuizResult.findOne({
      where: { user_id: studentId },
      order: [['createdAt', 'DESC']]
    });

    if (!latestQuiz) {
      return res.status(200).json({ latestReport: null });
    }

    // 3. Fetch Full Assessment Details (MongoDB)
    const details = await AssessmentDetails.findOne({ quiz_result_id: latestQuiz.id });
    
    // 4. Merge Logic (Admin Mirror)
    const latestReport = {
      total_score: latestQuiz.total_score,
      risk_level: latestQuiz.risk_level,
      ai_analysis: details ? details.ai_sentiment_analysis : "No AI analysis available.",
      createdAt: latestQuiz.createdAt,
      question_responses: details ? details.question_responses.map(r => ({
        question: r.question,
        selected_option: r.choiceLabel && r.choiceLabel !== 'N/A' ? r.choiceLabel : `Score: ${r.score}`,
        text_answer: r.text || null
      })) : []
    };

    console.log(`[counselorController.js] -> Data Logic Sync: Fetched mirrored clinical payload for Student ${studentId}.`);

    res.status(200).json({ latestReport });
  } catch (error) {
    console.error('❌ Error fetching clinical details:', error.message);
    res.status(500).json({ error: 'Failed to fetch clinical details.' });
  }
};

// ─── Get Student Reports ───
const getStudentReports = async (req, res) => {
  try {
    const counselorId = req.user.id;
    const activeInstituteId = req.headers['x-active-institute'] || req.user.institute_id;
    const studentId = parseInt(req.params.student_id, 10);

    const student = await User.findOne({ where: { id: studentId, role: 'Student', institute_id: activeInstituteId } });
    if (!student) return res.status(404).json({ error: 'Student not found.' });

    const sharedResults = await QuizResult.findAll({
      where: { user_id: studentId, shared_with_counselor: true },
      order: [['createdAt', 'DESC']],
    });

    const quizResultIds = sharedResults.map(r => r.id);
    const detailsDocs = await AssessmentDetails.find({ quiz_result_id: { $in: quizResultIds } });
    const detailsMap = {};
    detailsDocs.forEach(doc => { detailsMap[doc.quiz_result_id] = { question_responses: doc.question_responses, ai_sentiment_analysis: doc.ai_sentiment_analysis }; });

    const reports = sharedResults.map(result => ({
      id: result.id,
      quiz_type: result.quiz_type,
      total_score: result.total_score,
      risk_level: result.risk_level,
      taken_at: result.createdAt,
      details: detailsMap[result.id] || null,
    }));

    res.status(200).json({ student: { id: student.id, email: student.email }, reports });
  } catch (error) {
    res.status(500).json({ error: 'Failed' });
  }
};

// ─── Profile Endpoints ───
const getProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, { attributes: ['id', 'full_name', 'email', 'profile_metadata'] });
    res.status(200).json(user);
  } catch (error) { res.status(500).json({ error: 'Failed' }); }
};

const updateProfile = async (req, res) => {
  try {
    const { specialization, years_of_experience, bio } = req.body;
    const user = await User.findByPk(req.user.id);
    const meta = user.profile_metadata || {};
    user.profile_metadata = { ...meta, specialization, experience: years_of_experience, bio };
    await user.save();
    console.log(`[counselorController.js] -> Updating clinical metadata for Counselor ${user.id}.`);
    res.status(200).json({ message: 'Updated', profile_metadata: user.profile_metadata });
  } catch (error) { res.status(500).json({ error: 'Failed' }); }
};

module.exports = { applyToInstitute, getMyInstitutes, getStudents, getStudentReports, getStudentClinicalDetails, getProfile, updateProfile };
