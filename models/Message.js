const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  appointment_id: {
    type: Number, // References the PostgreSQL Appointment.id
    required: true,
    index: true,
  },
  sender_id: {
    type: Number, // References the PostgreSQL User.id
    required: true,
  },
  text: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  sentiment_flag: {
    type: String,
    enum: ['LOW', 'MODERATE', 'CRISIS'],
    default: 'LOW',
  },
}, {
  collection: 'messages',
});

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;
