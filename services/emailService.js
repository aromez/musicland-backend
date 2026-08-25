const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,

  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },

  connectionTimeout: 15000,
  greetingTimeout: 15000,
  socketTimeout: 20000,
});

async function verifyEmailTransporter() {
  try {
    await transporter.verify();

    console.log('==========================================');
    console.log('✅ Gmail SMTP connection iko tayari');
    console.log(`📧 Gmail: ${process.env.GMAIL_USER}`);
    console.log('==========================================');

    return true;
  } catch (error) {
    console.error('==========================================');
    console.error('❌ Gmail SMTP connection FAILED');
    console.error('Error:', error.message);
    console.error('==========================================');

    return false;
  }
}

async function sendOtpEmail(email, code) {
  if (!process.env.GMAIL_USER) {
    throw new Error(
      'GMAIL_USER haijawekwa kwenye environment'
    );
  }

  if (!process.env.GMAIL_APP_PASSWORD) {
    throw new Error(
      'GMAIL_APP_PASSWORD haijawekwa kwenye environment'
    );
  }

  const mailOptions = {
    from: `"MusicLand" <${process.env.GMAIL_USER}>`,
    to: email,
    subject: 'MusicLand - Code ya Uthibitisho',

    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>MusicLand OTP</title>
</head>

<body style="
  margin:0;
  padding:0;
  background:#0D0D0F;
  font-family:Arial,sans-serif;
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
    margin-bottom:20px;
  ">
    MusicLand 🎵
  </h2>

  <p>Habari,</p>

  <p>
    Tumia code hii kuthibitisha akaunti yako:
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
    Kama hukuomba code hii,
    unaweza kupuuza email hii.
  </p>

</div>

</body>
</html>
    `,
  };

  try {
    console.log(
      `📧 Inatuma OTP kwenda: ${email}`
    );

    const info =
      await transporter.sendMail(mailOptions);

    console.log(
      `✅ OTP email imetumwa kwa ${email}`
    );

    console.log(
      `📨 Message ID: ${info.messageId}`
    );

    return info;
  } catch (error) {
    console.error(
      `❌ OTP email imeshindikana kwa ${email}`
    );

    console.error(
      'SMTP Error:',
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