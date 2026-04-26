const User = require('../models/User');
const Institute = require('../models/Institute');
const CounselorInstitute = require('../models/CounselorInstitute');
const CounselingRequest = require('../models/CounselingRequest');
const MoodLog = require('../models/MoodLog');
const QuizResult = require('../models/QuizResult');
const AssessmentDetails = require('../models/AssessmentDetails');
const { Op } = require('sequelize');

// ─── GET /api/admin/dashboard-stats ───
const getDashboardStats = async (req, res) => {
  try {
    const adminInstituteId = req.user.institute_id;
    if (!adminInstituteId) return res.status(400).json({ error: 'Admin has no attached institute' });

    console.log(`[adminController.js : getDashboardStats] -> Scoping query to Institute ID: ${adminInstituteId}.`);

    const studentCount = await User.count({
      where: {
        institute_id: adminInstituteId,
        role: 'Student'
      }
    });

    const counselorCount = await CounselorInstitute.count({
      where: {
        institute_id: adminInstituteId,
        status: 'active'
      }
    });

    // ─── Mood Average Logic ───
    const today = new Date().toISOString().split('T')[0];
    const todayMoods = await MoodLog.findAll({
      where: { log_date: today },
      include: [{
        model: User,
        where: { institute_id: adminInstituteId, role: 'Student' },
        attributes: []
      }],
      attributes: ['mood_score']
    });

    const sum = todayMoods.reduce((acc, log) => acc + log.mood_score, 0);
    const averageMood = studentCount > 0 ? (sum / studentCount).toFixed(1) : 0;

    console.log(`[adminController.js : getDashboardStats] -> Daily Pulse: ${sum} total / ${studentCount} students = ${averageMood}.`);

    const formattedDate = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    res.status(200).json({
      success: true,
      stats: {
        counselorCount,
        studentCount,
        averageMood,
        currentDate: formattedDate
      }
    });
  } catch (error) {
    console.error('❌ Error fetching dashboard stats:', error.message);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
};

// ─── GET /api/admin/pending-counselors ───
// Legacy: counselors who applied with a fixed institute_id and is_hired=false
const getPendingCounselors = async (req, res) => {
  try {
    const adminInstituteId = req.user.institute_id;
    if (!adminInstituteId) return res.status(400).json({ error: 'Admin has no attached institute' });

    const counselors = await User.findAll({
      where: {
        institute_id: adminInstituteId,
        role: 'Counselor',
        is_hired: false
      },
      attributes: ['id', 'email', 'institute_id', 'profile_metadata', 'createdAt']
    });

    res.status(200).json({ counselors });
  } catch (error) {
    console.error('❌ Error fetching pending counselors:', error.message);
    res.status(500).json({ error: 'Failed to fetch pending counselors' });
  }
};

// ─── PATCH /api/admin/hire-counselor/:id ───
// Legacy: approve a counselor who applied with a fixed institute_id
const hireCounselor = async (req, res) => {
  try {
    const counselorId = req.params.id;
    const adminInstituteId = req.user.institute_id;

    const counselor = await User.findOne({
      where: { id: counselorId, role: 'Counselor', institute_id: adminInstituteId }
    });

    if (!counselor) return res.status(404).json({ error: 'Counselor application not found or mismatched institute' });

    counselor.is_hired = true;
    await counselor.save();

    res.status(200).json({ message: 'Counselor hired successfully' });
  } catch (error) {
    console.error('❌ Error hiring counselor:', error.message);
    res.status(500).json({ error: 'Failed to approve counselor' });
  }
};

// ─── GET /api/admin/pending-applications ───
// Multi-tenant: counselors who applied via the new CounselorInstitute table
const getPendingApplications = async (req, res) => {
  try {
    const adminInstituteId = req.user.institute_id;
    if (!adminInstituteId) {
      return res.status(400).json({ error: 'Admin has no attached institute' });
    }

    const applications = await CounselorInstitute.findAll({
      where: {
        institute_id: adminInstituteId,
        status: 'pending',
      },
      include: [
        {
          model: User,
          as: 'counselor',
          attributes: ['id', 'email', 'profile_metadata', 'createdAt'],
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    res.status(200).json({
      total: applications.length,
      applications: applications.map(app => ({
        application_id: app.id,
        status: app.status,
        applied_at: app.createdAt,
        counselor: {
          id: app.counselor.id,
          email: app.counselor.email,
          full_name: app.counselor.profile_metadata?.full_name,
          specialization: app.counselor.profile_metadata?.specialization,
          experience: app.counselor.profile_metadata?.experience,
          bio: app.counselor.profile_metadata?.bio,
          documents: app.counselor.profile_metadata?.documents,
        },
      })),
    });
  } catch (error) {
    console.error('❌ Error fetching pending applications:', error.message);
    res.status(500).json({ error: 'Failed to fetch pending applications' });
  }
};

// ─── GET /api/admin/counselors ───
// Left Column: Active Counselors, Right Column: Pending Applicants
const getCounselors = async (req, res) => {
  try {
    const adminInstituteId = req.user.institute_id;
    if (!adminInstituteId) return res.status(400).json({ error: 'Admin has no attached institute' });
    
    console.log(`[adminController.js] -> Fetching Counselor lists for Institute: ${adminInstituteId}.`);

    const allAssociations = await CounselorInstitute.findAll({
      where: { institute_id: adminInstituteId },
      include: [{
        model: User,
        as: 'counselor',
        attributes: ['id', 'email', 'profile_metadata', 'createdAt']
      }]
    });

    const activeList = [];
    const pendingList = [];

    for (const assoc of allAssociations) {
      const c = assoc.counselor;
      if (!c) continue;
      
      const payload = {
        application_id: assoc.id,
        counselor_id: c.id,
        email: c.email,
        full_name: c.profile_metadata?.full_name,
        specialization: c.profile_metadata?.specialization,
        bio: c.profile_metadata?.bio,
        documents: {
          license_url: c.profile_metadata?.documents?.license ? `/uploads/${c.profile_metadata.documents.license}` : null,
          degree_url: c.profile_metadata?.documents?.degree ? `/uploads/${c.profile_metadata.documents.degree}` : null,
        },
        applied_at: assoc.createdAt
      };

      if (assoc.status === 'active') {
        const studentCount = await CounselingRequest.count({
           where: { counselor_id: c.id, status: 'accepted', institute_id: adminInstituteId },
           distinct: true,
           col: 'student_id'
        });
        console.log(`[adminController.js] -> Calculated ${studentCount} active students for Counselor ${c.id} within Institute ${adminInstituteId}.`);
        activeList.push({ ...payload, studentCount });
      } else if (assoc.status === 'pending') {
        pendingList.push(payload);
      }
    }

    res.status(200).json({
      active: activeList,
      pending: pendingList
    });
  } catch (error) {
    console.error('❌ Error fetching counselors:', error.message);
    res.status(500).json({ error: 'Failed to fetch counselors' });
  }
};

// ─── PUT /api/admin/counselors/approve ───
const approveCounselor = async (req, res) => {
  try {
    const adminInstituteId = req.user.institute_id;
    const { counselor_id, action } = req.body;

    if (!counselor_id || !action) return res.status(400).json({ error: 'counselor_id and action are required' });
    
    const statusVal = action === 'approve' ? 'active' : 'rejected';

    const assoc = await CounselorInstitute.findOne({
      where: { counselor_id, institute_id: adminInstituteId }
    });

    if (!assoc) return res.status(404).json({ error: 'Counselor application not found' });
    
    assoc.status = statusVal;
    await assoc.save();

    if (statusVal === 'active') {
      await User.update({ is_hired: true }, { where: { id: counselor_id } });
    }

    console.log(`[adminController.js] -> Action ${action} processed for Counselor: ${counselor_id}.`);
    
    res.status(200).json({ success: true, new_status: statusVal });
  } catch (err) {
    console.error('❌ Error processing counselor approval:', err.message);
    res.status(500).json({ error: 'Failed to process counselor' });
  }
};

// ─── PUT /api/admin/approve-counselor ───
// Multi-tenant: approve or reject a CounselorInstitute application
// Body: { application_id, action: 'active' | 'rejected' }
const approveCounselorApplication = async (req, res) => {
  try {
    const adminInstituteId = req.user.institute_id;
    const { application_id, action } = req.body;

    if (!application_id || !action) {
      return res.status(400).json({ error: 'application_id and action are required' });
    }

    if (!['active', 'rejected'].includes(action)) {
      return res.status(400).json({ error: 'action must be "active" or "rejected"' });
    }

    // Verify the application belongs to this admin's institute
    const application = await CounselorInstitute.findOne({
      where: { id: application_id, institute_id: adminInstituteId },
    });

    if (!application) {
      return res.status(404).json({ error: 'Application not found or does not belong to your institute' });
    }

    application.status = action;
    await application.save();

    // If approved, also mark counselor as hired for backward compat
    if (action === 'active') {
      await User.update(
        { is_hired: true },
        { where: { id: application.counselor_id } }
      );
    }

    res.status(200).json({
      message: `Application ${action === 'active' ? 'approved' : 'rejected'} successfully`,
      application_id,
      new_status: action,
    });
  } catch (error) {
    console.error('❌ Error processing application:', error.message);
    res.status(500).json({ error: 'Failed to process application' });
  }
};

// ─── GET /api/admin/students ───
const getInstituteStudents = async (req, res) => {
  try {
    console.log("[adminController.js] -> Successfully imported models. Starting student data merge.");
    const adminInstituteId = req.user.institute_id;
    console.log(`[adminController.js : getInstituteStudents] -> Req User ID: ${req.user.id}, Req Institute ID: ${adminInstituteId}`);
    
    if (!adminInstituteId) return res.status(400).json({ error: 'Admin has no attached institute' });

    console.log(`[adminController.js : getInstituteStudents] -> Executing Student Query for Institute: ${adminInstituteId}`);
    const students = await User.findAll({
      where: { role: 'Student', institute_id: adminInstituteId },
      attributes: ['id', 'email', 'profile_metadata', 'createdAt'],
      logging: console.log
    });

    if (!students || students.length === 0) {
      console.log(`[adminController.js] -> Found 0 students for Institute ${adminInstituteId}`);
    }

    const mergedData = await Promise.all(students.map(async (student) => {
      const latestQuiz = await QuizResult.findOne({
        where: { user_id: student.id },
        order: [['createdAt', 'DESC']]
      });
      const riskTag = latestQuiz ? latestQuiz.risk_level : 'Stable';

      return {
        id: student.id,
        email: student.email,
        name: student.profile_metadata?.full_name || 'Unknown Student',
        joined: student.createdAt,
        riskLevel: riskTag
      };
    }));

    res.status(200).json({ success: true, students: mergedData });
  } catch (error) {
    console.error('❌ Error fetching institute students:', error.message);
    res.status(500).json({ error: 'Failed to fetch students' });
  }
};

// ─── GET /api/admin/student/:id/details ───
const getStudentClinicalDetails = async (req, res) => {
  try {
    const adminInstituteId = req.user.institute_id;
    const studentId = req.params.id;

    console.log(`[adminController.js] -> Aggregating clinical profile for Student ID: ${studentId}.`);

    // Ensure student belongs to institute
    const student = await User.findOne({
      where: { id: studentId, institute_id: adminInstituteId, role: 'Student' }
    });
    if (!student) return res.status(404).json({ error: 'Student not found.' });

    // 1. Total Quizzes
    const quizCount = await QuizResult.count({ where: { user_id: studentId } });

    // 2. Average Mood & Streak (Last 30 Days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const moodLogs = await MoodLog.findAll({
      where: {
        user_id: studentId,
        log_date: { [Op.gte]: thirtyDaysAgo.toISOString().split('T')[0] }
      },
      order: [['log_date', 'DESC']]
    });

    const avgMood = moodLogs.length > 0 
      ? (moodLogs.reduce((acc, log) => acc + log.mood_score, 0) / moodLogs.length).toFixed(1) 
      : 'N/A';

    // Calculate streak
    let streak = 0;
    let currentDate = new Date();
    currentDate.setHours(0,0,0,0);
    let todayLogged = false;

    for (let i = 0; i < moodLogs.length; i++) {
        let logDate = new Date(moodLogs[i].log_date);
        logDate.setHours(0,0,0,0);
        
        const diffTime = Math.abs(currentDate - logDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 

        if (i === 0 && diffDays === 0) {
            streak++;
            todayLogged = true;
        } else if (i === 0 && diffDays === 1) {
            streak++;
            currentDate.setDate(currentDate.getDate() - 1);
        } else if (diffDays === 1) {
            streak++;
            currentDate.setDate(currentDate.getDate() - 1);
        } else if (todayLogged && diffDays === 0) {
            continue; // multiple logs same day
        } else {
            break;
        }
    }

    // Latest Quiz
    const latestQuiz = await QuizResult.findOne({
      where: { user_id: studentId },
      order: [['createdAt', 'DESC']]
    });

    let latestReport = null;
    if (latestQuiz) {
      const details = await AssessmentDetails.findOne({ quiz_result_id: latestQuiz.id });
      console.log(`[adminController.js] -> Fetched Total Score: ${latestQuiz.total_score} for Student ${studentId}.`);
      
      if (details) {
         console.log("RAW MONGO DATA:", JSON.stringify(details.question_responses, null, 2));
      }

      latestReport = {
        total_score: latestQuiz.total_score,
        risk_level: latestQuiz.risk_level,
        ai_sentiment_analysis: details ? details.ai_sentiment_analysis : null,
        createdAt: latestQuiz.createdAt,
        responses: details ? details.question_responses.map(r => ({
          ...(r.toObject ? r.toObject() : r),
          question: r.question,
          selected_option: r.choiceLabel && r.choiceLabel !== 'N/A' ? r.choiceLabel : `Score: ${r.score}`,
          text_answer: r.text || null
        })) : []
      };

      let textCount = latestReport.responses.filter(r => r.text_answer).length;
      console.log(`[adminController.js] -> Sending ${textCount} text answers to frontend.`);
    }

    res.status(200).json({
      quizCount,
      avgMood,
      streak,
      moodLogs: moodLogs.map(m => ({ date: m.log_date, score: m.mood_score })),
      latestReport
    });

  } catch (error) {
    console.error('❌ Error fetching clinical details:', error.message);
    res.status(500).json({ error: 'Failed to fetch clinical details.' });
  }
};

module.exports = { 
  getDashboardStats, 
  getPendingCounselors, 
  hireCounselor, 
  getPendingApplications, 
  approveCounselorApplication,
  getCounselors,
  approveCounselor,
  getInstituteStudents,
  getStudentClinicalDetails
};
