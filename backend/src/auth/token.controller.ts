import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { TokenService } from './token.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { CreateTokenDto } from './dto/auth.dto';

@Controller('tokens')
@UseGuards(JwtAuthGuard)
export class TokenController {
  constructor(private tokenService: TokenService) {}

  @Post()
  create(@Request() req: any, @Body() body: CreateTokenDto) {
    return this.tokenService.createToken(
      req.user.userId,
      body.name,
      body.scope,
      body.expiresAt ? new Date(body.expiresAt) : undefined,
    );
  }

  @Get()
  list(@Request() req: any) {
    return this.tokenService.listTokens(req.user.userId);
  }

  @Delete(':id')
  revoke(@Request() req: any, @Param('id') id: string) {
    return this.tokenService.revokeToken(req.user.userId, id);
  }
}
