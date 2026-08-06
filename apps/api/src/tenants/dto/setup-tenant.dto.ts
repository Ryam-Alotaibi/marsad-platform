import { IsEmail, IsIn, IsString, Matches, MaxLength, MinLength } from 'class-validator';

const TENANT_TYPES = ['GOVERNMENT', 'HEALTHCARE', 'PRIVATE', 'NONPROFIT'] as const;
const HEX_COLOR = /^#[0-9A-Fa-f]{6}$/;

export class SetupTenantDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  nameAr: string;

  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name: string;

  @IsIn(TENANT_TYPES)
  type: (typeof TENANT_TYPES)[number];

  @Matches(HEX_COLOR)
  primaryColor: string;

  @Matches(HEX_COLOR)
  secondaryColor: string;

  @IsString()
  @MinLength(2)
  @MaxLength(120)
  regionName: string;

  @IsString()
  @MinLength(2)
  @MaxLength(120)
  siteName: string;

  @IsString()
  @MinLength(2)
  @MaxLength(120)
  adminFullName: string;

  @IsEmail()
  adminEmail: string;

  @IsString()
  @MinLength(8)
  @MaxLength(72)
  adminPassword: string;
}
