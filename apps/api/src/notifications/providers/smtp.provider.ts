import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer, { type Transporter } from 'nodemailer';
import type { DeliveryResult } from './provider.types';

/**
 * Real SMTP email delivery via nodemailer — activates only when SMTP_HOST /
 * SMTP_PORT / SMTP_USER / SMTP_PASS / SMTP_FROM are set. No real mailbox is
 * configured in this repo, so this stays dormant and NotificationsService
 * falls back to the documented Mock provider. See ARCHITECTURE.md.
 */
@Injectable()
export class SmtpProvider {
  private readonly logger = new Logger(SmtpProvider.name);
  private readonly transporter: Transporter | null;
  private readonly from?: string;

  constructor(private readonly config: ConfigService) {
    const host = this.config.get<string>('SMTP_HOST');
    const port = this.config.get<string>('SMTP_PORT');
    const user = this.config.get<string>('SMTP_USER');
    const pass = this.config.get<string>('SMTP_PASS');
    this.from = this.config.get<string>('SMTP_FROM');

    this.transporter =
      host && port && user && pass
        ? nodemailer.createTransport({
            host,
            port: Number(port),
            secure: Number(port) === 465,
            auth: { user, pass },
          })
        : null;
  }

  get isConfigured(): boolean {
    return this.transporter !== null && !!this.from;
  }

  async sendEmail(
    to: string,
    subject: string,
    body: string,
  ): Promise<DeliveryResult> {
    if (!this.transporter || !this.from) {
      return { delivered: false, error: 'NOT_CONFIGURED' };
    }
    try {
      const info = await this.transporter.sendMail({
        from: this.from,
        to,
        subject,
        text: body,
      });
      return { delivered: true, providerRef: info.messageId };
    } catch (err) {
      this.logger.error(`SMTP send failed: ${(err as Error).message}`);
      return { delivered: false, error: (err as Error).message };
    }
  }
}
