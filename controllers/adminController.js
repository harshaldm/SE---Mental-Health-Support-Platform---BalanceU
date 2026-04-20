const User = require('../models/User');

// GET /api/admin/pending-counselors
const getPendingCounselors = async (req, res) => {
  try {
    const adminInstituteId = req.user.institute_id;
    if (!adminInstituteId) return res.status(400).json({ error: 'Admin has no attached institute' });

    const counselors = await User.findAll({
      where: {
        institute_id: adminInstituteId,
        role: 'Counselor',
        is_hired: false
      },
      attributes: ['id', 'email', 'profile_metadata', 'createdAt']
    });

    res.status(200).json({ counselors });
  } catch (error) {
    console.error('❌ Error fetching pending counselors:', error.message);
    res.status(500).json({ error: 'Failed to fetch pending counselors' });
  }
};

// PATCH /api/admin/hire-counselor/:id
const hireCounselor = async (req, res) => {
  try {
    const counselorId = req.params.id;
    const adminInstituteId = req.user.institute_id;

    const counselor = await User.findOne({
      where: { id: counselorId, role: 'Counselor', institute_id: adminInstituteId }
    });

    if (!counselor) return res.status(404).json({ error: 'Counselor application not found or mismatched institute' });

    counselor.is_hired = true;
    await counselor.save();

    res.status(200).json({ message: 'Counselor hired successfully' });
  } catch (error) {
    console.error('❌ Error hiring counselor:', error.message);
    res.status(500).json({ error: 'Failed to approve counselor' });
  }
};

module.exports = { getPendingCounselors, hireCounselor };
