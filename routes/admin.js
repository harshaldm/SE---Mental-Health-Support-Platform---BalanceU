const express = require('express');
const router = express.Router();
const { getPendingCounselors, hireCounselor } = require('../controllers/adminController');
const authMiddleware = require('../middleware/authMiddleware');

// Ensure Admin role
const adminOnly = (req, res, next) => {
  if (req.user.role !== 'Admin') return res.status(403).json({ error: 'Admin access required' });
  next();
};

router.get('/pending-counselors', authMiddleware, adminOnly, getPendingCounselors);
router.patch('/hire-counselor/:id', authMiddleware, adminOnly, hireCounselor);

module.exports = router;
