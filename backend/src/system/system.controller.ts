import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { SystemService } from './system.service';
import { InitializeSetupDto, UpdateSystemConfigDto } from './dto/system.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SystemAdminGuard } from '../common/guards/system-admin.guard';

@Controller()
export class SystemController {
  constructor(private systemService: SystemService) {}

  @Get('setup/status')
  getSetupStatus() {
    return this.systemService.getSetupStatus();
  }

  @Post('setup/initialize')
  initialize(@Body() dto: InitializeSetupDto) {
    return this.systemService.initialize(dto);
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
