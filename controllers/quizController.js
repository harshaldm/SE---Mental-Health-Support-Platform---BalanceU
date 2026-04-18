const QuizResult = require('../models/QuizResult');
const AssessmentDetails = require('../models/AssessmentDetails');
const { analyzeResponses } = require('../utils/geminiAnalysis');

// ─── Risk Level Scales ───
// PHQ-9: 0-4 Minimal, 5-9 Mild, 10-14 Moderate, 15-19 Moderately Severe, 20-27 Severe
// GAD-7: 0-4 Minimal, 5-9 Mild, 10-14 Moderate, 15-21 Severe
const getRiskLevel = (quizType, totalScore) => {
  if (quizType === 'PHQ-9') {
    if (totalScore <= 4) return 'Minimal';
    if (totalScore <= 9) return 'Mild';
    if (totalScore <= 14) return 'Moderate';
    if (totalScore <= 19) return 'Moderately Severe';
    return 'Severe';
  }

  if (quizType === 'GAD-7') {
    if (totalScore <= 4) return 'Minimal';
    if (totalScore <= 9) return 'Mild';
    if (totalScore <= 14) return 'Moderate';
    return 'Severe';
  }

  return 'Unknown';
};

// ─── Submit Quiz ───
// POST /api/quiz/submit
const submitQuiz = async (req, res) => {
  try {
    const userId = req.user.id;
    const { quiz_type, question_responses } = req.body;

    // Validate inputs
    const allowedTypes = ['PHQ-9', 'GAD-7'];
    if (!quiz_type || !allowedTypes.includes(quiz_type)) {
      return res.status(400).json({ error: `quiz_type must be one of: ${allowedTypes.join(', ')}` });
    }

    if (!question_responses || !Array.isArray(question_responses) || question_responses.length === 0) {
      return res.status(400).json({ error: 'question_responses must be a non-empty array' });
    }

    // 1. Calculate total score
    const totalScore = question_responses.reduce((sum, r) => sum + (r.score || 0), 0);

    // 2. Determine risk level
    const riskLevel = getRiskLevel(quiz_type, totalScore);

    // 3. Save score & risk to PostgreSQL
    const quizResult = await QuizResult.create({
      user_id: userId,
      quiz_type,
      total_score: totalScore,
      risk_level: riskLevel,
      shared_with_counselor: false,
    });

    // 4. Run Gemini AI sentiment analysis on text responses
    const aiSummary = await analyzeResponses(question_responses);

    // 5. Save detailed responses & AI analysis to MongoDB
    const assessmentDetails = await AssessmentDetails.create({
      quiz_result_id: quizResult.id,
      question_responses,
      ai_sentiment_analysis: aiSummary,
    });

    res.status(201).json({
      message: 'Assessment submitted successfully',
      result: {
        id: quizResult.id,
        quiz_type: quizResult.quiz_type,
        total_score: quizResult.total_score,
        risk_level: quizResult.risk_level,
        shared_with_counselor: quizResult.shared_with_counselor,
      },
      ai_sentiment_analysis: aiSummary,
      details_id: assessmentDetails._id,
    });
  } catch (error) {
    console.error('❌ Error submitting quiz:', error.message);
    res.status(500).json({ error: 'Failed to submit assessment' });
  }
};

// ─── Share with Counselor ───
// PATCH /api/quiz/:id/share
const shareWithCounselor = async (req, res) => {
  try {
    const quizId = parseInt(req.params.id, 10);
    const userId = req.user.id;

    // Find the quiz result and ensure it belongs to this student
    const quizResult = await QuizResult.findOne({
      where: { id: quizId, user_id: userId },
    });

    if (!quizResult) {
      return res.status(404).json({ error: 'Quiz result not found or does not belong to you' });
    }

    quizResult.shared_with_counselor = true;
    await quizResult.save();

    res.status(200).json({
      message: 'Assessment shared with your counselor',
      result: {
        id: quizResult.id,
        quiz_type: quizResult.quiz_type,
        total_score: quizResult.total_score,
        risk_level: quizResult.risk_level,
        shared_with_counselor: quizResult.shared_with_counselor,
      },
    });
  } catch (error) {
    console.error('❌ Error sharing quiz:', error.message);
    res.status(500).json({ error: 'Failed to share assessment' });
  }
};

// ─── Get My Quiz History ───
// GET /api/quiz/my-results
const getMyResults = async (req, res) => {
  try {
    const userId = req.user.id;

    const results = await QuizResult.findAll({
      where: { user_id: userId },
      order: [['createdAt', 'DESC']],
    });

    res.status(200).json({
      total: results.length,
      results,
    });
  } catch (error) {
    console.error('❌ Error fetching results:', error.message);
    res.status(500).json({ error: 'Failed to fetch quiz results' });
  }
};

// ─── Counselor: View Shared Assessment Detail ───
// GET /api/quiz/:id/details
const getAssessmentDetails = async (req, res) => {
  try {
    const quizId = parseInt(req.params.id, 10);
    const userRole = req.user.role;
    const userId = req.user.id;

    // Find the quiz result
    const quizResult = await QuizResult.findByPk(quizId);
    if (!quizResult) {
      return res.status(404).json({ error: 'Quiz result not found' });
    }

    // Students can view their own; Counselors can view only if shared
    if (userRole === 'Student' && quizResult.user_id !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }
    if (userRole === 'Counselor' && !quizResult.shared_with_counselor) {
      return res.status(403).json({ error: 'This assessment has not been shared with counselors' });
    }

    // Fetch detailed responses from MongoDB
    const details = await AssessmentDetails.findOne({ quiz_result_id: quizId });

    res.status(200).json({
      result: quizResult,
      details: details || null,
    });
  } catch (error) {
    console.error('❌ Error fetching assessment details:', error.message);
    res.status(500).json({ error: 'Failed to fetch assessment details' });
  }
};

module.exports = { submitQuiz, shareWithCounselor, getMyResults, getAssessmentDetails };
