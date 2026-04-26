const mongoose = require('mongoose');

const assignedResourceSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  url: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ['Video', 'Article', 'Blog'],
    required: true,
  },
  student_id: {
    type: Number, // References PostgreSQL User.id (Student)
    required: true,
    index: true,
  },
  counselor_id: {
    type: Number, // References PostgreSQL User.id (Counselor)
    required: true,
    index: true,
  },
  assigned_at: {
    type: Date,
    default: Date.now,
  }
}, {
  collection: 'assigned_resources',
  timestamps: true,
});

const AssignedResource = mongoose.model('AssignedResource', assignedResourceSchema);

module.exports = AssignedResource;
