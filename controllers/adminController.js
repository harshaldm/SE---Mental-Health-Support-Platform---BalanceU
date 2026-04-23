const User = require('../models/User');
const Institute = require('../models/Institute');
const CounselorInstitute = require('../models/CounselorInstitute');

// ─── GET /api/admin/pending-counselors ───
// Legacy: counselors who applied with a fixed institute_id and is_hired=false
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
      attributes: ['id', 'email', 'institute_id', 'profile_metadata', 'createdAt']
    });

    res.status(200).json({ counselors });
  } catch (error) {
    console.error('❌ Error fetching pending counselors:', error.message);
    res.status(500).json({ error: 'Failed to fetch pending counselors' });
  }
};

// ─── PATCH /api/admin/hire-counselor/:id ───
// Legacy: approve a counselor who applied with a fixed institute_id
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

// ─── GET /api/admin/pending-applications ───
// Multi-tenant: counselors who applied via the new CounselorInstitute table
const getPendingApplications = async (req, res) => {
  try {
    const adminInstituteId = req.user.institute_id;
    if (!adminInstituteId) {
      return res.status(400).json({ error: 'Admin has no attached institute' });
    }

    const applications = await CounselorInstitute.findAll({
      where: {
        institute_id: adminInstituteId,
        status: 'pending',
      },
      include: [
        {
          model: User,
          as: 'counselor',
          attributes: ['id', 'email', 'profile_metadata', 'createdAt'],
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    res.status(200).json({
      total: applications.length,
      applications: applications.map(app => ({
        application_id: app.id,
        status: app.status,
        applied_at: app.createdAt,
        counselor: {
          id: app.counselor.id,
          email: app.counselor.email,
          full_name: app.counselor.profile_metadata?.full_name,
          specialization: app.counselor.profile_metadata?.specialization,
          experience: app.counselor.profile_metadata?.experience,
          bio: app.counselor.profile_metadata?.bio,
          documents: app.counselor.profile_metadata?.documents,
        },
      })),
    });
  } catch (error) {
    console.error('❌ Error fetching pending applications:', error.message);
    res.status(500).json({ error: 'Failed to fetch pending applications' });
  }
};

// ─── PUT /api/admin/approve-counselor ───
// Multi-tenant: approve or reject a CounselorInstitute application
// Body: { application_id, action: 'active' | 'rejected' }
const approveCounselorApplication = async (req, res) => {
  try {
    const adminInstituteId = req.user.institute_id;
    const { application_id, action } = req.body;

    if (!application_id || !action) {
      return res.status(400).json({ error: 'application_id and action are required' });
    }

    if (!['active', 'rejected'].includes(action)) {
      return res.status(400).json({ error: 'action must be "active" or "rejected"' });
    }

    // Verify the application belongs to this admin's institute
    const application = await CounselorInstitute.findOne({
      where: { id: application_id, institute_id: adminInstituteId },
    });

    if (!application) {
      return res.status(404).json({ error: 'Application not found or does not belong to your institute' });
    }

    application.status = action;
    await application.save();

    // If approved, also mark counselor as hired for backward compat
    if (action === 'active') {
      await User.update(
        { is_hired: true },
        { where: { id: application.counselor_id } }
      );
    }

    res.status(200).json({
      message: `Application ${action === 'active' ? 'approved' : 'rejected'} successfully`,
      application_id,
      new_status: action,
    });
  } catch (error) {
    console.error('❌ Error processing application:', error.message);
    res.status(500).json({ error: 'Failed to process application' });
  }
};

module.exports = { getPendingCounselors, hireCounselor, getPendingApplications, approveCounselorApplication };
