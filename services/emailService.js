const { Resend } = require('resend');

const RESEND_API_KEY = process.env.RESEND_API_KEY;

if (!RESEND_API_KEY) {
  console.warn('⚠️ RESEND_API_KEY haijawekwa kwenye environment');
}

const resend = new Resend(RESEND_API_KEY);

async function sendOtpEmail(email, code) {
  if (!RESEND_API_KEY) {
    throw new Error(
      'RESEND_API_KEY haijawekwa kwenye environment'
    );
  }

  if (!email) {
    throw new Error('Email inahitajika');
  }

  if (!code) {
    throw new Error('OTP code inahitajika');
  }

  const mailOptions = {
    from:
      process.env.RESEND_FROM_EMAIL ||
      'MusicLand <onboarding@resend.dev>',

    to: [email],

    subject: 'MusicLand - Code ya Uthibitisho',

    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport"
          content="width=device-width, initial-scale=1.0">

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

          <p>
            Habari,
          </p>

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
            Kama hukuomba code hii, unaweza kupuuza
            email hii.
          </p>

        </div>

      </body>
      </html>
    `,
  };

  try {
    console.log(
      `📧 Inatuma OTP email kwa ${email} kupitia Resend...`
    );

    const { data, error } =
      await resend.emails.send(mailOptions);

    if (error) {
      console.error(
        '❌ Resend API error:',
        error
      );

      throw new Error(
        error.message || 'Resend imeshindwa kutuma email'
      );
    }

    console.log(
      `✅ OTP email imetumwa kwa ${email}`
    );

    console.log(
      `📨 Resend Message ID: ${data?.id || 'unknown'}`
    );

    return data;
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
};