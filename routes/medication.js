const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const authorizeRole = require('../middleware/authorizeRole');
const { prescribeMedication, getMyMeds, takeMedication } = require('../controllers/medicationController');

// ─── Counselor prescribes medication ───
router.post('/prescribe', authMiddleware, authorizeRole(['Counselor']), prescribeMedication);

// ─── Student views their medications (grouped by day) ───
router.get('/my-meds', authMiddleware, authorizeRole(['Student']), getMyMeds);

// ─── Student marks a slot as taken ───
router.patch('/take/:logId', authMiddleware, authorizeRole(['Student']), takeMedication);

module.exports = router;
