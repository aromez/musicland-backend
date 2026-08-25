require('dotenv').config();

const express = require('express');
const cors = require('cors');

const musicRoutes =
  require('./routes/musicRoutes');

const authRoutes =
  require('./routes/authRoutes');

const cache =
  require('./services/cacheService');

const {
  verifyEmailTransporter,
} = require('./services/emailService');

const app = express();

const PORT =
  process.env.PORT || 3000;

// ============================================================
// MIDDLEWARE
// ============================================================

app.use(
  cors({
    origin: '*',
  })
);

app.use(
  express.json({
    limit: '2mb',
  })
);

// ============================================================
// ROOT
// ============================================================

app.get('/', (req, res) => {
  res.json({
    success: true,
    message:
      'MusicLand Backend API inafanya kazi 🎵',
    environment:
      process.env.NODE_ENV ||
      'development',
  });
});

// ============================================================
// HEALTH CHECK
// ============================================================

app.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'ok',
    service:
      'musicland-backend',
    time:
      new Date().toISOString(),
  });
});

// ============================================================
// API ROUTES
// ============================================================

app.use(
  '/api',
  musicRoutes
);

app.use(
  '/api/auth',
  authRoutes
);

// ============================================================
// ERROR HANDLER
// ============================================================

app.use(
  (err, req, res, next) => {
    console.error(
      '❌ GLOBAL ERROR:',
      err
    );

    res.status(500).json({
      success: false,
      message:
        'Internal server error',
    });
  }
);

// ============================================================
// CACHE CLEANUP
// ============================================================

cache.startCleanup(300);

// ============================================================
// START SERVER
// ============================================================

app.listen(
  PORT,
  '0.0.0.0',
  async () => {

    console.log(
      '=========================================='
    );

    console.log(
      '🎵 MusicLand Backend'
    );

    console.log(
      `🚀 Server inaendesha kwenye port ${PORT}`
    );

    console.log(
      `🌍 Environment: ${
        process.env.NODE_ENV ||
        'development'
      }`
    );

    console.log(
      `📧 Gmail configured: ${
        process.env.GMAIL_USER
          ? 'YES'
          : 'NO'
      }`
    );

    console.log(
      `🔐 JWT configured: ${
        process.env.JWT_SECRET
          ? 'YES'
          : 'NO'
      }`
    );

    console.log(
      '=========================================='
    );

    // ========================================================
    // TEST GMAIL SMTP
    // ========================================================

    await verifyEmailTransporter();
  }
);