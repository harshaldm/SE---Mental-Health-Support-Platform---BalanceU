const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const authorizeRole = require('../middleware/authorizeRole');
const moodController = require('../controllers/moodController');

// ─── GET /api/mood/check ───
// Check if mood is logged today
router.get('/check', authMiddleware, authorizeRole(['Student']), moodController.checkTodayMood);

// ─── POST /api/mood/log ───
// Log daily mood
router.post('/log', authMiddleware, authorizeRole(['Student']), moodController.logMood);

// ─── GET /api/mood/history ───
// Fetch all mood logs
router.get('/history', authMiddleware, authorizeRole(['Student']), moodController.getMoodHistory);

module.exports = router;
