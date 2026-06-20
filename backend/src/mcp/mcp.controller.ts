import {
  Controller,
  Get,
  Post,
  Body,
  Req,
  Request,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Request as ExpressRequest, Response } from 'express';
import { McpHttpService } from './mcp-http.service';
import { McpServer } from './mcp.server';
import { McpAuthGuard } from '../common/guards/mcp-auth.guard';
import { SystemService } from '../system/system.service';

@Controller('mcp')
export class McpController {
  constructor(
    private mcpHttpService: McpHttpService,
    private mcpServer: McpServer,
    private systemService: SystemService,
  ) {}

  @Post()
  @UseGuards(McpAuthGuard)
  async handlePost(
    @Req() req: ExpressRequest,
    @Res({ passthrough: false }) res: Response,
    @Request() nestReq: any,
  ) {
    await this.mcpHttpService.handleRequest(req, res, nestReq.user.userId, {
      tokenScope: nestReq.user.tokenScope,
    });
  }

  @Get()
  @UseGuards(McpAuthGuard)
  handleGet(
    @Req() req: ExpressRequest,
    @Res({ passthrough: false }) res: Response,
  ) {
    this.mcpHttpService.handleGet(req, res);
  }

  @Get('tools')
  @UseGuards(McpAuthGuard)
  listTools() {
    return { tools: this.mcpServer.getTools() };
  }

  @Post('execute')
  @UseGuards(McpAuthGuard)
  async executeTool(
    @Request() req: any,
    @Body() body: { tool: string; arguments: Record<string, any> },
  ) {
    const result = await this.mcpServer.executeTool(
      body.tool,
      body.arguments,
      req.user.userId,
      { tokenScope: req.user.tokenScope },
    );
    return { result };
  }

  @Get('setup-snippets')
  @UseGuards(McpAuthGuard)
  async getSetupSnippets() {
    const config = await this.systemService.getPublicConfig();
    const baseUrl = (config.publicApiUrl || '').replace(/\/$/, '');
    const mcpUrl = `${baseUrl}/api/mcp`;

    return {
      mcpUrl,
      publicApiUrl: baseUrl,
      tools: this.mcpServer.getTools(),
      setupGuide: this.mcpServer.buildSetupGuide(mcpUrl),
    };
  }
}
