require('dotenv').config();

const express = require('express');
const cors = require('cors');

const musicRoutes = require('./routes/musicRoutes');
const authRoutes = require('./routes/authRoutes');
const cache = require('./services/cacheService');

const app = express();

const PORT = process.env.PORT || 3000;

app.use(
  cors({
    origin: '*',
  })
);

app.use(express.json({ limit: '2mb' }));

app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'MusicLand Backend API inafanya kazi 🎵',
    environment: process.env.NODE_ENV || 'development',
  });
});

app.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'ok',
    service: 'musicland-backend',
  });
});

app.use('/api', musicRoutes);
app.use('/api/auth', authRoutes);

app.use((err, req, res, next) => {
  console.error(err);

  res.status(500).json({
    success: false,
    message: 'Internal server error',
  });
});

cache.startCleanup(300);

app.listen(PORT, '0.0.0.0', () => {
  console.log(
    `MusicLand Backend inaendesha kwenye port ${PORT}`
  );
});
