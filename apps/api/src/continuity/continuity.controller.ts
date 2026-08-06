import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, type RequestUser } from '../auth/current-user.decorator';
import { ContinuityService } from './continuity.service';
import { EvaluateContinuityDto } from './dto/evaluate-continuity.dto';
import { ApplyContinuityActionDto } from './dto/apply-continuity-action.dto';

@Controller('continuity')
@UseGuards(JwtAuthGuard)
export class ContinuityController {
  constructor(private readonly continuityService: ContinuityService) {}

  @Get('scheduled-services')
  listScheduledServices(@CurrentUser() user: RequestUser) {
    return this.continuityService.listScheduledServices(user.tenantId);
  }

  @Post('evaluate')
  evaluate(@CurrentUser() user: RequestUser, @Body() dto: EvaluateContinuityDto) {
    return this.continuityService.evaluate(user.tenantId, dto);
  }

  @Post('actions')
  apply(@CurrentUser() user: RequestUser, @Body() dto: ApplyContinuityActionDto) {
    return this.continuityService.apply(user.tenantId, user.id, dto);
  }

  @Get('actions')
  listActions(@CurrentUser() user: RequestUser) {
    return this.continuityService.listActions(user.tenantId);
  }
}
