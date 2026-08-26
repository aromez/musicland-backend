// routes/authRoutes.js
const express = require('express');
const router = express.Router();

const auth = require('../services/authService');

// ============================================================
// REGISTER - Direct registration
// ============================================================

router.post('/register', (req, res) => {
  try {
    const { email, username, password } = req.body;

    if (!email || !username || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email, username na password vinahitajika'
      });
    }

    const result = auth.register({ email, username, password });

    res.status(201).json({
      success: true,
      token: result.token,
      user: result.user,
      message: 'Akaunti imeundwa kikamilifu'
    });
  } catch (error) {
    console.error('❌ Registration error:', error.message);
    
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================================
// LOGIN
// ============================================================

router.post('/login', (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email na password vinahitajika'
      });
    }

    const result = auth.login({ email, password });

    res.json({
      success: true,
      token: result.token,
      user: result.user,
      message: 'Logged in successfully'
    });
  } catch (error) {
    console.error('❌ Login error:', error.message);
    
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================================
// GET CURRENT USER
// ============================================================

router.get('/me', (req, res) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Authorization token inahitajika'
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = auth.verifyToken(token);
    
    const user = auth.getUserById(decoded.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User haipatikani'
      });
    }

    res.json({
      success: true,
      user
    });
  } catch (error) {
    console.error('❌ Get user error:', error.message);
    
    res.status(401).json({
      success: false,
      error: error.message || 'Token si sahihi au imeisha muda'
    });
  }
});

// ============================================================
// UPDATE USER
// ============================================================

router.put('/me', (req, res) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Authorization token inahitajika'
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = auth.verifyToken(token);
    
    const { username, avatarUrl } = req.body;
    
    const user = auth.updateUser(decoded.userId, { username, avatarUrl });

    res.json({
      success: true,
      user,
      message: 'User updated successfully'
    });
  } catch (error) {
    console.error('❌ Update user error:', error.message);
    
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================================
// CHECK EMAIL AVAILABILITY
// ============================================================

router.post('/check-email', (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email inahitajika'
      });
    }

    const user = auth.getUserByEmail(email);

    res.json({
      success: true,
      available: !user,
      message: user ? 'Email tayari imesajiliwa' : 'Email inapatikana'
    });
  } catch (error) {
    console.error('❌ Check email error:', error.message);
    
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;