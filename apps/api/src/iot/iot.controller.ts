import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, type RequestUser } from '../auth/current-user.decorator';
import { IotService } from './iot.service';

@Controller('iot')
@UseGuards(JwtAuthGuard)
export class IotController {
  constructor(private readonly iotService: IotService) {}

  @Get('overview')
  getOverview(@CurrentUser() user: RequestUser) {
    return this.iotService.getOverview(user.tenantId);
  }
}
