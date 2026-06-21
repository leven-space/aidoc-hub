import { randomUUID } from 'node:crypto';
import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import type { Request, Response } from 'express';
import { McpServer as SdkMcpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { McpServer, type McpExecuteOptions } from './mcp.server';

interface McpSession {
  transport: StreamableHTTPServerTransport;
  sdkServer: SdkMcpServer;
}

@Injectable()
export class McpHttpService implements OnModuleDestroy {
  private readonly logger = new Logger(McpHttpService.name);
  private readonly sessions = new Map<string, McpSession>();

  constructor(private mcpServer: McpServer) {}

  onModuleDestroy() {
    for (const session of this.sessions.values()) {
      void session.transport.close();
      void session.sdkServer.close();
    }
    this.sessions.clear();
  }

  async handleRequest(
    req: Request,
    res: Response,
    userId: string,
    options?: McpExecuteOptions,
  ) {
    const sessionIdHeader = req.headers['mcp-session-id'];
    const sessionId =
      typeof sessionIdHeader === 'string' ? sessionIdHeader : undefined;

    try {
      if (sessionId && this.sessions.has(sessionId)) {
        const session = this.sessions.get(sessionId)!;
        await session.transport.handleRequest(req, res, req.body);
        return;
      }

      if (!sessionId && isInitializeRequest(req.body)) {
        const sdkServer = this.createSdkServer(userId, options);
        const transport = new StreamableHTTPServerTransport({
          sessionIdGenerator: () => randomUUID(),
          enableJsonResponse: true,
          onsessioninitialized: (newSessionId) => {
            this.sessions.set(newSessionId, { transport, sdkServer });
          },
        });

        await sdkServer.connect(transport);
        await transport.handleRequest(req, res, req.body);

        transport.onclose = () => {
          const id = transport.sessionId;
          if (id) {
            this.sessions.delete(id);
          }
          void sdkServer.close();
        };
        return;
      }

      if (!res.headersSent) {
        res.status(400).json({
          jsonrpc: '2.0',
          error: {
            code: -32000,
            message: 'Bad Request: No valid session ID provided',
          },
          id: null,
        });
      }
    } catch (error) {
      this.logger.error(
        'MCP request failed',
        error instanceof Error ? error.stack : error,
      );
      if (!res.headersSent) {
        res.status(500).json({
          jsonrpc: '2.0',
          error: {
            code: -32603,
            message: 'Internal server error',
          },
          id: null,
        });
      }
    }
  }

  handleGet(_req: Request, res: Response) {
    res.status(405).set('Allow', 'POST').send('Method Not Allowed');
  }

  private createSdkServer(
    userId: string,
    options?: McpExecuteOptions,
  ): SdkMcpServer {
    const server = new SdkMcpServer({
      name: 'aidoc-hub',
      version: '1.0.0',
    });

    const runTool = async (name: string, args: Record<string, unknown>) => {
      const result = await this.mcpServer.executeTool(
        name,
        args,
        userId,
        options,
      );
      return {
        content: [
          { type: 'text' as const, text: JSON.stringify(result, null, 2) },
        ],
      };
    };

    server.registerTool(
      'list_workspaces',
      {
        description: 'List all workspaces the user has access to',
        inputSchema: {},
      },
      async () => runTool('list_workspaces', {}),
    );

    server.registerTool(
      'create_workspace',
      {
        description:
          'Create a new workspace (caller becomes ADMIN; PAT requires READ_WRITE)',
        inputSchema: {
          name: z.string().describe('Workspace name'),
          description: z.string().optional().describe('Optional description'),
        },
      },
      async ({ name, description }) =>
        runTool('create_workspace', { name, description }),
    );

    server.registerTool(
      'list_repositories',
      {
        description: 'List repositories in a workspace',
        inputSchema: { workspaceId: z.string().describe('Workspace ID') },
      },
      async ({ workspaceId }) => runTool('list_repositories', { workspaceId }),
    );

    server.registerTool(
      'create_repository',
      {
        description:
          'Create a repository in a workspace (requires workspace ADMIN; PAT requires READ_WRITE)',
        inputSchema: {
          workspaceId: z.string().describe('Workspace ID'),
          name: z.string().describe('Repository name'),
          description: z.string().optional().describe('Optional description'),
        },
      },
      async ({ workspaceId, name, description }) =>
        runTool('create_repository', { workspaceId, name, description }),
    );

    server.registerTool(
      'read_file',
      {
        description: 'Read file content from a repository',
        inputSchema: {
          workspaceId: z.string(),
          repoId: z.string(),
          filePath: z.string(),
          version: z.string().optional().describe('Optional version OID'),
        },
      },
      async ({ workspaceId, repoId, filePath, version }) =>
        runTool('read_file', { workspaceId, repoId, filePath, version }),
    );

    server.registerTool(
      'write_file',
      {
        description: 'Write file content to a repository (creates new version)',
        inputSchema: {
          workspaceId: z.string(),
          repoId: z.string(),
          filePath: z.string(),
          content: z.string(),
          message: z.string().describe('Commit message'),
        },
      },
      async ({ workspaceId, repoId, filePath, content, message }) =>
        runTool('write_file', {
          workspaceId,
          repoId,
          filePath,
          content,
          message,
        }),
    );

    server.registerTool(
      'get_version_history',
      {
        description: 'Get version history of a repository',
        inputSchema: {
          workspaceId: z.string(),
          repoId: z.string(),
        },
      },
      async ({ workspaceId, repoId }) =>
        runTool('get_version_history', { workspaceId, repoId }),
    );

    return server;
  }
}
