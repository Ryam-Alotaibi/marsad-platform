import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditLogService } from '../audit-log/audit-log.service';
import { TwilioProvider } from './providers/twilio.provider';
import { SmtpProvider } from './providers/smtp.provider';
import {
  ALERT_CATEGORY_LABELS_AR,
  ALERT_SEVERITY_LABELS_AR,
} from '@marsad/shared';
import type { Alert, NotificationChannelType } from '@prisma/client';

function truncate(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
    private readonly twilio: TwilioProvider,
    private readonly smtp: SmtpProvider,
  ) {}

  findChannels(tenantId: string) {
    return this.prisma.notificationChannel.findMany({
      where: { tenantId, isActive: true },
    });
  }

  private async loadAlert(tenantId: string, alertId: string): Promise<Alert> {
    const alert = await this.prisma.alert.findFirst({
      where: { id: alertId, tenantId },
    });
    if (!alert) throw new NotFoundException('التنبيه غير موجود');
    return alert;
  }

  private render(
    channel: NotificationChannelType,
    alert: Alert,
    recipientName: string,
  ): string {
    const severity = ALERT_SEVERITY_LABELS_AR[alert.severity] ?? alert.severity;
    const category = ALERT_CATEGORY_LABELS_AR[alert.category] ?? alert.category;
    const when = new Intl.DateTimeFormat('ar-SA', {
      hour: '2-digit',
      minute: '2-digit',
      day: 'numeric',
      month: 'short',
    }).format(alert.createdAt);

    switch (channel) {
      case 'PUSH':
        return `${alert.title} — ${severity}\n${truncate(alert.description, 70)}`;
      case 'EMAIL':
        return [
          `الموضوع: تنبيه ${severity} — ${alert.title}`,
          '',
          `عزيزي/عزيزتي ${recipientName}،`,
          '',
          `تم رصد التنبيه التالي بمنصة مرصاد:`,
          alert.description,
          '',
          `الفئة: ${category}`,
          `الوقت: ${when}`,
          '',
          'يرجى المتابعة والإفادة عبر النظام.',
        ].join('\n');
      case 'SMS':
        return truncate(
          `مرصاد: ${severity} - ${alert.title}. ${alert.description}`,
          160,
        );
      case 'WHATSAPP':
        return [
          `تنبيه جديد من مرصاد`,
          alert.title,
          alert.description,
          `الفئة: ${category} — الخطورة: ${severity}`,
        ].join('\n');
      case 'VOICE_CALL':
        return `نص المكالمة الآلية: "لديك تنبيه بخطورة ${severity} من نظام مرصاد بخصوص ${alert.title}. يرجى فتح التطبيق لمزيد من التفاصيل."`;
      default:
        return alert.description;
    }
  }

  private async findRecipient(tenantId: string) {
    const candidates = await this.prisma.user.findMany({
      where: {
        tenantId,
        availabilityStatus: 'AVAILABLE',
        role: { key: { in: ['SUPPORT_ENGINEER', 'OPERATIONS_CENTER'] } },
      },
      include: { role: { select: { key: true } } },
    });
    return (
      candidates.find((c) => c.role.key === 'SUPPORT_ENGINEER') ??
      candidates[0] ??
      null
    );
  }

  async preview(tenantId: string, alertId: string) {
    const alert = await this.loadAlert(tenantId, alertId);
    const [channels, recipient] = await Promise.all([
      this.findChannels(tenantId),
      this.findRecipient(tenantId),
    ]);

    return channels.map((channel) => ({
      channel: channel.type,
      renderedContent: this.render(
        channel.type,
        alert,
        recipient?.fullName ?? 'المسؤول المختص',
      ),
    }));
  }

  /**
   * Dispatches through a real provider (Twilio / SMTP) when one is
   * configured for this channel and the recipient has the matching contact
   * field on file; otherwise falls back to the Mock behavior (simulated,
   * always "SENT", isMock stays true). PUSH has no real provider wired up
   * (would need FCM/APNs credentials) so it is always Mock.
   */
  private async dispatch(
    channel: NotificationChannelType,
    recipient: { email: string; phone: string | null },
    content: string,
    subject: string,
  ): Promise<{ status: 'SENT' | 'FAILED'; isMock: boolean; providerRef?: string }> {
    if (channel === 'EMAIL' && this.smtp.isConfigured) {
      const result = await this.smtp.sendEmail(recipient.email, subject, content);
      return result.delivered
        ? { status: 'SENT', isMock: false, providerRef: result.providerRef }
        : { status: 'FAILED', isMock: false };
    }

    if (channel === 'SMS' && this.twilio.isConfigured && recipient.phone) {
      const result = await this.twilio.sendSms(recipient.phone, content);
      return result.delivered
        ? { status: 'SENT', isMock: false, providerRef: result.providerRef }
        : { status: 'FAILED', isMock: false };
    }

    if (channel === 'WHATSAPP' && this.twilio.isConfigured && recipient.phone) {
      const result = await this.twilio.sendWhatsapp(recipient.phone, content);
      return result.delivered
        ? { status: 'SENT', isMock: false, providerRef: result.providerRef }
        : { status: 'FAILED', isMock: false };
    }

    if (channel === 'VOICE_CALL' && this.twilio.isConfigured && recipient.phone) {
      const result = await this.twilio.sendVoiceCall(recipient.phone, content);
      return result.delivered
        ? { status: 'SENT', isMock: false, providerRef: result.providerRef }
        : { status: 'FAILED', isMock: false };
    }

    return { status: 'SENT', isMock: true };
  }

  async send(tenantId: string, actorUserId: string, alertId: string) {
    const alert = await this.loadAlert(tenantId, alertId);
    const [channels, recipient] = await Promise.all([
      this.findChannels(tenantId),
      this.findRecipient(tenantId),
    ]);

    if (!recipient) {
      return [];
    }

    const severity = ALERT_SEVERITY_LABELS_AR[alert.severity] ?? alert.severity;

    const logs = await Promise.all(
      channels.map(async (channel) => {
        const content = this.render(channel.type, alert, recipient.fullName);
        const outcome = await this.dispatch(
          channel.type,
          recipient,
          content,
          `تنبيه ${severity} — ${alert.title}`,
        );

        return this.prisma.notificationLog.create({
          data: {
            alertId: alert.id,
            channel: channel.type,
            recipientId: recipient.id,
            renderedContent: content,
            status: outcome.status,
            isMock: outcome.isMock,
            providerRef: outcome.providerRef,
            sentAt: new Date(),
          },
        });
      }),
    );

    await this.auditLog.record({
      tenantId,
      actorUserId,
      action: 'SEND_NOTIFICATIONS',
      entityType: 'Alert',
      entityId: alert.id,
      metadata: { channelCount: logs.length },
    });

    return logs;
  }
}
