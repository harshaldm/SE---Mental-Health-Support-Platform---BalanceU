const { MoodLog } = require('../models');
const { Op } = require('sequelize');
const logger = require('../utils/logger');

/**
 * Check if the user has already logged a mood for the current calendar date.
 */
exports.checkTodayMood = async (req, res) => {
  try {
    const userId = req.user.id;
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    const log = await MoodLog.findOne({
      where: {
        user_id: userId,
        log_date: today
      }
    });

    res.status(200).json({
      hasLoggedToday: !!log,
      log: log || null
    });
  } catch (error) {
    logger.error(`[moodController.js : checkTodayMood : 24] -> Error: ${error.message}`);
    res.status(500).json({ error: 'Failed to check mood status' });
  }
};

/**
 * Save a mood score (1-5).
 */
exports.logMood = async (req, res) => {
  try {
    const userId = req.user.id;
    const { mood_score } = req.body;
    const today = new Date().toISOString().split('T')[0];

    if (!mood_score || mood_score < 1 || mood_score > 5) {
      return res.status(400).json({ error: 'Mood score must be between 1 and 5' });
    }

    const [log, created] = await MoodLog.findOrCreate({
      where: { user_id: userId, log_date: today },
      defaults: { mood_score }
    });

    if (!created) {
      log.mood_score = mood_score;
      await log.save();
    }

    logger.info(`[moodController.js : logMood : 52] -> Logged mood ${mood_score} for user ${userId}.`);

    res.status(created ? 201 : 200).json({
      message: created ? 'Mood logged successfully' : 'Mood updated successfully',
      log
    });
  } catch (error) {
    logger.error(`[moodController.js : logMood : 60] -> Error: ${error.message}`);
    res.status(500).json({ error: 'Failed to log mood' });
  }
};

/**
 * Fetch all mood logs for the current user.
 */
exports.getMoodHistory = async (req, res) => {
  try {
    const userId = req.user.id;

    const logs = await MoodLog.findAll({
      where: { user_id: userId },
      order: [['log_date', 'DESC']]
    });

    res.status(200).json({
      total: logs.length,
      logs
    });
  } catch (error) {
    logger.error(`[moodController.js : getMoodHistory : 82] -> Error: ${error.message}`);
    res.status(500).json({ error: 'Failed to fetch mood history' });
  }
};
