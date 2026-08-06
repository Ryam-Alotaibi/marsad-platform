import { IsArray, IsObject, IsString } from 'class-validator';

export class UpdatePreferencesDto {
  @IsArray()
  @IsString({ each: true })
  channels: string[];

  @IsObject()
  thresholds: Record<string, number>;

  @IsArray()
  @IsString({ each: true })
  watchedRegionIds: string[];
}
