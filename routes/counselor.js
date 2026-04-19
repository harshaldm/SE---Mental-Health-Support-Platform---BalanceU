const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const authorizeRole = require('../middleware/authorizeRole');
const { getStudents, getStudentReports } = require('../controllers/counselorController');

// ─── Counselor Routes (Protected + Role-Gated) ───
router.get('/students', authMiddleware, authorizeRole(['Counselor', 'Admin']), getStudents);
router.get('/reports/:student_id', authMiddleware, authorizeRole(['Counselor']), getStudentReports);

module.exports = router;
