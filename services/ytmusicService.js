const { spawn } = require('child_process');
const path = require('path');

// Simple concurrency limiter (3 concurrent processes)
class ConcurrencyLimiter {
  constructor(concurrency) {
    this.concurrency = concurrency;
    this.running = 0;
    this.queue = [];
  }

  async run(fn) {
    if (this.running >= this.concurrency) {
      await new Promise(resolve => this.queue.push(resolve));
    }
    this.running++;
    try {
      return await fn();
    } finally {
      this.running--;
      if (this.queue.length > 0) {
        const resolve = this.queue.shift();
        resolve();
      }
    }
  }
}

const limit = new ConcurrencyLimiter(3);

const PYTHON_BIN = process.env.PYTHON_BIN || 'python3';
const SCRIPT_PATH = path.join(
  __dirname,
  '..',
  'python',
  'ytmusic_lookup.py'
);

/**
 * Execute Python command with timeout and concurrency control
 */
function runPythonCommand(args, timeoutMs = 45000) {
  // Validate args
  if (!Array.isArray(args)) {
    return Promise.reject(new Error('Args must be an array'));
  }

  return limit.run(() => {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      const proc = spawn(PYTHON_BIN, [SCRIPT_PATH, ...args.map(String)]);
      
      let output = '';
      let errorOutput = '';
      let finished = false;
      
      // Kill process after timeout
      const timeout = setTimeout(() => {
        if (!finished) {
          finished = true;
          proc.kill('SIGTERM');
          reject(new Error(`Python timeout after ${timeoutMs}ms: ${args.join(' ')}`));
        }
      }, timeoutMs);
      
      proc.stdout.on('data', (data) => {
        output += data.toString();
        // Prevent memory issues
        if (output.length > 10 * 1024 * 1024) {
          proc.kill();
          reject(new Error('Python output too large (>10MB)'));
        }
      });
      
      proc.stderr.on('data', (data) => {
        errorOutput += data.toString();
        // Log stderr for debugging (but don't fail on warnings)
        console.warn(`[Python stderr] ${data.toString().trim()}`);
      });
      
      proc.on('error', (err) => {
        if (!finished) {
          finished = true;
          clearTimeout(timeout);
          reject(new Error(`Python process error: ${err.message}`));
        }
      });
      
      proc.on('close', (code) => {
        if (finished) return;
        finished = true;
        clearTimeout(timeout);
        
        const duration = Date.now() - startTime;
        console.log(`🐍 Python executed in ${duration}ms: ${args.join(' ')}`);
        
        if (duration > 10000) {
          console.warn(`⚠️ Slow Python: ${duration}ms for ${args.join(' ')}`);
        }
        
        // Always log stderr if present
        if (errorOutput) {
          console.warn(`[Python stderr] ${errorOutput.trim()}`);
        }
        
        if (code !== 0) {
          return reject(
            new Error(`Python exited with code ${code}: ${errorOutput || 'Unknown error'}`)
          );
        }
        
        // Try to parse JSON
        try {
          // Find JSON in output (in case there are log messages)
          const jsonMatch = output.match(/\{[\s\S]*\}/);
          const jsonStr = jsonMatch ? jsonMatch[0] : output;
          const parsed = JSON.parse(jsonStr);
          
          if (parsed.error) {
            reject(new Error(parsed.error));
          } else {
            // Remove debug info before returning
            delete parsed._executionTime;
            resolve(parsed);
          }
        } catch (e) {
          reject(new Error(
            `Failed to parse JSON: ${e.message}\nOutput preview: ${output.substring(0, 200)}`
          ));
        }
      });
    });
  });
}

// ===== API Functions =====

async function getTrendingSongs(page = 1, limit = 4) {
  try {
    // Convert page/limit to total limit (page * limit)
    const totalLimit = parseInt(page) * parseInt(limit);
    const result = await runPythonCommand(['trending', String(totalLimit)]);
    
    // Handle pagination
    if (result.songs) {
      const start = (parseInt(page) - 1) * parseInt(limit);
      const end = start + parseInt(limit);
      result.songs = result.songs.slice(start, end);
    }
    
    return result;
  } catch (error) {
    console.error('❌ Error fetching trending songs:', error.message);
    throw error;
  }
}

async function getRecommendedSongs(page = 1, limit = 4) {
  try {
    const totalLimit = parseInt(page) * parseInt(limit);
    const result = await runPythonCommand(['recommended', String(totalLimit)]);
    
    if (result.songs) {
      const start = (parseInt(page) - 1) * parseInt(limit);
      const end = start + parseInt(limit);
      result.songs = result.songs.slice(start, end);
    }
    
    return result;
  } catch (error) {
    console.error('❌ Error fetching recommended songs:', error.message);
    throw error;
  }
}

async function searchSongs(query, filterType = null, limit = 10) {
  try {
    const args = ['search', query];
    if (filterType) args.push(filterType);
    args.push(String(limit));
    
    return await runPythonCommand(args);
  } catch (error) {
    console.error('❌ Error searching songs:', error.message);
    throw error;
  }
}

async function getSongDetails(videoId) {
  try {
    return await runPythonCommand(['song', videoId]);
  } catch (error) {
    console.error('❌ Error getting song details:', error.message);
    throw error;
  }
}

async function getStreamUrl(videoId) {
  try {
    return await runPythonCommand(['stream', videoId]);
  } catch (error) {
    console.error('❌ Error getting stream URL:', error.message);
    throw error;
  }
}

async function getPopularArtists(limit = 10) {
  try {
    // Use trending songs to get popular artists
    const result = await runPythonCommand(['trending', '50']);
    if (result.songs) {
      // Extract unique artists
      const artistMap = new Map();
      result.songs.forEach(song => {
        if (song.artist && !artistMap.has(song.artistId)) {
          artistMap.set(song.artistId, {
            id: song.artistId,
            name: song.artist,
            coverUrl: song.coverUrl,
            songCount: 1
          });
        } else if (song.artistId && artistMap.has(song.artistId)) {
          const artist = artistMap.get(song.artistId);
          artist.songCount++;
        }
      });
      
      // Sort by song count and limit
      const artists = Array.from(artistMap.values())
        .sort((a, b) => b.songCount - a.songCount)
        .slice(0, parseInt(limit));
      
      return { artists };
    }
    return { artists: [] };
  } catch (error) {
    console.error('❌ Error fetching popular artists:', error.message);
    throw error;
  }
}

async function getTrendingAlbums(limit = 10) {
  try {
    const result = await runPythonCommand(['trending', '50']);
    if (result.songs) {
      // Extract unique albums
      const albumMap = new Map();
      result.songs.forEach(song => {
        if (song.albumId && !albumMap.has(song.albumId)) {
          albumMap.set(song.albumId, {
            id: song.albumId,
            title: song.title,
            artist: song.artist,
            coverUrl: song.coverUrl,
            trackCount: 1
          });
        } else if (song.albumId && albumMap.has(song.albumId)) {
          const album = albumMap.get(song.albumId);
          album.trackCount++;
        }
      });
      
      // Sort by track count and limit
      const albums = Array.from(albumMap.values())
        .sort((a, b) => b.trackCount - a.trackCount)
        .slice(0, parseInt(limit));
      
      return { albums };
    }
    return { albums: [] };
  } catch (error) {
    console.error('❌ Error fetching trending albums:', error.message);
    throw error;
  }
}

module.exports = {
  runPythonCommand,
  getTrendingSongs,
  getRecommendedSongs,
  searchSongs,
  getSongDetails,
  getStreamUrl,
  getPopularArtists,
  getTrendingAlbums
};