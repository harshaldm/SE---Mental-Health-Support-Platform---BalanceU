const Institute = require('../models/Institute');
const CustomFormSchema = require('../models/CustomFormSchema');

// ─── Create Institute ───
// POST /api/institutes
const createInstitute = async (req, res) => {
  try {
    const { name, type, address, contact_info } = req.body;

    if (!name || !type) {
      return res.status(400).json({ error: 'name and type are required' });
    }

    const institute = await Institute.create({ name, type, address, contact_info });

    res.status(201).json({
      message: 'Institute registered successfully',
      institute,
    });
  } catch (error) {
    console.error('❌ Error creating institute:', error.message);
    res.status(500).json({ error: 'Failed to register institute' });
  }
};

// ─── Save Form Schema ───
// POST /api/institutes/:id/form-schema
const saveFormSchema = async (req, res) => {
  try {
    const instituteId = parseInt(req.params.id, 10);
    const { fields } = req.body;

    if (!fields || typeof fields !== 'object') {
      return res.status(400).json({ error: 'fields must be a valid JSON object' });
    }

    // Verify institute exists in PostgreSQL
    const institute = await Institute.findByPk(instituteId);
    if (!institute) {
      return res.status(404).json({ error: 'Institute not found' });
    }

    // Upsert: update existing schema or create a new one
    const schema = await CustomFormSchema.findOneAndUpdate(
      { institute_id: instituteId },
      { institute_id: instituteId, fields },
      { upsert: true, new: true, runValidators: true }
    );

    res.status(200).json({
      message: 'Form schema saved successfully',
      schema,
    });
  } catch (error) {
    console.error('❌ Error saving form schema:', error.message);
    res.status(500).json({ error: 'Failed to save form schema' });
  }
};

// ─── Get Form Schema ───
// GET /api/institutes/:id/form-schema
const getFormSchema = async (req, res) => {
  try {
    const instituteId = parseInt(req.params.id, 10);

    const schema = await CustomFormSchema.findOne({ institute_id: instituteId });
    if (!schema) {
      return res.status(404).json({ error: 'No form schema found for this institute' });
    }

    res.status(200).json({ schema });
  } catch (error) {
    console.error('❌ Error fetching form schema:', error.message);
    res.status(500).json({ error: 'Failed to fetch form schema' });
  }
};

module.exports = { createInstitute, saveFormSchema, getFormSchema };
