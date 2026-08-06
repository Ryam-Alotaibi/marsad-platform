import { IsEnum, IsString, MinLength } from 'class-validator';
import { AlertCategory, AlertSeverity } from '@prisma/client';

export class CreateSupportAlertDto {
  @IsString()
  @MinLength(3)
  title: string;

  @IsString()
  @MinLength(3)
  description: string;

  @IsEnum(AlertSeverity)
  severity: AlertSeverity;

  @IsEnum(AlertCategory)
  category: AlertCategory;
}
