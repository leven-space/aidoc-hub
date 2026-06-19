import { IsString, IsOptional, IsArray } from 'class-validator';

export class CommitFileDto {
  @IsString()
  filePath: string;

  @IsString()
  content: string;
}

export class CommitDto {
  @IsArray()
  files: CommitFileDto[];

  @IsString()
  message: string;

  @IsString()
  author: string;

  @IsOptional()
  @IsString()
  baseVersion?: string;

  @IsOptional()
  forceOverwrite?: boolean;
}
