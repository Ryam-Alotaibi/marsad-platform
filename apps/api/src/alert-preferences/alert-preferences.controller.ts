import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, type RequestUser } from '../auth/current-user.decorator';
import { AlertPreferencesService } from './alert-preferences.service';
import { UpdatePreferencesDto } from './dto/update-preferences.dto';

@Controller('alert-preferences')
@UseGuards(JwtAuthGuard)
export class AlertPreferencesController {
  constructor(
    private readonly alertPreferencesService: AlertPreferencesService,
  ) {}

  @Get('me')
  getMine(@CurrentUser() user: RequestUser) {
    return this.alertPreferencesService.getMine(user.id);
  }

  @Put('me')
  updateMine(
    @CurrentUser() user: RequestUser,
    @Body() dto: UpdatePreferencesDto,
  ) {
    return this.alertPreferencesService.updateMine(user.id, dto);
  }

  @Get('regions')
  findRegions(@CurrentUser() user: RequestUser) {
    return this.alertPreferencesService.findRegions(user.tenantId);
  }

  @Get('category-summary')
  getCategorySummary(@CurrentUser() user: RequestUser) {
    return this.alertPreferencesService.getCategorySummary(user.tenantId);
  }
}
