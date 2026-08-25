const express = require('express');
const router = express.Router();
const authService = require('../services/authService');

router.post('/register', async (req, res) => {
  try {
    const { email, phone } = req.body;
    const result = await authService.requestOtp({ email, phone });
    res.json({ message: 'Code imetumwa', contact: result.contact });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/verify-otp', (req, res) => {
  try {
    const { contact, code } = req.body;
    const result = authService.verifyOtp({ contact, code });
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/resend-otp', async (req, res) => {
  try {
    const { contact } = req.body;
    const isEmail = contact.includes('@');
    await authService.requestOtp(isEmail ? { email: contact } : { phone: contact });
    res.json({ message: 'Code mpya imetumwa' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/setup-profile', (req, res) => {
  try {
    const tempToken = req.headers.authorization?.replace('Bearer ', '');
    const { username, password } = req.body;
    const result = authService.setupProfile({ tempToken, username, password });
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/login', (req, res) => {
  try {
    const { identifier, password } = req.body;
    const result = authService.login({ identifier, password });
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/logout', (req, res) => {
  res.json({ message: 'Umetoka kikamilifu' });
});

// GET /api/auth/me - pata taarifa za user aliyeko-login (kutumia token)
router.get('/me', (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    const decoded = authService.verifyToken(token);
    const user = authService.getUserById(decoded.userId);
    if (!user) return res.status(404).json({ error: 'User hajapatikana' });
    res.json({ user });
  } catch (err) {
    res.status(401).json({ error: 'Token si sahihi au imeisha muda' });
  }
});

module.exports = router;