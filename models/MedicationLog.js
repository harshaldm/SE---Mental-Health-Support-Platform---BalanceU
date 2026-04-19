const mongoose = require('mongoose');

const medicationLogSchema = new mongoose.Schema({
  prescription_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Prescription',
    required: true,
    index: true,
  },
  student_id: {
    type: Number, // References PostgreSQL User.id
    required: true,
    index: true,
  },
  due_date: {
    type: Date,
    required: true,
  },
  slot_name: {
    type: String, // e.g., 'Morning', 'Afternoon', 'Night'
    required: true,
  },
  is_taken: {
    type: Boolean,
    default: false,
  },
  taken_at: {
    type: Date,
    default: null,
  },
}, {
  collection: 'medication_logs',
  timestamps: true,
});

const MedicationLog = mongoose.model('MedicationLog', medicationLogSchema);

module.exports = MedicationLog;
