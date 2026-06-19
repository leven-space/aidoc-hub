import { Controller, Get, Post, Param, Query, Body, UseGuards, Request } from '@nestjs/common';
import { VersionService } from './version.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('workspaces/:workspaceId/repos/:repoId/versions')
@UseGuards(JwtAuthGuard)
export class VersionController {
  constructor(private versionService: VersionService) {}

  @Get()
  getHistory(
    @Request() req: any,
    @Param('workspaceId') workspaceId: string,
    @Param('repoId') repoId: string,
  ) {
    return this.versionService.getHistory(workspaceId, repoId, req.user.userId);
  }

  @Get('diff')
  getDiff(
    @Request() req: any,
    @Param('workspaceId') workspaceId: string,
    @Param('repoId') repoId: string,
    @Query('path') filePath: string,
    @Query('from') fromVersion: string,
    @Query('to') toVersion: string,
  ) {
    return this.versionService.getDiff(workspaceId, repoId, req.user.userId, filePath, fromVersion, toVersion);
  }

  @Post('restore')
  restoreVersion(
    @Request() req: any,
    @Param('workspaceId') workspaceId: string,
    @Param('repoId') repoId: string,
    @Body() body: { version: string },
  ) {
    return this.versionService.restoreVersion(workspaceId, repoId, req.user.userId, body.version);
  }
}
