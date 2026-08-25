require('dotenv').config();
const express = require('express');
const cors = require('cors');
const musicRoutes = require('./routes/musicRoutes');
const cache = require('./services/cacheService');
const authRoutes = require('./routes/authRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use('/api', musicRoutes);
app.use('/api/auth', authRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'MusicLand Backend API inafanya kazi 🎵' });
});

cache.startCleanup(300); // futa cache zilizoisha muda kila dakika 5

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server inaendesha kwenye http://0.0.0.0:${PORT}`);
});