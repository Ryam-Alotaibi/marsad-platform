import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, type RequestUser } from '../auth/current-user.decorator';
import { EnvironmentService } from './environment.service';

@Controller('environment')
@UseGuards(JwtAuthGuard)
export class EnvironmentController {
  constructor(private readonly environmentService: EnvironmentService) {}

  @Get()
  getEnvironment(@CurrentUser() user: RequestUser) {
    return this.environmentService.getEnvironment(user.tenantId);
  }
}
