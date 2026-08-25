const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const db = require('./database');

const JWT_SECRET = process.env.JWT_SECRET || 'musicland_dev_secret_badilisha_hii';
const OTP_EXPIRY_MS = 5 * 60 * 1000;

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function isEmail(value) {
  return /^[\w.-]+@([\w-]+\.)+[\w-]{2,4}$/.test(value);
}

// ============================================================
// REQUEST OTP - DEVELOPMENT MODE (NO EMAIL)
// ============================================================

async function requestOtp({ email, phone }) {
  const contact = email || phone;

  if (!contact) {
    throw new Error('Email au namba ya simu inahitajika');
  }

  if (phone && !email) {
    throw new Error('SMS OTP bado haijaunganishwa. Tumia email kwa sasa.');
  }

  if (email && !isEmail(email)) {
    throw new Error('Email uliyoingiza si sahihi');
  }

  // Generate OTP
  const code = generateOtp();
  const expiresAt = Date.now() + OTP_EXPIRY_MS;

  console.log('========================================');
  console.log('📧 DEVELOPMENT MODE - OTP GENERATED');
  console.log(`👤 Contact: ${contact}`);
  console.log(`🔑 OTP Code: ${code}`);
  console.log(`⏰ Expires: ${new Date(expiresAt).toISOString()}`);
  console.log('========================================');

  // Save OTP to database
  db.prepare(`
    INSERT INTO otp_codes (contact, code, expires_at)
    VALUES (?, ?, ?)
    ON CONFLICT(contact)
    DO UPDATE SET
      code = excluded.code,
      expires_at = excluded.expires_at
  `).run(contact, code, expiresAt);

  // Return success without sending email
  return {
    contact,
    devMode: true,
    message: 'OTP generated (check server logs for code)'
  };
}

// ============================================================
// VERIFY OTP - DEVELOPMENT MODE (ACCEPT ANY CODE)
// ============================================================

function verifyOtp({ contact, code }) {
  // DEVELOPMENT MODE - Auto-verify
  console.log('🔓 DEVELOPMENT MODE: Auto-verifying OTP');
  console.log(`👤 Contact: ${contact}`);
  console.log(`🔑 Code provided: ${code}`);

  // Check if OTP exists in database
  const row = db
    .prepare('SELECT * FROM otp_codes WHERE contact = ?')
    .get(contact);

  if (!row) {
    console.log('⚠️ No OTP found in database, generating temp token anyway');
  } else {
    console.log(`✅ OTP found in database: ${row.code}`);
    // Delete OTP after verification
    db.prepare('DELETE FROM otp_codes WHERE contact = ?').run(contact);
  }

  // Generate temp token
  const tempToken = jwt.sign(
    { contact, purpose: 'setup-profile' },
    JWT_SECRET,
    { expiresIn: '15m' }
  );

  console.log(`✅ Temp token generated for ${contact}`);
  
  return { tempToken };
}

// ============================================================
// SETUP PROFILE
// ============================================================

function setupProfile({ tempToken, username, password }) {
  let decoded;

  try {
    decoded = jwt.verify(tempToken, JWT_SECRET);
  } catch (error) {
    throw new Error('Session imeisha muda, anza tena usajili');
  }

  if (decoded.purpose !== 'setup-profile') {
    throw new Error('Token si sahihi');
  }

  const contact = decoded.contact;

  const existing = db.prepare(`
    SELECT * FROM users
    WHERE email = ? OR phone = ?
  `).get(contact, contact);

  if (existing) {
    throw new Error('Akaunti ya hii email/namba tayari ipo');
  }

  if (!username || !password) {
    throw new Error('Username na password vinahitajika');
  }

  if (password.length < 6) {
    throw new Error('Password lazima iwe na angalau characters 6');
  }

  const passwordHash = bcrypt.hashSync(password, 10);
  const id = crypto.randomUUID();
  const isEmailContact = isEmail(contact);

  db.prepare(`
    INSERT INTO users (
      id, email, phone, username, password_hash, avatar_url, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    isEmailContact ? contact : null,
    isEmailContact ? null : contact,
    username,
    passwordHash,
    null,
    Date.now()
  );

  const token = jwt.sign({ userId: id }, JWT_SECRET, { expiresIn: '30d' });

  console.log(`✅ User registered: ${username} (${contact})`);

  return {
    token,
    user: {
      id,
      username,
      email: isEmailContact ? contact : null,
      phone: isEmailContact ? null : contact,
      avatarUrl: null,
    },
  };
}

// ============================================================
// LOGIN
// ============================================================

function login({ identifier, password }) {
  const user = db.prepare(`
    SELECT * FROM users
    WHERE email = ? OR phone = ?
  `).get(identifier, identifier);

  if (!user) {
    throw new Error('Akaunti haipo. Hakikisha email/namba ni sahihi');
  }

  const valid = bcrypt.compareSync(password, user.password_hash);

  if (!valid) {
    throw new Error('Password si sahihi');
  }

  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '30d' });

  return {
    token,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      phone: user.phone,
      avatarUrl: user.avatar_url,
    },
  };
}

// ============================================================
// GET USER
// ============================================================

function getUserById(userId) {
  const user = db.prepare(`
    SELECT * FROM users WHERE id = ?
  `).get(userId);

  if (!user) {
    return null;
  }

  return {
    id: user.id,
    username: user.username,
    email: user.email,
    phone: user.phone,
    avatarUrl: user.avatar_url,
  };
}

// ============================================================
// VERIFY TOKEN
// ============================================================

function verifyToken(token) {
  if (!token) {
    throw new Error('Token haipo');
  }

  return jwt.verify(token, JWT_SECRET);
}

// ============================================================
// EXPORTS
// ============================================================

module.exports = {
  requestOtp,
  verifyOtp,
  setupProfile,
  login,
  getUserById,
  verifyToken,
};