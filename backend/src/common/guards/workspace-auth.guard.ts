import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpStatus,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AppException, ErrorCode } from '../exceptions/app.exception';
import { PrismaService } from '../prisma/prisma.service';

export const ROLES_KEY = 'roles';

@Injectable()
export class WorkspaceAuthGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles) return true;

    const request = context.switchToHttp().getRequest();
    const userId = request.user?.userId;
    const workspaceId = request.params.workspaceId || request.params.id;

    if (!userId || !workspaceId) {
      throw new AppException(
        ErrorCode.WORKSPACE_ACCESS_DENIED,
        HttpStatus.FORBIDDEN,
      );
    }

    const member = await this.prisma.workspaceMember.findUnique({
      where: { userId_workspaceId: { userId, workspaceId } },
    });

    if (!member) {
      throw new AppException(
        ErrorCode.WORKSPACE_NOT_MEMBER,
        HttpStatus.FORBIDDEN,
      );
    }

    const hasRole = requiredRoles.includes(member.role);
    if (!hasRole) {
      throw new AppException(
        ErrorCode.WORKSPACE_INSUFFICIENT_PERMISSION,
        HttpStatus.FORBIDDEN,
      );
    }

    return true;
  }
}
