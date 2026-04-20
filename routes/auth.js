const express = require('express');
const router = express.Router();
const { registerAdmin, registerStudent, registerCounselor, login, getMe } = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');

// Configure Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

// ─── Public Auth Routes ───
router.post('/register-admin', registerAdmin);
router.post('/register-student', registerStudent);
router.post('/register-counselor', upload.fields([
  { name: 'profile_pic', maxCount: 1 },
  { name: 'degree', maxCount: 1 },
  { name: 'license', maxCount: 1 }
]), registerCounselor);
router.post('/login', login);

// ─── Protected Routes ───
router.get('/me', authMiddleware, getMe);

module.exports = router;
