# Frontend Agent Guide (English)

> Root constraints: [`/AGENTS.en.md`](../AGENTS.en.md). Chinese version: [`AGENTS.md`](AGENTS.md).

## Directory roles

| Directory | Contains | Does not contain |
|-----------|----------|------------------|
| `pages/` | route-level pages | small reusable widgets |
| `components/` | shared UI | page-only business logic |
| `layouts/` | `MainLayout`, `AuthLayout` | business components |
| `contexts/` | global state (Auth) | page-local state |
| `services/` | all API calls | UI logic |
| `types/` | shared interfaces | — |
| `content/` | app version, changelog, features, tours | — |
| `theme/` | Ant Design tokens | — |

Page domains: `auth/`, `workspace/`, `repo/`, `upload/`, `version/`, `settings/`, `recycle/`, `help/`, `review/`.

## App content & help (`content/`)

> Release workflow: [`AGENTS.en.md`](../AGENTS.en.md) § Version & Documentation.

| File | Role |
|------|------|
| `content/version.ts` | `APP_VERSION`, `APP_RELEASE_DATE` |
| `content/changelog.ts` | version list → i18n keys |
| `content/features.ts` | feature cards on Features page |
| `content/tours.ts` | tour step defs, `startFeatureTour()` |

### When adding a feature (documentation duty)

1. **`features.ts`** — add `FeatureDef` (`id`, `category`, `introducedIn`; optional `tourId`, `routePattern`, `badge`)
2. **Bilingual i18n** — update **both** `zh-CN.json` and `en-US.json`:
   - `features.{id}.title` / `features.{id}.desc`
   - if guided: `features.{id}.guideHint`, `featureTour.{id}.*`
3. **Interactive tour (optional)** — register in `tours.ts`; add `data-tour="..."` on DOM; see `ReviewPage` / `ReviewToolbar`
4. **Routes** — features page at `/help/features`; never hardcode version strings — use `APP_VERSION`

### i18n namespaces (help-related)

| Prefix | Purpose |
|--------|---------|
| `nav.help*` | Header help menu |
| `help.*` | Features page common copy |
| `features.*` | per-feature title & description |
| `featureTour.*` | tour step title & description |
| `changelog.*` | changelog drawer (`items` is string[]; same count in both locales) |
| `tour.*` | global onboarding tour |

**Hard rule**: any new/changed key above must exist in **both** locale files.

## Routing

- **Single routes file**: `src/App.tsx`
- New page: `pages/{domain}/XxxPage.tsx` → add `Route` in `App.tsx`
- Layouts: `MainLayout` (authenticated) / `AuthLayout` (guest)
- Guards: `ProtectedRoute` / `GuestRoute`

## Components

- Function components + hooks only
- Export name matches filename: `UploadPage.tsx` → `export function UploadPage`
- Use `PageContainer` for page shell
- Ant Design + `@ant-design/icons`

## API layer

- All HTTP via `services/index.ts`; never `axios`/`fetch` in pages
- Details in `services/api.ts`

## Forbidden

- Duplicate code blocks in one file
- Splitting `App.tsx` routes without explicit request
- `@/` path alias (project uses relative paths)
- New state management libraries
- `localStorage` in components except tour completion (see `OnboardingTour.tsx`)
- Hardcoded user-visible strings (use i18n, **both languages**)
- Hardcoded app version (use `APP_VERSION` from `content/version.ts`)

## Verification

```bash
cd frontend
pnpm lint
pnpm build
```
