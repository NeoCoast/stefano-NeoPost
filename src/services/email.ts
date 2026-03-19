import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

import { confirmationEmailHtml } from '@/templates/confirmation-email';

interface EmailResult {
  messageId: string;
  previewUrl: string | null;
}

class EmailService {
  private static transporterPromise: Promise<Transporter> | null = null;

  private static getTransporter(): Promise<Transporter> {
    if (this.transporterPromise) return this.transporterPromise;

    if (process.env.NODE_ENV === 'production') {
      this.transporterPromise = Promise.resolve(nodemailer.createTransport({
        host: process.env.BREVO_SMTP_HOST,
        port: Number(process.env.BREVO_SMTP_PORT),
        secure: Number(process.env.BREVO_SMTP_PORT) === 465,
        auth: {
          user: process.env.BREVO_SMTP_USER,
          pass: process.env.BREVO_SMTP_PASS,
        },
        connectionTimeout: 10000,
        socketTimeout: 10000,
      }));
    } else {
      this.transporterPromise = nodemailer.createTestAccount().then((testAccount) => (
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

    return this.transporterPromise;
  }

  static async sendConfirmationEmail(to: string, token: string): Promise<EmailResult> {
    const transporter = await this.getTransporter();
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
  }
}

export default EmailService;
