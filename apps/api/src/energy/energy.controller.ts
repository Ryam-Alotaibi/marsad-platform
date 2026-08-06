import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, type RequestUser } from '../auth/current-user.decorator';
import { EnergyService } from './energy.service';

@Controller('energy')
@UseGuards(JwtAuthGuard)
export class EnergyController {
  constructor(private readonly energyService: EnergyService) {}

  @Get()
  getEnergy(@CurrentUser() user: RequestUser) {
    return this.energyService.getEnergy(user.tenantId);
  }

  @Post('actions/turn-off-ac')
  turnOffAc(@CurrentUser() user: RequestUser) {
    return this.energyService.turnOffAc(user.tenantId);
  }

  @Post('actions/enable-night-rationing')
  enableNightRationing(@CurrentUser() user: RequestUser) {
    return this.energyService.enableNightRationing(user.tenantId);
  }

  @Post('schedules/:id/toggle')
  toggleSchedule(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.energyService.toggleSchedule(user.tenantId, id);
  }
}
