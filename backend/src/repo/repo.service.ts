import { Injectable, HttpStatus } from '@nestjs/common';
import { AppException, ErrorCode } from '../common/exceptions/app.exception';
import type { Response } from 'express';
import { PrismaService } from '../common/prisma/prisma.service';
import { GitService, type RepoFileInput } from '../git/git.service';
import { WorkspaceService } from '../workspace/workspace.service';
import { inferStaticContentType } from './static-content-type';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_FILES_PER_COMMIT = 50;

@Injectable()
export class RepoService {
  constructor(
    private prisma: PrismaService,
    private gitService: GitService,
    private workspaceService: WorkspaceService,
  ) {}

  async createRepo(
    workspaceId: string,
    userId: string,
    name: string,
    description?: string,
  ) {
    await this.workspaceService.checkAdmin(workspaceId, userId);

    const existing = await this.prisma.repository.findFirst({
      where: { workspaceId, name, isDeleted: false },
    });
    if (existing) {
      throw new AppException(
        ErrorCode.REPO_NAME_EXISTS,
        HttpStatus.BAD_REQUEST,
      );
    }

    const repo = await this.prisma.repository.create({
      data: { name, description: description || '', workspaceId },
    });

    await this.gitService.initRepo(workspaceId, repo.id);

    return repo;
  }

  async listRepos(workspaceId: string, userId: string) {
    await this.workspaceService.checkMembership(workspaceId, userId);
    return this.prisma.repository.findMany({
      where: { workspaceId, isDeleted: false },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async getRepo(repoId: string, workspaceId: string, userId: string) {
    await this.workspaceService.checkMembership(workspaceId, userId);
    const repo = await this.prisma.repository.findFirst({
      where: { id: repoId, workspaceId, isDeleted: false },
    });
    if (!repo) {
      throw new AppException(ErrorCode.REPO_NOT_FOUND, HttpStatus.NOT_FOUND);
    }
    const latest = await this.gitService.getLatestVersion(workspaceId, repoId);
    return { ...repo, latestVersion: latest };
  }

  async softDeleteRepo(repoId: string, workspaceId: string, userId: string) {
    await this.workspaceService.checkAdmin(workspaceId, userId);
    await this.prisma.repository.update({
      where: { id: repoId },
      data: { isDeleted: true, deletedAt: new Date() },
    });
    return { success: true };
  }

  async commitFiles(
    repoId: string,
    workspaceId: string,
    userId: string,
    files: RepoFileInput[],
    message: string,
    baseVersion?: string,
    forceOverwrite?: boolean,
  ) {
    await this.workspaceService.checkEditor(workspaceId, userId);
    this.validateFiles(files);

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const author = user?.name || userId;

    const result = await this.gitService.commitFiles(
      workspaceId,
      repoId,
      files,
      message,
      author,
      baseVersion,
      forceOverwrite,
    );

    await this.prisma.repository.update({
      where: { id: repoId },
      data: { updatedAt: new Date() },
    });

    return result;
  }

  async getFiles(
    repoId: string,
    workspaceId: string,
    userId: string,
    version?: string,
  ) {
    await this.workspaceService.checkMembership(workspaceId, userId);
    return this.gitService.listFiles(workspaceId, repoId, version);
  }

  async listDeletedRepos(workspaceId: string, userId: string) {
    await this.workspaceService.checkAdmin(workspaceId, userId);
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    return this.prisma.repository.findMany({
      where: {
        workspaceId,
        isDeleted: true,
        deletedAt: { gte: thirtyDaysAgo },
      },
      orderBy: { deletedAt: 'desc' },
    });
  }

  async restoreRepo(repoId: string, workspaceId: string, userId: string) {
    await this.workspaceService.checkAdmin(workspaceId, userId);
    const repo = await this.prisma.repository.findFirst({
      where: { id: repoId, workspaceId, isDeleted: true },
    });
    if (!repo) {
      throw new AppException(
        ErrorCode.REPO_DELETED_NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }
    return this.prisma.repository.update({
      where: { id: repoId },
      data: { isDeleted: false, deletedAt: null },
    });
  }

  async permanentDeleteRepo(
    repoId: string,
    workspaceId: string,
    userId: string,
  ) {
    await this.workspaceService.checkAdmin(workspaceId, userId);
    const repo = await this.prisma.repository.findFirst({
      where: { id: repoId, workspaceId, isDeleted: true },
    });
    if (!repo) {
      throw new AppException(
        ErrorCode.REPO_DELETED_NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }
    await this.prisma.repository.delete({ where: { id: repoId } });
    return { success: true };
  }

  async readFile(
    repoId: string,
    workspaceId: string,
    userId: string,
    filePath: string,
    version?: string,
  ) {
    await this.workspaceService.checkMembership(workspaceId, userId);
    return this.gitService.readFileAtVersion(
      workspaceId,
      repoId,
      filePath,
      version,
    );
  }

  async servePreviewFile(
    repoId: string,
    workspaceId: string,
    userId: string,
    filePath: string,
    version: string | undefined,
    res: Response,
  ) {
    await this.workspaceService.checkMembership(workspaceId, userId);
    this.assertSafeFilePath(filePath);

    const buffer = await this.gitService.readFileBufferAtVersion(
      workspaceId,
      repoId,
      filePath,
      version,
    );

    const contentType = inferStaticContentType(filePath);
    if (contentType) {
      res.setHeader('Content-Type', contentType);
    }
    res.setHeader('Cache-Control', 'private, max-age=60');
    res.send(buffer);
  }

  private assertSafeFilePath(filePath: string) {
    if (!filePath || filePath.includes('..') || filePath.startsWith('/')) {
      throw new AppException(
        ErrorCode.INVALID_FILE_PATH,
        HttpStatus.BAD_REQUEST,
        {
          path: filePath,
        },
      );
    }
  }

  private validateFiles(files: RepoFileInput[]) {
    if (!files || files.length === 0) {
      throw new AppException(
        ErrorCode.NO_FILES_PROVIDED,
        HttpStatus.BAD_REQUEST,
      );
    }
    if (files.length > MAX_FILES_PER_COMMIT) {
      throw new AppException(
        ErrorCode.MAX_FILES_EXCEEDED,
        HttpStatus.BAD_REQUEST,
        {
          max: MAX_FILES_PER_COMMIT,
        },
      );
    }
    for (const file of files) {
      if (file.filePath.includes('..') || file.filePath.startsWith('/')) {
        throw new AppException(
          ErrorCode.INVALID_FILE_PATH,
          HttpStatus.BAD_REQUEST,
          {
            path: file.filePath,
          },
        );
      }
      if (this.getFileByteLength(file) > MAX_FILE_SIZE) {
        throw new AppException(
          ErrorCode.FILE_SIZE_EXCEEDED,
          HttpStatus.BAD_REQUEST,
          {
            path: file.filePath,
            maxSize: '10MB',
          },
        );
      }
    }
  }

  private getFileByteLength(file: RepoFileInput): number {
    if (file.encoding === 'base64') {
      return Buffer.byteLength(file.content, 'base64');
    }
    return Buffer.byteLength(file.content, 'utf-8');
  }
}
