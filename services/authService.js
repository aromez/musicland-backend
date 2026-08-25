const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const db = require('./database');
const { sendOtpEmail } = require('./emailService');

const JWT_SECRET =
  process.env.JWT_SECRET ||
  'musicland_dev_secret_badilisha_hii';

const OTP_EXPIRY_MS = 5 * 60 * 1000;

function generateOtp() {
  return Math.floor(
    100000 + Math.random() * 900000
  ).toString();
}

function isEmail(value) {
  return /^[\w.-]+@([\w-]+\.)+[\w-]{2,4}$/.test(value);
}

// ============================================================
// REQUEST OTP
// ============================================================

async function requestOtp({ email, phone }) {
  const contact = email || phone;

  if (!contact) {
    throw new Error(
      'Email au namba ya simu inahitajika'
    );
  }

  if (phone && !email) {
    throw new Error(
      'SMS OTP bado haijaunganishwa. Tumia email kwa sasa.'
    );
  }

  if (email && !isEmail(email)) {
    throw new Error(
      'Email uliyoingiza si sahihi'
    );
  }

  const code = generateOtp();

  const expiresAt =
    Date.now() + OTP_EXPIRY_MS;

  console.log(
    `🔐 OTP generated for ${contact}`
  );

  // ==========================================================
  // SAVE OTP
  // ==========================================================

  db.prepare(`
    INSERT INTO otp_codes
      (contact, code, expires_at)
    VALUES (?, ?, ?)

    ON CONFLICT(contact)
    DO UPDATE SET
      code = excluded.code,
      expires_at = excluded.expires_at
  `).run(
    contact,
    code,
    expiresAt
  );

  // ==========================================================
  // SEND EMAIL
  // ==========================================================

  if (email) {
    try {
      await sendOtpEmail(
        email,
        code
      );

      console.log(
        `✅ OTP sent successfully to ${email}`
      );
    } catch (error) {

      db.prepare(
        'DELETE FROM otp_codes WHERE contact = ?'
      ).run(contact);

      console.error(
        `❌ Failed sending OTP to ${email}:`,
        error.message
      );

      throw new Error(
        'Imeshindikana kutuma OTP kwenye email. Jaribu tena.'
      );
    }
  }

  return {
    contact,
  };
}

// ============================================================
// VERIFY OTP
// ============================================================

function verifyOtp({
  contact,
  code,
}) {
  const row = db
    .prepare(
      'SELECT * FROM otp_codes WHERE contact = ?'
    )
    .get(contact);

  if (!row) {
    throw new Error(
      'Hakuna code iliyotumwa kwa hii email'
    );
  }

  if (
    row.expires_at <
    Date.now()
  ) {
    db.prepare(
      'DELETE FROM otp_codes WHERE contact = ?'
    ).run(contact);

    throw new Error(
      'Code imeisha muda, omba code mpya'
    );
  }

  if (row.code !== code) {
    throw new Error(
      'Code si sahihi'
    );
  }

  // Delete OTP after successful verification

  db.prepare(
    'DELETE FROM otp_codes WHERE contact = ?'
  ).run(contact);

  const tempToken = jwt.sign(
    {
      contact,
      purpose: 'setup-profile',
    },
    JWT_SECRET,
    {
      expiresIn: '15m',
    }
  );

  return {
    tempToken,
  };
}

// ============================================================
// SETUP PROFILE
// ============================================================

function setupProfile({
  tempToken,
  username,
  password,
}) {
  let decoded;

  try {
    decoded =
      jwt.verify(
        tempToken,
        JWT_SECRET
      );
  } catch (error) {
    throw new Error(
      'Session imeisha muda, anza tena usajili'
    );
  }

  if (
    decoded.purpose !==
    'setup-profile'
  ) {
    throw new Error(
      'Token si sahihi'
    );
  }

  const contact =
    decoded.contact;

  const existing =
    db.prepare(`
      SELECT *
      FROM users
      WHERE email = ?
         OR phone = ?
    `).get(
      contact,
      contact
    );

  if (existing) {
    throw new Error(
      'Akaunti ya hii email/namba tayari ipo'
    );
  }

  if (!username || !password) {
    throw new Error(
      'Username na password vinahitajika'
    );
  }

  if (password.length < 6) {
    throw new Error(
      'Password lazima iwe na angalau characters 6'
    );
  }

  const passwordHash =
    bcrypt.hashSync(
      password,
      10
    );

  const id =
    crypto.randomUUID();

  const isEmailContact =
    isEmail(contact);

  db.prepare(`
    INSERT INTO users
      (
        id,
        email,
        phone,
        username,
        password_hash,
        avatar_url,
        created_at
      )
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    isEmailContact
      ? contact
      : null,

    isEmailContact
      ? null
      : contact,

    username,
    passwordHash,
    null,
    Date.now()
  );

  const token =
    jwt.sign(
      {
        userId: id,
      },
      JWT_SECRET,
      {
        expiresIn: '30d',
      }
    );

  return {
    token,

    user: {
      id,
      username,

      email:
        isEmailContact
          ? contact
          : null,

      phone:
        isEmailContact
          ? null
          : contact,

      avatarUrl: null,
    },
  };
}

// ============================================================
// LOGIN
// ============================================================

function login({
  identifier,
  password,
}) {
  const user =
    db.prepare(`
      SELECT *
      FROM users
      WHERE email = ?
         OR phone = ?
    `).get(
      identifier,
      identifier
    );

  if (!user) {
    throw new Error(
      'Akaunti haipo. Hakikisha email/namba ni sahihi'
    );
  }

  const valid =
    bcrypt.compareSync(
      password,
      user.password_hash
    );

  if (!valid) {
    throw new Error(
      'Password si sahihi'
    );
  }

  const token =
    jwt.sign(
      {
        userId: user.id,
      },
      JWT_SECRET,
      {
        expiresIn: '30d',
      }
    );

  return {
    token,

    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      phone: user.phone,
      avatarUrl:
        user.avatar_url,
    },
  };
}

// ============================================================
// GET USER
// ============================================================

function getUserById(userId) {
  const user =
    db.prepare(`
      SELECT *
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
    phone: user.phone,
    avatarUrl:
      user.avatar_url,
  };
}

// ============================================================
// VERIFY TOKEN
// ============================================================

function verifyToken(token) {
  if (!token) {
    throw new Error(
      'Token haipo'
    );
  }

  return jwt.verify(
    token,
    JWT_SECRET
  );
}

module.exports = {
  requestOtp,
  verifyOtp,
  setupProfile,
  login,
  getUserById,
  verifyToken,
};