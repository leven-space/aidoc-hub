import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';

@Injectable()
export class SystemAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    if (request.user?.systemRole !== 'SYSTEM_ADMIN') {
      throw new ForbiddenException('System administrator access required');
    }
    return true;
  }
}
