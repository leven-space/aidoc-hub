import { Injectable, HttpStatus } from '@nestjs/common';
import { AppException, ErrorCode } from '../common/exceptions/app.exception';
import { randomBytes } from 'crypto';
import * as bcrypt from 'bcryptjs';
import type { Response } from 'express';
import type { Share } from '@prisma/client';
import { PrismaService } from '../common/prisma/prisma.service';
import { WorkspaceService } from '../workspace/workspace.service';
import { GitService } from '../git/git.service';
import { inferStaticContentType } from '../repo/static-content-type';

@Injectable()
export class ShareService {
  constructor(
    private prisma: PrismaService,
    private workspaceService: WorkspaceService,
    private gitService: GitService,
  ) {}

  async createShare(
    workspaceId: string,
    repoId: string,
    userId: string,
    type: 'VIEW_ONLY' | 'SOURCE_ACCESS',
    options?: {
      password?: string;
      expiresAt?: Date;
      maxVisits?: number;
      version?: string;
    },
  ) {
    await this.workspaceService.checkEditor(workspaceId, userId);

    const token = randomBytes(16).toString('hex');
    const passwordHash = options?.password
      ? await bcrypt.hash(options.password, 10)
      : null;

    const share = await this.prisma.share.create({
      data: {
        repositoryId: repoId,
        workspaceId,
        type,
        token,
        password: passwordHash,
        expiresAt: options?.expiresAt || null,
        maxVisits: options?.maxVisits || null,
        version: options?.version || null,
        createdBy: userId,
      },
    });

    return {
      id: share.id,
      token: share.token,
      type: share.type,
      url: `/share/${share.token}`,
      expiresAt: share.expiresAt,
      createdAt: share.createdAt,
    };
  }

  async validateShare(token: string, password?: string) {
    const share = await this.findActiveShare(token);
    this.ensureShareLimits(share);

    if (share.password) {
      if (!password) {
        return { requiresPassword: true };
      }
      await this.verifySharePassword(share, password);
    }

    await this.incrementVisitCount(share.id);

    return {
      id: share.id,
      type: share.type,
      repositoryId: share.repositoryId,
      workspaceId: share.workspaceId,
      version: share.version,
    };
  }

  async getShareView(token: string, password?: string) {
    const share = await this.findActiveShare(token);
    this.ensureShareLimits(share);

    if (share.password) {
      if (!password) {
        return { requiresPassword: true as const };
      }
      await this.verifySharePassword(share, password);
    }

    await this.incrementVisitCount(share.id);

    const repo = await this.prisma.repository.findFirst({
      where: {
        id: share.repositoryId,
        workspaceId: share.workspaceId,
        isDeleted: false,
      },
    });
    if (!repo) {
      throw new AppException(ErrorCode.REPO_NOT_FOUND, HttpStatus.NOT_FOUND);
    }

    const files = await this.gitService.listFiles(
      share.workspaceId,
      share.repositoryId,
      share.version || undefined,
    );

    return {
      requiresPassword: false as const,
      type: share.type,
      version: share.version,
      repoName: repo.name,
      repoDescription: repo.description,
      files,
    };
  }

  async readShareFile(token: string, filePath: string, password?: string) {
    const share = await this.assertShareAccess(token, password);
    if (share.type !== 'SOURCE_ACCESS') {
      throw new AppException(
        ErrorCode.SHARE_SOURCE_ACCESS_DENIED,
        HttpStatus.FORBIDDEN,
      );
    }
    this.assertSafeFilePath(filePath);

    return this.gitService.readFileAtVersion(
      share.workspaceId,
      share.repositoryId,
      filePath,
      share.version || undefined,
    );
  }

  async serveSharePreview(
    token: string,
    filePath: string,
    password: string | undefined,
    res: Response,
  ) {
    const share = await this.assertShareAccess(token, password);
    this.assertSafeFilePath(filePath);

    const buffer = await this.gitService.readFileBufferAtVersion(
      share.workspaceId,
      share.repositoryId,
      filePath,
      share.version || undefined,
    );

    const contentType = inferStaticContentType(filePath);
    if (contentType) {
      res.setHeader('Content-Type', contentType);
    }
    res.setHeader('Cache-Control', 'private, max-age=60');
    res.send(buffer);
  }

  async listShares(workspaceId: string, repoId: string, userId: string) {
    await this.workspaceService.checkMembership(workspaceId, userId);
    return this.prisma.share.findMany({
      where: { repositoryId: repoId, workspaceId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async deactivateShare(shareId: string, userId: string) {
    const share = await this.prisma.share.findFirst({
      where: { id: shareId, createdBy: userId },
    });
    if (!share) {
      throw new AppException(ErrorCode.SHARE_NOT_FOUND, HttpStatus.NOT_FOUND);
    }
    await this.prisma.share.update({
      where: { id: shareId },
      data: { isActive: false },
    });
    return { success: true };
  }

  private async assertShareAccess(
    token: string,
    password?: string,
  ): Promise<Share> {
    const share = await this.findActiveShare(token);
    this.ensureShareLimits(share);

    if (share.password) {
      if (!password) {
        throw new AppException(
          ErrorCode.SHARE_PASSWORD_REQUIRED,
          HttpStatus.FORBIDDEN,
        );
      }
      await this.verifySharePassword(share, password);
    }

    return share;
  }

  private async findActiveShare(token: string): Promise<Share> {
    const share = await this.prisma.share.findUnique({
      where: { token },
    });

    if (!share || !share.isActive) {
      throw new AppException(
        ErrorCode.SHARE_LINK_NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }

    return share;
  }

  private ensureShareLimits(share: Share) {
    if (share.expiresAt && share.expiresAt < new Date()) {
      throw new AppException(
        ErrorCode.SHARE_LINK_EXPIRED,
        HttpStatus.BAD_REQUEST,
      );
    }

    if (share.maxVisits && share.visitCount >= share.maxVisits) {
      throw new AppException(
        ErrorCode.SHARE_MAX_VISITS,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  private async verifySharePassword(share: Share, password: string) {
    if (!share.password) {
      return;
    }
    const valid = await bcrypt.compare(password, share.password);
    if (!valid) {
      throw new AppException(
        ErrorCode.SHARE_INVALID_PASSWORD,
        HttpStatus.FORBIDDEN,
      );
    }
  }

  private async incrementVisitCount(shareId: string) {
    await this.prisma.share.update({
      where: { id: shareId },
      data: { visitCount: { increment: 1 } },
    });
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
}
