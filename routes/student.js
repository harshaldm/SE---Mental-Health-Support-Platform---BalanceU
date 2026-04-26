const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const authorizeRole = require('../middleware/authorizeRole');
const { getStudentMedications } = require('../controllers/studentController');

// GET /api/student/medications
router.get('/medications', authMiddleware, authorizeRole(['Student']), getStudentMedications);

module.exports = router;
