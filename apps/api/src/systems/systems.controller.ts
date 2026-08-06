import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, type RequestUser } from '../auth/current-user.decorator';
import { SystemsService } from './systems.service';

@Controller('systems')
@UseGuards(JwtAuthGuard)
export class SystemsController {
  constructor(private readonly systemsService: SystemsService) {}

  @Get()
  findAll(@CurrentUser() user: RequestUser) {
    return this.systemsService.findAll(user.tenantId);
  }
}
