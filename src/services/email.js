const nodemailer = require('nodemailer');

let transporterPromise = null;

const getTransporter = () => {
  if (transporterPromise) return transporterPromise;

  if (process.env.NODE_ENV === 'production') {
    transporterPromise = Promise.resolve(nodemailer.createTransport({
      host: process.env.BREVO_SMTP_HOST,
      port: Number(process.env.BREVO_SMTP_PORT),
      auth: {
        user: process.env.BREVO_SMTP_USER,
        pass: process.env.BREVO_SMTP_PASS,
      },
    }));
  } else {
    transporterPromise = nodemailer.createTestAccount().then((testAccount) => (
      nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      })
    ));
  }

  return transporterPromise;
};

const sendConfirmationEmail = async (to, token) => {
  const transporter = await getTransporter();
  const confirmUrl = `${process.env.APP_URL}/api/users/confirm?token=${token}`;

  const info = await transporter.sendMail({
    from: '"NeoPost" <noreply@neopost.app>',
    to,
    subject: 'Confirm your NeoPost account',
    html: `
      <h1>Welcome to NeoPost!</h1>
      <p>Click the link below to confirm your account:</p>
      <a href="${confirmUrl}">${confirmUrl}</a>
      <p>This link expires in 24 hours.</p>
    `,
  });

  const previewUrl = nodemailer.getTestMessageUrl(info) || null;
  if (previewUrl) {
    // eslint-disable-next-line no-console
    console.log('Email preview URL:', previewUrl);
  }

  return { messageId: info.messageId, previewUrl };
};

module.exports = { sendConfirmationEmail };
