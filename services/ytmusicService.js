const { spawn } = require('child_process');
const path = require('path');

const PYTHON_BIN = path.join(__dirname, '..', 'python', 'venv', 'bin', 'python3');
const SCRIPT_PATH = path.join(__dirname, '..', 'python', 'ytmusic_lookup.py');

function runPythonCommand(args) {
  return new Promise((resolve, reject) => {
    const proc = spawn(PYTHON_BIN, [SCRIPT_PATH, ...args]);

    let output = '';
    let errorOutput = '';

    proc.stdout.on('data', (data) => {
      output += data.toString();
    });

    proc.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    proc.on('close', (code) => {
      if (code !== 0) {
        return reject(new Error(`Python process ilitoka na code ${code}: ${errorOutput}`));
      }
      try {
        const parsed = JSON.parse(output);
        if (parsed.error) {
          return reject(new Error(parsed.error));
        }
        resolve(parsed);
      } catch (e) {
        reject(new Error(`Imeshindikana ku-parse output ya Python: ${e.message}`));
      }
    });
  });
}

async function getTrending() {
  return runPythonCommand(['trending']);
}

async function search(query, filterType = null) {
  const args = ['search', query];
  if (filterType) args.push(filterType);
  return runPythonCommand(args);
}

async function getSong(videoId) {
  return runPythonCommand(['song', videoId]);
}

async function getWatchPlaylist(videoId) {
  return runPythonCommand(['watch_playlist', videoId]);
}

async function getStreamUrl(videoId) {
  return runPythonCommand(['stream', videoId]);
}

async function getArtistAlbums(artistId) {
  return runPythonCommand(['artist_albums', artistId]);
}

async function getArtistSongs(artistId) {
  return runPythonCommand(['artist_songs', artistId]);
}

async function getArtistDetails(artistId) {
  return runPythonCommand(['artist_details', artistId]);
}

async function getAlbumDetails(albumId) {
  return runPythonCommand(['album_details', albumId]);
}

module.exports = {
  getTrending,
  search,
  getSong,
  getWatchPlaylist,
  getStreamUrl,
  getArtistAlbums,
  getArtistSongs,
  getArtistDetails,
  getAlbumDetails,
};