import { Body, Controller, Get, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { TenantsService } from './tenants.service';
import { SetupTenantDto } from './dto/setup-tenant.dto';

@Controller('tenants')
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Get()
  findAll() {
    return this.tenantsService.findAll();
  }

  @Post('setup')
  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  setup(@Body() dto: SetupTenantDto) {
    return this.tenantsService.setup(dto);
  }
}
