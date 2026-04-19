const mongoose = require('mongoose');

const resourceSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    required: true, // e.g., 'Anxiety', 'Exam Stress', 'Sleep', 'Depression', 'General Wellness'
  },
  content_type: {
    type: String,
    enum: ['Link', 'Text', 'PDF'],
    required: true,
  },
  url: {
    type: String,
    default: null, // Required for Link and PDF types
  },
  description: {
    type: String,
    default: '',
  },
  counselor_id: {
    type: Number, // References the PostgreSQL User.id (Counselor)
    required: true,
    index: true,
  },
  institute_id: {
    type: Number, // References the PostgreSQL Institute.id
    required: true,
    index: true,
  },
}, {
  collection: 'resources',
  timestamps: true,
});

const Resource = mongoose.model('Resource', resourceSchema);

module.exports = Resource;
