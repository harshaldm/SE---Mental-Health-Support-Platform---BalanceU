const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  getPendingCounselors,
  hireCounselor,
  getPendingApplications,
  approveCounselorApplication,
  getInstituteStudents,
  getStudentClinicalDetails,
  getCounselors,
  approveCounselor
} = require('../controllers/adminController');
const authMiddleware = require('../middleware/authMiddleware');

// Ensure Admin role
const adminOnly = (req, res, next) => {
  if (req.user.role !== 'Admin') return res.status(403).json({ error: 'Admin access required' });
  next();
};

// ─── Dashboard Stats ───
router.get('/dashboard-stats', authMiddleware, adminOnly, getDashboardStats);

// ─── Legacy single-institute counselor approval ───
router.get('/pending-counselors', authMiddleware, adminOnly, getPendingCounselors);
router.patch('/hire-counselor/:id', authMiddleware, adminOnly, hireCounselor);

// ─── Multi-tenant counselor application management ───
router.get('/pending-applications', authMiddleware, adminOnly, getPendingApplications);
router.put('/approve-counselor', authMiddleware, adminOnly, approveCounselorApplication);

// ─── Student Management ───
router.get('/students', authMiddleware, adminOnly, getInstituteStudents);
router.get('/student/:id/details', authMiddleware, adminOnly, getStudentClinicalDetails);

// ─── Counselor Management ───
router.get('/counselors', authMiddleware, adminOnly, getCounselors);
router.put('/counselors/approve', authMiddleware, adminOnly, approveCounselor);

module.exports = router;
