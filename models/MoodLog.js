const mongoose = require('mongoose');

const moodLogSchema = new mongoose.Schema({
  user_id: {
    type: Number, // References the PostgreSQL User.id
    required: true,
    index: true,
  },
  mood_score: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },
  note: {
    type: String,
    default: '',
  },
  date: {
    type: Date,
    default: Date.now,
  },
}, {
  collection: 'mood_logs',
  timestamps: true,
});

const MoodLog = mongoose.model('MoodLog', moodLogSchema);

module.exports = MoodLog;
