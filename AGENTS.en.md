# AI Doc Hub — Agent Harness (English)

> Primary constraint document for AI coding tools (Cursor, Claude Code, Copilot, etc.). Read before modifying code. Chinese version: [`AGENTS.md`](AGENTS.md).

## Project Overview

Enterprise HTML asset version management and collaboration platform. Monorepo: `backend/` (NestJS API) + `frontend/` (React SPA).

## Tech Stack (do not replace without approval)

| Layer | Tech | Version |
|-------|------|---------|
| Runtime | Node.js | >= 18 |
| Package manager | pnpm workspaces | >= 8 |
| Backend | NestJS 11 | see `backend/package.json` |
| ORM | Prisma 5 + PostgreSQL 18 | schema in `backend/prisma/` |
| Git engine | isomorphic-git | only in `backend/src/git/` |
| Frontend | React 19 + Vite 8 | see `frontend/package.json` |
| UI | Ant Design 6 | theme in `frontend/src/theme/` |
| Routing | React Router 7 | routes **only** in `frontend/src/App.tsx` |
| HTTP | Axios | instance in `frontend/src/services/api.ts` |
| E2E | Playwright | repo root |

**Forbidden**: Redux/MobX, Next.js, direct DB access from frontend, alternate ORM/router libraries.

## Module Boundaries

```
aidoc-hub/
├── backend/src/       # auth, workspace, repo, git, version, share, mcp, audit, common
└── frontend/src/
    ├── pages/         # route-level pages by domain
    ├── components/    # shared UI
    ├── layouts/       # MainLayout, AuthLayout
    ├── contexts/      # AuthContext
    ├── services/      # all API calls
    ├── types/         # shared TS types (index.ts)
    ├── content/       # app version, changelog, feature catalog, tour registry (update on release)
    └── theme/         # Ant Design theme
```

| Need | Backend | Frontend |
|------|---------|----------|
| New REST API | module controller/service | `services/index.ts` |
| New page | — | `pages/{domain}/XxxPage.tsx` + `App.tsx` route |
| Shared UI | — | `components/` |
| DB change | `backend/prisma/schema.prisma` | sync `frontend/src/types/` |
| AI/MCP | `backend/src/mcp/` (**create workspace/repo + discover + in-repo file R/W**; see MCP boundary in root AGENTS) | MCP settings page |
| Feature docs / release notes | — | `frontend/src/content/` + bilingual i18n + root `CHANGELOG.md` |

## AI Coding Rules

1. **Minimal diff** — only change files required for the task
2. **No duplicate blocks** — never paste a second copy of imports/components/functions at file end
3. **Follow existing patterns** — read sibling files before writing new code
4. **No over-abstraction** — inline one-off logic
5. **No new dependencies** without clear reason
6. **Do not commit** `dist/`, `node_modules/`, `.env`
7. **Always verify** — run `pnpm lint` and `pnpm build`
8. **Bilingual UI copy** — user-facing strings **must** exist in both `zh-CN.json` and `en-US.json` (see Version & Documentation)
9. **Type safety** — use `frontend/src/types/`; backend DTOs in `{module}/dto/`
10. **Auth** — APIs must use `@UseGuards(JwtAuthGuard)` or service-layer workspace role checks

## Current Version

