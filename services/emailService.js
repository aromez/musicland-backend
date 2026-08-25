const nodemailer = require('nodemailer');

const GMAIL_USER = process.env.GMAIL_USER;
const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD;

if (!GMAIL_USER) {
  console.warn('⚠️ GMAIL_USER haijawekwa kwenye environment');
}

if (!GMAIL_APP_PASSWORD) {
  console.warn('⚠️ GMAIL_APP_PASSWORD haijawekwa kwenye environment');
}

const transporter = nodemailer.createTransport({
  service: 'gmail',

  auth: {
    user: GMAIL_USER,
    pass: GMAIL_APP_PASSWORD,
  },

  connectionTimeout: 15000,
  greetingTimeout: 15000,
  socketTimeout: 20000,
});

/**
 * Verify Gmail SMTP connection
 */
async function verifyEmailTransporter() {
  try {
    await transporter.verify();

    console.log('✅ Gmail SMTP connection iko tayari');

    return true;
  } catch (error) {
    console.error(
      '❌ Gmail SMTP connection failed:',
      error.message
    );

    return false;
  }
}

/**
 * Send OTP email
 */
async function sendOtpEmail(email, code) {
  if (!GMAIL_USER) {
    throw new Error(
      'GMAIL_USER haijawekwa kwenye environment'
    );
  }

  if (!GMAIL_APP_PASSWORD) {
    throw new Error(
      'GMAIL_APP_PASSWORD haijawekwa kwenye environment'
    );
  }

  if (!email) {
    throw new Error('Email inahitajika');
  }

  if (!code) {
    throw new Error('OTP code inahitajika');
  }

  const mailOptions = {
    from: `"MusicLand" <${GMAIL_USER}>`,

    to: email,

    subject: 'MusicLand - Code ya Uthibitisho',

    html: `
      <!DOCTYPE html>
      <html lang="sw">

      <head>
        <meta charset="UTF-8">
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0"
        >

        <title>MusicLand OTP</title>
      </head>

      <body style="
        margin:0;
        padding:0;
        background:#0D0D0F;
        font-family:Arial,Helvetica,sans-serif;
      ">

        <div style="
          max-width:480px;
          margin:40px auto;
          padding:30px;
          background:#151518;
          border-radius:16px;
          color:#ffffff;
        ">

          <h2 style="
            color:#1ED760;
            margin:0 0 20px 0;
          ">
            MusicLand 🎵
          </h2>

          <p>
            Habari,
          </p>

          <p>
            Tumia code hii kuthibitisha akaunti yako ya MusicLand:
          </p>

          <div style="
            font-size:34px;
            font-weight:bold;
            letter-spacing:10px;
            color:#1ED760;
            text-align:center;
            margin:30px 0;
          ">
            ${code}
          </div>

          <p>
            Code hii itaisha baada ya dakika
            <strong>5</strong>.
          </p>

          <p style="
            color:#999999;
            font-size:12px;
            margin-top:30px;
          ">
            Kama hukuomba code hii, unaweza kupuuza
            email hii.
          </p>

          <hr style="
            border:0;
            border-top:1px solid #292929;
            margin:30px 0;
          ">

          <p style="
            color:#666666;
            font-size:11px;
            text-align:center;
          ">
            © MusicLand
          </p>

        </div>

      </body>
      </html>
    `,
  };

  try {
    console.log(
      `📧 Inatuma OTP email kwa ${email} kupitia Gmail...`
    );

    const info = await transporter.sendMail(mailOptions);

    console.log(
      `✅ OTP email imetumwa kwa ${email}`
    );

    console.log(
      `📨 Message ID: ${info.messageId}`
    );

    return info;

  } catch (error) {
    console.error(
      `❌ OTP email imeshindikana kwa ${email}:`,
      error.message
    );

    throw new Error(
      `Imeshindikana kutuma OTP email: ${error.message}`
    );
  }
}

module.exports = {
  sendOtpEmail,
  verifyEmailTransporter,
};