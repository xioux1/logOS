require('dotenv').config();
const express = require('express');
const cors = require('cors');
const authMiddleware = require('./middleware/auth');

const logsRouter = require('./routes/logs');
const memoryRouter = require('./routes/memory');
const integrationsRouter = require('./routes/integrations');

const app = express();

const allowedOrigins = [
  process.env.PWA_ORIGIN || 'http://localhost:5173',
  process.env.DISCRIMINADOR_ORIGIN || 'http://localhost:3000',
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. curl, server-to-server)
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
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

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`LogOS backend running on port ${PORT}`);
});

module.exports = app;
