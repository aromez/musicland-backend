require('dotenv').config();

const express = require('express');
const cors = require('cors');

const musicRoutes = require('./routes/musicRoutes');
const authRoutes = require('./routes/authRoutes');
const cache = require('./services/cacheService');

const app = express();

// Render provides PORT through environment variables
const PORT = process.env.PORT || 3000;

// ============================================================
// BASIC APP SETTINGS
// ============================================================

app.disable('x-powered-by');

// ============================================================
// CORS
// ============================================================

const corsOptions = {
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
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));

// ============================================================
// BODY PARSER
// ============================================================

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// ============================================================
// REQUEST LOGGER
// ============================================================

app.use((req, res, next) => {
  const start = Date.now();

  console.log(`[REQUEST] ${req.method} ${req.originalUrl}`);

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
// API HEALTH CHECK
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
// API ROUTES
// ============================================================

// Music routes
app.use('/api', musicRoutes);

// Authentication routes
app.use('/api/auth', authRoutes);

// ============================================================
// 404 HANDLER
// ============================================================

app.use((req, res) => {
  console.log(`[404] ${req.method} ${req.originalUrl}`);

  res.status(404).json({
    success: false,
    error: 'Route haijapatikana',
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString(),
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

  const isDevelopment = process.env.NODE_ENV === 'development';

  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: isDevelopment ? err.message : 'Server imepata hitilafu',
    timestamp: new Date().toISOString(),
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
    console.log('⚠️ Cache service haipatikani au haina startCleanup');
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
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'production'}`);
  console.log(`🕐 Started: ${new Date().toISOString()}`);
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
  // Keep server running
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
  // Keep server running
});