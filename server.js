require('dotenv').config();

const express = require('express');
const cors = require('cors');

const musicRoutes = require('./routes/musicRoutes');
const authRoutes = require('./routes/authRoutes');
const cache = require('./services/cacheService');
const { verifyEmailTransporter } = require('./services/emailService');

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================================
// CORS
// ============================================================

// Allow requests from your Flutter app and frontend
const allowedOrigins = [
  'https://musicland-frontend.onrender.com',
  'http://localhost:3000',
  'http://localhost:5000',
  'http://localhost:8080',
];

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps, curl)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      console.log('❌ CORS blocked:', origin);
      callback(new Error('CORS policy violation'));
    }
  },
  credentials: false,
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

app.listen(PORT, '0.0.0.0', async () => {
  console.log('========================================');
  console.log('🎵 MusicLand Backend');
  console.log('========================================');
  console.log(`🚀 Server inaendesha kwenye port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📧 Brevo configured: ${process.env.BREVO_API_KEY ? 'YES' : 'NO'}`);
  console.log(`🔐 Brevo From Email: ${process.env.BREVO_FROM_EMAIL || 'NOT SET'}`);
  console.log(`🔑 JWT configured: ${process.env.JWT_SECRET ? 'YES' : 'NO'}`);
  console.log(`🕐 Started: ${new Date().toISOString()}`);
  console.log('========================================');

  // Verify Brevo configuration
  await verifyEmailTransporter();
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