const googleCalendar = require('./google-calendar.adapter');
const discriminador = require('./discriminador.adapter');

const integrations = {
  google_calendar: googleCalendar,
  discriminador: discriminador,
  // future_app: FutureAppAdapter  ← register new adapters here
};

module.exports = integrations;
