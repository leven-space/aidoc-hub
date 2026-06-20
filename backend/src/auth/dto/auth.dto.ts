import { IsOptional, IsString, MinLength, Matches, IsIn } from 'class-validator';

export class RegisterDto {
  @IsString()
  @Matches(/^1[3-9]\d{9}$/)
  phone: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsOptional()
  @IsString()
  name?: string;
}

export class LoginDto {
  @IsString()
  @Matches(/^1[3-9]\d{9}$/)
  phone: string;

  @IsString()
  @MinLength(6)
  password: string;
}

export class CreateTokenDto {
  @IsString()
  @MinLength(1)
  name: string;

  @IsOptional()
  @IsIn(['READ', 'READ_WRITE'])
  scope?: 'READ' | 'READ_WRITE' = 'READ';

  @IsOptional()
  @IsString()
  expiresAt?: string;
}
