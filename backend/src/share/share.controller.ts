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
import { Throttle } from '@nestjs/throttler';
import { JwtService } from '@nestjs/jwt';
import type { Request as ExpressRequest, Response } from 'express';
import { ShareService } from './share.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ShareAccessDto, ShareReadFileDto } from './dto/share.dto';
import { hasValidShareGrant, setShareGrantCookie } from './share-access.util';

@Controller('shares')
export class ShareController {
  constructor(
    private shareService: ShareService,
    private jwtService: JwtService,
  ) {}

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
      allowDownload?: boolean;
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
        allowDownload: body.allowDownload,
      },
    );
  }

  @Post('validate/:token')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  validate(
    @Param('token') token: string,
    @Body() body: ShareAccessDto,
    @Request() req: ExpressRequest,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.handleShareAccess(token, body.password, req, res);
  }

  @Post(':token/access')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  access(
    @Param('token') token: string,
    @Body() body: ShareAccessDto,
    @Request() req: ExpressRequest,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.handleShareAccess(token, body.password, req, res);
  }

  @Get(':token/preview/*splat')
  async servePreview(
    @Param('token') token: string,
    @Param('splat') splat: string | string[],
    @Request() req: ExpressRequest,
    @Res() res: Response,
  ) {
    const rawPath = Array.isArray(splat) ? splat.join('/') : splat;
    const decodedPath = decodeURIComponent(rawPath);
    const hasGrant = hasValidShareGrant(req, this.jwtService, token);
    return this.shareService.serveSharePreview(
      token,
      decodedPath,
      undefined,
      res,
      hasGrant,
    );
  }

  @Post(':token/file')
  readFile(
    @Param('token') token: string,
    @Body() body: ShareReadFileDto,
    @Request() req: ExpressRequest,
  ) {
    const hasGrant = hasValidShareGrant(req, this.jwtService, token);
    return this.shareService.readShareFile(
      token,
      body.path,
      undefined,
      hasGrant,
    );
  }

  @Get(':token/view')
  getView(@Param('token') token: string, @Request() req: ExpressRequest) {
    const hasGrant = hasValidShareGrant(req, this.jwtService, token);
    return this.shareService.getShareView(token, undefined, hasGrant);
  }

  @Get(':token/download')
  async download(
    @Param('token') token: string,
    @Query('path') filePath: string,
    @Request() req: ExpressRequest,
    @Res() res: Response,
  ) {
    const hasGrant = hasValidShareGrant(req, this.jwtService, token);
    return this.shareService.downloadSharePath(
      token,
      filePath,
      undefined,
      res,
      hasGrant,
    );
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

  private async handleShareAccess(
    token: string,
    password: string | undefined,
    req: ExpressRequest,
    res: Response,
  ) {
    const result = await this.shareService.getShareView(token, password);
    if (
      password &&
      !('requiresPassword' in result && result.requiresPassword)
    ) {
      setShareGrantCookie(res, this.jwtService, token);
    }
    return result;
  }
}
