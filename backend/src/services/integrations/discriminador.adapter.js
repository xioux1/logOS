const axios = require('axios');

const BASE_URL = () => process.env.DISCRIMINADOR_BASE_URL || 'http://localhost:3000';

async function logSession({ session_type, subject, duration_minutes, notes }, userToken) {
  const response = await axios.post(
    `${BASE_URL()}/api/sessions`,
    { session_type, subject, duration_minutes, notes },
    {
      headers: {
        Authorization: `Bearer ${userToken}`,
        'Content-Type': 'application/json',
      },
      timeout: 8000,
    }
  );
  return response.data;
}

async function pull(_query, _userToken) {
  // TODO: implement session history fetch if needed
  return [];
}

module.exports = { logSession, pull };
