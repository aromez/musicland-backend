/**
 * MusicLand Email Service
 * Uses Brevo Transactional Email API over HTTPS
 * Suitable for Render Free Tier
 */

const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';
const BREVO_API_KEY = process.env.BREVO_API_KEY;
const BREVO_FROM_EMAIL = process.env.BREVO_FROM_EMAIL;
const BREVO_FROM_NAME = process.env.BREVO_FROM_NAME || 'MusicLand';

// ============================================================
// ENVIRONMENT CHECK
// ============================================================

if (!BREVO_API_KEY) {
  console.warn('⚠️ BREVO_API_KEY haijawekwa kwenye environment');
}

if (!BREVO_FROM_EMAIL) {
  console.warn('⚠️ BREVO_FROM_EMAIL haijawekwa kwenye environment');
}

// ============================================================
// VERIFY BREVO CONFIGURATION
// ============================================================

async function verifyEmailTransporter() {
  console.log('🔍 Verifying Brevo API configuration...');

  if (!BREVO_API_KEY) {
    console.error('❌ BREVO_API_KEY haijawekwa');
    return false;
  }

  if (!BREVO_FROM_EMAIL) {
    console.error('❌ BREVO_FROM_EMAIL haijawekwa');
    return false;
  }

  try {
    // Test API key by making a simple request
    const response = await fetch('https://api.brevo.com/v3/account', {
      headers: {
        accept: 'application/json',
        'api-key': BREVO_API_KEY,
      },
      signal: AbortSignal.timeout(10000),
    });

    if (response.ok) {
      console.log('✅ Brevo API configuration iko tayari na API key ni valid');
      return true;
    } else {
      const data = await response.json().catch(() => ({}));
      console.error('❌ Brevo API key ni invalid:', response.status, data);
      return false;
    }
  } catch (error) {
    console.error('❌ Brevo API verification failed:', error.message);
    return false;
  }
}

// ============================================================
// SEND OTP EMAIL
// ============================================================

async function sendOtpEmail(email, code) {
  // ----------------------------------------------------------
  // Validate environment
  // ----------------------------------------------------------

  if (!BREVO_API_KEY) {
    throw new Error('BREVO_API_KEY haijawekwa kwenye environment');
  }

  if (!BREVO_FROM_EMAIL) {
    throw new Error('BREVO_FROM_EMAIL haijawekwa kwenye environment');
  }

  // ----------------------------------------------------------
  // Validate input
  // ----------------------------------------------------------

  if (!email) {
    throw new Error('Email inahitajika');
  }

  if (!code) {
    throw new Error('OTP code inahitajika');
  }

  // ----------------------------------------------------------
  // Email HTML
  // ----------------------------------------------------------

  const htmlContent = `
<!DOCTYPE html>
<html lang="sw">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>MusicLand OTP</title>
</head>
<body style="margin:0;padding:0;background:#0D0D0F;font-family:Arial,Helvetica,sans-serif;">
  <div style="max-width:480px;margin:40px auto;padding:30px;background:#151518;border-radius:16px;color:#ffffff;">
    <h2 style="color:#1ED760;margin:0 0 20px 0;">MusicLand 🎵</h2>
    <p>Habari,</p>
    <p>Tumia code hii kuthibitisha akaunti yako ya MusicLand:</p>
    <div style="font-size:34px;font-weight:bold;letter-spacing:10px;color:#1ED760;text-align:center;margin:30px 0;">
      ${code}
    </div>
    <p>Code hii itaisha baada ya dakika <strong>5</strong>.</p>
    <p style="color:#999999;font-size:12px;margin-top:30px;">
      Kama hukuomba code hii, unaweza kupuuza email hii.
    </p>
    <hr style="border:0;border-top:1px solid #292929;margin:30px 0;">
    <p style="color:#666666;font-size:11px;text-align:center;">© MusicLand</p>
  </div>
</body>
</html>
  `;

  // ----------------------------------------------------------
  // Brevo request payload
  // ----------------------------------------------------------

  const payload = {
    sender: {
      name: BREVO_FROM_NAME,
      email: BREVO_FROM_EMAIL,
    },
    to: [{ email }],
    subject: 'MusicLand - Code ya Uthibitisho',
    htmlContent: htmlContent,
    textContent: `MusicLand OTP yako ni ${code}. Code hii itaisha baada ya dakika 5.`,
  };

  try {
    console.log(`📧 Inatuma OTP email kwa ${email} kupitia Brevo API...`);

    const response = await fetch(BREVO_API_URL, {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'api-key': BREVO_API_KEY,
        'content-type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(20000),
    });

    // --------------------------------------------------------
    // Read response
    // --------------------------------------------------------

    const responseText = await response.text();
    let data = null;

    try {
      data = responseText ? JSON.parse(responseText) : null;
    } catch {
      data = { raw: responseText };
    }

    // --------------------------------------------------------
    // Brevo error
    // --------------------------------------------------------

    if (!response.ok) {
      console.error('❌ Brevo API error:', response.status, data);

      const message = data?.message || data?.error || 'Brevo imeshindwa kutuma email';

      throw new Error(`Brevo API error (${response.status}): ${message}`);
    }

    // --------------------------------------------------------
    // Success
    // --------------------------------------------------------

    console.log(`✅ OTP email imetumwa kwa ${email}`);
    console.log(`📨 Brevo Message ID: ${data?.messageId || 'unknown'}`);

    return data;
  } catch (error) {
    console.error(`❌ OTP email imeshindikana kwa ${email}:`, error.message);

    // Re-throw with user-friendly message
    if (error.message.includes('AbortError') || error.name === 'TimeoutError') {
      throw new Error('Imeshindikana kutuma OTP: Timeout. Jaribu tena.');
    }

    if (error.message.includes('BREVO_API_KEY')) {
      throw new Error('Imeshindikana kutuma OTP: Brevo API key haijasanidiwa.');
    }

    if (error.message.includes('ECONNREFUSED')) {
      throw new Error('Imeshindikana kutuma OTP: Connection refused. Jaribu tena.');
    }

    throw new Error(`Imeshindikana kutuma OTP: ${error.message}`);
  }
}

