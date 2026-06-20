import { Injectable, HttpStatus } from '@nestjs/common';
import { AppException, ErrorCode } from '../common/exceptions/app.exception';
import { WorkspaceService } from '../workspace/workspace.service';
import { RepoService } from '../repo/repo.service';
import { GitService } from '../git/git.service';

export interface McpTool {
  name: string;
  description: string;
  inputSchema: Record<string, any>;
}

export interface McpExecuteOptions {
  tokenScope?: 'READ' | 'READ_WRITE';
}

@Injectable()
export class McpServer {
  constructor(
    private workspaceService: WorkspaceService,
    private repoService: RepoService,
    private gitService: GitService,
  ) {}

  getTools(): McpTool[] {
    return [
      {
        name: 'list_workspaces',
        description: '列出当前用户有权限访问的所有工作空间',
        inputSchema: { type: 'object', properties: {} },
      },
      {
        name: 'list_repositories',
        description: '列出指定工作空间下的所有仓库',
        inputSchema: {
          type: 'object',
          properties: {
            workspaceId: { type: 'string', description: '工作空间 ID' },
          },
          required: ['workspaceId'],
        },
      },
      {
        name: 'read_file',
        description: '读取仓库中指定路径的文件内容，可选 version 指定版本 OID',
        inputSchema: {
          type: 'object',
          properties: {
            workspaceId: { type: 'string', description: '工作空间 ID' },
            repoId: { type: 'string', description: '仓库 ID' },
            filePath: { type: 'string', description: '文件路径' },
            version: { type: 'string', description: '可选，版本 OID' },
          },
          required: ['workspaceId', 'repoId', 'filePath'],
        },
      },
      {
        name: 'write_file',
        description:
          '写入文件并创建新版本（需要工作空间 EDITOR 权限，PAT 需 READ_WRITE 范围）',
        inputSchema: {
          type: 'object',
          properties: {
            workspaceId: { type: 'string', description: '工作空间 ID' },
            repoId: { type: 'string', description: '仓库 ID' },
            filePath: { type: 'string', description: '文件路径' },
            content: { type: 'string', description: '文件内容' },
            message: { type: 'string', description: '提交说明' },
          },
          required: ['workspaceId', 'repoId', 'filePath', 'content', 'message'],
        },
      },
      {
        name: 'get_version_history',
        description: '获取仓库的版本历史记录',
        inputSchema: {
          type: 'object',
          properties: {
            workspaceId: { type: 'string', description: '工作空间 ID' },
            repoId: { type: 'string', description: '仓库 ID' },
          },
          required: ['workspaceId', 'repoId'],
        },
      },
    ];
  }

  buildSetupGuide(mcpUrl: string, tokenPlaceholder = 'adh_YOUR_TOKEN'): string {
    const tools = this.getTools();
    const toolDocs = tools
      .map((tool) => {
        const schema = JSON.stringify(tool.inputSchema, null, 2);
        return `### ${tool.name}\n${tool.description}\n\n参数 Schema：\n\`\`\`json\n${schema}\n\`\`\``;
      })
      .join('\n\n');

    const cursorJson = JSON.stringify(
      {
        mcpServers: {
          'aidoc-hub': {
            url: mcpUrl,
            headers: { Authorization: `Bearer ${tokenPlaceholder}` },
          },
        },
      },
      null,
      2,
    );

    const claudeJson = JSON.stringify(
      {
        mcpServers: {
          'aidoc-hub': {
            type: 'http',
            url: mcpUrl,
            headers: { Authorization: `Bearer ${tokenPlaceholder}` },
          },
        },
      },
      null,
      2,
    );

    return `# AI Doc Hub MCP 接入指南

请根据以下信息，帮我在当前 AI 编程工具（Cursor / Claude Code / Codex 等）中完成 MCP 服务器配置，并验证连接可用。

---

## 一、连接信息

| 项 | 值 |
|---|---|
| MCP HTTP URL | ${mcpUrl} |
| 鉴权方式 | HTTP Header \`Authorization: Bearer <Token>\` |
| Personal Access Token | ${tokenPlaceholder} |

Token 在 AI Doc Hub「个人设置 → Token 管理」中创建，以 \`adh_\` 开头。只读 Token 无法调用 write_file。

---

## 二、请执行的任务

1. 识别我当前使用的 AI 工具（Cursor / Claude Code / Codex / 其他）
2. 写入正确的 MCP 配置文件并填入上述 URL 与 Token
3. 重启或刷新 MCP 连接
4. 调用 tools/list，确认能返回 list_workspaces 等工具
5. 如有报错，根据下方接口说明排查

---

## 三、各客户端配置参考

### Cursor（~/.cursor/mcp.json）

\`\`\`json
${cursorJson}
\`\`\`

### Claude Code（项目根目录 .mcp.json 或 claude mcp add）

\`\`\`json
${claudeJson}
\`\`\`

### Codex（~/.codex/config.toml）

\`\`\`toml
[mcp_servers.aidoc-hub]
url = "${mcpUrl}"

# 环境变量 AIDOC_HUB_TOKEN=${tokenPlaceholder}
\`\`\`

---

## 四、MCP 协议与 HTTP 接口说明

AI Doc Hub 使用 **HTTP Streamable MCP**（Model Context Protocol），兼容标准 MCP 客户端。

### 主端点（推荐）

- **POST** \`${mcpUrl}\`
- Header: \`Authorization: Bearer ${tokenPlaceholder}\`
- Content-Type: \`application/json\`
- 协议：MCP Streamable HTTP（initialize → tools/list → tools/call）

### 备用 REST 端点

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | ${mcpUrl}/tools | 列出可用工具及参数 Schema |
| POST | ${mcpUrl}/execute | 执行工具，Body: \`{ "tool": "工具名", "arguments": { ... } }\` |

### 鉴权说明

- 支持 JWT（Bearer）或 Personal Access Token（\`adh_\` 前缀）
- \`write_file\` 工具要求 PAT 范围为 READ_WRITE，且用户在工作空间中为 EDITOR 或 ADMIN

---

## 五、可用 MCP 工具

${toolDocs}

---

## 六、典型调用流程

1. \`list_workspaces\` → 获取 workspaceId
2. \`list_repositories\` → 传入 workspaceId，获取 repoId
3. \`read_file\` / \`write_file\` / \`get_version_history\` → 传入 workspaceId + repoId 操作文件

配置完成后，请告诉我是否已成功连接并列出工具。`;
  }

  async executeTool(
    toolName: string,
    args: Record<string, any>,
    userId: string,
    options?: McpExecuteOptions,
  ): Promise<any> {
    switch (toolName) {
      case 'list_workspaces':
        return this.workspaceService.findAll(userId);

      case 'list_repositories':
        return this.repoService.listRepos(args.workspaceId, userId);

      case 'read_file':
        await this.workspaceService.checkMembership(args.workspaceId, userId);
        return this.gitService.readFileAtVersion(
          args.workspaceId,
          args.repoId,
          args.filePath,
          args.version,
        );

      case 'write_file':
        if (options?.tokenScope === 'READ') {
          throw new AppException(
            ErrorCode.TOKEN_WRITE_PERMISSION_REQUIRED,
            HttpStatus.FORBIDDEN,
          );
        }
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
        throw new AppException(
          ErrorCode.VALIDATION_FAILED,
          HttpStatus.BAD_REQUEST,
        );
    }
  }
}
