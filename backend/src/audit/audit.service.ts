import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { WorkspaceService } from '../workspace/workspace.service';
import { SystemService } from '../system/system.service';

function escapeLikePattern(input: string): string {
  return input.replace(/[%_\\]/g, '\\$&');
}

@Injectable()
export class AuditService {
  constructor(
    private prisma: PrismaService,
    private workspaceService: WorkspaceService,
    private systemService: SystemService,
  ) {}

  async listLogs(
    userId: string,
    filters: {
      workspaceId?: string;
      action?: string;
      userId?: string;
      from?: string;
      to?: string;
      page?: number;
      pageSize?: number;
    },
  ) {
    const page = filters.page || 1;
    const pageSize = Math.min(Math.max(filters.pageSize || 20, 1), 100);

    if (filters.workspaceId) {
      await this.workspaceService.checkAdmin(filters.workspaceId, userId);
    } else {
      await this.systemService.requireSystemAdmin(userId);
    }

    const where: any = {};
    if (filters.action) {
      where.action = { contains: escapeLikePattern(filters.action) };
    }
    if (filters.userId) {
      where.userId = filters.userId;
    }
    if (filters.from || filters.to) {
      where.createdAt = {};
      if (filters.from) where.createdAt.gte = new Date(filters.from);
      if (filters.to) where.createdAt.lte = new Date(filters.to);
    }

    const [items, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, phone: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return { items, total, page, pageSize };
  }
}
