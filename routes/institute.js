const express = require('express');
const router = express.Router();
const {
  createInstitute,
  saveFormSchema,
  getFormSchema,
  getListInstitutes
} = require('../controllers/instituteController');
const { getCounselorsForInstitute } = require('../controllers/requestController');

// ─── Institute Routes ───
router.post('/', createInstitute);
router.get('/list', getListInstitutes);
router.patch('/schema', saveFormSchema);
router.get('/:id/form-schema', getFormSchema);
router.get('/:id/counselors', getCounselorsForInstitute);

module.exports = router;
