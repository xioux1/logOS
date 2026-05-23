const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');

// GET /api/integrations/status
router.get('/status', async (req, res) => {
  const userId = req.logosUser.id;

  try {
    const userResult = await pool.query(
      `SELECT metadata FROM logos.users WHERE id = $1`,
      [userId]
    );
    const meta = userResult.rows[0]?.metadata || {};

    const status = {
      google_calendar: {
        connected: !!(meta.google_tokens?.access_token || process.env.GOOGLE_ACCESS_TOKEN),
        label: 'Google Calendar',
      },
      discriminador: {
        connected: !!process.env.DISCRIMINADOR_BASE_URL,
        label: 'Discriminador',
        base_url: process.env.DISCRIMINADOR_BASE_URL || null,
      },
    };

    res.json({ integrations: status });
  } catch (err) {
    console.error('GET /api/integrations/status error:', err);
    res.status(500).json({ error: 'Failed to fetch integration status' });
  }
});

module.exports = router;
