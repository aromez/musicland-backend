const express = require('express');
const axios = require('axios');
const router = express.Router();
const ytmusicService = require('../services/ytmusicService');
const cache = require('../services/cacheService');

const GENRE_SEED_ARTISTS = {
  all: [
    'Alikiba', 'Harmonize', 'Burna Boy', 'Rema', 'Diamond Platnumz', 'Wizkid', 'Zuchu',
    'Davido', 'Mbosso', 'Rayvanny', 'Marioo', 'Asake', 'Tyla', 'Ayra Starr', 'Kizz Daniel',
  ],
  afrosounds: [
    'Burna Boy', 'Rema', 'Wizkid', 'Davido', 'Diamond Platnumz', 'Asake', 'Tyla',
    'Ayra Starr', 'Kizz Daniel', 'Omah Lay', 'Fireboy DML', 'CKay',
  ],
  hiphop: [
    'Drake', 'Kendrick Lamar', 'Travis Scott', 'J. Cole', 'Future', '21 Savage',
    'Lil Baby', 'Nas', 'Tyler, The Creator', 'Metro Boomin',
  ],
  pop: [
    'Taylor Swift', 'Ariana Grande', 'Dua Lipa', 'The Weeknd', 'Billie Eilish',
    'Sabrina Carpenter', 'Olivia Rodrigo', 'Harry Styles', 'Justin Bieber', 'Ed Sheeran',
  ],
  electronic: [
    'Calvin Harris', 'David Guetta', 'Martin Garrix', 'Marshmello', 'Alan Walker',
    'Zedd', 'Tiësto', 'Avicii', 'Kygo',
  ],
  caribbean: [
    'Sean Paul', 'Shenseea', 'Popcaan', 'Vybz Kartel', 'Koffee', 'Spice', 'Skillibeng',
  ],
  gospel: [
    'Rose Muhando', 'Christina Shusho', 'Ida Yesaya', 'Kefa Nyerenda', 'Judith Wa Nairobi',
    'Ruth Wamuyu', 'Rosa Ree', 'Willy Paul',
  ],
  instrumental: [
    'Kygo', 'ODESZA', 'Bonobo', 'Tycho', 'Rüfüs Du Sol', 'Ludovico Einaudi', 'Yiruma',
  ],
  latin: [
    'Bad Bunny', 'Karol G', 'Shakira', 'J Balvin', 'Rosalía', 'Peso Pluma', 'Feid',
  ],
  punjabi: [
    'Diljit Dosanjh', 'Sidhu Moose Wala', 'AP Dhillon', 'Karan Aujla', 'Shubh',
  ],
  rnb: [
    'SZA', 'Frank Ocean', 'Summer Walker', 'Brent Faiyaz', 'H.E.R.', 'Jhené Aiko', 'Daniel Caesar',
  ],
  rock: [
    'Imagine Dragons', 'Coldplay', 'OneRepublic', 'Foo Fighters', 'Linkin Park',
    'Twenty One Pilots', 'Muse',
  ],
  bongoflava: [
    'Alikiba', 'Harmonize', 'Diamond Platnumz', 'Mbosso', 'Zuchu', 'Rayvanny', 'Marioo',
    'Jux', 'Nandy', 'Lava Lava',
  ],
};

function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function getSeedArtistsForGenre(genre, count = 3) {
  const pool = GENRE_SEED_ARTISTS[genre] || GENRE_SEED_ARTISTS.all;
  return shuffleArray(pool).slice(0, Math.min(count, pool.length));
}

function proxyImage(req, originalUrl) {
  if (!originalUrl) return '';
  const base = `${req.protocol}://${req.get('host')}`;
  return `${base}/api/image-proxy?url=${encodeURIComponent(originalUrl)}`;
}

