const Prescription = require('../models/Prescription');
const MedicationLog = require('../models/MedicationLog');
const User = require('../models/User');
const CounselorInstitute = require('../models/CounselorInstitute');

// ─── Prescribe Medication (Counselor) ───
// POST /api/meds/prescribe
const prescribeMedication = async (req, res) => {
  try {
    const counselorId = req.user.id;
    const activeInstituteId = req.headers['x-active-institute'];
    const { student_id, med_name, dosage, start_date, end_date, frequency, slots } = req.body;

    console.log(`[counselorController.js] -> Prescription Attempt: Counselor ${counselorId}, Student ${student_id}, Institute ${activeInstituteId}.`);

    if (!activeInstituteId) {
      return res.status(400).json({ error: 'Active institute context is missing.' });
    }

    if (!student_id || !med_name || !dosage || !start_date || !end_date || !frequency || !slots) {
      return res.status(400).json({ error: 'All fields are required: student_id, med_name, dosage, start_date, end_date, frequency, slots' });
    }

    // 1. Verify Counselor is active at this institute
    const counselorAuth = await CounselorInstitute.findOne({
      where: { counselor_id: counselorId, institute_id: activeInstituteId, status: 'active' }
    });

    if (!counselorAuth) {
      console.error(`[counselorController.js] -> Validation Failed: Reason [Counselor not active at institute ${activeInstituteId}].`);
      return res.status(403).json({ error: 'You do not have active permission to prescribe at this institute.' });
    }

    // 2. Verify Student exists at this specific institute
    const student = await User.findOne({
      where: { id: student_id, role: 'Student', institute_id: activeInstituteId },
    });

    if (!student) {
      console.error(`[counselorController.js] -> Validation Failed: Reason [Mismatched Institute / Student ${student_id} not found at ${activeInstituteId}].`);
      return res.status(404).json({ error: 'Student not found at your institute' });
    }

    // Use resolved instituteId for database storage
    const instituteId = activeInstituteId;

    // Create the prescription
    const prescription = await Prescription.create({
      student_id,
      counselor_id: counselorId,
      institute_id: instituteId,
      med_name,
      dosage,
      start_date: new Date(start_date),
      end_date: new Date(end_date),
      frequency,
      slots,
    });

    // Auto-generate MedicationLog entries
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

    console.log(`💊 Prescription created: ${med_name} for student ${student_id} → ${logs.length} log entries`);

    res.status(201).json({
      message: 'Prescription created successfully',
      prescription,
      logs_generated: logs.length,
    });
  } catch (error) {
    console.error('❌ Error creating prescription:', error.message);
    res.status(500).json({ error: 'Failed to create prescription' });
  }
};

// ─── Get My Medications (Student) ───
// GET /api/meds/my-meds
const getMyMeds = async (req, res) => {
  try {
    const userId = req.user.id;

    console.log(`💊 Fetching meds for student ${userId} (type: ${typeof userId})`);

    // Get all prescriptions for this student (cast to Number for Mongoose query)
    const prescriptions = await Prescription.find({ student_id: Number(userId) })
      .sort({ start_date: -1 })
      .lean();

    if (prescriptions.length === 0) {
      return res.status(200).json({ message: 'No prescriptions found', prescriptions: [] });
    }

    // Get all log entries for this student
    const logs = await MedicationLog.find({ student_id: Number(userId) })
      .sort({ due_date: 1, slot_name: 1 })
      .lean();

    // Group logs by prescription, then by day
    const grouped = prescriptions.map(prescription => {
      const prescLogs = logs.filter(l => l.prescription_id.toString() === prescription._id.toString());

      // Group by date
      const byDay = {};
      prescLogs.forEach(log => {
        const dateKey = new Date(log.due_date).toISOString().split('T')[0];
        if (!byDay[dateKey]) byDay[dateKey] = [];
        byDay[dateKey].push({
          _id: log._id,
          slot_name: log.slot_name,
          is_taken: log.is_taken,
          status: log.status,
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
};

// ─── Take Medication (Student) ───
// PATCH /api/meds/take/:logId
const takeMedication = async (req, res) => {
  try {
    const logId = req.params.logId;
    const userIdFromToken = String(req.user.id);

    console.log('--- 🕵️ Ownership Debug ---');
    console.log(`Token User ID: "${userIdFromToken}" (type: ${typeof userIdFromToken})`);
    console.log(`Looking up MedicationLog._id: "${logId}"`);

    // Step 1: Find the log by its MongoDB _id only
    const log = await MedicationLog.findById(logId);

    if (!log) {
      console.log('❌ Log not found in database. Listing sample logs for this user...');
      const sampleLogs = await MedicationLog.find({ student_id: Number(req.user.id) }).limit(3).lean();
      console.log('Sample log IDs:', sampleLogs.map(l => l._id.toString()));
      return res.status(404).json({ error: 'Medication log not found. It may have been from an old prescription.' });
    }

    // Step 2: Debug both IDs
    console.log(`DB student_id: "${log.student_id}" (type: ${typeof log.student_id})`);
    console.log(`Match: ${String(log.student_id) === userIdFromToken ? '✅ YES' : '❌ NO'}`);

    // Step 3: Compare as Strings — fixes Number vs String mismatch
    if (String(log.student_id) !== userIdFromToken) {
      return res.status(403).json({
        error: 'This medication log belongs to a different student',
        debug: { db_student_id: log.student_id, token_user_id: userIdFromToken },
      });
    }

    if (log.is_taken) {
      return res.status(400).json({ error: 'This medication slot is already marked as taken' });
    }

    // Step 4: Mark as taken
    log.is_taken = true;
    log.status = 'taken';
    log.taken_at = new Date();
    await log.save();

    console.log(`✅ Medication marked as taken: ${log.slot_name} (log ${logId})`);

    // Step 5: Real-time notification to Counselor via Socket.io
    const prescription = await Prescription.findById(log.prescription_id).lean();
    if (prescription) {
      const io = req.app.get('io');
      if (io) {
        const student = await User.findByPk(Number(req.user.id));
        io.emit('medication_taken', {
          counselor_id: prescription.counselor_id,
          student_id: Number(req.user.id),
          student_email: student ? student.email : 'Unknown',
          med_name: prescription.med_name,
          slot_name: log.slot_name,
          due_date: log.due_date,
          taken_at: log.taken_at,
        });
        console.log(`📢 Socket event emitted: medication_taken → Counselor ${prescription.counselor_id}`);
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
};

module.exports = { prescribeMedication, getMyMeds, takeMedication };
