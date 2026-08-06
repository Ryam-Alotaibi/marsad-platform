import { IsIn, IsString } from 'class-validator';

export class EvaluateContinuityDto {
  @IsIn(['PREDICTION', 'SCENARIO'])
  sourceType: 'PREDICTION' | 'SCENARIO';

  @IsString()
  sourceId: string;
}
