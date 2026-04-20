const mongoose = require('mongoose');

const studentDetailsSchema = new mongoose.Schema({
  user_id: {
    type: Number, // References the PostgreSQL User.id
    required: true,
    index: true,
  },
  institute_id: {
    type: String, // References the PostgreSQL Institute.id
    required: true,
    index: true,
  },
  data: {
    type: mongoose.Schema.Types.Mixed, // Flexible JSON — stores answers to the institute's custom form
    required: true,
  },
}, {
  timestamps: true,
  collection: 'student_details',
});

const StudentDetails = mongoose.model('StudentDetails', studentDetailsSchema);

module.exports = StudentDetails;
