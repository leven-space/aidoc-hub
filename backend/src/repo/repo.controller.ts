import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { RepoService } from './repo.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('workspaces/:workspaceId/repos')
@UseGuards(JwtAuthGuard)
export class RepoController {
  constructor(private repoService: RepoService) {}

  @Post()
  create(
    @Request() req: any,
    @Param('workspaceId') workspaceId: string,
    @Body() body: { name: string; description?: string },
  ) {
    return this.repoService.createRepo(workspaceId, req.user.userId, body.name, body.description);
  }

  @Get()
  list(@Request() req: any, @Param('workspaceId') workspaceId: string) {
    return this.repoService.listRepos(workspaceId, req.user.userId);
  }

  @Get(':repoId')
  get(
    @Request() req: any,
    @Param('workspaceId') workspaceId: string,
    @Param('repoId') repoId: string,
  ) {
    return this.repoService.getRepo(repoId, workspaceId, req.user.userId);
  }

  @Delete(':repoId')
  softDelete(
    @Request() req: any,
    @Param('workspaceId') workspaceId: string,
    @Param('repoId') repoId: string,
  ) {
    return this.repoService.softDeleteRepo(repoId, workspaceId, req.user.userId);
  }

  @Post(':repoId/commits')
  commit(
    @Request() req: any,
    @Param('workspaceId') workspaceId: string,
    @Param('repoId') repoId: string,
    @Body() body: {
      files: { filePath: string; content: string }[];
      message: string;
      baseVersion?: string;
      forceOverwrite?: boolean;
    },
  ) {
    return this.repoService.commitFiles(
      repoId,
      workspaceId,
      req.user.userId,
      body.files,
      body.message,
      body.baseVersion,
      body.forceOverwrite,
    );
  }

  @Get(':repoId/files')
  getFiles(
    @Request() req: any,
    @Param('workspaceId') workspaceId: string,
    @Param('repoId') repoId: string,
  ) {
    return this.repoService.getFiles(repoId, workspaceId, req.user.userId);
  }

  @Get(':repoId/file')
  async readFile(
    @Request() req: any,
    @Param('workspaceId') workspaceId: string,
    @Param('repoId') repoId: string,
    @Query('path') filePath: string,
    @Query('version') version: string,
  ) {
    return this.repoService.readFile(repoId, workspaceId, req.user.userId, filePath, version);
  }

  @Get(':repoId/download')
  async downloadFile(
    @Request() req: any,
    @Param('workspaceId') workspaceId: string,
    @Param('repoId') repoId: string,
    @Query('path') filePath: string,
    @Query('version') version: string,
    @Res() res: Response,
  ) {
    const content = await this.repoService.readFile(
      repoId,
      workspaceId,
      req.user.userId,
      filePath,
      version,
    );
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Content-Disposition', `attachment; filename="${filePath}"`);
    res.send(content);
  }
}
