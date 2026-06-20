import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { AppException } from '../common/exceptions/app.exception';
import { SystemService } from './system.service';
import { PrismaService } from '../common/prisma/prisma.service';

describe('SystemService', () => {
  let service: SystemService;

  const prismaMock = {
    user: {
      count: jest.fn(),
      create: jest.fn(),
    },
    workspace: {
      create: jest.fn(),
    },
    systemConfig: {
      create: jest.fn(),
      findUnique: jest.fn(),
      upsert: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const jwtServiceMock = {
    sign: jest.fn().mockReturnValue('jwt-token'),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SystemService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: JwtService, useValue: jwtServiceMock },
      ],
    }).compile();

    service = module.get(SystemService);
  });

  it('returns setup status', async () => {
    prismaMock.user.count.mockResolvedValue(0);
    await expect(service.getSetupStatus()).resolves.toEqual({
      initialized: false,
    });
  });

  it('rejects initialize when already initialized', async () => {
    prismaMock.user.count.mockResolvedValue(1);
    await expect(
      service.initialize({
        phone: '13800138000',
        password: 'secret1',
        siteName: 'AI Doc Hub',
        publicApiUrl: 'http://localhost:5173',
      }),
    ).rejects.toBeInstanceOf(AppException);
  });
});
