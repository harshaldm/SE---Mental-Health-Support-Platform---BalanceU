const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const authorizeRole = require('../middleware/authorizeRole');
const MoodLog = require('../models/MoodLog');
const MoodStreak = require('../models/MoodStreak');

/**
 * Check if two dates are on consecutive calendar days.
 */
const isYesterday = (lastDate, today) => {
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  return (
    lastDate.getFullYear() === yesterday.getFullYear() &&
    lastDate.getMonth() === yesterday.getMonth() &&
    lastDate.getDate() === yesterday.getDate()
  );
};

/**
 * Check if two dates are the same calendar day.
 */
const isSameDay = (d1, d2) => {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
};

// ─── POST /api/mood/add ───
// Students log their daily mood with streak tracking
router.post('/add', authMiddleware, authorizeRole(['Student']), async (req, res) => {
  try {
    const userId = req.user.id;
    const { mood_score, note } = req.body;

    if (!mood_score || mood_score < 1 || mood_score > 5) {
      return res.status(400).json({ error: 'mood_score is required and must be between 1 and 5' });
    }

    const now = new Date();

    // Save the mood entry
    const moodLog = await MoodLog.create({
      user_id: userId,
      mood_score,
      note: note || '',
      date: now,
    });

    // ─── Streak Logic ───
    let streak = await MoodStreak.findOne({ user_id: userId });

    if (!streak) {
      // First ever mood log — start streak at 1
      streak = await MoodStreak.create({
        user_id: userId,
        current_streak: 1,
        longest_streak: 1,
        last_log_date: now,
      });
    } else {
      const lastDate = new Date(streak.last_log_date);

      if (isSameDay(lastDate, now)) {
        // Already logged today — don't change the streak, just update timestamp
        streak.last_log_date = now;
      } else if (isYesterday(lastDate, now)) {
        // Logged yesterday → increment streak
        streak.current_streak += 1;
        if (streak.current_streak > streak.longest_streak) {
          streak.longest_streak = streak.current_streak;
        }
        streak.last_log_date = now;
      } else {
        // Missed a day → reset streak to 1
        streak.current_streak = 1;
        streak.last_log_date = now;
      }

      await streak.save();
    }

    res.status(201).json({
      message: 'Mood logged',
      current_streak: streak.current_streak,
      longest_streak: streak.longest_streak,
      log: moodLog,
    });
  } catch (error) {
    console.error('❌ Error logging mood:', error.message);
    res.status(500).json({ error: 'Failed to log mood' });
  }
});

// ─── GET /api/mood/history ───
// Fetch the last 30 days of mood logs for the logged-in student
router.get('/history', authMiddleware, authorizeRole(['Student']), async (req, res) => {
  try {
    const userId = req.user.id;
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const logs = await MoodLog.find({
      user_id: userId,
      date: { $gte: thirtyDaysAgo },
    })
      .sort({ date: -1 })
      .lean();

    // Include streak info
    const streak = await MoodStreak.findOne({ user_id: userId }).lean();

    res.status(200).json({
      current_streak: streak ? streak.current_streak : 0,
      longest_streak: streak ? streak.longest_streak : 0,
      total: logs.length,
      logs,
    });
  } catch (error) {
    console.error('❌ Error fetching mood history:', error.message);
    res.status(500).json({ error: 'Failed to fetch mood history' });
  }
});

module.exports = router;
