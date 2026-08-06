import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, type RequestUser } from '../auth/current-user.decorator';
import { SupportService } from './support.service';
import { CreateSupportAlertDto } from './dto/create-alert.dto';

@Controller('support')
@UseGuards(JwtAuthGuard)
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  @Get('team')
  findTeam(@CurrentUser() user: RequestUser) {
    return this.supportService.findTeam(user.tenantId);
  }

  @Get('escalation-rules')
  findEscalationRules(@CurrentUser() user: RequestUser) {
    return this.supportService.findEscalationRules(user.tenantId);
  }

  @Post('alerts')
  createAlert(
    @CurrentUser() user: RequestUser,
    @Body() dto: CreateSupportAlertDto,
  ) {
    return this.supportService.createAlert(user.tenantId, user.id, dto);
  }
}
