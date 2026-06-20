# README Screenshots

These images are used in `README.md` and `README_zh-CN.md`.

## Files

| File | Page |
|------|------|
| `workspaces.png` | Workspace list |
| `repo-preview.png` | Repository detail + HTML preview |
| `version-history.png` | Version history timeline |
| `upload.png` | Commit new version / upload |
| `mcp-settings.png` | MCP integration settings |
| `token-settings.png` | Personal access token management |

## Regenerate

Requires local dev servers (`pnpm dev`) and Playwright browsers:

```bash
node scripts/capture-readme-screenshots.mjs
```

Viewport: 1440×900. Locale: `en-US`. Onboarding tour is skipped for clean captures.
