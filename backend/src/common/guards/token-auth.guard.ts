import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpStatus,
} from '@nestjs/common';
import { AppException, ErrorCode } from '../exceptions/app.exception';
import { TokenService } from '../../auth/token.service';

@Injectable()
export class TokenAuthGuard implements CanActivate {
  constructor(private tokenService: TokenService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppException(
        ErrorCode.INVALID_AUTH_HEADER,
        HttpStatus.UNAUTHORIZED,
      );
    }

    const token = authHeader.substring(7);

    // Check if it's a personal access token (starts with adh_)
    if (token.startsWith('adh_')) {
      const result = await this.tokenService.validateToken(token);
      if (!result) {
        throw new AppException(
          ErrorCode.INVALID_OR_EXPIRED_TOKEN,
          HttpStatus.UNAUTHORIZED,
        );
      }
      request.user = { userId: result.userId, tokenScope: result.scope };
      return true;
    }

    // Otherwise, let the JWT guard handle it
    return true;
  }
}
