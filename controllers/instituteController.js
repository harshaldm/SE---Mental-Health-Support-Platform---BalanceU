const Institute = require('../models/Institute');

// ─── Create Institute ───
// POST /api/institutes
const createInstitute = async (req, res) => {
  try {
    const { name, type, address, contact_info } = req.body;

    if (!name || !type) {
      return res.status(400).json({ error: 'name and type are required' });
    }

    // Usually ID is predefined now, but leaving this for legacy compat
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

// ─── Get List of Institutes ───
// GET /api/institutes/list
const getListInstitutes = async (req, res) => {
  try {
    const institutes = await Institute.findAll({
      attributes: ['id', 'name', 'type']
    });
    res.status(200).json({ institutes });
  } catch (error) {
    console.error('❌ Error fetching institutes list:', error.message);
    res.status(500).json({ error: 'Failed to fetch institutes list' });
  }
};

// ─── Save Form Schema ───
// PATCH /api/institutes/schema
const saveFormSchema = async (req, res) => {
  try {
    const { institute_id, schema } = req.body; // Expect JSON array in schema

    if (!institute_id || !schema || !Array.isArray(schema)) {
      return res.status(400).json({ error: 'institute_id and schema (array) are required' });
    }

    const institute = await Institute.findByPk(institute_id);
    if (!institute) {
      return res.status(404).json({ error: 'Institute not found' });
    }

    // Save JSONB schema directly to Postgres
    institute.registration_schema = schema;
    await institute.save();

    res.status(200).json({
      message: 'Form schema saved successfully',
      schema: institute.registration_schema,
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
    const instituteId = req.params.id;

    const institute = await Institute.findByPk(instituteId);
    if (!institute) {
      return res.status(404).json({ error: 'Institute not found' });
    }

    // Default to empty array if no schema defined yet
    const schema = institute.registration_schema || [];
    res.status(200).json({ schema });
  } catch (error) {
    console.error('❌ Error fetching form schema:', error.message);
    res.status(500).json({ error: 'Failed to fetch form schema' });
  }
};

// ─── Get All Institutes (Discovery) ───
// GET /api/institutes/all
const getAllInstitutes = async (req, res) => {
  try {
    const institutes = await Institute.findAll({
      attributes: ['id', 'name', 'type']
    });
    res.status(200).json({ institutes });
  } catch (error) {
    console.error('❌ Error fetching all institutes:', error.message);
    res.status(500).json({ error: 'Failed to fetch institutes' });
  }
};

module.exports = { createInstitute, getListInstitutes, saveFormSchema, getFormSchema, getAllInstitutes };
