import { Injectable, HttpStatus } from '@nestjs/common';
import { AppException, ErrorCode } from '../common/exceptions/app.exception';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../common/prisma/prisma.service';
import { InitializeSetupDto, UpdateSystemConfigDto } from './dto/system.dto';

export const SYSTEM_CONFIG_KEYS = {
  PUBLIC_API_URL: 'publicApiUrl',
  SITE_NAME: 'siteName',
  REGISTRATION_ENABLED: 'registrationEnabled',
  INITIALIZED_AT: 'initializedAt',
} as const;

export interface PublicSystemConfig {
  publicApiUrl: string;
  siteName: string;
  registrationEnabled: boolean;
}

@Injectable()
export class SystemService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async isInitialized(): Promise<boolean> {
    const count = await this.prisma.user.count();
    return count > 0;
  }

  async getSetupStatus() {
    return { initialized: await this.isInitialized() };
  }

  async initialize(dto: InitializeSetupDto) {
    if (await this.isInitialized()) {
      throw new AppException(
        ErrorCode.SYSTEM_ALREADY_INITIALIZED,
        HttpStatus.CONFLICT,
      );
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const now = new Date().toISOString();

    const user = await this.prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          phone: dto.phone,
          passwordHash,
          name: dto.name || `Admin_${dto.phone.slice(-4)}`,
          systemRole: 'SYSTEM_ADMIN',
        },
      });

      await tx.workspace.create({
        data: {
          name: `${created.name}'s Space`,
          ownerId: created.id,
          members: {
            create: {
              userId: created.id,
              role: 'ADMIN',
            },
          },
        },
      });

      const configs = [
        {
          key: SYSTEM_CONFIG_KEYS.PUBLIC_API_URL,
          value: dto.publicApiUrl.replace(/\/$/, ''),
        },
        { key: SYSTEM_CONFIG_KEYS.SITE_NAME, value: dto.siteName },
        { key: SYSTEM_CONFIG_KEYS.REGISTRATION_ENABLED, value: 'true' },
        { key: SYSTEM_CONFIG_KEYS.INITIALIZED_AT, value: now },
      ];

      for (const config of configs) {
        await tx.systemConfig.create({
          data: { ...config, updatedBy: created.id },
        });
      }

      return created;
    });

    const accessToken = this.jwtService.sign({ sub: user.id });
    return {
      accessToken,
      user: {
        id: user.id,
        phone: user.phone,
        name: user.name,
        avatar: user.avatar,
        systemRole: user.systemRole,
      },
    };
  }

  async isRegistrationEnabled(): Promise<boolean> {
    if (!(await this.isInitialized())) {
      return false;
    }
    const value = await this.getConfigValue(
      SYSTEM_CONFIG_KEYS.REGISTRATION_ENABLED,
    );
    return value !== 'false';
  }

  async getPublicConfig(): Promise<PublicSystemConfig> {
    const [publicApiUrl, siteName, registrationEnabled] = await Promise.all([
      this.getConfigValue(SYSTEM_CONFIG_KEYS.PUBLIC_API_URL),
      this.getConfigValue(SYSTEM_CONFIG_KEYS.SITE_NAME),
      this.getConfigValue(SYSTEM_CONFIG_KEYS.REGISTRATION_ENABLED),
    ]);

    return {
      publicApiUrl: publicApiUrl || '',
      siteName: siteName || 'AI Doc Hub',
      registrationEnabled: registrationEnabled !== 'false',
    };
  }

  async updateConfig(userId: string, dto: UpdateSystemConfigDto) {
    const updates: Array<{ key: string; value: string }> = [];

    if (dto.publicApiUrl !== undefined) {
      updates.push({
        key: SYSTEM_CONFIG_KEYS.PUBLIC_API_URL,
        value: dto.publicApiUrl.replace(/\/$/, ''),
      });
    }
    if (dto.siteName !== undefined) {
      updates.push({ key: SYSTEM_CONFIG_KEYS.SITE_NAME, value: dto.siteName });
    }
    if (dto.registrationEnabled !== undefined) {
      updates.push({
        key: SYSTEM_CONFIG_KEYS.REGISTRATION_ENABLED,
        value: String(dto.registrationEnabled),
      });
    }

    for (const update of updates) {
      await this.prisma.systemConfig.upsert({
        where: { key: update.key },
        create: { key: update.key, value: update.value, updatedBy: userId },
        update: { value: update.value, updatedBy: userId },
      });
    }

    return this.getPublicConfig();
  }

  async getConfigValue(key: string): Promise<string | null> {
    const config = await this.prisma.systemConfig.findUnique({
      where: { key },
    });
    return config?.value ?? null;
  }

  async requireSystemAdmin(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { systemRole: true },
    });
    if (!user || user.systemRole !== 'SYSTEM_ADMIN') {
      throw new AppException(
        ErrorCode.SYSTEM_ADMIN_REQUIRED,
        HttpStatus.FORBIDDEN,
      );
    }
  }
}
