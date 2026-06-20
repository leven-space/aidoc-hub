import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
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
      throw new UnauthorizedException(
        'Missing or invalid authorization header',
      );
    }

    const token = authHeader.substring(7);

    if (token.startsWith('adh_')) {
      const result = await this.tokenService.validateToken(token);
      if (!result) {
        throw new UnauthorizedException('Invalid or expired access token');
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
        throw new UnauthorizedException('User not found');
      }
      request.user = { userId: user.id, systemRole: user.systemRole };
      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
