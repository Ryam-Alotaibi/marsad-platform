import { IsNumber, Max, Min } from 'class-validator';

export class RunScenarioDto {
  @IsNumber()
  @Min(-10)
  @Max(60)
  temperatureC: number;

  @IsNumber()
  @Min(0)
  @Max(150)
  loadPct: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  humidityPct: number;

  @IsNumber()
  @Min(0)
  @Max(300)
  aqi: number;

  @IsNumber()
  @Min(0)
  @Max(48)
  powerOutageHours: number;

  @IsNumber()
  @Min(0)
  @Max(200)
  suspiciousLoginAttempts: number;
}
