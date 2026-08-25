/**
 * MusicLand Email Service
 * Uses Brevo SDK
 */

const SibApiV3Sdk = require('@getbrevo/brevo');

// ============================================================
// INITIALIZE BREVO
// ============================================================

const defaultClient = SibApiV3Sdk.ApiClient.instance;
const apiKey = defaultClient.authentications['api-key'];
apiKey.apiKey = process.env.BREVO_API_KEY;

const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

// ============================================================
// ENVIRONMENT CHECK
// ============================================================

if (!process.env.BREVO_API_KEY) {
  console.warn('⚠️ BREVO_API_KEY haijawekwa kwenye environment');
}

if (!process.env.BREVO_FROM_EMAIL) {
  console.warn('⚠️ BREVO_FROM_EMAIL haijawekwa kwenye environment');
}

// ============================================================
// VERIFY BREVO CONFIGURATION
// ============================================================

async function verifyEmailTransporter() {
  console.log('🔍 Verifying Brevo configuration...');

  if (!process.env.BREVO_API_KEY) {
    console.error('❌ BREVO_API_KEY haijawekwa');
    return false;
  }

  if (!process.env.BREVO_FROM_EMAIL) {
    console.error('❌ BREVO_FROM_EMAIL haijawekwa');
    return false;
  }

  try {
    // Test API key
    const response = await apiInstance.getAccount();
    console.log('✅ Brevo API configuration iko tayari');
    console.log(`📧 From Email: ${process.env.BREVO_FROM_EMAIL}`);
    return true;
  } catch (error) {
    console.error('❌ Brevo API configuration failed:', error.message);
    return false;
  }
}

// ============================================================
// SEND OTP EMAIL
// ============================================================

async function sendOtpEmail(email, code) {
  // ----------------------------------------------------------
  // Validate
  // ----------------------------------------------------------

  if (!process.env.BREVO_API_KEY) {
    throw new Error('BREVO_API_KEY haijawekwa kwenye environment');
  }

  if (!process.env.BREVO_FROM_EMAIL) {
    throw new Error('BREVO_FROM_EMAIL haijawekwa kwenye environment');
  }

  if (!email) {
    throw new Error('Email inahitajika');
  }

  if (!code) {
    throw new Error('OTP code inahitajika');
  }

  // ----------------------------------------------------------
  // Create email
  // ----------------------------------------------------------

  const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();

  sendSmtpEmail.sender = {
    name: process.env.BREVO_FROM_NAME || 'MusicLand',
    email: process.env.BREVO_FROM_EMAIL,
  };

  sendSmtpEmail.to = [{ email }];
  sendSmtpEmail.subject = 'MusicLand - Code ya Uthibitisho';

  sendSmtpEmail.htmlContent = `
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

  sendSmtpEmail.textContent = `MusicLand OTP yako ni ${code}. Code hii itaisha baada ya dakika 5.`;

  try {
    console.log(`📧 Inatuma OTP kwa ${email} kupitia Brevo...`);

    const response = await apiInstance.sendTransacEmail(sendSmtpEmail);

    console.log(`✅ OTP imetumwa kwa ${email}`);
    console.log(`📨 Message ID: ${response.messageId}`);

    return response;
  } catch (error) {
    console.error(`❌ OTP imeshindikana kwa ${email}:`, error.message);

    if (error.response) {
      console.error('Brevo Error Details:', error.response.body);
    }

    throw new Error(`Imeshindikana kutuma OTP: ${error.message}`);
  }
}

// ============================================================
// EXPORTS
// ============================================================

module.exports = {
  sendOtpEmail,
  verifyEmailTransporter,
};