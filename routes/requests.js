const express = require('express');
const router  = express.Router();
const authMiddleware  = require('../middleware/authMiddleware');
const authorizeRole   = require('../middleware/authorizeRole');
const {
  submitRequest,
  getMyRequests,
  respondToRequest,
  getMyConversations,
} = require('../controllers/requestController');

// POST   /api/requests/submit            → Student submits a support request
router.post('/submit', authMiddleware, authorizeRole(['Student']), submitRequest);

// GET    /api/requests/my-requests       → Counselor views their incoming requests
router.get('/my-requests', authMiddleware, authorizeRole(['Counselor']), getMyRequests);

// PATCH  /api/requests/:id/respond       → Counselor accepts or rejects a request
router.patch('/:id/respond', authMiddleware, authorizeRole(['Counselor']), respondToRequest);

// GET    /api/requests/my-conversations  → Both roles: returns accepted pairs + appointment_id
router.get('/my-conversations', authMiddleware, getMyConversations);

module.exports = router;
