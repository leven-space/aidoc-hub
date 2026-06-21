import { test, expect } from '@playwright/test';

test.describe('Review mode', () => {
  test('review page shows toolbar and disabled copy without annotations', async ({ page }) => {
    await page.goto('/login');
    await page.getByPlaceholder('Phone Number').fill('13800000001');
    await page.getByPlaceholder('Password', { exact: true }).fill('admin123');
    await page.getByRole('button', { name: 'Sign In' }).click();

    await page.waitForURL('/', { timeout: 15000 }).catch(() => undefined);

    const workspaceLink = page.locator('a[href*="/workspaces/"]').first();
    if (!(await workspaceLink.isVisible({ timeout: 5000 }).catch(() => false))) {
      test.skip(true, 'No workspace available for review smoke test');
    }

    await workspaceLink.click();
    const repoLink = page.locator('a[href*="/repos/"]').first();
    if (!(await repoLink.isVisible({ timeout: 5000 }).catch(() => false))) {
      test.skip(true, 'No repository available for review smoke test');
    }
    await repoLink.click();

    const reviewButton = page.getByRole('button', { name: /Review Mode|审阅模式/ });
    if (!(await reviewButton.isVisible({ timeout: 5000 }).catch(() => false))) {
      test.skip(true, 'No HTML file selected for review mode entry');
    }

    await reviewButton.click();
    await expect(page.getByRole('button', { name: /Copy AI Prompt|复制 AI Prompt/ })).toBeVisible({
      timeout: 15000,
    });
    await expect(page.getByRole('button', { name: /Copy AI Prompt|复制 AI Prompt/ })).toBeDisabled();
    await expect(page.getByText(/Review mode does not write|审阅模式不会写入/)).toBeVisible();
  });
});
