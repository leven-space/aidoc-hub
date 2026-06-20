import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Request,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Response } from 'express';
import { SystemService } from './system.service';
import { InitializeSetupDto, UpdateSystemConfigDto } from './dto/system.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SystemAdminGuard } from '../common/guards/system-admin.guard';
import { setAccessTokenCookie } from '../common/utils/auth-cookie.util';

@Controller()
export class SystemController {
  constructor(private systemService: SystemService) {}

  @Get('setup/status')
  getSetupStatus() {
    return this.systemService.getSetupStatus();
  }

  @Post('setup/initialize')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async initialize(
    @Body() dto: InitializeSetupDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.systemService.initialize(dto);
    setAccessTokenCookie(res, result.accessToken);
    return result;
  }

  @Get('system/config')
  @UseGuards(JwtAuthGuard)
  getConfig() {
    return this.systemService.getPublicConfig();
  }

  @Patch('system/config')
  @UseGuards(JwtAuthGuard, SystemAdminGuard)
  updateConfig(@Request() req: any, @Body() dto: UpdateSystemConfigDto) {
    return this.systemService.updateConfig(req.user.userId, dto);
  }
}
