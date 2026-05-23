const { google } = require('googleapis');
const { pool } = require('../../config/db');

// TODO: implement full OAuth2 callback flow (/api/auth/google/callback)
// For now, tokens are supplied via environment variables.
function buildOAuth2Client(tokens) {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
  oauth2Client.setCredentials(tokens);
  return oauth2Client;
}

async function getUserTokens(userId) {
  const result = await pool.query(
    `SELECT metadata FROM logos.users WHERE id = $1`,
    [userId]
  );
  const meta = result.rows[0]?.metadata || {};
  if (meta.google_tokens) return meta.google_tokens;

  // Fall back to env-level tokens (mock phase)
  if (process.env.GOOGLE_ACCESS_TOKEN) {
    return {
      access_token: process.env.GOOGLE_ACCESS_TOKEN,
      refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
    };
  }
  return null;
}

async function saveUserTokens(userId, tokens) {
  await pool.query(
    `UPDATE logos.users
        SET metadata = jsonb_set(COALESCE(metadata, '{}'), '{google_tokens}', $2::jsonb)
      WHERE id = $1`,
    [userId, JSON.stringify(tokens)]
  );
}

async function createEvent({ title, description, start, end }, userId) {
  const tokens = await getUserTokens(userId);
  if (!tokens) throw new Error('Google Calendar not connected for this user');

  const auth = buildOAuth2Client(tokens);

  // Persist refreshed tokens automatically
  auth.on('tokens', async (newTokens) => {
    const merged = { ...tokens, ...newTokens };
    await saveUserTokens(userId, merged).catch(console.error);
  });

  const calendar = google.calendar({ version: 'v3', auth });
  const response = await calendar.events.insert({
    calendarId: 'primary',
    requestBody: {
      summary: title,
      description: description || '',
      start: { dateTime: start },
      end: { dateTime: end },
    },
  });

  return response.data;
}

async function pull(_query, _userId) {
  // TODO: implement event listing if needed
  return [];
}

module.exports = { createEvent, pull };
