import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { ShareService } from './share.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('shares')
export class ShareController {
  constructor(private shareService: ShareService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(
    @Request() req: any,
    @Body()
    body: {
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
  validate(
    @Param('token') token: string,
    @Query('password') password?: string,
  ) {
    return this.shareService.validateShare(token, password);
  }

  @Get(':token/preview/*splat')
  async servePreview(
    @Param('token') token: string,
    @Param('splat') splat: string | string[],
    @Query('password') password?: string,
    @Res() res?: Response,
  ) {
    const rawPath = Array.isArray(splat) ? splat.join('/') : splat;
    const decodedPath = decodeURIComponent(rawPath);
    return this.shareService.serveSharePreview(
      token,
      decodedPath,
      password,
      res!,
    );
  }

  @Get(':token/file')
  readFile(
    @Param('token') token: string,
    @Query('path') filePath: string,
    @Query('password') password?: string,
  ) {
    return this.shareService.readShareFile(token, filePath, password);
  }

  @Get(':token/view')
  getView(@Param('token') token: string, @Query('password') password?: string) {
    return this.shareService.getShareView(token, password);
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
