import { test, expect, type Page } from '@playwright/test';
import {
  registerUser,
  createWorkspace,
  createRepo,
  commitFiles,
  getVersionHistory,
  restoreVersion,
  getVersionDiff,
  readFile,
  mcpExecute,
} from './helpers/api';

const password = 'Test123456';
const phone = `137${Date.now().toString().slice(-8)}`;

const v1Html = '<html><body><h1>Version One</h1></body></html>';
const v2Html = '<html><body><h1>Version Two</h1></body></html>';
const v3Html = '<html><body><h1>Version Three</h1></body></html>';

test.describe.configure({ mode: 'serial' });

let jwt: string;
let workspaceId: string;
let repoId: string;
let v1Oid: string;
let v3Oid: string;

test.describe('版本升级与回退 API/MCP', () => {
  test.beforeAll(async ({ request }) => {
    const session = await registerUser(request, phone, password);
    jwt = session.jwt;

    const ws = await createWorkspace(request, jwt, `Version-E2E-${Date.now()}`);
    workspaceId = ws.id;

    const repo = await createRepo(request, jwt, workspaceId, 'Version Test Repo');
    repoId = repo.id;

    const c1 = await commitFiles(request, jwt, workspaceId, repoId, [
      { filePath: 'index.html', content: v1Html },
    ], 'E2E Version 1');
    v1Oid = c1.oid;

    await commitFiles(request, jwt, workspaceId, repoId, [
      { filePath: 'index.html', content: v2Html },
    ], 'E2E Version 2');

    const c3 = await commitFiles(request, jwt, workspaceId, repoId, [
      { filePath: 'index.html', content: v3Html },
    ], 'E2E Version 3');
    v3Oid = c3.oid;
  });

  test('VER-API-01 连续提交生成多版本历史', async ({ request }) => {
    const history = await getVersionHistory(request, jwt, workspaceId, repoId);
    expect(history.length).toBeGreaterThanOrEqual(3);
    expect(history[0].message).toContain('E2E Version 3');
    expect(history[0].version).toBeGreaterThan(history[2].version);
    expect(history[2].message).toContain('E2E Version 1');
  });

  test('VER-API-02 REST 读取指定历史版本内容', async ({ request }) => {
    const v1Content = await readFile(request, jwt, workspaceId, repoId, 'index.html', v1Oid);
    expect(v1Content).toContain('Version One');

    const latest = await readFile(request, jwt, workspaceId, repoId, 'index.html');
    expect(latest).toContain('Version Three');
  });

  test('VER-API-03 MCP read_file 指定 version OID', async ({ request }) => {
    const v1Content = await mcpExecute<string>(request, jwt, 'read_file', {
      workspaceId,
      repoId,
      filePath: 'index.html',
      version: v1Oid,
    });
    expect(v1Content).toContain('Version One');

    const v3Content = await mcpExecute<string>(request, jwt, 'read_file', {
      workspaceId,
      repoId,
      filePath: 'index.html',
      version: v3Oid,
    });
    expect(v3Content).toContain('Version Three');
  });

  test('VER-API-04 两版本 Diff 对比', async ({ request }) => {
    const diff = await getVersionDiff(
      request,
      jwt,
      workspaceId,
      repoId,
      'index.html',
      v1Oid,
      v3Oid,
    );
    expect(diff.fromContent).toContain('Version One');
    expect(diff.toContent).toContain('Version Three');
    expect(diff.diff.some((d) => d.type === 'remove' || d.type === 'add')).toBe(true);
  });

  test('VER-API-05 恢复到历史版本并验证内容回退', async ({ request }) => {
    const restored = await restoreVersion(request, jwt, workspaceId, repoId, v1Oid);
    expect(restored.oid).toBeTruthy();

    const latest = await readFile(request, jwt, workspaceId, repoId, 'index.html');
    expect(latest).toContain('Version One');
    expect(latest).not.toContain('Version Three');

    const history = await getVersionHistory(request, jwt, workspaceId, repoId);
    expect(history.length).toBeGreaterThanOrEqual(4);
    expect(history[0].message).toContain('Restore');
  });

  test('VER-API-06 MCP get_version_history 反映恢复后版本链', async ({ request }) => {
    const history = await mcpExecute<Array<{ oid: string; message: string }>>(
      request,
      jwt,
      'get_version_history',
      { workspaceId, repoId },
    );
    expect(history.length).toBeGreaterThanOrEqual(4);
    const latestContent = await mcpExecute<string>(request, jwt, 'read_file', {
      workspaceId,
      repoId,
      filePath: 'index.html',
    });
    expect(latestContent).toContain('Version One');
  });
});

async function completeTour(page: Page) {
  await page.waitForTimeout(700);
  const tour = page.locator('.ant-tour');
  if (!(await tour.isVisible({ timeout: 3000 }).catch(() => false))) {
    return;
  }
  for (let i = 0; i < 6; i++) {
    if (!(await tour.isVisible().catch(() => false))) break;
    const finish = tour.getByRole('button', { name: 'Finish' });
    if (await finish.isVisible().catch(() => false)) {
      await finish.click();
      break;
    }
    await tour.getByRole('button', { name: 'Next' }).click();
  }
}

test.describe('版本升级与回退 UI', () => {
  test('VER-UI-01 UI 二次提交升版并恢复历史版本', async ({ page, request }) => {
    const uiPhone = `136${Date.now().toString().slice(-8)}`;
    const session = await registerUser(request, uiPhone, password);
    const ws = await createWorkspace(request, session.jwt, `Version-UI-${Date.now()}`);
    const repo = await createRepo(request, session.jwt, ws.id, 'UI Version Repo');
    await commitFiles(request, session.jwt, ws.id, repo.id, [
      { filePath: 'index.html', content: v1Html },
    ], 'UI Version 1');

    await page.goto('/login');
    await page.getByPlaceholder('Phone Number').fill(uiPhone);
    await page.getByPlaceholder('Password').fill(password);
    await page.getByRole('button', { name: 'Sign In' }).click();
    await expect(page.getByRole('heading', { name: 'Workspaces' })).toBeVisible({ timeout: 15000 });
    await completeTour(page);

    await page.goto(`/workspaces/${ws.id}/repos/${repo.id}/upload`);
    await expect(page.getByRole('heading', { name: 'Commit New Version' })).toBeVisible();
    await page.locator('input[type="file"]').setInputFiles({
      name: 'index.html',
      mimeType: 'text/html',
      buffer: Buffer.from(v2Html),
    });
    await page.getByPlaceholder('Describe this update').fill('UI Version 2');
    await page.getByRole('button', { name: 'Commit New Version' }).click();

    await page.goto(`/workspaces/${ws.id}/repos/${repo.id}/versions`);
    await expect(page.getByRole('heading', { name: 'Version History' })).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('UI Version 2')).toBeVisible();
    await expect(page.getByText('UI Version 1')).toBeVisible();

    const v1Card = page.locator('.ant-card').filter({ hasText: 'UI Version 1' }).first();
    await v1Card.getByRole('button', { name: 'Restore This Version' }).click();
    await page.getByRole('button', { name: 'OK' }).click();

    await page.goto(`/workspaces/${ws.id}/repos/${repo.id}`);
    await expect(page.getByText('HTML Preview')).toBeVisible({ timeout: 15000 });
    const preview = page.frameLocator('iframe').locator('h1');
    await expect(preview).toHaveText('Version One', { timeout: 15000 });
  });
});
