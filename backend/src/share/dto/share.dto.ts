import { IsOptional, IsString } from 'class-validator';

export class ShareAccessDto {
  @IsOptional()
  @IsString()
  password?: string;
}

export class ShareReadFileDto {
  @IsString()
  path: string;
}
