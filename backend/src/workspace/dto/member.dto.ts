import { IsIn, IsString, Matches } from 'class-validator';

export class InviteMemberDto {
  @IsString()
  @Matches(/^1[3-9]\d{9}$/)
  phone: string;

  @IsIn(['ADMIN', 'EDITOR', 'VIEWER'])
  role: 'ADMIN' | 'EDITOR' | 'VIEWER';
}

export class UpdateMemberRoleDto {
  @IsIn(['ADMIN', 'EDITOR', 'VIEWER'])
  role: 'ADMIN' | 'EDITOR' | 'VIEWER';
}
