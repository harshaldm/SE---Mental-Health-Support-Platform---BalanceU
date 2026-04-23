const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const authorizeRole = require('../middleware/authorizeRole');
const { applyToInstitute, getMyInstitutes, getStudents, getStudentReports } = require('../controllers/counselorController');

// ─── Counselor Routes (Protected + Role-Gated) ───

// Multi-tenant institute management
router.post('/apply', authMiddleware, authorizeRole(['Counselor']), applyToInstitute);
router.get('/my-institutes', authMiddleware, authorizeRole(['Counselor']), getMyInstitutes);

// Student data — scoped via X-Active-Institute header
router.get('/students', authMiddleware, authorizeRole(['Counselor', 'Admin']), getStudents);
router.get('/reports/:student_id', authMiddleware, authorizeRole(['Counselor']), getStudentReports);

module.exports = router;
