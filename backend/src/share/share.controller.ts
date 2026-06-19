import { Controller, Post, Get, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ShareService } from './share.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('shares')
export class ShareController {
  constructor(private shareService: ShareService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(
    @Request() req: any,
    @Body() body: {
      workspaceId: string;
      repoId: string;
      type: 'VIEW_ONLY' | 'SOURCE_ACCESS';
      password?: string;
      expiresAt?: string;
      maxVisits?: number;
      version?: string;
    },
  ) {
    return this.shareService.createShare(
      body.workspaceId,
      body.repoId,
      req.user.userId,
      body.type,
      {
        password: body.password,
        expiresAt: body.expiresAt ? new Date(body.expiresAt) : undefined,
        maxVisits: body.maxVisits,
        version: body.version,
      },
    );
  }

  @Get('validate/:token')
  validate(@Param('token') token: string, @Query('password') password?: string) {
    return this.shareService.validateShare(token, password);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  list(
    @Request() req: any,
    @Query('workspaceId') workspaceId: string,
    @Query('repoId') repoId: string,
  ) {
    return this.shareService.listShares(workspaceId, repoId, req.user.userId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  deactivate(@Request() req: any, @Param('id') id: string) {
    return this.shareService.deactivateShare(id, req.user.userId);
  }
}
