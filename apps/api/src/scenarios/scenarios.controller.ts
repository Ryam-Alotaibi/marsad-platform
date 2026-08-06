import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, type RequestUser } from '../auth/current-user.decorator';
import { ScenariosService } from './scenarios.service';
import { RunScenarioDto } from './dto/run-scenario.dto';

@Controller('scenarios')
@UseGuards(JwtAuthGuard)
export class ScenariosController {
  constructor(private readonly scenariosService: ScenariosService) {}

  @Post('run')
  runWhatIf(@CurrentUser() user: RequestUser, @Body() dto: RunScenarioDto) {
    return this.scenariosService.runWhatIf(user.tenantId, dto);
  }

  @Post('sweep/run')
  runNightlySweep(@CurrentUser() user: RequestUser) {
    return this.scenariosService.runNightlySweep(user.tenantId);
  }

  @Get()
  listScenarios(@CurrentUser() user: RequestUser) {
    return this.scenariosService.listScenarios(user.tenantId);
  }

  @Post(':id/freeze')
  freezePlaybook(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body('name') name: string,
  ) {
    return this.scenariosService.freezePlaybook(user.tenantId, user.id, id, name);
  }

  @Get('playbooks/all')
  listPlaybooks(@CurrentUser() user: RequestUser) {
    return this.scenariosService.listPlaybooks(user.tenantId);
  }

  @Post('playbooks/:id/activate')
  activatePlaybook(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.scenariosService.activatePlaybook(user.tenantId, user.id, id);
  }
}
