import { IsIn, IsString } from 'class-validator';

export class ApplyContinuityActionDto {
  @IsString()
  scheduledServiceId: string;

  @IsIn(['PREDICTION', 'SCENARIO'])
  sourceType: 'PREDICTION' | 'SCENARIO';

  @IsString()
  sourceId: string;

  @IsIn(['REMOTE', 'RE_ROUTED', 'CANCELLED'])
  actionTaken: 'REMOTE' | 'RE_ROUTED' | 'CANCELLED';
}
