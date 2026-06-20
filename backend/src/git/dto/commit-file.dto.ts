import { IsString, IsOptional, IsArray, IsIn } from 'class-validator';

export class CommitFileDto {
  @IsString()
  filePath: string;

  @IsString()
  content: string;

  @IsOptional()
  @IsIn(['utf-8', 'base64'])
  encoding?: 'utf-8' | 'base64';
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
