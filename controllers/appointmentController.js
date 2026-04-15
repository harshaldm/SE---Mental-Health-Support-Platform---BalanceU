const { Op } = require('sequelize');
const Appointment = require('../models/Appointment');
const User = require('../models/User');

// ─── Book Appointment (Student) ───
// POST /api/appointments/book
const bookAppointment = async (req, res) => {
  try {
    const studentId = req.user.id;
    const studentInstituteId = req.user.institute_id;
    const { counselor_id, scheduled_at, issue_description } = req.body;

    if (!counselor_id || !scheduled_at) {
      return res.status(400).json({ error: 'counselor_id and scheduled_at are required' });
    }

    // Verify the counselor exists and is a Counselor at the same institute
    const counselor = await User.findOne({
      where: {
        id: counselor_id,
        role: 'Counselor',
        institute_id: studentInstituteId,
      },
    });

    if (!counselor) {
      return res.status(404).json({ error: 'Counselor not found at your institute' });
    }

    const appointment = await Appointment.create({
      student_id: studentId,
      counselor_id,
      scheduled_at: new Date(scheduled_at),
      status: 'pending',
      issue_description: issue_description || null,
    });

    res.status(201).json({
      message: 'Appointment booked successfully',
      appointment,
    });
  } catch (error) {
    console.error('❌ Error booking appointment:', error.message);
    res.status(500).json({ error: 'Failed to book appointment' });
  }
};

// ─── Update Appointment Status (Counselor) ───
// PATCH /api/appointments/:id/status
const updateAppointmentStatus = async (req, res) => {
  try {
    const appointmentId = parseInt(req.params.id, 10);
    const counselorId = req.user.id;
    const { status } = req.body;

    const allowedStatuses = ['confirmed', 'cancelled'];
    if (!status || !allowedStatuses.includes(status)) {
      return res.status(400).json({ error: `status must be one of: ${allowedStatuses.join(', ')}` });
    }

    // Find the appointment and ensure it belongs to this counselor
    const appointment = await Appointment.findOne({
      where: { id: appointmentId, counselor_id: counselorId },
    });

    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found or not assigned to you' });
    }

    appointment.status = status;
    await appointment.save();

    res.status(200).json({
      message: `Appointment ${status} successfully`,
      appointment,
    });
  } catch (error) {
    console.error('❌ Error updating appointment:', error.message);
    res.status(500).json({ error: 'Failed to update appointment status' });
  }
};

// ─── Get My Sessions (Student or Counselor) ───
// GET /api/appointments/my-sessions
const getMySessions = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    let whereClause;
    if (userRole === 'Counselor') {
      whereClause = { counselor_id: userId };
    } else {
      whereClause = { student_id: userId };
    }

    const appointments = await Appointment.findAll({
      where: whereClause,
      include: [
        { model: User, as: 'student', attributes: ['id', 'email'] },
        { model: User, as: 'counselor', attributes: ['id', 'email'] },
      ],
      order: [['scheduled_at', 'ASC']],
    });

    res.status(200).json({
      total: appointments.length,
      appointments,
    });
  } catch (error) {
    console.error('❌ Error fetching sessions:', error.message);
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
};

module.exports = { bookAppointment, updateAppointmentStatus, getMySessions };
