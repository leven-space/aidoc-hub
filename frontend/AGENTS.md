# Frontend Agent Guide

> 根约束见 `/AGENTS.md`。本文件仅描述 React 前端约定。

## 目录职责

| 目录 | 放什么 | 不放什么 |
|------|--------|----------|
| `pages/` | 路由级页面组件 | 可复用小组件 |
| `components/` | 跨页面复用 UI | 页面级业务逻辑 |
| `layouts/` | `MainLayout`、`AuthLayout` | 业务组件 |
| `contexts/` | 全局状态（目前仅 Auth） | 页面局部 state |
| `services/` | 所有 API 调用 | UI 逻辑 |
| `types/` | 共享 interface/type | 组件 props（可内联） |
| `theme/` | Ant Design theme token | — |

页面按业务域分子目录：`auth/`、`workspace/`、`repo/`、`upload/`、`version/`、`settings/`、`recycle/`、`help/`、`review/`。

## 应用内容与帮助（`content/`）

> 发版与功能说明细则见根目录 [`AGENTS.md`](../AGENTS.md)「版本与文档」；英文见 [`AGENTS.en.md`](../AGENTS.en.md)、[`frontend/AGENTS.en.md`](AGENTS.en.md)。

| 文件 | 职责 |
|------|------|
| `content/version.ts` | `APP_VERSION`、`APP_RELEASE_DATE` |
| `content/changelog.ts` | 版本列表 → i18n key |
| `content/features.ts` | 功能说明页卡片数据 |
| `content/tours.ts` | Tour 步骤定义、`startFeatureTour()` |

### 新增功能时的前端文档义务

1. **`features.ts`** — 增加 `FeatureDef`（`id`、`category`、`introducedIn`；可选 `tourId`、`routePattern`、`badge`）
2. **双语 i18n** — 同时在 `zh-CN.json` 与 `en-US.json` 添加：
   - `features.{id}.title` / `features.{id}.desc`
   - 若有引导：`features.{id}.guideHint`、`featureTour.{id}.*`
3. **交互引导（可选）** — 在 `tours.ts` 注册；页面 DOM 加 `data-tour="..."`；Review 模式参考 `ReviewPage` + `ReviewToolbar`
4. **新页面路由** — 功能说明页固定 `/help/features`；不要在 page 内硬编码版本号，用 `APP_VERSION`

### i18n 命名空间（帮助相关）

| 前缀 | 用途 |
|------|------|
| `nav.help*` | Header 帮助菜单 |
| `help.*` | 功能说明页通用文案 |
| `features.*` | 各功能标题与描述 |
| `featureTour.*` | 各 Tour 步骤标题与描述 |
| `changelog.*` | 更新日志 Drawer（`items` 为 string[]，两语言条目数一致） |
| `tour.*` | 全局新手引导（onboarding） |

**硬性要求**：新增或修改上述 key 时，**两个 locale 文件必须同步**，禁止只改中文。

## 路由

- **唯一路由文件**：`src/App.tsx`
- 新页面必须：创建 `pages/{domain}/XxxPage.tsx` → 在 `App.tsx` 添加 `Route`
- 布局：`MainLayout`（需登录）/ `AuthLayout`（访客）
- 守卫：`ProtectedRoute` / `GuestRoute`

## 组件规范

```typescript
// ✅ 标准页面组件
export function UploadPage() {
  const { workspaceId, repoId } = useParams<{ workspaceId: string; repoId: string }>();
  const [loading, setLoading] = useState(false);
  // useEffect 拉数 → services API → Ant Design UI
}
```

- 使用函数组件 + hooks，不用 class 组件
- 导出名与文件名一致：`UploadPage.tsx` → `export function UploadPage`
- 页面容器统一用 `PageContainer`（breadcrumb + title）
- UI 组件用 Ant Design，图标用 `@ant-design/icons`

## API 层

```typescript
// pages 中这样调用
import { repoApi } from '../../services';

repoApi.get(workspaceId, repoId).then(setRepo).catch(...);
```

- HTTP 细节只在 `services/api.ts`（拦截器、token、401 跳转）
- 域 API 在 `services/index.ts`：`authApi`、`workspaceApi`、`repoApi` 等
- **禁止**在 page/component 中 `axios.get` 或 `fetch`

## 类型

- 共享类型：`import type { Repository } from '../../types'`
- API 响应类型已在 `types/index.ts` 定义，勿重复声明
- 后端新增字段时同步更新 `types/index.ts`

## 样式

- 全局样式：`styles/global.css`
- 组件内优先 Ant Design props；临时样式用 inline `style={{}}`
- 不引入 CSS Modules / Tailwind / styled-components（除非项目已统一迁移）

## 错误处理模式

```typescript
message.error(err instanceof Error ? err.message : '操作失败');
```

与现有页面保持一致。

## 禁止事项

- **文件内重复代码块**（import、组件、函数各只能有一份）
- 新建 `router/` 或拆分 `App.tsx` 路由（除非明确要求重构）
- 使用 `@/` path alias（项目实际用相对路径）
- 引入新状态管理库
- 在 component 直接访问 `localStorage`（token 由 `api.ts` / `AuthContext` 管理；Tour 完成态除外，见 `OnboardingTour.tsx`）
- 硬编码用户可见文案（必须走 i18n，且中英双语）
- 硬编码应用版本号（使用 `content/version.ts` 的 `APP_VERSION`）

## 验证

```bash
cd frontend
pnpm lint
pnpm build
```
