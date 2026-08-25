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
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Accept',
      'Origin',
      'X-Requested-With',
    ],
  })
);

// ============================================================
// BODY PARSER
// ============================================================

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

// ============================================================
// REQUEST LOGGER
// ============================================================

app.use((req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;

    console.log(
      `[${new Date().toISOString()}] ${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`
    );
  });

  next();
});

// ============================================================
// ROOT
// ============================================================

app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'MusicLand Backend API inafanya kazi 🎵',
    environment: process.env.NODE_ENV || 'production',
    timestamp: new Date().toISOString(),
  });
});

// ============================================================
// HEALTH CHECK
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
// API HEALTH
// ============================================================

app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    status: 'ok',
    service: 'musicland-backend',
    timestamp: new Date().toISOString(),
  });
});

// ============================================================
// ROUTES
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
    error: 'Route haijapatikana',
    path: req.originalUrl,
    method: req.method,
  });
});

// ============================================================
// GLOBAL ERROR HANDLER
// ============================================================

app.use((err, req, res, next) => {
  console.error('========================================');
  console.error('GLOBAL SERVER ERROR');
  console.error(err);
  console.error('========================================');

  if (res.headersSent) {
    return next(err);
  }

  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message:
      process.env.NODE_ENV === 'development'
        ? err.message
        : 'Server imepata hitilafu',
  });
});

// ============================================================
// CACHE CLEANUP
// ============================================================

try {
  cache.startCleanup(300);
  console.log('✅ Cache cleanup imeanzishwa');
} catch (error) {
  console.error(
    '⚠️ Cache cleanup haikuanza:',
    error.message
  );
}

// ============================================================
// START SERVER
// ============================================================

app.listen(PORT, '0.0.0.0', () => {
  console.log('========================================');
  console.log('🎵 MusicLand Backend');
  console.log('========================================');
  console.log(`🚀 Server inaendesha kwenye port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'production'}`);
  console.log(`🕐 Started: ${new Date().toISOString()}`);
  console.log('========================================');
});