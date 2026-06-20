/**
 * One-off script: capture README screenshots from local dev server.
 * Usage: node scripts/capture-readme-screenshots.mjs
 */
import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

const API = 'http://localhost:3000/api';
const BASE = 'http://localhost:5173';
const OUT = path.join(process.cwd(), 'docs/images');
const password = 'Screenshot123';
const phone = `135${Date.now().toString().slice(-8)}`;

async function api(method, urlPath, body, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API}${urlPath}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json();
  if (!res.ok || json.success === false) {
    throw new Error(`${urlPath} failed: ${JSON.stringify(json)}`);
  }
  return json.data;
}

async function main() {
  await mkdir(OUT, { recursive: true });

  const auth = await api('POST', '/auth/register', { phone, password });
  const jwt = auth.accessToken;
  const ws = await api('POST', '/workspaces', { name: 'Product Docs' }, jwt);
  const repo = await api('POST', `/workspaces/${ws.id}/repos`, { name: 'Product Manual' }, jwt);
  await api(
    'POST',
    `/workspaces/${ws.id}/repos/${repo.id}/commits`,
    {
      files: [
        {
          filePath: 'index.html',
          content:
            '<html><head><style>body{font-family:system-ui;background:#f8fafc;margin:0;padding:40px}h1{color:#4f46e5} .card{background:#fff;padding:24px;border-radius:12px;box-shadow:0 2px 8px rgba(0,0,0,.08)}</style></head><body><div class="card"><h1>AI Doc Hub</h1><p>HTML asset version management for teams.</p></div></body></html>',
        },
      ],
      message: 'Initial release',
    },
    jwt,
  );
  await api(
    'POST',
    `/workspaces/${ws.id}/repos/${repo.id}/commits`,
    {
      files: [
        {
          filePath: 'index.html',
          content:
            '<html><head><style>body{font-family:system-ui;background:#f8fafc;margin:0;padding:40px}h1{color:#16a34a} .card{background:#fff;padding:24px;border-radius:12px;box-shadow:0 2px 8px rgba(0,0,0,.08)}</style></head><body><div class="card"><h1>Version 2</h1><p>Updated product documentation.</p></div></body></html>',
        },
      ],
      message: 'Update styling and content',
    },
    jwt,
  );

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.addInitScript(() => {
    localStorage.setItem('aidoc-hub.locale', 'en-US');
    localStorage.setItem(`onboarding.completed.${'pending'}`, 'true');
  });

  await page.goto(`${BASE}/login`);
  await page.getByPlaceholder('Phone Number').fill(phone);
  await page.getByPlaceholder('Password').fill(password);
  await page.getByRole('button', { name: 'Sign In' }).click();
  await page.waitForURL('**/');

  const userId = auth.user.id;
  await page.evaluate((id) => {
    localStorage.setItem(`onboarding.completed.${id}`, 'true');
  }, userId);
  await page.reload();

  const shots = [
    { name: 'workspaces', url: '/' },
    { name: 'repo-preview', url: `/workspaces/${ws.id}/repos/${repo.id}` },
    { name: 'version-history', url: `/workspaces/${ws.id}/repos/${repo.id}/versions` },
    { name: 'upload', url: `/workspaces/${ws.id}/repos/${repo.id}/upload` },
    { name: 'mcp-settings', url: '/settings/mcp' },
    { name: 'token-settings', url: '/settings/tokens' },
  ];

  for (const shot of shots) {
    await page.goto(`${BASE}${shot.url}`);
    await page.waitForTimeout(1200);
    await page.screenshot({ path: path.join(OUT, `${shot.name}.png`), fullPage: false });
    console.log(`saved ${shot.name}.png`);
  }

  await browser.close();
  console.log('Done:', OUT);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
