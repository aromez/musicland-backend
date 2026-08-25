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
  optionsSuccessStatus: 204,
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
    message: 'MusicLand Backend API inafanya kazi 🎵',
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
// MUSIC ROUTES
// ============================================================

app.use('/api', musicRoutes);

// ============================================================
// AUTH ROUTES
// ============================================================

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
    method: req.method,
  });
});

// ============================================================
// GLOBAL ERROR HANDLER
// ============================================================

app.use((err, req, res, next) => {
  console.error('========================================');
  console.error('❌ GLOBAL SERVER ERROR');
  console.error(err);
  console.error('========================================');

  if (res.headersSent) {
    return next(err);
  }

  const isDevelopment = process.env.NODE_ENV === 'development';

  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: isDevelopment ? err.message : 'Server imepata hitilafu',
  });
});

// ============================================================
// CACHE CLEANUP
// ============================================================

try {
  if (cache && typeof cache.startCleanup === 'function') {
    cache.startCleanup(300);
    console.log('✅ Cache cleanup imeanzishwa');
  } else {
    console.log('⚠️ Cache service haipatikani');
  }
} catch (error) {
  console.error('⚠️ Cache cleanup haikuanza:', error.message);
}

// ============================================================
// START SERVER
// ============================================================

app.listen(PORT, '0.0.0.0', () => {
  console.log('========================================');
  console.log('🎵 MusicLand Backend');
  console.log('========================================');
  console.log(`🚀 Server inaendesha kwenye port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔓 Email Service: DISABLED`);
  console.log(`🔑 JWT Secret: ${process.env.JWT_SECRET ? '✅ SET' : '❌ NOT SET'}`);
  console.log(`🕐 Started: ${new Date().toISOString()}`);
  console.log('========================================');
  console.log('💡 OTP Codes will be shown in console');
  console.log('💡 Check logs for OTP code');
  console.log('========================================');
});

// ============================================================
// GRACEFUL SHUTDOWN
// ============================================================

process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received. Closing server...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received. Closing server...');
  process.exit(0);
});

process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection:', reason);
});