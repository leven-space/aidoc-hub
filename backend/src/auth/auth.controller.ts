import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Request,
  Res,
} from '@nestjs/common';
import { Throttle, SkipThrottle } from '@nestjs/throttler';
import type { Response } from 'express';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RegisterDto, LoginDto } from './dto/auth.dto';
import {
  setAccessTokenCookie,
  clearAccessTokenCookie,
} from '../common/utils/auth-cookie.util';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async register(
    @Body() body: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.register(body);
    setAccessTokenCookie(res, result.accessToken);
    return result;
  }

  @Post('login')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async login(
    @Body() body: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(body);
    setAccessTokenCookie(res, result.accessToken);
    return result;
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @SkipThrottle()
  logout(@Res({ passthrough: true }) res: Response) {
    clearAccessTokenCookie(res);
    return { success: true };
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @SkipThrottle()
  getProfile(@Request() req: any) {
    return this.authService.getProfile(req.user.userId);
  }
}
