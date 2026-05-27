require('dotenv').config();
const express = require('express');
const cors = require('cors');
const authMiddleware = require('./middleware/auth');

const logsRouter = require('./routes/logs');
const memoryRouter = require('./routes/memory');
const integrationsRouter = require('./routes/integrations');

const app = express();

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim())
  : null;

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (!allowedOrigins || allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error(`CORS: origin ${origin} not allowed`));
    },
    credentials: true,
  })
);

app.use(express.json());

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.use('/api/logs', authMiddleware, logsRouter);
app.use('/api/memory', authMiddleware, memoryRouter);
app.use('/api/integrations', authMiddleware, integrationsRouter);

const { runMigrations } = require('./config/db');

const PORT = process.env.PORT || 3001;
runMigrations()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`LogOS backend running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Migration failed, aborting startup:', err);
    process.exit(1);
  });

module.exports = app;
