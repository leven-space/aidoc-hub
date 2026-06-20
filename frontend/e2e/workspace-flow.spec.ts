import { test, expect, type Page } from '@playwright/test';

const phone = `138${Date.now().toString().slice(-8)}`;
const password = 'Test123456';
const workspaceName = `E2E Workspace ${Date.now()}`;
const repoName = `E2E Repo ${Date.now()}`;

async function completeTour(page: Page) {
  await page.waitForTimeout(700);
  const tour = page.locator('.ant-tour');
  if (!(await tour.isVisible({ timeout: 3000 }).catch(() => false))) {
    return;
  }
  for (let i = 0; i < 6; i++) {
    if (!(await tour.isVisible().catch(() => false))) {
      break;
    }
    const finish = tour.getByRole('button', { name: 'Finish' });
    if (await finish.isVisible().catch(() => false)) {
      await finish.click();
      break;
    }
    await tour.getByRole('button', { name: 'Next' }).click();
  }
  await expect(tour).not.toBeVisible({ timeout: 5000 });
}

async function submitModal(page: Page, buttonName = 'Create') {
  await completeTour(page);
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: buttonName, exact: true }).click();
}

test.describe.configure({ mode: 'serial' });

test.describe('AI Doc Hub 主流程', () => {
  test('注册登录 → 创建空间 → 创建仓库 → 上传文件', async ({ page }) => {
    await page.goto('/register');
    await expect(page.getByRole('heading', { name: 'Sign Up' })).toBeVisible();
    await page.getByPlaceholder('Phone Number').fill(phone);
    await page.getByPlaceholder('Password', { exact: true }).fill(password);
    await page.getByPlaceholder('Confirm Password').fill(password);
    await page.getByRole('button', { name: 'Sign Up' }).click();

    await expect(page.getByRole('heading', { name: 'Workspaces' })).toBeVisible({ timeout: 15000 });
    await completeTour(page);

    await page.getByRole('button', { name: 'Create Workspace' }).click();
    await page.getByPlaceholder('e.g. Product Docs Team').fill(workspaceName);
    await submitModal(page);

    await expect(page.getByRole('heading', { name: workspaceName })).toBeVisible({ timeout: 15000 });
    await completeTour(page);

    await page.getByRole('button', { name: 'Create Repository' }).click();
    await page.getByPlaceholder('e.g. Product Manual').fill(repoName);
    await submitModal(page);

    await expect(page.getByRole('heading', { name: repoName })).toBeVisible({ timeout: 15000 });

    await page.getByRole('button', { name: 'Commit New Version' }).first().click();
    await expect(page.getByRole('heading', { name: 'Commit New Version' })).toBeVisible();

    const htmlContent = '<html><body><h1>E2E Test</h1></body></html>';
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'index.html',
      mimeType: 'text/html',
      buffer: Buffer.from(htmlContent),
    });

    await page.getByPlaceholder('Describe this update').fill('E2E initial commit');
    await page.getByRole('button', { name: 'Commit New Version' }).click();

    await expect(page.getByText('HTML Preview')).toBeVisible({ timeout: 15000 });
  });

  test('登录已有账号并访问 Token 管理', async ({ page }) => {
    await page.goto('/login');
    await page.getByPlaceholder('Phone Number').fill(phone);
    await page.getByPlaceholder('Password').fill(password);
    await page.getByRole('button', { name: 'Sign In' }).click();

    await expect(page.getByRole('heading', { name: 'Workspaces' })).toBeVisible({ timeout: 15000 });

    await page.goto('/settings/tokens');
    await expect(page.getByRole('heading', { name: 'Access Token Management' })).toBeVisible();
    await page.getByRole('button', { name: 'Create Token' }).click();
    await expect(page.getByText('Create Access Token')).toBeVisible();
  });
});
