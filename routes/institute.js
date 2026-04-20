const express = require('express');
const router = express.Router();
const {
  createInstitute,
  saveFormSchema,
  getFormSchema,
  getListInstitutes
} = require('../controllers/instituteController');

// ─── Institute Routes ───
router.post('/', createInstitute);
router.get('/list', getListInstitutes);
router.patch('/schema', saveFormSchema);
router.get('/:id/form-schema', getFormSchema);

module.exports = router;
