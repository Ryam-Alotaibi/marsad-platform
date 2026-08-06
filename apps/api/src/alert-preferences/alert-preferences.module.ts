import { Module } from '@nestjs/common';
import { AlertPreferencesController } from './alert-preferences.controller';
import { AlertPreferencesService } from './alert-preferences.service';

@Module({
  controllers: [AlertPreferencesController],
  providers: [AlertPreferencesService],
})
export class AlertPreferencesModule {}
