import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, type RequestUser } from '../auth/current-user.decorator';
import { FederatedService } from './federated.service';

@Controller('federated')
@UseGuards(JwtAuthGuard)
export class FederatedController {
  constructor(private readonly federatedService: FederatedService) {}

  @Get('status')
  getStatus(@CurrentUser() user: RequestUser) {
    return this.federatedService.getStatus(user.tenantId);
  }

  @Post('join')
  join(@CurrentUser() user: RequestUser) {
    return this.federatedService.join(user.tenantId);
  }

  @Post('leave')
  leave(@CurrentUser() user: RequestUser) {
    return this.federatedService.leave(user.tenantId);
  }

  @Post('rounds/run')
  runRound(@CurrentUser() user: RequestUser) {
    return this.federatedService.runRound(user.tenantId, user.id);
  }
}
