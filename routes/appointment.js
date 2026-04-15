const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const authorizeRole = require('../middleware/authorizeRole');
const { bookAppointment, updateAppointmentStatus, getMySessions } = require('../controllers/appointmentController');

// ─── Student books an appointment ───
router.post('/book', authMiddleware, authorizeRole(['Student']), bookAppointment);

// ─── Counselor confirms or cancels ───
router.patch('/:id/status', authMiddleware, authorizeRole(['Counselor']), updateAppointmentStatus);

// ─── Both roles can view their sessions ───
router.get('/my-sessions', authMiddleware, authorizeRole(['Student', 'Counselor']), getMySessions);

module.exports = router;
