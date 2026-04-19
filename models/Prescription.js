const mongoose = require('mongoose');

const prescriptionSchema = new mongoose.Schema({
  student_id: {
    type: Number, // References PostgreSQL User.id
    required: true,
    index: true,
  },
  counselor_id: {
    type: Number, // References PostgreSQL User.id (Counselor)
    required: true,
  },
  institute_id: {
    type: Number, // References PostgreSQL Institute.id
    required: true,
  },
  med_name: {
    type: String,
    required: true,
  },
  start_date: {
    type: Date,
    required: true,
  },
  end_date: {
    type: Date,
    required: true,
  },
  frequency: {
    type: Number, // How many times per day
    required: true,
    min: 1,
  },
  slots: {
    type: [String], // e.g., ['Morning', 'Afternoon', 'Night']
    required: true,
  },
}, {
  collection: 'prescriptions',
  timestamps: true,
});

const Prescription = mongoose.model('Prescription', prescriptionSchema);

module.exports = Prescription;
