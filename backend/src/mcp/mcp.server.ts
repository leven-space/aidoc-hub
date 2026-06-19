import { Injectable } from '@nestjs/common';
import { WorkspaceService } from '../workspace/workspace.service';
import { GitService } from '../git/git.service';

export interface McpTool {
  name: string;
  description: string;
  inputSchema: Record<string, any>;
}

@Injectable()
export class McpServer {
  constructor(
    private workspaceService: WorkspaceService,
    private gitService: GitService,
  ) {}

  getTools(): McpTool[] {
    return [
      {
        name: 'list_workspaces',
        description: 'List all workspaces the user has access to',
        inputSchema: { type: 'object', properties: {} },
      },
      {
        name: 'list_repositories',
        description: 'List repositories in a workspace',
        inputSchema: {
          type: 'object',
          properties: {
            workspaceId: { type: 'string', description: 'Workspace ID' },
          },
          required: ['workspaceId'],
        },
      },
      {
        name: 'read_file',
        description: 'Read file content from a repository',
        inputSchema: {
          type: 'object',
          properties: {
            workspaceId: { type: 'string' },
            repoId: { type: 'string' },
            filePath: { type: 'string' },
            version: { type: 'string', description: 'Optional version OID' },
          },
          required: ['workspaceId', 'repoId', 'filePath'],
        },
      },
      {
        name: 'write_file',
        description: 'Write file content to a repository (creates new version)',
        inputSchema: {
          type: 'object',
          properties: {
            workspaceId: { type: 'string' },
            repoId: { type: 'string' },
            filePath: { type: 'string' },
            content: { type: 'string' },
            message: { type: 'string', description: 'Commit message' },
          },
          required: ['workspaceId', 'repoId', 'filePath', 'content', 'message'],
        },
      },
      {
        name: 'get_version_history',
        description: 'Get version history of a repository',
        inputSchema: {
          type: 'object',
          properties: {
            workspaceId: { type: 'string' },
            repoId: { type: 'string' },
          },
          required: ['workspaceId', 'repoId'],
        },
      },
    ];
  }

  async executeTool(toolName: string, args: Record<string, any>, userId: string): Promise<any> {
    switch (toolName) {
      case 'list_workspaces':
        return this.workspaceService.findAll(userId);

      case 'list_repositories':
        return this.workspaceService.checkMembership(args.workspaceId, userId).then(() => {
          // Import prisma to list repos
          return { workspaceId: args.workspaceId, message: 'Use REST API for full repo list' };
        });

      case 'read_file':
        await this.workspaceService.checkMembership(args.workspaceId, userId);
        return this.gitService.readFileAtVersion(
          args.workspaceId,
          args.repoId,
          args.filePath,
          args.version,
        );

      case 'write_file':
        await this.workspaceService.checkEditor(args.workspaceId, userId);
        return this.gitService.commitFiles(
          args.workspaceId,
          args.repoId,
          [{ filePath: args.filePath, content: args.content }],
          args.message,
          userId,
        );

      case 'get_version_history':
        await this.workspaceService.checkMembership(args.workspaceId, userId);
        return this.gitService.getHistory(args.workspaceId, args.repoId);

      default:
        throw new Error(`Unknown tool: ${toolName}`);
    }
  }
}
