import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { WorkspaceService } from './workspace.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { InviteMemberDto, UpdateMemberRoleDto } from './dto/member.dto';

@Controller('workspaces')
@UseGuards(JwtAuthGuard)
export class WorkspaceController {
  constructor(private workspaceService: WorkspaceService) {}

  @Post()
  create(
    @Request() req: any,
    @Body() body: { name: string; description?: string },
  ) {
    return this.workspaceService.create(
      req.user.userId,
      body.name,
      body.description,
    );
  }

  @Get()
  findAll(@Request() req: any) {
    return this.workspaceService.findAll(req.user.userId);
  }

  @Get('recycle/list')
  listDeleted(@Request() req: any) {
    return this.workspaceService.listDeleted(req.user.userId);
  }

  @Get(':id')
  findOne(@Request() req: any, @Param('id') id: string) {
    return this.workspaceService.findOne(id, req.user.userId);
  }

  @Put(':id')
  update(
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: { name?: string; description?: string },
  ) {
    return this.workspaceService.update(
      id,
      req.user.userId,
      body.name,
      body.description,
    );
  }

  @Delete(':id')
  softDelete(@Request() req: any, @Param('id') id: string) {
    return this.workspaceService.softDelete(id, req.user.userId);
  }

  @Post(':id/restore')
  restore(@Request() req: any, @Param('id') id: string) {
    return this.workspaceService.restore(id, req.user.userId);
  }

  @Delete(':id/permanent')
  permanentDelete(@Request() req: any, @Param('id') id: string) {
    return this.workspaceService.permanentDelete(id, req.user.userId);
  }

  // Member management
  @Get(':id/members')
  listMembers(@Request() req: any, @Param('id') id: string) {
    return this.workspaceService.listMembers(id, req.user.userId);
  }

  @Post(':id/members')
  inviteMember(
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: InviteMemberDto,
  ) {
    return this.workspaceService.inviteMember(
      id,
      req.user.userId,
      body.phone,
      body.role,
    );
  }

  @Put(':id/members/:memberId')
  updateMemberRole(
    @Request() req: any,
    @Param('id') id: string,
    @Param('memberId') memberId: string,
    @Body() body: UpdateMemberRoleDto,
  ) {
    return this.workspaceService.updateMemberRole(
      id,
      req.user.userId,
      memberId,
      body.role,
    );
  }

  @Delete(':id/members/:memberId')
  removeMember(
    @Request() req: any,
    @Param('id') id: string,
    @Param('memberId') memberId: string,
  ) {
    return this.workspaceService.removeMember(id, req.user.userId, memberId);
  }
}
