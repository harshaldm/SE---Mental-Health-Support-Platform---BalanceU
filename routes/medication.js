const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const authorizeRole = require('../middleware/authorizeRole');
const Prescription = require('../models/Prescription');
const MedicationLog = require('../models/MedicationLog');
const User = require('../models/User');

// ─── POST /api/meds/prescribe ───
// Counselor creates a prescription and auto-generates log entries
router.post('/prescribe', authMiddleware, authorizeRole(['Counselor']), async (req, res) => {
  try {
    const counselorId = req.user.id;
    const instituteId = req.user.institute_id;
    const { student_id, med_name, start_date, end_date, frequency, slots } = req.body;

    // Validate required fields
    if (!student_id || !med_name || !start_date || !end_date || !frequency || !slots) {
      return res.status(400).json({ error: 'All fields are required: student_id, med_name, start_date, end_date, frequency, slots' });
    }

    if (!Array.isArray(slots) || slots.length === 0) {
      return res.status(400).json({ error: 'slots must be a non-empty array (e.g., ["Morning", "Night"])' });
    }

    if (slots.length !== frequency) {
      return res.status(400).json({ error: `frequency (${frequency}) must match the number of slots (${slots.length})` });
    }

    // Verify the student exists and is at the same institute
    const student = await User.findOne({
      where: { id: student_id, role: 'Student', institute_id: instituteId },
    });

    if (!student) {
      return res.status(404).json({ error: 'Student not found at your institute' });
    }

    // Create the prescription
    const prescription = await Prescription.create({
      student_id,
      counselor_id: counselorId,
      institute_id: instituteId,
      med_name,
      start_date: new Date(start_date),
      end_date: new Date(end_date),
      frequency,
      slots,
    });

    // ─── Auto-generate MedicationLog entries ───
    const logs = [];
    const start = new Date(start_date);
    const end = new Date(end_date);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    for (let day = new Date(start); day <= end; day.setDate(day.getDate() + 1)) {
      for (const slot of slots) {
        logs.push({
          prescription_id: prescription._id,
          student_id,
          due_date: new Date(day),
          slot_name: slot,
          is_taken: false,
          taken_at: null,
        });
      }
    }

    await MedicationLog.insertMany(logs);

    res.status(201).json({
      message: 'Prescription created successfully',
      prescription,
      logs_generated: logs.length,
    });
  } catch (error) {
    console.error('❌ Error creating prescription:', error.message);
    res.status(500).json({ error: 'Failed to create prescription' });
  }
});

// ─── GET /api/meds/my-meds ───
// Student fetches their medication logs grouped by day
router.get('/my-meds', authMiddleware, authorizeRole(['Student']), async (req, res) => {
  try {
    const userId = req.user.id;

    // Get all active prescriptions for this student
    const prescriptions = await Prescription.find({ student_id: userId })
      .sort({ start_date: -1 })
      .lean();

    if (prescriptions.length === 0) {
      return res.status(200).json({ message: 'No prescriptions found', prescriptions: [] });
    }

    // Get all log entries for this student
    const logs = await MedicationLog.find({ student_id: userId })
      .sort({ due_date: 1, slot_name: 1 })
      .lean();

    // Group logs by prescription, then by day
    const prescriptionIds = prescriptions.map(p => p._id.toString());
    const grouped = prescriptions.map(prescription => {
      const prescLogs = logs.filter(l => l.prescription_id.toString() === prescription._id.toString());

      // Group by date
      const byDay = {};
      prescLogs.forEach(log => {
        const dateKey = new Date(log.due_date).toISOString().split('T')[0]; // YYYY-MM-DD
        if (!byDay[dateKey]) byDay[dateKey] = [];
        byDay[dateKey].push({
          _id: log._id,
          slot_name: log.slot_name,
          is_taken: log.is_taken,
          taken_at: log.taken_at,
        });
      });

      return {
        prescription_id: prescription._id,
        med_name: prescription.med_name,
        start_date: prescription.start_date,
        end_date: prescription.end_date,
        frequency: prescription.frequency,
        slots: prescription.slots,
        days: byDay,
      };
    });

    res.status(200).json({
      total_prescriptions: grouped.length,
      prescriptions: grouped,
    });
  } catch (error) {
    console.error('❌ Error fetching medications:', error.message);
    res.status(500).json({ error: 'Failed to fetch medications' });
  }
});

// ─── PATCH /api/meds/take/:logId ───
// Student marks a specific medication slot as taken
router.patch('/take/:logId', authMiddleware, authorizeRole(['Student']), async (req, res) => {
  try {
    const userId = req.user.id;
    const logId = req.params.logId;

    // Find the log and verify it belongs to this student
    const log = await MedicationLog.findOne({ _id: logId, student_id: userId });

    if (!log) {
      return res.status(404).json({ error: 'Medication log not found or does not belong to you' });
    }

    if (log.is_taken) {
      return res.status(400).json({ error: 'This medication slot is already marked as taken' });
    }

    log.is_taken = true;
    log.taken_at = new Date();
    await log.save();

    // ─── Real-time notification to Counselor via Socket.io ───
    const prescription = await Prescription.findById(log.prescription_id).lean();
    if (prescription) {
      const io = req.app.get('io');
      if (io) {
        const student = await User.findByPk(userId);
        io.emit('medication_taken', {
          counselor_id: prescription.counselor_id,
          student_id: userId,
          student_email: student ? student.email : 'Unknown',
          med_name: prescription.med_name,
          slot_name: log.slot_name,
          due_date: log.due_date,
          taken_at: log.taken_at,
        });
      }
    }

    res.status(200).json({
      message: `${log.slot_name} medication marked as taken`,
      log,
    });
  } catch (error) {
    console.error('❌ Error marking medication:', error.message);
    res.status(500).json({ error: 'Failed to mark medication as taken' });
  }
});

module.exports = router;
