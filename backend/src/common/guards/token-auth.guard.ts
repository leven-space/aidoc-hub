import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { TokenService } from '../../auth/token.service';

@Injectable()
export class TokenAuthGuard implements CanActivate {
  constructor(private tokenService: TokenService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid authorization header');
    }

    const token = authHeader.substring(7);

    // Check if it's a personal access token (starts with adh_)
    if (token.startsWith('adh_')) {
      const result = await this.tokenService.validateToken(token);
      if (!result) {
        throw new UnauthorizedException('Invalid or expired access token');
      }
      request.user = { userId: result.userId, tokenScope: result.scope };
      return true;
    }

    // Otherwise, let the JWT guard handle it
    return true;
  }
}
