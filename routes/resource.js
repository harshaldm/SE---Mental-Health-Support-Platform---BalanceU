const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const authorizeRole = require('../middleware/authorizeRole');
const Resource = require('../models/Resource');

// ─── POST /api/resources ───
// Counselors add new wellness materials
router.post('/', authMiddleware, authorizeRole(['Counselor']), async (req, res) => {
  try {
    const counselorId = req.user.id;
    const instituteId = req.user.institute_id;
    const { title, category, content_type, url, description } = req.body;

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
// Students fetch resources from counselors at their own institute
// Supports optional ?category= query filter
router.get('/', authMiddleware, authorizeRole(['Student', 'Counselor']), async (req, res) => {
  try {
    const instituteId = req.user.institute_id;
    const { category } = req.query;

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

module.exports = router;
