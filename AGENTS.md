# AI Doc Hub — Agent Harness

> 本文件是 AI 编码工具（Cursor、Claude Code、Copilot 等）的**首要约束文档**。修改代码前必须先阅读，并遵守分层 AGENTS 与 `.cursor/rules/`。

## 项目定位

企业级 HTML 资产版本管理与协作平台。Monorepo：`backend/`（NestJS API）+ `frontend/`（React SPA）。

## 技术栈（禁止擅自替换）

| 层 | 技术 | 版本约束 |
|----|------|----------|
| 运行时 | Node.js | >= 18 |
| 包管理 | pnpm workspaces | >= 8 |
| 后端框架 | NestJS 11 | 见 `backend/package.json` |
| ORM | Prisma 5 + PostgreSQL 18 | schema 在 `backend/prisma/` |
| 版本控制引擎 | isomorphic-git | 仅 `backend/src/git/` |
| 前端框架 | React 19 + Vite 8 | 见 `frontend/package.json` |
| UI | Ant Design 6 | 主题在 `frontend/src/theme/` |
| 路由 | React Router 7 | 路由**仅**定义在 `frontend/src/App.tsx` |
| HTTP | Axios | 实例在 `frontend/src/services/api.ts` |
| E2E | Playwright | 根目录 |

**禁止**：引入 Redux/MobX、换用 Next.js、在 frontend 直接访问数据库、新建 ORM/路由库。

## 模块边界

```
aidoc-hub/
├── backend/src/
│   ├── auth/          # JWT、PAT、登录注册
│   ├── workspace/     # 工作空间与成员角色
│   ├── repo/          # 仓库 CRUD、文件提交入口
│   ├── git/           # Git 底层（无 controller）
│   ├── version/       # 版本历史与 diff
│   ├── share/         # 分享链接
│   ├── mcp/           # MCP 协议
│   ├── audit/         # 审计日志查询
│   └── common/        # guards、filters、interceptors、middlewares、prisma
└── frontend/src/
    ├── pages/         # 按业务域分子目录，一页一文件
    ├── components/    # 跨页面复用组件
    ├── layouts/       # 布局壳
    ├── contexts/      # React Context
    ├── services/      # API 层（禁止在 page 内写 fetch/axios）
    ├── types/         # 共享 TS 类型（单一入口 index.ts）
    └── theme/         # Ant Design 主题
```

### 新增功能放哪里

| 需求 | 后端 | 前端 |
|------|------|------|
| 新 REST 接口 | 已有模块加 controller/service；跨域逻辑放 `common/` | 在 `services/index.ts` 加 API 方法 |
| 新页面 | — | `pages/{domain}/XxxPage.tsx` + 在 `App.tsx` 注册路由 |
| 共享 UI | — | `components/` |
| 数据库变更 | `backend/prisma/schema.prisma` + `prisma db push` | 同步更新 `frontend/src/types/` |
| AI/MCP 能力 | `backend/src/mcp/` | 通常无需前端 |

### 跨层调用规则

- Frontend → Backend：仅通过 `services/*Api`，baseURL `/api`
- Backend 模块间：通过 NestJS `imports` + 注入 Service，**禁止**跨模块直接 import controller
- Git 操作：业务模块调用 `GitService`，不直接操作 isomorphic-git

## AI 编码硬性约束

1. **最小改动**：只改完成任务所需的文件，不顺手重构无关代码
2. **禁止重复粘贴**：不得在文件末尾追加第二份 import/组件/函数（参考 `UploadPage.tsx` 历史事故）
3. **遵循现有模式**：先读同目录已有文件，复制其结构与命名，不发明新架构
4. **不新建多余抽象**：单处使用的逻辑内联，不抽 one-liner helper
5. **不擅自加依赖**：`package.json` 变更需有明确理由
6. **不提交生成物**：`dist/`、`node_modules/`、`.env` 不入库
7. **不跳过验证**：改完后运行 `pnpm lint` 与相关 `build`/`test`
8. **中文 UI 文案**：面向用户的字符串用中文，与现有页面一致
9. **类型安全**：优先用 `frontend/src/types/` 已有类型；后端 DTO 放 `{module}/dto/`
10. **权限**：后端接口必须 `@UseGuards(JwtAuthGuard)` 或在 service 层校验 workspace 角色

## 代码风格速查

| 项 | 后端 | 前端 |
|----|------|------|
| 文件名 | kebab-case + 角色后缀 `repo.service.ts` | PascalCase `UploadPage.tsx` |
| 导出 | NestJS class export | `export function XxxPage()` |
| import | 相对路径，无 `@/` alias | 相对路径，不用 `@/`（虽 vite 配了 alias） |
| 格式化 | Prettier（backend eslint 集成） | ESLint recommended |
| 响应格式 | 全局 `TransformInterceptor` 包装 `{ success, data }` | `api.ts` 已解包，直接用 `data` |

## 提交与 PR

遵循 [Conventional Commits](https://www.conventionalcommits.org/)，详见 `CONTRIBUTING.md`。

```
<type>(<scope>): <subject>

type: feat | fix | docs | style | refactor | test | chore | perf
scope: backend | frontend | mcp | prisma | ci | deps
```

示例：`feat(frontend): add folder upload mode on upload page`

**禁止**：`update`、`fix bug`、`WIP` 等模糊信息。

## 验证清单（改完必做）

```bash
pnpm lint                    # 全仓 lint
pnpm build                   # 全仓构建
cd backend && pnpm test      # 后端单测（若改了 backend）
```

## 分层文档

- 后端细则：`backend/AGENTS.md`
- 前端细则：`frontend/AGENTS.md`
- Cursor 规则：`.cursor/rules/*.mdc`（自动注入会话）
