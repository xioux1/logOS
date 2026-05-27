const { pool } = require('../config/db');

let cachedUserId = null;

async function getOrCreateSingleUser(client) {
  if (cachedUserId) return cachedUserId;

  const existing = await client.query(`SELECT id FROM logos.users LIMIT 1`);
  if (existing.rows.length > 0) {
    cachedUserId = existing.rows[0].id;
    return cachedUserId;
  }

  const result = await client.query(
    `INSERT INTO logos.users DEFAULT VALUES RETURNING id`
  );
  cachedUserId = result.rows[0].id;
  return cachedUserId;
}

async function authMiddleware(req, res, next) {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.error('API_KEY env var is not set');
    return res.status(500).json({ error: 'Server misconfiguration' });
  }

  const authHeader = req.headers['authorization'];
  const provided = authHeader?.startsWith('Bearer ')
    ? authHeader.slice(7)
    : req.headers['x-api-key'];

  if (!provided || provided !== apiKey) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const client = await pool.connect();
  try {
    req.logosUser = { id: await getOrCreateSingleUser(client) };
    next();
  } catch (err) {
    console.error('Auth middleware error:', err);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
}

module.exports = authMiddleware;
