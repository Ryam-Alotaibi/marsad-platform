import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, type RequestUser } from '../auth/current-user.decorator';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get('channels')
  findChannels(@CurrentUser() user: RequestUser) {
    return this.notificationsService.findChannels(user.tenantId);
  }

  @Get('preview/:alertId')
  preview(@CurrentUser() user: RequestUser, @Param('alertId') alertId: string) {
    return this.notificationsService.preview(user.tenantId, alertId);
  }

  @Post('send/:alertId')
  send(@CurrentUser() user: RequestUser, @Param('alertId') alertId: string) {
    return this.notificationsService.send(user.tenantId, user.id, alertId);
  }
}
