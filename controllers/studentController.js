const Prescription = require('../models/Prescription');
const User = require('../models/User');

// ─── Get Student medications ───
// GET /api/student/medications
const getStudentMedications = async (req, res) => {
  try {
    const student_id = req.user.id;
    const institute_id = req.user.institute_id;

    if (!institute_id) {
       return res.status(400).json({ error: 'Your account is not linked to any institute.' });
    }

    const prescriptions = await Prescription.find({ 
        student_id: Number(student_id),
        institute_id: institute_id 
    }).sort({ createdAt: -1 }).lean();

    console.log(`[studentController.js] -> Found ${prescriptions.length} prescriptions for Student ${student_id}.`);

    res.status(200).json({ 
        count: prescriptions.length,
        prescriptions 
    });
  } catch (error) {
    console.error('❌ Error fetching student medications:', error.message);
    res.status(500).json({ error: 'Failed to fetch medications' });
  }
};

module.exports = { getStudentMedications };
