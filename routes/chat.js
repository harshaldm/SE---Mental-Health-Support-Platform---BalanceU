const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const authorizeRole = require('../middleware/authorizeRole');
const Message = require('../models/Message');
const Appointment = require('../models/Appointment');

// ─── GET /api/chat/:appointment_id/history ───
// Fetch persisted chat history for an appointment (REST fallback)
router.get('/:appointment_id/history', authMiddleware, authorizeRole(['Student', 'Counselor']), async (req, res) => {
  try {
    const appointmentId = parseInt(req.params.appointment_id, 10);
    const userId = req.user.id;

    // Verify the user is part of this appointment
    const appointment = await Appointment.findByPk(appointmentId);
    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }
    if (appointment.student_id !== userId && appointment.counselor_id !== userId) {
      return res.status(403).json({ error: 'You are not part of this appointment' });
    }

    const messages = await Message.find({ appointment_id: appointmentId })
      .sort({ timestamp: 1 })
      .lean();

    res.status(200).json({
      appointment_id: appointmentId,
      total: messages.length,
      messages,
    });
  } catch (error) {
    console.error('❌ Error fetching chat history:', error.message);
    res.status(500).json({ error: 'Failed to fetch chat history' });
  }
});

module.exports = router;
