const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const userController = require('../controllers/userController');

// GET /api/user/profile
router.get('/profile', authMiddleware, userController.getProfile);

// PUT /api/user/profile
router.put('/profile', authMiddleware, userController.updateProfile);

module.exports = router;
