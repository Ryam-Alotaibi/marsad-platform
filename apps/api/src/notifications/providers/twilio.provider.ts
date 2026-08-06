import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Twilio from 'twilio';
import type { DeliveryResult } from './provider.types';

/**
 * Real Twilio integration — activates only when TWILIO_ACCOUNT_SID /
 * TWILIO_AUTH_TOKEN / TWILIO_FROM_NUMBER are set in the environment. With no
 * credentials configured (the default in this repo, since we don't hold a
 * real Twilio account), NotificationsService falls back to the documented
 * Mock provider instead of calling this class. See ARCHITECTURE.md.
 */
@Injectable()
export class TwilioProvider {
  private readonly logger = new Logger(TwilioProvider.name);
  private readonly client: ReturnType<typeof Twilio> | null;
  private readonly fromNumber?: string;
  private readonly whatsappFrom?: string;

  constructor(private readonly config: ConfigService) {
    const sid = this.config.get<string>('TWILIO_ACCOUNT_SID');
    const token = this.config.get<string>('TWILIO_AUTH_TOKEN');
    this.fromNumber = this.config.get<string>('TWILIO_FROM_NUMBER');
    this.whatsappFrom = this.config.get<string>('TWILIO_WHATSAPP_FROM');
    this.client = sid && token ? Twilio(sid, token) : null;
  }

  get isConfigured(): boolean {
    return this.client !== null && !!this.fromNumber;
  }

  async sendSms(to: string, body: string): Promise<DeliveryResult> {
    if (!this.client || !this.fromNumber) {
      return { delivered: false, error: 'NOT_CONFIGURED' };
    }
    try {
      const message = await this.client.messages.create({
        to,
        from: this.fromNumber,
        body,
      });
      return { delivered: true, providerRef: message.sid };
    } catch (err) {
      this.logger.error(`Twilio SMS failed: ${(err as Error).message}`);
      return { delivered: false, error: (err as Error).message };
    }
  }

  async sendWhatsapp(to: string, body: string): Promise<DeliveryResult> {
    if (!this.client || !this.whatsappFrom) {
      return { delivered: false, error: 'NOT_CONFIGURED' };
    }
    try {
      const message = await this.client.messages.create({
        to: `whatsapp:${to}`,
        from: `whatsapp:${this.whatsappFrom}`,
        body,
      });
      return { delivered: true, providerRef: message.sid };
    } catch (err) {
      this.logger.error(`Twilio WhatsApp failed: ${(err as Error).message}`);
      return { delivered: false, error: (err as Error).message };
    }
  }

  async sendVoiceCall(to: string, sayText: string): Promise<DeliveryResult> {
    if (!this.client || !this.fromNumber) {
      return { delivered: false, error: 'NOT_CONFIGURED' };
    }
    try {
      const twiml = `<Response><Say language="ar-SA">${sayText}</Say></Response>`;
      const call = await this.client.calls.create({
        to,
        from: this.fromNumber,
        twiml,
      });
      return { delivered: true, providerRef: call.sid };
    } catch (err) {
      this.logger.error(`Twilio voice call failed: ${(err as Error).message}`);
      return { delivered: false, error: (err as Error).message };
    }
  }
}
