const { pool } = require('../config/db');

const MAX_RAW_HISTORY = 10;

async function getMemory(userId) {
  const result = await pool.query(
    `SELECT summary, raw_history FROM logos.conversation_memory WHERE user_id = $1`,
    [userId]
  );
  if (result.rows.length === 0) {
    return { summary: null, raw_history: [] };
  }
  return result.rows[0];
}

async function updateMemory(userId, { summary, newTurns }) {
  const current = await getMemory(userId);
  let history = Array.isArray(current.raw_history) ? current.raw_history : [];

  if (newTurns) {
    history = [...history, ...newTurns];
    if (history.length > MAX_RAW_HISTORY) {
      history = history.slice(history.length - MAX_RAW_HISTORY);
    }
  }

  const newSummary = summary !== undefined ? summary : current.summary;

  await pool.query(
    `INSERT INTO logos.conversation_memory (user_id, summary, raw_history, last_updated)
     VALUES ($1, $2, $3, NOW())
     ON CONFLICT (user_id) DO UPDATE
       SET summary = EXCLUDED.summary,
           raw_history = EXCLUDED.raw_history,
           last_updated = NOW()`,
    [userId, newSummary, JSON.stringify(history)]
  );
}

async function resetMemory(userId) {
  await pool.query(
    `DELETE FROM logos.conversation_memory WHERE user_id = $1`,
    [userId]
  );
}

module.exports = { getMemory, updateMemory, resetMemory };
