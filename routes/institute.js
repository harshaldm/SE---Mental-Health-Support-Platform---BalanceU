const express = require('express');
const router = express.Router();
const {
  createInstitute,
  saveFormSchema,
  getFormSchema,
} = require('../controllers/instituteController');

// ─── Institute Routes ───
router.post('/', createInstitute);
router.post('/:id/form-schema', saveFormSchema);
router.get('/:id/form-schema', getFormSchema);

module.exports = router;
