import { test, expect } from '@playwright/test';
import {
  registerUser,
  createPat,
  createWorkspace,
  createRepo,
  commitFiles,
  mcpExecute,
  mcpTools,
  apiRaw,
} from './helpers/api';

const password = 'Test123456';
const phone = `139${Date.now().toString().slice(-8)}`;

test.describe.configure({ mode: 'serial' });

let jwt: string;
let readPat: string;
let writePat: string;
let workspaceId: string;
let repoId: string;

test.describe('MCP API E2E', () => {
  test.beforeAll(async ({ request }) => {
    const session = await registerUser(request, phone, password);
    jwt = session.jwt;

    const ws = await createWorkspace(request, jwt, `MCP-E2E-${Date.now()}`);
    workspaceId = ws.id;

    const repo = await createRepo(request, jwt, workspaceId, 'MCP 测试仓库');
    repoId = repo.id;

    await commitFiles(
      request,
      jwt,
      workspaceId,
      repoId,
      [
        {
          filePath: 'index.html',
          content: '<html><body><h1>MCP Initial</h1></body></html>',
        },
      ],
      'MCP 初始提交',
    );

    const readToken = await createPat(request, jwt, 'E2E READ', 'READ');
    readPat = readToken.plaintext;

    const writeToken = await createPat(request, jwt, 'E2E WRITE', 'READ_WRITE');
    writePat = writeToken.plaintext;
  });

  test('MCP-01 无 Token 访问被拒绝', async ({ request }) => {
    const { status } = await apiRaw(request, 'GET', '/mcp/tools');
    expect(status).toBe(401);
  });

  test('MCP-02 JWT 可获取工具列表', async ({ request }) => {
    const { tools } = await mcpTools(request, jwt);
    const names = tools.map((t) => t.name);
    expect(names).toContain('list_workspaces');
    expect(names).toContain('list_repositories');
    expect(names).toContain('read_file');
    expect(names).toContain('write_file');
    expect(names).toContain('get_version_history');
    expect(names.length).toBe(5);
  });

  test('MCP-03 PAT 可获取工具列表', async ({ request }) => {
    const { tools } = await mcpTools(request, readPat);
    expect(tools.length).toBe(5);
  });

  test('MCP-04 list_workspaces 返回用户空间', async ({ request }) => {
    const workspaces = await mcpExecute<Array<{ id: string; name: string }>>(
      request,
      readPat,
      'list_workspaces',
    );
    expect(workspaces.some((w) => w.id === workspaceId)).toBe(true);
  });

  test('MCP-05 list_repositories 返回仓库列表', async ({ request }) => {
    const repos = await mcpExecute<Array<{ id: string; name: string }>>(
      request,
      readPat,
      'list_repositories',
      { workspaceId },
    );
    expect(repos.some((r) => r.id === repoId)).toBe(true);
  });

  test('MCP-06 read_file 读取文件内容', async ({ request }) => {
    const content = await mcpExecute<string>(request, readPat, 'read_file', {
      workspaceId,
      repoId,
      filePath: 'index.html',
    });
    expect(content).toContain('MCP Initial');
  });

  test('MCP-07 get_version_history 返回版本记录', async ({ request }) => {
    const history = await mcpExecute<Array<{ oid: string; message: string }>>(
      request,
      readPat,
      'get_version_history',
      { workspaceId, repoId },
    );
    expect(history.length).toBeGreaterThanOrEqual(1);
    expect(history[0].message).toContain('MCP 初始提交');
  });

  test('MCP-08 write_file 创建新版本', async ({ request }) => {
    const result = await mcpExecute<{ oid: string }>(request, writePat, 'write_file', {
      workspaceId,
      repoId,
      filePath: 'index.html',
      content: '<html><body><h1>MCP Written</h1></body></html>',
      message: 'MCP write_file 测试',
    });
    expect(result.oid).toBeTruthy();

    const readBack = await mcpExecute<string>(request, readPat, 'read_file', {
      workspaceId,
      repoId,
      filePath: 'index.html',
    });
    expect(readBack).toContain('MCP Written');
  });

  test('MCP-09 READ PAT 禁止 write_file', async ({ request }) => {
    const { status, body } = await apiRaw(request, 'POST', '/mcp/execute', readPat, {
      tool: 'write_file',
      arguments: {
        workspaceId,
        repoId,
        filePath: 'index.html',
        content: '<html></html>',
        message: 'should fail',
      },
    });
    expect(status).toBe(403);
    const err = body as { code?: string };
    expect(err.code).toBe('TOKEN_WRITE_PERMISSION_REQUIRED');
  });

  test('MCP-11 缺少 workspaceId 参数校验失败', async ({ request }) => {
    const { status } = await apiRaw(request, 'POST', '/mcp/execute', readPat, {
      tool: 'list_repositories',
      arguments: {},
    });
    expect(status).toBeGreaterThanOrEqual(400);
  });

  test('MCP-12 无效或越权文件路径被拒绝', async ({ request }) => {
    const { status, body } = await apiRaw(request, 'POST', '/mcp/execute', readPat, {
      tool: 'read_file',
      arguments: {
        workspaceId,
        repoId,
        filePath: '../secret.txt',
      },
    });
    expect(status).toBeGreaterThanOrEqual(400);
    const err = body as { code?: string };
    expect(['INVALID_FILE_PATH', 'FILE_NOT_FOUND']).toContain(err.code);
  });

  test('MCP-16 setup-snippets 返回接入信息', async ({ request }) => {
    const { status, body } = await apiRaw(request, 'GET', '/mcp/setup-snippets', readPat);
    expect(status).toBe(200);
    const data = (body as { data: { mcpUrl: string; tools: unknown[] } }).data;
    expect(data.mcpUrl).toContain('/api/mcp');
    expect(data.tools.length).toBe(5);
  });

  test('MCP-13 并行 read_file 全部成功', async ({ request }) => {
    const concurrency = 10;
    const results = await Promise.all(
      Array.from({ length: concurrency }, () =>
        mcpExecute<string>(request, readPat, 'read_file', {
          workspaceId,
          repoId,
          filePath: 'index.html',
        }),
      ),
    );
    expect(results.length).toBe(concurrency);
    for (const r of results) {
      expect(r).toContain('MCP Written');
    }
  });

  test('MCP-14 并行 write_file 不同文件全部成功', async ({ request }) => {
    const concurrency = 5;
    const writes = await Promise.all(
      Array.from({ length: concurrency }, (_, i) =>
        mcpExecute<{ oid: string }>(request, writePat, 'write_file', {
          workspaceId,
          repoId,
          filePath: `pages/page-${i}.html`,
          content: `<html><body>Page ${i}</body></html>`,
          message: `并发写入 page-${i}`,
        }),
      ),
    );
    expect(writes.every((w) => w.oid)).toBe(true);

    for (let i = 0; i < concurrency; i++) {
      const content = await mcpExecute<string>(request, readPat, 'read_file', {
        workspaceId,
        repoId,
        filePath: `pages/page-${i}.html`,
      });
      expect(content).toContain(`Page ${i}`);
    }
  });

  test('MCP-15 并行 list_workspaces 结果一致', async ({ request }) => {
    const concurrency = 20;
    const results = await Promise.all(
      Array.from({ length: concurrency }, () =>
        mcpExecute<Array<{ id: string }>>(request, readPat, 'list_workspaces'),
      ),
    );
    const baseline = JSON.stringify(results[0]);
    for (const r of results) {
      expect(JSON.stringify(r)).toBe(baseline);
    }
  });
});