| Item | Value |
|------|-------|
| **App version** | `1.0.0` |
| **Release date** | `2026-06-21` |
| **GitHub Release** | [v1.0.0](https://github.com/leven-space/aidoc-hub/releases/tag/v1.0.0) |
| **Single source of truth** | `frontend/src/content/version.ts` → `APP_VERSION` / `APP_RELEASE_DATE` |

> After each release, update this table, all `package.json` `version` fields, `CHANGELOG.md`, and GitHub Release (**bilingual CN + EN**).

## Version & Documentation (required reading for AI)

In-app feature descriptions, changelog, and interactive guides are first-class product surfaces. **Do not ship features or releases without updating the files below.**

### File checklist

| Purpose | Path | Notes |
|---------|------|-------|
| Version | `frontend/src/content/version.ts` | `APP_VERSION`, `APP_RELEASE_DATE` |
| Changelog index | `frontend/src/content/changelog.ts` | points to i18n keys; append per release |
| Feature catalog | `frontend/src/content/features.ts` | cards, `introducedIn`, optional `tourId` |
| Tour registry | `frontend/src/content/tours.ts` | multi-tour steps, `startFeatureTour()` |
| Chinese copy | `frontend/src/i18n/locales/zh-CN.json` | `help.*`, `features.*`, `featureTour.*`, `changelog.*` |
| English copy | `frontend/src/i18n/locales/en-US.json` | **same keys as zh-CN; no missing keys** |
| Repo changelog | `CHANGELOG.md` | Keep a Changelog format |
| Features page | `frontend/src/pages/help/FeaturesPage.tsx` | route `/help/features` |
| Changelog drawer | `frontend/src/components/ChangelogDrawer.tsx` | opened from Header help menu |
| Help entry | `frontend/src/layouts/MainLayout.tsx` | dropdown: tour / features / changelog |

### In-app help behavior (fixed — do not revert without explicit request)

- **No auto-popup** for changelog or What's New; users open from Header **Help** menu
- **Onboarding tour** (`onboarding`): may still auto-show once on first login (`tour.completed.onboarding.{userId}`)
- **Feature tours**: started from Features page or in-page help button; target DOM needs `data-tour="..."`
- Header shows `Help v{APP_VERSION}`

### Release checklist

1. Update `frontend/src/content/version.ts`
2. Append entry in `changelog.ts`; add `changelog.vXXX.*` in **both** locale files
3. Add feature to `features.ts`; add `features.{id}.*` in **both** locale files
4. For interactive guide: register steps in `tours.ts` + `data-tour` on page + bilingual `featureTour.*`
5. Update root `CHANGELOG.md` (bilingual sections recommended)
6. Sync `version` in root, `frontend/`, and `backend/` `package.json`
7. Create **bilingual** GitHub Release (CN + EN title and body)
8. Update the **Current Version** table in this file and `AGENTS.md`

### GitHub Release format

- **Title**: `vX.Y.Z — English Title / 中文标题`
- **Body**: **简体中文** section → `---` → **English** section; aligned with `CHANGELOG.md`
- **Do not** publish single-language releases

### v1.0.0 feature catalog (`features.ts`)

Workspaces, HTML preview, **Review Mode** (with review tour), version history, upload/commit, share, global search, recycle bin, MCP, PAT, audit logs.

## MCP capability boundary (required reading for AI)

The MCP layer lets AI agents **create workspaces and repositories, discover resources, and read/write files inside repositories**. Implementation: `backend/src/mcp/`.

### Provided tools (7 — do not add/remove without product approval)

| Tool | Capability | Permission notes |
|------|------------|------------------|
| `list_workspaces` | List workspaces the user can access (id, name, metadata) | workspace member |
| `create_workspace` | Create a new workspace (caller becomes ADMIN) | PAT **READ_WRITE** |
| `list_repositories` | List repositories in a workspace | workspace member |
| `create_repository` | Create a repository in a workspace | **ADMIN** and PAT **READ_WRITE** |
| `read_file` | Read a file in a repo; optional `version` OID | workspace member |
| `write_file` | Write a single file and create a new commit | **EDITOR+** and PAT **READ_WRITE** |
| `get_version_history` | Linear Git commit history for a repo | workspace member |

Typical flow: `create_workspace` → `create_repository` → `write_file` / `read_file` (or use `list_*` to discover existing resources).

### Deliberately not provided (do not implement as MCP tools)

| Not provided | Notes |
|--------------|-------|
| Member / role management | REST + Web UI only |
| Share links, recycle bin, audit | REST + Web UI only |
| Version restore | REST/UI only; not exposed via MCP |
| Batch / folder upload | MCP single-file `write_file` only |
| Delete workspace or repository | Not exposed via MCP |

> New MCP tools require explicit product approval. Sync: `mcp.server.ts`, `mcp-http.service.ts`, E2E `mcp-api.spec.ts`, README/AGENTS **bilingual docs**.

### Code touchpoints

- Tool defs & execution: `backend/src/mcp/mcp.server.ts`
- HTTP Streamable registration: `backend/src/mcp/mcp-http.service.ts`
- Auth: `McpAuthGuard` + `tokenScope` (`create_workspace` / `create_repository` / `write_file` require READ_WRITE)
- Setup guide text: `McpServer.buildSetupGuide()` (copied from MCP settings page)

## Layered docs

- Backend: `backend/AGENTS.md`
- Frontend: `frontend/AGENTS.en.md` (content/ & i18n details)
- Chinese: `AGENTS.md`, `frontend/AGENTS.md`
- Cursor rules: `.cursor/rules/*.mdc`

## Verification

```bash
pnpm lint
pnpm build
cd backend && pnpm test   # if backend changed
```

## Commits & PRs

Conventional Commits — see `CONTRIBUTING.md`.

```
<type>(<scope>): <subject>
type: feat | fix | docs | style | refactor | test | chore | perf
scope: backend | frontend | mcp | prisma | ci | deps
```
