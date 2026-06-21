# Backend Agent Guide

> 根约束见 `/AGENTS.md`。本文件仅描述 NestJS 后端约定。

## 模块结构模板

每个业务模块至少包含：

```
{module}/
├── {module}.module.ts
├── {module}.controller.ts   # 有 HTTP 接口时
├── {module}.service.ts
└── dto/                     # 需要 class-validator 时
    └── xxx.dto.ts
```

纯服务模块（如 `git/`）可无 controller。参考：`repo/`、`auth/`。

## 命名与文件

- 类名 PascalCase：`RepoService`、`RepoController`
- 文件名 kebab-case：`repo.service.ts`、`commit-file.dto.ts`
- DTO 类后缀 `Dto`：`CommitFileDto`
- 测试：`{name}.service.spec.ts`

## Import 约定

- **使用相对路径**，无 path alias
- 同模块：`./repo.service`
- 兄弟模块：`../git/git.service`
- 共享：`../common/prisma/prisma.service`
- Nest 装饰器：`@nestjs/common` 等

## Controller 规范

```typescript
@Controller('workspaces/:workspaceId/repos')
@UseGuards(JwtAuthGuard)
export class RepoController {
  constructor(private repoService: RepoService) {}
  // 薄 controller：参数解析 + 调用 service
}
```

- 全局前缀 `api` 已在 `main.ts` 设置，controller 路径不含 `api`
- 权限校验在 service 层调用 `WorkspaceService.checkMembership/checkEditor/checkAdmin`
- 请求体优先用 `dto/` + `class-validator`，与 `ValidationPipe` 配合

## Service 规范

- 注入 `PrismaService`、其他 module 的 Service
- 业务异常用 NestJS 内置异常：`NotFoundException`、`ForbiddenException`、`ConflictException`
- 不 catch 后吞掉错误；需要转换时 rethrow 或包装

## common/ 横切关注点

| 目录 | 用途 | 注册位置 |
|------|------|----------|
| `filters/all-exceptions.filter.ts` | 统一错误响应 | `main.ts` 全局 |
| `interceptors/transform.interceptor.ts` | `{ success, data }` 包装 | `main.ts` 全局 |
| `middlewares/http-logger.middleware.ts` | 请求日志 | `app.module.ts` |
| `middlewares/audit.middleware.ts` | 写操作审计 | `app.module.ts` |
| `guards/` | 共享 guard | controller `@UseGuards` |
| `prisma/` | `@Global()` PrismaModule | `app.module.ts` |

新 guard/filter 放 `common/`，模块专属 guard 放模块内（如 `auth/jwt-auth.guard.ts`）。

## 数据库

- Schema：`prisma/schema.prisma`
- 迁移/同步：`npx prisma db push`（开发）或 `prisma migrate`
- 改 schema 后同步检查 frontend `types/index.ts`

## MCP 模块（`src/mcp/`）

> 产品边界详见根目录 [`AGENTS.md`](../AGENTS.md)「MCP 能力边界」；英文 [`AGENTS.en.md`](../AGENTS.en.md) § MCP capability boundary。

### 设计原则

- **工作空间**：`list_workspaces` 发现已有空间；`create_workspace` 创建新空间（PAT 需 READ_WRITE）
- **仓库**：`list_repositories` 发现已有仓库；`create_repository` 创建新仓库（需 **ADMIN**，PAT 需 READ_WRITE）
- **仓库内文件操作**：`read_file`、`write_file`（单文件）、`get_version_history`

### 修改 MCP 时的必改文件

1. `mcp.server.ts` — `getTools()` 与 `executeTool()` switch
2. `mcp-http.service.ts` — `createSdkServer()` 内 `registerTool`（与上表一致）
3. `frontend/e2e/mcp-api.spec.ts` — 工具列表与权限用例
4. 根目录 `AGENTS.md` / `AGENTS.en.md`、README / README_zh-CN.md

### 权限

- 所有工具：JWT 或 `adh_` PAT，经 `McpAuthGuard`
- `write_file`：`options.tokenScope !== 'READ'` + `WorkspaceService.checkEditor`
- 其余工具：`checkMembership` 或 `findAll`（list 场景）

## 禁止事项

- 在 controller 写业务逻辑超过 5 行
- 新建与 NestJS 平行的 HTTP 层（如裸 Express router）
- 在 `git/` 外直接使用 isomorphic-git
- 返回未包装的原始 Prisma 敏感字段（密码 hash 等）
- 添加全局 middleware 而不在 `app.module.ts` 注册
- **擅自新增 MCP 工具**（未评审的管理类接口）

## 验证

```bash
cd backend
pnpm lint
pnpm build
pnpm test
```
