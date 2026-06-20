import { test, expect } from '@playwright/test';

const phone = `138${Date.now().toString().slice(-8)}`;
const password = 'Test123456';

test.describe.configure({ mode: 'serial' });

test.describe('AI Doc Hub 主流程', () => {
  test('注册登录 → 创建空间 → 创建仓库 → 上传文件', async ({ page }) => {
    // 注册
    await page.goto('/register');
    await expect(page.getByRole('heading', { name: '注册' })).toBeVisible();
    await page.getByPlaceholder('手机号').fill(phone);
    await page.getByPlaceholder('密码', { exact: true }).fill(password);
    await page.getByPlaceholder('确认密码').fill(password);
    await page.getByRole('button', { name: /注\s*册/ }).click();

    // 应跳转到工作空间列表
    await expect(page.getByRole('heading', { name: '工作空间' })).toBeVisible({ timeout: 15000 });

    // 创建团队空间
    await page.getByRole('button', { name: /创建空间/ }).click();
    await page.getByPlaceholder('例如：产品文档团队').fill('E2E 测试空间');
    await page.getByRole('button', { name: /^创\s*建$/ }).click();

    // 进入空间详情
    await expect(page.getByRole('heading', { name: 'E2E 测试空间' })).toBeVisible({ timeout: 15000 });

    // 创建仓库
    await page.getByRole('button', { name: /创建仓库/ }).click();
    await page.getByPlaceholder('例如：产品说明书').fill('E2E 测试仓库');
    await page.getByRole('button', { name: /^创\s*建$/ }).click();

    // 进入仓库详情
    await expect(page.getByRole('heading', { name: 'E2E 测试仓库' })).toBeVisible({ timeout: 15000 });

    // 提交新版本
    await page.getByRole('button', { name: /提交新版本/ }).first().click();
    await expect(page.getByRole('heading', { name: '提交新版本' })).toBeVisible();

    // 上传 HTML 文件
    const htmlContent = '<html><body><h1>E2E Test</h1></body></html>';
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'index.html',
      mimeType: 'text/html',
      buffer: Buffer.from(htmlContent),
    });

    await page.getByPlaceholder('描述本次更新的内容').fill('E2E 初始提交');
    await page.getByRole('button', { name: /提交新版本/ }).click();

    // 回到仓库详情，应能看到预览
    await expect(page.getByText('HTML 预览')).toBeVisible({ timeout: 15000 });
  });

  test('登录已有账号并访问 Token 管理', async ({ page }) => {
    await page.goto('/login');
    await page.getByPlaceholder('手机号').fill(phone);
    await page.getByPlaceholder('密码').fill(password);
    await page.getByRole('button', { name: /登\s*录/ }).click();

    await expect(page.getByRole('heading', { name: '工作空间' })).toBeVisible({ timeout: 15000 });

    await page.goto('/settings/tokens');
    await expect(page.getByRole('heading', { name: 'Access Token 管理' })).toBeVisible();
    await page.getByRole('button', { name: /创建 Token/ }).click();
    await expect(page.getByText('创建 Access Token')).toBeVisible();
  });
});
