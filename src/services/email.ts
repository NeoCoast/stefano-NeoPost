import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { confirmationEmailHtml } from '../templates/confirmation-email';

let transporterPromise: Promise<Transporter> | null = null;

const getTransporter = (): Promise<Transporter> => {
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

interface EmailResult {
  messageId: string;
  previewUrl: string | null;
}

export const sendConfirmationEmail = async (to: string, token: string): Promise<EmailResult> => {
  const transporter = await getTransporter();
  const confirmUrl = `${process.env.APP_URL}/api/users/confirm?token=${token}`;

  const info = await transporter.sendMail({
    from: '"NeoPost" <noreply@neopost.app>',
    to,
    subject: 'Confirm your NeoPost account',
    html: confirmationEmailHtml(confirmUrl),
  });

  const previewUrl = nodemailer.getTestMessageUrl(info) || null;
  if (previewUrl) {
    console.log('Email preview URL:', previewUrl);
  }

  return { messageId: info.messageId, previewUrl };
};
