import type { Request } from 'express';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../common/prisma/prisma.service';

function extractAccessTokenFromCookie(req: Request): string | null {
  const cookieHeader = req?.headers?.cookie;
  if (!cookieHeader) return null;
  const entry = cookieHeader
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith('accessToken='));
  if (!entry) return null;
  return decodeURIComponent(entry.slice('accessToken='.length));
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        (req) => {
          const token = req?.query?.token;
          return typeof token === 'string' ? token : null;
        },
        extractAccessTokenFromCookie,
      ]),
      ignoreExpiration: false,
      secretOrKey:
        configService.get<string>('JWT_SECRET') || 'aidochub-dev-secret',
    });
  }

  async validate(payload: any) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, systemRole: true },
    });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return { userId: user.id, systemRole: user.systemRole };
  }
}
