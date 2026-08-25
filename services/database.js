const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, '..', 'musicland.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE,
    phone TEXT UNIQUE,
    username TEXT,
    password_hash TEXT,
    avatar_url TEXT,
    created_at INTEGER
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS otp_codes (
    contact TEXT PRIMARY KEY,
    code TEXT,
    expires_at INTEGER
  )
`);

module.exports = db;