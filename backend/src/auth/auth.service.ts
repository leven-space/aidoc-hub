import { Injectable, HttpStatus } from '@nestjs/common';
import { AppException, ErrorCode } from '../common/exceptions/app.exception';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../common/prisma/prisma.service';
import { SystemService } from '../system/system.service';
import { maskPhone } from '../common/utils/phone.util';

export interface RegisterDto {
  phone: string;
  password: string;
  name?: string;
}

export interface LoginDto {
  phone: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  user: {
    id: string;
    phone: string;
    name: string;
    avatar: string;
    systemRole: 'USER' | 'SYSTEM_ADMIN';
  };
}

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private systemService: SystemService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResponse> {
    if (!(await this.systemService.isInitialized())) {
      throw new AppException(
        ErrorCode.SYSTEM_NOT_INITIALIZED,
        HttpStatus.BAD_REQUEST,
      );
    }

    if (!(await this.systemService.isRegistrationEnabled())) {
      throw new AppException(
        ErrorCode.REGISTRATION_DISABLED,
        HttpStatus.BAD_REQUEST,
      );
    }

    if (!/^1[3-9]\d{9}$/.test(dto.phone)) {
      throw new AppException(
        ErrorCode.INVALID_PHONE_FORMAT,
        HttpStatus.BAD_REQUEST,
      );
    }

    if (!/^(?=.*[A-Za-z])(?=.*\d).{6,}$/.test(dto.password)) {
      throw new AppException(
        ErrorCode.PASSWORD_TOO_WEAK,
        HttpStatus.BAD_REQUEST,
      );
    }

    const existing = await this.prisma.user.findUnique({
      where: { phone: dto.phone },
    });
    if (existing) {
      throw new AppException(
        ErrorCode.PHONE_ALREADY_REGISTERED,
        HttpStatus.BAD_REQUEST,
      );
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        phone: dto.phone,
        passwordHash,
        name: dto.name || `User_${dto.phone.slice(-4)}`,
      },
    });

    await this.prisma.workspace.create({
      data: {
        name: `${user.name}'s Space`,
        ownerId: user.id,
        members: {
          create: {
            userId: user.id,
            role: 'ADMIN',
          },
        },
      },
    });

    const token = this.generateToken(user.id);
    return {
      accessToken: token,
      user: this.toUserResponse(user),
    };
  }

  async login(dto: LoginDto): Promise<AuthResponse> {
    const user = await this.prisma.user.findUnique({
      where: { phone: dto.phone },
    });
    if (!user) {
      throw new AppException(
        ErrorCode.INVALID_CREDENTIALS,
        HttpStatus.UNAUTHORIZED,
      );
    }

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) {
      throw new AppException(
        ErrorCode.INVALID_CREDENTIALS,
        HttpStatus.UNAUTHORIZED,
      );
    }

    const token = this.generateToken(user.id);
    return {
      accessToken: token,
      user: this.toUserResponse(user),
    };
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        phone: true,
        name: true,
        avatar: true,
        systemRole: true,
        createdAt: true,
      },
    });
    if (!user) {
      throw new AppException(ErrorCode.USER_NOT_FOUND, HttpStatus.UNAUTHORIZED);
    }
    return {
      ...user,
      phone: maskPhone(user.phone),
    };
  }

  private toUserResponse(user: {
    id: string;
    phone: string;
    name: string;
    avatar: string;
    systemRole: 'USER' | 'SYSTEM_ADMIN';
  }) {
    return {
      id: user.id,
      phone: user.phone,
      name: user.name,
      avatar: user.avatar,
      systemRole: user.systemRole,
    };
  }

  private generateToken(userId: string): string {
    return this.jwtService.sign({ sub: userId });
  }
}
