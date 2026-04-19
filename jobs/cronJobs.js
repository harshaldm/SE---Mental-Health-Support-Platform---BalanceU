const cron = require('node-cron');
const MedicationLog = require('../models/MedicationLog');
const Prescription = require('../models/Prescription');
const User = require('../models/User');

const initCronJobs = (app) => {
  // Run every hour to check for missed medications
  // '0 * * * *' = at minute 0 past every hour
  // Using node-cron format
  cron.schedule('0 * * * *', async () => {
    console.log('⏰ Running Missed Medication Job...');
    try {
      const io = app.get('io');
      
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);

      // Find all logs that are not taken, pending, and due more than 2 hours ago
      const missedLogs = await MedicationLog.find({
        is_taken: false,
        status: 'pending',
        due_date: { $lt: twoHoursAgo }
      });

      if (missedLogs.length === 0) {
        console.log('✅ No missed medications found out of timeframe.');
        return;
      }

      console.log(`🚨 Found ${missedLogs.length} missed medication(s). Updating status and notifying counselors...`);

      for (const log of missedLogs) {
        // Update status to 'missed'
        log.status = 'missed';
        await log.save();

        // Notify counselor if io exists
        if (io) {
          const prescription = await Prescription.findById(log.prescription_id).lean();
          if (prescription) {
            const student = await User.findByPk(log.student_id);
            io.emit('medication_missed', {
              counselor_id: prescription.counselor_id,
              student_id: log.student_id,
              student_email: student ? student.email : 'Unknown',
              med_name: prescription.med_name,
              slot_name: log.slot_name,
              due_date: log.due_date
            });
            console.log(`📢 Emitted medication_missed for Student ${log.student_id} to Counselor ${prescription.counselor_id}`);
          }
        }
      }
    } catch (error) {
      console.error('❌ Error running missed medication cron job:', error.message);
    }
  });

  console.log('⏱️ Cron jobs initialized.');
};

module.exports = initCronJobs;
