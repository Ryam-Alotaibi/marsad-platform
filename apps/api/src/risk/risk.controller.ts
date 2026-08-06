import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, type RequestUser } from '../auth/current-user.decorator';
import { RiskService } from './risk.service';

@Controller('risk')
@UseGuards(JwtAuthGuard)
export class RiskController {
  constructor(private readonly riskService: RiskService) {}

  @Get('alerts')
  findAlerts(@CurrentUser() user: RequestUser) {
    return this.riskService.findAlerts(user.tenantId);
  }

  @Get('factors')
  getRiskFactorBreakdown(@CurrentUser() user: RequestUser) {
    return this.riskService.getRiskFactorBreakdown(user.tenantId);
  }
}
