require('dotenv').config();

const express = require('express');
const cors = require('cors');

const musicRoutes = require('./routes/musicRoutes');
const authRoutes = require('./routes/authRoutes');
const cache = require('./services/cacheService');

const app = express();

const PORT = process.env.PORT || 3000;

// ============================================================
// CORS
// ============================================================

app.use(
  cors({
    origin: true,
    credentials: false,
    methods: [
      'GET',
      'POST',
      'PUT',
      'PATCH',
      'DELETE',
      'OPTIONS',
    ],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Accept',
      'Origin',
      'X-Requested-With',
    ],
  })
);

// Handle browser preflight requests
app.options('*', cors());

// ============================================================
// BODY PARSER
// ============================================================

app.use(
  express.json({
    limit: '2mb',
  })
);

// ============================================================
// REQUEST LOGGER
// ============================================================

app.use((req, res, next) => {
  console.log(
    `[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`
  );

  next();
});

// ============================================================
// ROOT
// ============================================================

app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'MusicLand Backend API inafanya kazi 🎵',
    environment:
      process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
  });
});

// ============================================================
// HEALTH
// ============================================================

app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    status: 'ok',
    service: 'musicland-backend',
    timestamp: new Date().toISOString(),
  });
});

// ============================================================
// API ROUTES
// ============================================================

app.use('/api', musicRoutes);

app.use('/api/auth', authRoutes);

// ============================================================
// 404 HANDLER
// ============================================================

app.use((req, res) => {
  console.log(
    `404 - Route haijapatikana: ${req.method} ${req.originalUrl}`
  );

  res.status(404).json({
    success: false,
    message: 'Route haijapatikana',
    path: req.originalUrl,
  });
});

// ============================================================
// ERROR HANDLER
// ============================================================

app.use((err, req, res, next) => {
  console.error('SERVER ERROR:', err);

  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error:
      process.env.NODE_ENV === 'development'
        ? err.message
        : undefined,
  });
});

// ============================================================
// CACHE CLEANUP
// ============================================================

cache.startCleanup(300);

// ============================================================
// START SERVER
// ============================================================

app.listen(PORT, '0.0.0.0', () => {
  console.log(
    `🎵 MusicLand Backend inaendesha kwenye port ${PORT}`
  );

  console.log(
    `🌐 PORT: ${PORT}`
  );

  console.log(
    `🚀 Environment: ${
      process.env.NODE_ENV || 'development'
    }`
  );
});