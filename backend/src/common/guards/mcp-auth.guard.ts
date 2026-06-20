import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpStatus,
} from '@nestjs/common';
import { AppException, ErrorCode } from '../exceptions/app.exception';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { TokenService } from '../../auth/token.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class McpAuthGuard implements CanActivate {
  constructor(
    private tokenService: TokenService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization as string | undefined;

    if (!authHeader?.startsWith('Bearer ')) {
      throw new AppException(
        ErrorCode.INVALID_AUTH_HEADER,
        HttpStatus.UNAUTHORIZED,
      );
    }

    const token = authHeader.substring(7);

    if (token.startsWith('adh_')) {
      const result = await this.tokenService.validateToken(token);
      if (!result) {
        throw new AppException(
          ErrorCode.INVALID_OR_EXPIRED_TOKEN,
          HttpStatus.UNAUTHORIZED,
        );
      }
      request.user = {
        userId: result.userId,
        tokenScope: result.scope,
        systemRole: result.user.systemRole,
      };
      return true;
    }

    try {
      const payload = this.jwtService.verify(token, {
        secret:
          this.configService.get<string>('JWT_SECRET') || 'aidochub-dev-secret',
      });
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        select: { id: true, systemRole: true },
      });
      if (!user) {
        throw new AppException(
          ErrorCode.USER_NOT_FOUND,
          HttpStatus.UNAUTHORIZED,
        );
      }
      request.user = { userId: user.id, systemRole: user.systemRole };
      return true;
    } catch {
      throw new AppException(
        ErrorCode.INVALID_OR_EXPIRED_TOKEN,
        HttpStatus.UNAUTHORIZED,
      );
    }
  }
}
