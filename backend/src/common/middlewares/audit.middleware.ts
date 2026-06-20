import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { PrismaService } from '../prisma/prisma.service';

const AUDIT_ACTIONS = [
  'POST', 'PUT', 'PATCH', 'DELETE',
];

const AUDIT_PATHS = [
  '/api/workspaces',
  '/api/repos',
  '/api/shares',
  '/api/auth/tokens',
];

@Injectable()
export class AuditMiddleware implements NestMiddleware {
  private readonly logger = new Logger('Audit');
  constructor(private prisma: PrismaService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    next();

    // Only audit mutating operations on key paths
    if (!AUDIT_ACTIONS.includes(req.method)) return;
    const shouldAudit = AUDIT_PATHS.some((p) => req.path.startsWith(p));
    if (!shouldAudit) return;

    const userId = (req as any).user?.userId || null;
    const ip = req.ip || req.headers['x-forwarded-for'] as string || '';

    try {
      await this.prisma.auditLog.create({
        data: {
          userId,
          action: `${req.method} ${req.path}`,
          targetType: this.extractTargetType(req.path),
          targetId: this.extractTargetId(req.path),
          details: JSON.stringify(req.body || {}),
          ip,
        },
      });
    } catch (err) {
      // Don't fail the request if audit logging fails
      this.logger.warn(`Audit log failed for ${req.method} ${req.path}: ${err}`);
    }
  }

  private extractTargetType(path: string): string {
    const parts = path.split('/').filter(Boolean);
    return parts[1] || 'unknown';
  }

  private extractTargetId(path: string): string | null {
    const parts = path.split('/').filter(Boolean);
    return parts[2] || null;
  }
}
