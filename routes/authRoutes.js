const express = require('express');

const router = express.Router();

const authService =
  require('../services/authService');

// ============================================================
// REGISTER - REQUEST OTP
// ============================================================

router.post('/register', async (req, res) => {
  try {
    const { email, phone } = req.body;

    console.log('==========================================');
    console.log('REGISTER REQUEST');
    console.log('Email:', email);
    console.log('Phone:', phone);
    console.log('==========================================');

    if (!email && !phone) {
      return res.status(400).json({
        success: false,
        error:
          'Email au namba ya simu inahitajika',
      });
    }

    const result =
      await authService.requestOtp({
        email,
        phone,
      });

    return res.status(200).json({
      success: true,
      message: 'Code imetumwa',
      contact: result.contact,
    });

  } catch (err) {
    console.error(
      '❌ REGISTER ERROR:',
      err.message
    );

    return res.status(400).json({
      success: false,
      error:
        err.message ||
        'Imeshindikana kutuma OTP',
    });
  }
});

// ============================================================
// VERIFY OTP
// ============================================================

router.post('/verify-otp', (req, res) => {
  try {
    const {
      contact,
      code,
    } = req.body;

    if (!contact || !code) {
      return res.status(400).json({
        success: false,
        error:
          'Contact na OTP code vinahitajika',
      });
    }

    const result =
      authService.verifyOtp({
        contact,
        code,
      });

    return res.status(200).json({
      success: true,
      ...result,
    });

  } catch (err) {
    console.error(
      '❌ VERIFY OTP ERROR:',
      err.message
    );

    return res.status(400).json({
      success: false,
      error:
        err.message ||
        'OTP si sahihi',
    });
  }
});

// ============================================================
// RESEND OTP
// ============================================================

router.post('/resend-otp', async (req, res) => {
  try {
    const { contact } = req.body;

    if (!contact) {
      return res.status(400).json({
        success: false,
        error:
          'Email au namba ya simu inahitajika',
      });
    }

    const isEmail =
      contact.includes('@');

    const result =
      await authService.requestOtp(
        isEmail
          ? { email: contact }
          : { phone: contact }
      );

    return res.status(200).json({
      success: true,
      message: 'Code mpya imetumwa',
      contact: result.contact,
    });

  } catch (err) {
    console.error(
      '❌ RESEND OTP ERROR:',
      err.message
    );

    return res.status(400).json({
      success: false,
      error:
        err.message ||
        'Imeshindikana kutuma OTP',
    });
  }
});

// ============================================================
// SETUP PROFILE
// ============================================================

router.post(
  '/setup-profile',
  (req, res) => {
    try {
      const authorization =
        req.headers.authorization;

      if (!authorization) {
        return res.status(401).json({
          success: false,
          error:
            'Authorization token inahitajika',
        });
      }

      const tempToken =
        authorization.replace(
          'Bearer ',
          ''
        );

      const {
        username,
        password,
      } = req.body;

      if (!username || !password) {
        return res.status(400).json({
          success: false,
          error:
            'Username na password vinahitajika',
        });
      }

      const result =
        authService.setupProfile({
          tempToken,
          username,
          password,
        });

      return res.status(200).json({
        success: true,
        ...result,
      });

    } catch (err) {
      console.error(
        '❌ SETUP PROFILE ERROR:',
        err.message
      );

      return res.status(400).json({
        success: false,
        error: err.message,
      });
    }
  }
);

// ============================================================
// LOGIN
// ============================================================

router.post('/login', (req, res) => {
  try {
    const {
      identifier,
      password,
    } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({
        success: false,
        error:
          'Email/namba na password vinahitajika',
      });
    }

    const result =
      authService.login({
        identifier,
        password,
      });

    return res.status(200).json({
      success: true,
      ...result,
    });

  } catch (err) {
    console.error(
      '❌ LOGIN ERROR:',
      err.message
    );

    return res.status(401).json({
      success: false,
      error:
        err.message ||
        'Login imeshindikana',
    });
  }
});

// ============================================================
// LOGOUT
// ============================================================

router.post('/logout', (req, res) => {
  return res.status(200).json({
    success: true,
    message:
      'Umetoka kikamilifu',
  });
});

// ============================================================
// CURRENT USER
// ============================================================

router.get('/me', (req, res) => {
  try {
    const authorization =
      req.headers.authorization;

    if (!authorization) {
      return res.status(401).json({
        success: false,
        error:
          'Authorization token inahitajika',
      });
    }

    const token =
      authorization.replace(
        'Bearer ',
        ''
      );

    const decoded =
      authService.verifyToken(token);

    const user =
      authService.getUserById(
        decoded.userId
      );

    if (!user) {
      return res.status(404).json({
        success: false,
        error:
          'User hajapatikana',
      });
    }

    return res.status(200).json({
      success: true,
      user,
    });

  } catch (err) {
    console.error(
      '❌ GET ME ERROR:',
      err.message
    );

    return res.status(401).json({
      success: false,
      error:
        'Token si sahihi au imeisha muda',
    });
  }
});

module.exports = router;