// ============================================================
// SEND PASSWORD RESET EMAIL
// ============================================================

async function sendPasswordResetEmail(email, resetToken) {
  // Validate environment
  if (!BREVO_API_KEY) {
    throw new Error('BREVO_API_KEY haijawekwa kwenye environment');
  }

  if (!BREVO_FROM_EMAIL) {
    throw new Error('BREVO_FROM_EMAIL haijawekwa kwenye environment');
  }

  const resetLink = `${process.env.FRONTEND_URL || 'https://musicland.vercel.app'}/reset-password?token=${resetToken}`;

  const htmlContent = `
<!DOCTYPE html>
<html lang="sw">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>MusicLand - Reset Password</title>
</head>
<body style="margin:0;padding:0;background:#0D0D0F;font-family:Arial,Helvetica,sans-serif;">
  <div style="max-width:480px;margin:40px auto;padding:30px;background:#151518;border-radius:16px;color:#ffffff;">
    <h2 style="color:#1ED760;margin:0 0 20px 0;">MusicLand 🎵</h2>
    <p>Habari,</p>
    <p>Ulifanya ombi la kuweka upya nenosiri lako.</p>
    <p>Bofya link hapa chini kuweka upya nenosiri lako:</p>
    <div style="text-align:center;margin:30px 0;">
      <a href="${resetLink}" style="background:#1ED760;color:#000000;padding:12px 30px;border-radius:8px;text-decoration:none;font-weight:bold;">
        Weka Upya Nenosiri
      </a>
    </div>
    <p>Link hii itaisha baada ya dakika <strong>15</strong>.</p>
    <p style="color:#999999;font-size:12px;margin-top:30px;">
      Kama hukuomba kuweka upya nenosiri, unaweza kupuuza email hii.
    </p>
    <hr style="border:0;border-top:1px solid #292929;margin:30px 0;">
    <p style="color:#666666;font-size:11px;text-align:center;">© MusicLand</p>
  </div>
</body>
</html>
  `;

  const payload = {
    sender: {
      name: BREVO_FROM_NAME,
      email: BREVO_FROM_EMAIL,
    },
    to: [{ email }],
    subject: 'MusicLand - Weka Upya Nenosiri',
    htmlContent: htmlContent,
    textContent: `Weka upya nenosiri lako: ${resetLink}`,
  };

  try {
    const response = await fetch(BREVO_API_URL, {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'api-key': BREVO_API_KEY,
        'content-type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(20000),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(`Brevo error: ${data.message || response.statusText}`);
    }

    console.log(`✅ Password reset email sent to ${email}`);
    return await response.json();
  } catch (error) {
    console.error(`❌ Password reset email failed for ${email}:`, error.message);
    throw new Error(`Imeshindikana kutuma email ya kuweka upya nenosiri: ${error.message}`);
  }
}

// ============================================================
// SEND VERIFICATION EMAIL
// ============================================================

async function sendVerificationEmail(email, code) {
  return sendOtpEmail(email, code);
}

// ============================================================
// DEVELOPMENT MODE - Log OTP only
// ============================================================

async function sendOtpEmailDev(email, code) {
  console.log('========================================');
  console.log('📧 DEVELOPMENT MODE - OTP EMAIL');
  console.log('========================================');
  console.log(`👤 To: ${email}`);
  console.log(`🔑 OTP Code: ${code}`);
  console.log('========================================');

  // If Brevo is configured, try to send real email
  if (BREVO_API_KEY && BREVO_FROM_EMAIL) {
    try {
      return await sendOtpEmail(email, code);
    } catch (error) {
      console.log('⚠️ Real email failed, but OTP is logged above');
      return { messageId: 'dev-mode-fallback' };
    }
  }

  return { messageId: 'dev-mode' };
}

// ============================================================
// EXPORTS
// ============================================================

module.exports = {
  sendOtpEmail,
  sendOtpEmailDev,
  sendVerificationEmail,
  sendPasswordResetEmail,
  verifyEmailTransporter,
};