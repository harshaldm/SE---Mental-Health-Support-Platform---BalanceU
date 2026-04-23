const express = require('express');
const router = express.Router();
const {
  getPendingCounselors,
  hireCounselor,
  getPendingApplications,
  approveCounselorApplication,
} = require('../controllers/adminController');
const authMiddleware = require('../middleware/authMiddleware');

// Ensure Admin role
const adminOnly = (req, res, next) => {
  if (req.user.role !== 'Admin') return res.status(403).json({ error: 'Admin access required' });
  next();
};

// ─── Legacy single-institute counselor approval ───
router.get('/pending-counselors', authMiddleware, adminOnly, getPendingCounselors);
router.patch('/hire-counselor/:id', authMiddleware, adminOnly, hireCounselor);

// ─── Multi-tenant counselor application management ───
router.get('/pending-applications', authMiddleware, adminOnly, getPendingApplications);
router.put('/approve-counselor', authMiddleware, adminOnly, approveCounselorApplication);

module.exports = router;
