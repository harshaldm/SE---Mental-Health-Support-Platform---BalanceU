const mongoose = require('mongoose');

const moodStreakSchema = new mongoose.Schema({
  user_id: {
    type: Number, // References the PostgreSQL User.id
    required: true,
    unique: true,
    index: true,
  },
  current_streak: {
    type: Number,
    default: 1,
  },
  longest_streak: {
    type: Number,
    default: 1,
  },
  last_log_date: {
    type: Date,
    default: null,
  },
}, {
  collection: 'mood_streaks',
  timestamps: true,
});

const MoodStreak = mongoose.model('MoodStreak', moodStreakSchema);

module.exports = MoodStreak;
