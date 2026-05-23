const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');

async function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing authorization token' });
  }

  const token = authHeader.slice(7);

  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  const externalId = String(payload.sub || payload.id);
  const provider = payload.provider || 'discriminador';

  const client = await pool.connect();
  try {
    // Look up existing federated identity
    const existing = await client.query(
      `SELECT fi.logos_user_id
         FROM logos.federated_identities fi
        WHERE fi.provider = $1 AND fi.external_id = $2`,
      [provider, externalId]
    );

    if (existing.rows.length > 0) {
      req.logosUser = { id: existing.rows[0].logos_user_id };
      return next();
    }

    // Auto-provision: create logos user + federated identity
    await client.query('BEGIN');
    const userResult = await client.query(
      `INSERT INTO logos.users DEFAULT VALUES RETURNING id`
    );
    const logosUserId = userResult.rows[0].id;

    await client.query(
      `INSERT INTO logos.federated_identities (logos_user_id, provider, external_id)
       VALUES ($1, $2, $3)`,
      [logosUserId, provider, externalId]
    );
    await client.query('COMMIT');

    req.logosUser = { id: logosUserId };
    next();
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('Auth middleware error:', err);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
}

module.exports = authMiddleware;
