import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpStatus,
} from '@nestjs/common';
import { AppException, ErrorCode } from '../exceptions/app.exception';

@Injectable()
export class SystemAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    if (request.user?.systemRole !== 'SYSTEM_ADMIN') {
      throw new AppException(
        ErrorCode.SYSTEM_ADMIN_REQUIRED,
        HttpStatus.FORBIDDEN,
      );
    }
    return true;
  }
}
