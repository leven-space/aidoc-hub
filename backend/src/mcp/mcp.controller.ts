import { Controller, Post, Get, Body, UseGuards, Request } from '@nestjs/common';
import { McpServer } from './mcp.server';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('mcp')
@UseGuards(JwtAuthGuard)
export class McpController {
  constructor(private mcpServer: McpServer) {}

  @Get('tools')
  listTools() {
    return { tools: this.mcpServer.getTools() };
  }

  @Post('execute')
  async executeTool(
    @Request() req: any,
    @Body() body: { tool: string; arguments: Record<string, any> },
  ) {
    const result = await this.mcpServer.executeTool(
      body.tool,
      body.arguments,
      req.user.userId,
    );
    return { result };
  }
}