function mapSong(item, req, genre) {
  const rawCover = (item.thumbnails && item.thumbnails[item.thumbnails.length - 1]?.url) || '';
  return {
    id: item.videoId || item.id || '',
    title: item.title || 'Unknown',
    artist: (item.artists && item.artists[0]?.name) || item.artist || 'Unknown Artist',
    artistId: (item.artists && item.artists[0]?.id) || '',
    coverUrl: proxyImage(req, rawCover),
    albumId: item.album?.id || null,
    durationSec: item.duration_seconds || 0,
    streamUrl: item.videoId || '',
    genre: genre || 'all',
    isDownloaded: false,
    isLiked: false,
  };
}

function mapAlbum(item, req, fallbackArtist) {
  const rawYear = item.year;
  const year = typeof rawYear === 'string' ? parseInt(rawYear, 10) || 0 : (rawYear || 0);
  const rawCover = (item.thumbnails && item.thumbnails[item.thumbnails.length - 1]?.url) || '';

  return {
    id: item.browseId || item.playlistId || '',
    title: item.title || 'Unknown Album',
    artist: (item.artists && item.artists[0]?.name) || item.artist || fallbackArtist || '',
    coverUrl: proxyImage(req, rawCover),
    year: year,
  };
}

function mapArtist(item, req) {
  const rawAvatar = (item.thumbnails && item.thumbnails[item.thumbnails.length - 1]?.url) || '';
  return {
    id: item.browseId || '',
    name: item.artist || item.title || 'Unknown',
    avatarUrl: proxyImage(req, rawAvatar),
    monthlyListeners: 0,
  };
}

async function getSeedArtistSongs(req, genre = 'all') {
  const artistNames = getSeedArtistsForGenre(genre);

  const results = await Promise.all(
    artistNames.map(async (name) => {
      try {
        const artistResults = await ytmusicService.search(name, 'artists');
        const artist = artistResults?.[0];
        if (!artist?.browseId) return [];

        const songs = await ytmusicService.getArtistSongs(artist.browseId);
        return (songs || []).map((s) => mapSong(s, req, genre));
      } catch (e) {
        return [];
      }
    })
  );

  const merged = [];
  const maxLen = Math.max(...results.map((r) => r.length), 0);
  for (let i = 0; i < maxLen; i++) {
    for (const artistSongs of results) {
      if (artistSongs[i]) merged.push(artistSongs[i]);
    }
  }
  return shuffleArray(merged);
}

// GET /api/image-proxy?url=<encoded original image url>
router.get('/image-proxy', async (req, res) => {
  try {
    const url = req.query.url;
    if (!url) return res.status(400).send('Query parameter url inahitajika');

    const response = await axios.get(url, { responseType: 'arraybuffer' });
    res.set('Content-Type', response.headers['content-type'] || 'image/jpeg');
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Cache-Control', 'public, max-age=86400');
    res.send(response.data);
  } catch (err) {
    res.status(500).send('Imeshindikana kupakua image');
  }
});

