// server.js
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

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With'],
}));

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
  console.log(`➡️ ${req.method} ${req.originalUrl}`);

  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`⬅️ ${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`);
  });

  next();
});

// ============================================================
// ROOT
// ============================================================

app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'MusicLand Backend API 🎵',
    environment: process.env.NODE_ENV || 'development',
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

app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    status: 'ok',
    service: 'musicland-backend-api',
    timestamp: new Date().toISOString(),
  });
});

// ============================================================
// ROUTES
// ============================================================

app.use('/api', musicRoutes);
app.use('/api/auth', authRoutes);

// ============================================================
// 404
// ============================================================

app.use((req, res) => {
  console.log(`❌ 404: ${req.method} ${req.originalUrl}`);

  res.status(404).json({
    success: false,
    error: 'Route haijapatikana',
    path: req.originalUrl,
  });
});

// ============================================================
// ERROR HANDLER
// ============================================================

app.use((err, req, res, next) => {
  console.error('❌ Error:', err);

  if (res.headersSent) {
    return next(err);
  }

  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// ============================================================
// CACHE CLEANUP
// ============================================================

try {
  if (cache && typeof cache.startCleanup === 'function') {
    cache.startCleanup(300);
    console.log('✅ Cache cleanup imeanzishwa');
  }
} catch (error) {
  console.error('⚠️ Cache cleanup error:', error.message);
}

// ============================================================
// START SERVER
// ============================================================

app.listen(PORT, '0.0.0.0', () => {
  console.log('========================================');
  console.log('🎵 MusicLand Backend');
  console.log('========================================');
  console.log(`🚀 Port: ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔑 JWT: ${process.env.JWT_SECRET ? '✅' : '❌'}`);
  console.log(`🕐 Started: ${new Date().toISOString()}`);
  console.log('========================================');
});