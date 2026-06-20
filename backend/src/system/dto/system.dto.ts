import {
  IsBoolean,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  MinLength,
} from 'class-validator';

export class InitializeSetupDto {
  @Matches(/^1[3-9]\d{9}$/, { message: 'Invalid phone number format' })
  phone: string;

  @MinLength(6)
  @Matches(/^(?=.*[A-Za-z])(?=.*\d).+$/, {
    message: 'Password must include letters and numbers',
  })
  password: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsString()
  siteName: string;

  @IsUrl({ require_tld: false }, { message: 'Invalid public API URL' })
  publicApiUrl: string;
}

export class UpdateSystemConfigDto {
  @IsOptional()
  @IsUrl({ require_tld: false }, { message: 'Invalid public API URL' })
  publicApiUrl?: string;

  @IsOptional()
  @IsString()
  siteName?: string;

  @IsOptional()
  @IsBoolean()
  registrationEnabled?: boolean;
}
