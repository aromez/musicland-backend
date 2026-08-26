const express = require('express');
const cors = require('cors');
const timeout = require('connect-timeout');
const path = require('path');

// Import services
const { 
  getTrendingSongs, 
  getRecommendedSongs, 
  getPopularArtists, 
  getTrendingAlbums,
  searchSongs,
  getSongDetails,
  getStreamUrl
} = require('./services/ytmusicService');

const app = express();

// ===== Configuration =====
const PORT = process.env.PORT || 10000;
const TIMEOUT = parseInt(process.env.API_TIMEOUT) || 60000; // 60 seconds

// ===== Middleware =====

// Timeout middleware
app.use(timeout(`${TIMEOUT}ms`));

// CORS
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// JSON parser
app.use(express.json());

// Logging with response time
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.url} - ${res.statusCode} - ${duration}ms`);
    if (duration > 10000) {
      console.warn(`⚠️ SLOW: ${duration}ms - ${req.url}`);
    }
  });
  next();
});

// Force HTTPS in production
app.use((req, res, next) => {
  if (req.headers['x-forwarded-proto'] !== 'https' && process.env.NODE_ENV === 'production') {
    return res.redirect('https://' + req.headers.host + req.url);
  }
  next();
});

// ===== API Routes =====

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    timeout: TIMEOUT
  });
});

// Trending songs
app.get('/api/trending', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 4;
    
    console.log(`📊 Fetching trending: page=${page}, limit=${limit}`);
    const result = await getTrendingSongs(page, limit);
    
    res.json(result);
  } catch (error) {
    console.error('❌ Trending error:', error.message);
    res.status(500).json({ 
      error: 'Failed to fetch trending songs',
      message: error.message 
    });
  }
});

// Recommended songs
app.get('/api/recommended', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 4;
    
    console.log(`📊 Fetching recommended: page=${page}, limit=${limit}`);
    const result = await getRecommendedSongs(page, limit);
    
    res.json(result);
  } catch (error) {
    console.error('❌ Recommended error:', error.message);
    res.status(500).json({ 
      error: 'Failed to fetch recommended songs',
      message: error.message 
    });
  }
});

// Popular artists
app.get('/api/artists/popular', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    
    console.log(`📊 Fetching popular artists: limit=${limit}`);
    const result = await getPopularArtists(limit);
    
    res.json(result);
  } catch (error) {
    console.error('❌ Popular artists error:', error.message);
    res.status(500).json({ 
      error: 'Failed to fetch popular artists',
      message: error.message 
    });
  }
});

// Trending albums
app.get('/api/albums/trending', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    
    console.log(`📊 Fetching trending albums: limit=${limit}`);
    const result = await getTrendingAlbums(limit);
    
    res.json(result);
  } catch (error) {
    console.error('❌ Trending albums error:', error.message);
    res.status(500).json({ 
      error: 'Failed to fetch trending albums',
      message: error.message 
    });
  }
});

// Search
app.get('/api/search', async (req, res) => {
  try {
    const query = req.query.q;
    const filter = req.query.filter || null;
    const limit = parseInt(req.query.limit) || 10;
    
    if (!query) {
      return res.status(400).json({ error: 'Search query required' });
    }
    
    console.log(`📊 Searching: query="${query}", filter=${filter}`);
    const result = await searchSongs(query, filter, limit);
    
    res.json(result);
  } catch (error) {
    console.error('❌ Search error:', error.message);
    res.status(500).json({ 
      error: 'Search failed',
      message: error.message 
    });
  }
});

// Song details
app.get('/api/song/:videoId', async (req, res) => {
  try {
    const { videoId } = req.params;
    
    console.log(`📊 Fetching song: ${videoId}`);
    const result = await getSongDetails(videoId);
    
    res.json(result);
  } catch (error) {
    console.error('❌ Song details error:', error.message);
    res.status(500).json({ 
      error: 'Failed to fetch song details',
      message: error.message 
    });
  }
});

// Stream URL
app.get('/api/stream/:videoId', async (req, res) => {
  try {
    const { videoId } = req.params;
    
    console.log(`📊 Getting stream URL: ${videoId}`);
    const result = await getStreamUrl(videoId);
    
    res.json(result);
  } catch (error) {
    console.error('❌ Stream URL error:', error.message);
    res.status(500).json({ 
      error: 'Failed to get stream URL',
      message: error.message 
    });
  }
});

// ===== Image Proxy =====
app.get('/api/image-proxy', async (req, res) => {
  try {
    const imageUrl = req.query.url;
    if (!imageUrl) {
      return res.status(400).json({ error: 'URL parameter required' });
    }
    
    const axios = require('axios');
    const response = await axios({
      method: 'get',
      url: imageUrl,
      responseType: 'stream',
      timeout: 10000
    });
    
    res.setHeader('Content-Type', response.headers['content-type']);
    response.data.pipe(res);
  } catch (error) {
    console.error('❌ Image proxy error:', error.message);
    res.status(500).json({ error: 'Failed to fetch image' });
  }
});

// ===== Error Handling =====
app.use((err, req, res, next) => {
  if (err.timeout) {
    console.error('⏰ Request timeout:', req.url);
    return res.status(503).json({ 
      error: 'Request timeout', 
      message: `Server took longer than ${TIMEOUT}ms to respond`
    });
  }
  
  console.error('❌ Server error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: err.message 
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ===== Start Server =====
const server = app.listen(PORT, () => {
  console.log(`🚀 MusicLand Backend`);
  console.log(`📡 Server running on port ${PORT}`);
  console.log(`⏱️  Timeout: ${TIMEOUT}ms`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Set server timeout
server.timeout = TIMEOUT;
server.keepAliveTimeout = TIMEOUT;

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, closing server...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, closing server...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});