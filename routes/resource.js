const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const authorizeRole = require('../middleware/authorizeRole');
const Resource = require('../models/Resource');
const AssignedResource = require('../models/AssignedResource');
const logger = require('../utils/logger');
const { searchResources } = require('../utils/geminiService');

// ─── POST /api/resources ───
// Counselors add new wellness materials
router.post('/', authMiddleware, authorizeRole(['Counselor']), async (req, res) => {
  try {
    const counselorId = req.user.id;
    const instituteId = req.headers['x-active-institute'] || req.user.institute_id;
    const { title, category, content_type, url, description } = req.body;

    if (!instituteId) {
      return res.status(400).json({ error: 'Active institute context is missing.' });
    }

    if (!title || !category || !content_type) {
      return res.status(400).json({ error: 'title, category, and content_type are required' });
    }

    const allowedTypes = ['Link', 'Text', 'PDF'];
    if (!allowedTypes.includes(content_type)) {
      return res.status(400).json({ error: `content_type must be one of: ${allowedTypes.join(', ')}` });
    }

    // Require url for Link and PDF types
    if ((content_type === 'Link' || content_type === 'PDF') && !url) {
      return res.status(400).json({ error: 'url is required for Link and PDF resources' });
    }

    const resource = await Resource.create({
      title,
      category,
      content_type,
      url: url || null,
      description: description || '',
      counselor_id: counselorId,
      institute_id: instituteId,
    });

    res.status(201).json({
      message: 'Resource added successfully',
      resource,
    });
  } catch (error) {
    console.error('❌ Error adding resource:', error.message);
    res.status(500).json({ error: 'Failed to add resource' });
  }
});

// ─── GET /api/resources ───
// Students/Counselors fetch resources from counselors at the active institute
// Supports optional ?category= query filter
router.get('/', authMiddleware, authorizeRole(['Student', 'Counselor']), async (req, res) => {
  try {
    const instituteId = req.headers['x-active-institute'] || req.user.institute_id;
    const { category } = req.query;

    if (!instituteId) {
      return res.status(400).json({ error: 'Institute context is missing.' });
    }

    const filter = { institute_id: instituteId };
    if (category && category.trim()) {
      filter.category = { $regex: new RegExp(category.trim(), 'i') }; // case-insensitive
    }

    const resources = await Resource.find(filter)
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      institute_id: instituteId,
      category: category || null,
      total: resources.length,
      resources,
    });
  } catch (error) {
    console.error('❌ Error fetching resources:', error.message);
    res.status(500).json({ error: 'Failed to fetch resources' });
  }
});

// ─── POST /api/resources/search ───
// Gemini Search Integration
router.post('/search', authMiddleware, async (req, res) => {
  try {
    const { query } = req.body;
    if (!query) return res.status(400).json({ error: 'Search query is required' });

    logger.start(`[resource.js : search : 12] -> API Search requested for: ${query}`);
    const results = await searchResources(query);

    res.status(200).json({ results });
  } catch (error) {
    logger.error(`[resource.js : search : 17] -> Search failed: ${error.message}`);
    res.status(500).json({ error: 'Resource search failed' });
  }
});

// ─── POST /api/resources/assign ───
// Counselors assign specifically to a student
router.post('/assign', authMiddleware, authorizeRole(['Counselor']), async (req, res) => {
  try {
    const counselor_id = req.user.id;
    const { title, url, type, student_id } = req.body;

    if (!title || !url || !type || !student_id) {
      return res.status(400).json({ error: 'title, url, type, and student_id are required' });
    }

    const assigned = await AssignedResource.create({
      title, url, type, student_id, counselor_id
    });

    logger.success(`[resource.js : assign : 37] -> Resource assigned to student ${student_id}`);
    res.status(201).json({ message: 'Resource assigned successfully', assigned });
  } catch (error) {
    logger.error(`[resource.js : assign : 40] -> Assignment failed: ${error.message}`);
    res.status(500).json({ error: 'Failed to assign resource' });
  }
});

// ─── GET /api/resources/assigned ───
// Students fetch their specific assigned list
router.get('/assigned', authMiddleware, authorizeRole(['Student']), async (req, res) => {
  try {
    const student_id = req.user.id;
    logger.start(`[resource.js : getAssigned : 50] -> Fetching assigned resources for student: ${student_id}`);

    const assigned = await AssignedResource.find({ student_id })
      .sort({ assigned_at: -1 })
      .lean();

    res.status(200).json({ assigned });
  } catch (error) {
    logger.error(`[resource.js : getAssigned : 58] -> Fetch failed: ${error.message}`);
    res.status(500).json({ error: 'Failed to fetch assigned resources' });
  }
});

module.exports = router;