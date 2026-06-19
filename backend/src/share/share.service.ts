import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { randomBytes } from 'crypto';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../common/prisma/prisma.service';
import { WorkspaceService } from '../workspace/workspace.service';

@Injectable()
export class ShareService {
  constructor(
    private prisma: PrismaService,
    private workspaceService: WorkspaceService,
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
    const share = await this.prisma.share.findUnique({
      where: { token },
    });

    if (!share || !share.isActive) {
      throw new NotFoundException('Share link not found or deactivated');
    }

    if (share.expiresAt && share.expiresAt < new Date()) {
      throw new BadRequestException('Share link has expired');
    }

    if (share.maxVisits && share.visitCount >= share.maxVisits) {
      throw new BadRequestException('Share link has reached max visits');
    }

    if (share.password) {
      if (!password) {
        return { requiresPassword: true };
      }
      const valid = await bcrypt.compare(password, share.password);
      if (!valid) {
        throw new ForbiddenException('Invalid password');
      }
    }

    // Increment visit count
    await this.prisma.share.update({
      where: { id: share.id },
      data: { visitCount: { increment: 1 } },
    });

    return {
      id: share.id,
      type: share.type,
      repositoryId: share.repositoryId,
      workspaceId: share.workspaceId,
      version: share.version,
    };
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
      throw new NotFoundException('Share not found');
    }
    await this.prisma.share.update({
      where: { id: shareId },
      data: { isActive: false },
    });
    return { success: true };
  }
}