// GET /api/trending?page=1&limit=4&genre=all
router.get('/trending', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 0;
    const limit = parseInt(req.query.limit) || 4;
    const genre = req.query.genre || 'all';

    const cacheKey = `trending:${genre}`;
    let allSongs = cache.get(cacheKey);

    if (!allSongs) {
      allSongs = await getSeedArtistSongs(req, genre);
      cache.set(cacheKey, allSongs, 600);
    }

    const start = page * limit;
    const songs = allSongs.slice(start, start + limit);

    res.json({ songs });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/albums/trending?limit=10
router.get('/albums/trending', async (req, res) => {
  try {
    const cacheKey = 'albums:trending';
    let albums = cache.get(cacheKey);

    if (!albums) {
      const results = await Promise.all(
        getSeedArtistsForGenre('all').map(async (name) => {
          try {
            const artistResults = await ytmusicService.search(name, 'artists');
            const artist = artistResults?.[0];
            if (!artist?.browseId) return [];

            const albumsData = await ytmusicService.getArtistAlbums(artist.browseId);
            return (albumsData || []).map((a) => ({ raw: a, artistName: name }));
          } catch (e) {
            return [];
          }
        })
      );

      const albumsMap = new Map();
      for (const artistAlbums of results) {
        for (const { raw, artistName } of artistAlbums) {
          const mapped = mapAlbum(raw, req, artistName);
          const rawId = raw.browseId || raw.playlistId || '';
          if (rawId && !albumsMap.has(rawId)) {
            albumsMap.set(rawId, mapped);
          }
        }
      }
      albums = shuffleArray(Array.from(albumsMap.values()));
      cache.set(cacheKey, albums, 600);
    }

    res.json({ albums });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/artists/popular?limit=10
router.get('/artists/popular', async (req, res) => {
  try {
    const cacheKey = 'artists:popular';
    let artists = cache.get(cacheKey);

    if (!artists) {
      const seedNames = getSeedArtistsForGenre('all', 5);
      const results = await Promise.all(
        seedNames.map(async (name) => {
          try {
            const data = await ytmusicService.search(name, 'artists');
            const artist = data?.[0];
            return artist ? mapArtist(artist, req) : null;
          } catch (e) {
            return null;
          }
        })
      );
      artists = results.filter((a) => a !== null);
      cache.set(cacheKey, artists, 600);
    }

    res.json({ artists });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/recommended?page=1&limit=4
router.get('/recommended', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 0;
    const limit = parseInt(req.query.limit) || 4;

    const cacheKey = 'recommended:all';
    let allSongs = cache.get(cacheKey);

    if (!allSongs) {
      allSongs = await getSeedArtistSongs(req, 'all');
      cache.set(cacheKey, allSongs, 600);
    }

    const start = page * limit;
    const songs = allSongs.slice(start, start + limit);

    res.json({ songs });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/search?q=query
router.get('/search', async (req, res) => {
  try {
    const query = req.query.q;
    if (!query) return res.status(400).json({ error: 'Query parameter q inahitajika' });

    const [songsData, albumsData, artistsData] = await Promise.all([
      ytmusicService.search(query, 'songs'),
      ytmusicService.search(query, 'albums'),
      ytmusicService.search(query, 'artists'),
    ]);

    res.json({
      songs: (songsData || []).map((item) => mapSong(item, req)),
      albums: (albumsData || []).map((item) => mapAlbum(item, req)),
      artists: (artistsData || []).map((item) => mapArtist(item, req)),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/stream/:videoId
router.get('/stream/:videoId', async (req, res) => {
  try {
    const result = await ytmusicService.getStreamUrl(req.params.videoId);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/artist/:artistId
router.get('/artist/:artistId', async (req, res) => {
  try {
    const cacheKey = `artist:${req.params.artistId}`;
    let data = cache.get(cacheKey);

    if (!data) {
      const raw = await ytmusicService.getArtistDetails(req.params.artistId);
      const topSongs = (raw.songs?.results || []).map((s) => mapSong(s, req));
      const albums = (raw.albums?.results || []).map((a) => mapAlbum(a, req, raw.name));

      data = {
        id: req.params.artistId,
        name: raw.name || 'Unknown',
        avatarUrl: proxyImage(req, (raw.thumbnails && raw.thumbnails[raw.thumbnails.length - 1]?.url) || ''),
        description: raw.description || '',
        topSongs,
        albums,
      };
      cache.set(cacheKey, data, 1800);
    }

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/album/:albumId
router.get('/album/:albumId', async (req, res) => {
  try {
    const cacheKey = `album:${req.params.albumId}`;
    let data = cache.get(cacheKey);

    if (!data) {
      const raw = await ytmusicService.getAlbumDetails(req.params.albumId);
      const songs = (raw.tracks || []).map((s) => mapSong(s, req));
      const rawYear = raw.year;
      const year = typeof rawYear === 'string' ? parseInt(rawYear, 10) || 0 : (rawYear || 0);

      data = {
        id: req.params.albumId,
        title: raw.title || 'Unknown Album',
        artist: (raw.artists && raw.artists[0]?.name) || '',
        coverUrl: proxyImage(req, (raw.thumbnails && raw.thumbnails[raw.thumbnails.length - 1]?.url) || ''),
        year,
        songs,
      };
      cache.set(cacheKey, data, 1800);
    }

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;