const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');
const claudeService = require('../services/claude.service');

// POST /api/logs — process a new entry through Claude
router.post('/', async (req, res) => {
  const { text } = req.body;
  if (!text || typeof text !== 'string' || !text.trim()) {
    return res.status(400).json({ error: 'text is required' });
  }

  // Forward the user's raw token so adapters can authenticate upstream
  const userToken = req.headers['authorization']?.slice(7);

  try {
    const result = await claudeService.processEntry(text.trim(), req.logosUser.id, userToken);
    res.json(result);
  } catch (err) {
    console.error('POST /api/logs error:', err);
    res.status(500).json({ error: 'Failed to process entry' });
  }
});

// GET /api/logs — paginated history with optional filters
router.get('/', async (req, res) => {
  const userId = req.logosUser.id;
  const limit = Math.min(parseInt(req.query.limit) || 20, 100);
  const offset = parseInt(req.query.offset) || 0;
  const type = req.query.type || null;
  const tags = req.query.tags ? req.query.tags.split(',') : null;

  try {
    let query = `
      SELECT
        l.id,
        l.raw_text,
        l.created_at,
        COALESCE(
          json_agg(
            json_build_object(
              'id', se.id,
              'type', se.type,
              'title', se.title,
              'scheduled_at', se.scheduled_at,
              'tags', se.tags,
              'priority', se.priority,
              'metadata', se.metadata,
              'created_at', se.created_at
            ) ORDER BY se.created_at
          ) FILTER (WHERE se.id IS NOT NULL),
          '[]'
        ) AS structured_entries
      FROM logos.logs l
      LEFT JOIN logos.structured_entries se ON se.log_id = l.id
      WHERE l.user_id = $1
    `;

    const params = [userId];
    let idx = 2;

    if (type) {
      query += ` AND se.type = $${idx++}`;
      params.push(type);
    }
    if (tags) {
      query += ` AND se.tags && $${idx++}`;
      params.push(tags);
    }

    query += `
      GROUP BY l.id
      ORDER BY l.created_at DESC
      LIMIT $${idx++} OFFSET $${idx++}
    `;
    params.push(limit, offset);

    const result = await pool.query(query, params);
    res.json({ logs: result.rows, limit, offset });
  } catch (err) {
    console.error('GET /api/logs error:', err);
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
});

module.exports = router;
