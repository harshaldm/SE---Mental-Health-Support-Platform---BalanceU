const express = require('express');
const router = express.Router();
const { registerAdmin, registerStudent, login, getMe } = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

// ─── Public Auth Routes ───
router.post('/register-admin', registerAdmin);
router.post('/register-student', registerStudent);
router.post('/login', login);

// ─── Protected Routes ───
router.get('/me', authMiddleware, getMe);

module.exports = router;
