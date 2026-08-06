import { Module } from '@nestjs/common';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { TwilioProvider } from './providers/twilio.provider';
import { SmtpProvider } from './providers/smtp.provider';

@Module({
  controllers: [NotificationsController],
  providers: [NotificationsService, TwilioProvider, SmtpProvider],
})
export class NotificationsModule {}
