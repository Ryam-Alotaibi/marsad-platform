import { Module } from '@nestjs/common';
import { FederatedController } from './federated.controller';
import { FederatedService } from './federated.service';

@Module({
  controllers: [FederatedController],
  providers: [FederatedService],
})
export class FederatedModule {}
