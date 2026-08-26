// services/authService.js
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const db = require('./database');

const JWT_SECRET = process.env.JWT_SECRET || 'musicland_dev_secret_badilisha_hii';

// ============================================================
// REGISTER - Direct registration without OTP
// ============================================================

function register({ email, username, password }) {
  // ----------------------------------------------------------
  // Validate input
  // ----------------------------------------------------------

  if (!email) {
    throw new Error('Email inahitajika');
  }

  if (!username) {
    throw new Error('Username inahitajika');
  }

  if (!password) {
    throw new Error('Password inahitajika');
  }

  if (password.length < 6) {
    throw new Error('Password lazima iwe na angalau characters 6');
  }

  // Check if email already exists
  const existing = db.prepare(`
    SELECT * FROM users WHERE email = ?
  `).get(email);

  if (existing) {
    throw new Error('Email hii tayari imesajiliwa');
  }

  // Check if username already exists
  const existingUsername = db.prepare(`
    SELECT * FROM users WHERE username = ?
  `).get(username);

  if (existingUsername) {
    throw new Error('Username hii tayari imechukuliwa');
  }

  // ----------------------------------------------------------
  // Create user
  // ----------------------------------------------------------

  const passwordHash = bcrypt.hashSync(password, 10);
  const id = crypto.randomUUID();

  db.prepare(`
    INSERT INTO users (
      id, email, username, password_hash, avatar_url, created_at
    ) VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    id,
    email,
    username,
    passwordHash,
    null,
    Date.now()
  );

  // ----------------------------------------------------------
  // Generate token
  // ----------------------------------------------------------

  const token = jwt.sign(
    { userId: id, email },
    JWT_SECRET,
    { expiresIn: '30d' }
  );

  console.log(`✅ User registered: ${username} (${email})`);

  return {
    token,
    user: {
      id,
      username,
      email,
      avatarUrl: null,
    },
  };
}

// ============================================================
// LOGIN - Simple login with email and password
// ============================================================

function login({ email, password }) {
  // ----------------------------------------------------------
  // Validate input
  // ----------------------------------------------------------

  if (!email) {
    throw new Error('Email inahitajika');
  }

  if (!password) {
    throw new Error('Password inahitajika');
  }

  // ----------------------------------------------------------
  // Find user
  // ----------------------------------------------------------

  const user = db.prepare(`
    SELECT * FROM users WHERE email = ?
  `).get(email);

  if (!user) {
    throw new Error('Email au password si sahihi');
  }

  // ----------------------------------------------------------
  // Verify password
  // ----------------------------------------------------------

  const valid = bcrypt.compareSync(password, user.password_hash);

  if (!valid) {
    throw new Error('Email au password si sahihi');
  }

  // ----------------------------------------------------------
  // Generate token
  // ----------------------------------------------------------

  const token = jwt.sign(
    { userId: user.id, email: user.email },
    JWT_SECRET,
    { expiresIn: '30d' }
  );

  return {
    token,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      avatarUrl: user.avatar_url,
    },
  };
}

// ============================================================
// GET USER BY ID
// ============================================================

function getUserById(userId) {
  const user = db.prepare(`
    SELECT id, email, username, avatar_url, created_at
    FROM users
    WHERE id = ?
  `).get(userId);

  if (!user) {
    return null;
  }

  return {
    id: user.id,
    username: user.username,
    email: user.email,
    avatarUrl: user.avatar_url,
    createdAt: user.created_at,
  };
}

// ============================================================
// VERIFY TOKEN
// ============================================================

function verifyToken(token) {
  if (!token) {
    throw new Error('Token haipo');
  }

  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    throw new Error('Token si sahihi au imeisha muda');
  }
}

// ============================================================
// GET USER BY EMAIL
// ============================================================

function getUserByEmail(email) {
  const user = db.prepare(`
    SELECT id, email, username, avatar_url
    FROM users
    WHERE email = ?
  `).get(email);

  return user || null;
}

// ============================================================
// UPDATE USER
// ============================================================

function updateUser(userId, data) {
  const { username, avatarUrl } = data;

  if (username) {
    db.prepare(`
      UPDATE users SET username = ? WHERE id = ?
    `).run(username, userId);
  }

  if (avatarUrl !== undefined) {
    db.prepare(`
      UPDATE users SET avatar_url = ? WHERE id = ?
    `).run(avatarUrl, userId);
  }

  return getUserById(userId);
}

// ============================================================
// EXPORTS
// ============================================================

module.exports = {
  register,
  login,
  getUserById,
  getUserByEmail,
  verifyToken,
  updateUser,
};