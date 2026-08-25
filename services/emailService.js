const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

async function sendOtpEmail(email, code) {
  const mailOptions = {
    from: `"MusicLand" <${process.env.GMAIL_USER}>`,
    to: email,
    subject: 'MusicLand - Code ya Uthibitisho',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; background: #0D0D0F; color: #FFFFFF;">
        <h2 style="color: #1ED760;">MusicLand</h2>
        <p>Habari,</p>
        <p>Code yako ya uthibitisho ni:</p>
        <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #1ED760; margin: 20px 0;">
          ${code}
        </div>
        <p>Code hii itaisha muda baada ya dakika 5.</p>
        <p style="color: #B3B3B3; font-size: 12px;">Kama hukuomba code hii, puuza ujumbe huu.</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
}

module.exports = { sendOtpEmail };