import { Injectable, HttpStatus } from '@nestjs/common';
import { AppException, ErrorCode } from '../common/exceptions/app.exception';
import { randomBytes, createHash } from 'crypto';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class TokenService {
  constructor(private prisma: PrismaService) {}

  async createToken(
    userId: string,
    name: string,
    scope: 'READ' | 'READ_WRITE' = 'READ',
    expiresAt?: Date,
  ) {
    const rawToken = `adh_${randomBytes(32).toString('hex')}`;
    const tokenHash = createHash('sha256').update(rawToken).digest('hex');

    const token = await this.prisma.accessToken.create({
      data: {
        userId,
        name,
        tokenHash,
        scope,
        expiresAt: expiresAt || null,
      },
    });

    // Only return plaintext token on creation
    return {
      id: token.id,
      name: token.name,
      scope: token.scope,
      expiresAt: token.expiresAt,
      createdAt: token.createdAt,
      plaintext: rawToken,
    };
  }

  async listTokens(userId: string) {
    return this.prisma.accessToken.findMany({
      where: { userId },
      select: {
        id: true,
        name: true,
        scope: true,
        expiresAt: true,
        lastUsedAt: true,
        isRevoked: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async revokeToken(userId: string, tokenId: string) {
    const token = await this.prisma.accessToken.findFirst({
      where: { id: tokenId, userId },
    });
    if (!token) {
      throw new AppException(ErrorCode.TOKEN_NOT_FOUND, HttpStatus.NOT_FOUND);
    }
    await this.prisma.accessToken.update({
      where: { id: tokenId },
      data: { isRevoked: true },
    });
    return { success: true };
  }

  async validateToken(rawToken: string) {
    const tokenHash = createHash('sha256').update(rawToken).digest('hex');
    const token = await this.prisma.accessToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!token || token.isRevoked) {
      return null;
    }

    if (token.expiresAt && token.expiresAt < new Date()) {
      return null;
    }

    // Update last used
    await this.prisma.accessToken.update({
      where: { id: token.id },
      data: { lastUsedAt: new Date() },
    });

    return {
      userId: token.userId,
      scope: token.scope,
      user: token.user,
    };
  }
}
