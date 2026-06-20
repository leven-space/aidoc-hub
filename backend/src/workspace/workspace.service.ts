import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class WorkspaceService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, name: string, description?: string) {
    const workspace = await this.prisma.workspace.create({
      data: {
        name,
        description: description || '',
        ownerId: userId,
        members: {
          create: { userId, role: 'ADMIN' },
        },
      },
      include: { members: { include: { user: true } } },
    });
    return workspace;
  }

  async findAll(userId: string) {
    return this.prisma.workspace.findMany({
      where: {
        isDeleted: false,
        members: { some: { userId } },
      },
      include: {
        _count: { select: { members: true, repositories: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async findOne(workspaceId: string, userId: string) {
    const workspace = await this.prisma.workspace.findFirst({
      where: { id: workspaceId, isDeleted: false },
      include: {
        members: { include: { user: true } },
        _count: { select: { repositories: true } },
      },
    });
    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }
    const member = workspace.members.find((m) => m.userId === userId);
    if (!member) {
      throw new ForbiddenException('No access to this workspace');
    }
    return workspace;
  }

  async softDelete(workspaceId: string, userId: string) {
    await this.checkAdmin(workspaceId, userId);
    await this.prisma.workspace.update({
      where: { id: workspaceId },
      data: { isDeleted: true, deletedAt: new Date() },
    });
    return { success: true };
  }

  async listDeleted(userId: string) {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    return this.prisma.workspace.findMany({
      where: {
        isDeleted: true,
        deletedAt: { gte: thirtyDaysAgo },
        members: { some: { userId, role: 'ADMIN' } },
      },
      orderBy: { deletedAt: 'desc' },
    });
  }

  async restore(workspaceId: string, userId: string) {
    await this.checkAdmin(workspaceId, userId);
    const workspace = await this.prisma.workspace.findFirst({
      where: { id: workspaceId, isDeleted: true },
    });
    if (!workspace) {
      throw new NotFoundException('Deleted workspace not found');
    }
    return this.prisma.workspace.update({
      where: { id: workspaceId },
      data: { isDeleted: false, deletedAt: null },
    });
  }

  async permanentDelete(workspaceId: string, userId: string) {
    await this.checkAdmin(workspaceId, userId);
    const workspace = await this.prisma.workspace.findFirst({
      where: { id: workspaceId, isDeleted: true },
    });
    if (!workspace) {
      throw new NotFoundException('Deleted workspace not found');
    }
    await this.prisma.workspace.delete({ where: { id: workspaceId } });
    return { success: true };
  }

  async update(
    workspaceId: string,
    userId: string,
    name?: string,
    description?: string,
  ) {
    await this.checkAdmin(workspaceId, userId);
    return this.prisma.workspace.update({
      where: { id: workspaceId },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
      },
    });
  }

  // Member management
  async inviteMember(
    workspaceId: string,
    userId: string,
    phone: string,
    role: string,
  ) {
    await this.checkAdmin(workspaceId, userId);

    const targetUser = await this.prisma.user.findUnique({ where: { phone } });
    if (!targetUser) {
      throw new NotFoundException('User not found with this phone number');
    }

    const existing = await this.prisma.workspaceMember.findUnique({
      where: { userId_workspaceId: { userId: targetUser.id, workspaceId } },
    });
    if (existing) {
      throw new BadRequestException('User is already a member');
    }

    return this.prisma.workspaceMember.create({
      data: {
        userId: targetUser.id,
        workspaceId,
        role: role as any,
      },
      include: { user: true },
    });
  }

  async updateMemberRole(
    workspaceId: string,
    userId: string,
    memberId: string,
    role: string,
  ) {
    await this.checkAdmin(workspaceId, userId);
    return this.prisma.workspaceMember.update({
      where: { id: memberId },
      data: { role: role as any },
    });
  }

  async removeMember(workspaceId: string, userId: string, memberId: string) {
    await this.checkAdmin(workspaceId, userId);
    const member = await this.prisma.workspaceMember.findUnique({
      where: { id: memberId },
    });
    if (!member) {
      throw new NotFoundException('Member not found');
    }
    if (member.userId === userId) {
      throw new BadRequestException('Cannot remove yourself');
    }
    await this.prisma.workspaceMember.delete({ where: { id: memberId } });
    return { success: true };
  }

  async listMembers(workspaceId: string, userId: string) {
    await this.checkMembership(workspaceId, userId);
    return this.prisma.workspaceMember.findMany({
      where: { workspaceId },
      include: {
        user: { select: { id: true, name: true, avatar: true, phone: true } },
      },
    });
  }

  // Permission helpers
  async checkMembership(workspaceId: string, userId: string) {
    const member = await this.prisma.workspaceMember.findUnique({
      where: { userId_workspaceId: { userId, workspaceId } },
    });
    if (!member) {
      throw new ForbiddenException('No access to this workspace');
    }
    return member;
  }

  async checkAdmin(workspaceId: string, userId: string) {
    const member = await this.checkMembership(workspaceId, userId);
    if (member.role !== 'ADMIN') {
      throw new ForbiddenException('Admin permission required');
    }
    return member;
  }

  async checkEditor(workspaceId: string, userId: string) {
    const member = await this.checkMembership(workspaceId, userId);
    if (member.role !== 'ADMIN' && member.role !== 'EDITOR') {
      throw new ForbiddenException('Editor permission required');
    }
    return member;
  }
}
