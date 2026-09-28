import nodemailer, { type Transporter } from 'nodemailer';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { renderEmailTemplate } from './email-template.js';

const transporter: Transporter | null =
  env.GMAIL_USER && env.GMAIL_APP_PASSWORD
    ? nodemailer.createTransport({
        service: 'gmail',
        auth: { user: env.GMAIL_USER, pass: env.GMAIL_APP_PASSWORD },
      })
    : null;

class EmailService {
  async sendVerificationEmail(to: string, token: string): Promise<void> {
    const link = `${env.APP_BASE_URL}/verify-email?token=${token}`;
    await this.send(
      to,
      'Verify your DocIQ email',
      renderEmailTemplate({
        heading: 'Confirm your email',
        intro: 'Welcome to DocIQ — one click and your account is ready to go.',
        ctaLabel: 'Verify email',
        ctaLink: link,
        footnote: 'This link expires in 24 hours. If you didn\'t create a DocIQ account, you can ignore this email.',
      }),
    );
  }

  async sendPasswordResetEmail(to: string, token: string): Promise<void> {
    const link = `${env.APP_BASE_URL}/reset-password?token=${token}`;
    await this.send(
      to,
      'Reset your DocIQ password',
      renderEmailTemplate({
        heading: 'Reset your password',
        intro: 'We received a request to reset your DocIQ password. Click below to choose a new one.',
        ctaLabel: 'Reset password',
        ctaLink: link,
        footnote: 'This link expires in 1 hour. If you didn\'t request this, you can safely ignore this email.',
      }),
    );
  }

  private async send(to: string, subject: string, html: string): Promise<void> {
    if (!transporter) {
      logger.warn({ to, subject }, 'GMAIL_USER/GMAIL_APP_PASSWORD not set — logging email instead of sending');
      logger.info({ to, subject, html }, 'Email (dev fallback)');
      return;
    }

    try {
      await transporter.sendMail({ from: env.EMAIL_FROM, to, subject, html });
    } catch (error) {
      logger.error({ err: error, to, subject }, 'Failed to send email via Gmail SMTP');
    }
  }
}

export const emailService = new EmailService();
