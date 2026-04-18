const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const authorizeRole = require('../middleware/authorizeRole');
const {
  submitQuiz,
  shareWithCounselor,
  getMyResults,
  getAssessmentDetails,
} = require('../controllers/quizController');

// ─── Student submits a quiz ───
router.post('/submit', authMiddleware, authorizeRole(['Student']), submitQuiz);

// ─── Student shares result with counselor ───
router.patch('/:id/share', authMiddleware, authorizeRole(['Student']), shareWithCounselor);

// ─── Student views their own quiz history ───
router.get('/my-results', authMiddleware, authorizeRole(['Student']), getMyResults);

// ─── Student or Counselor views detailed assessment (role-gated inside controller) ───
router.get('/:id/details', authMiddleware, authorizeRole(['Student', 'Counselor']), getAssessmentDetails);

module.exports = router;
