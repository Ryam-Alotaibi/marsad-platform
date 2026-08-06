import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, type RequestUser } from '../auth/current-user.decorator';
import { MapsService } from './maps.service';

@Controller('maps')
@UseGuards(JwtAuthGuard)
export class MapsController {
  constructor(private readonly mapsService: MapsService) {}

  @Get('power')
  getPowerMap(@CurrentUser() user: RequestUser) {
    return this.mapsService.getPowerMap(user.tenantId);
  }

  @Get('power/:siteId/curve')
  getPowerCurve(
    @CurrentUser() user: RequestUser,
    @Param('siteId') siteId: string,
  ) {
    return this.mapsService.getPowerCurve(user.tenantId, siteId);
  }

  @Get('telecom')
  getTelecomMap(@CurrentUser() user: RequestUser) {
    return this.mapsService.getTelecomMap(user.tenantId);
  }

  @Get('risk')
  getRiskMap(@CurrentUser() user: RequestUser) {
    return this.mapsService.getRiskMap(user.tenantId);
  }

  @Get('weather')
  getWeatherMap(@CurrentUser() user: RequestUser) {
    return this.mapsService.getWeatherMap(user.tenantId);
  }
}
