# Contributing to AI Doc Hub

感谢参与贡献。本文档面向人类开发者与 AI 工具，定义协作规范。

## 开发环境

```bash
pnpm install
docker compose up -d postgres
cd backend && npx prisma db push
pnpm dev
```

要求：Node.js >= 18，pnpm >= 8。

## 项目结构

```
aidoc-hub/
├── AGENTS.md           # AI 工具首要约束（必读）
├── backend/AGENTS.md   # 后端细则
├── frontend/AGENTS.md  # 前端细则
├── backend/            # NestJS API
├── frontend/           # React SPA
└── .cursor/rules/      # Cursor 自动规则
```

## 分支策略

- `main`：稳定分支
- 功能分支：`feat/xxx`、`fix/xxx`、`docs/xxx`
- 从 `main` 拉取，完成后提 PR

## 代码规范

### 通用

1. 先读同目录已有代码，遵循现有模式
2. 最小改动原则，不做无关重构
3. 改完执行 `pnpm lint` 和 `pnpm build`
4. 用户可见文案使用中文

### 后端（NestJS）

- 模块：`{name}.module.ts` / `.service.ts` / `.controller.ts`
- 相对路径 import
- DTO 放 `{module}/dto/`，配合 class-validator
- 详见 [backend/AGENTS.md](backend/AGENTS.md)

### 前端（React）

- 页面：`pages/{domain}/XxxPage.tsx`
- 路由：仅 `App.tsx`
- API：仅 `services/`
- 详见 [frontend/AGENTS.md](frontend/AGENTS.md)

## Commit 规范

采用 [Conventional Commits](https://www.conventionalcommits.org/)，由 commitlint 校验。

### 格式

```
<type>(<scope>): <subject>

[optional body]

[optional footer]
```

### Type

| Type | 用途 |
|------|------|
| `feat` | 新功能 |
| `fix` | Bug 修复 |
| `docs` | 文档 |
| `style` | 格式（不影响逻辑） |
| `refactor` | 重构 |
| `test` | 测试 |
| `chore` | 构建/工具 |
| `perf` | 性能优化 |

### Scope（推荐）

`backend` | `frontend` | `mcp` | `prisma` | `ci` | `deps`

### 示例

```
feat(frontend): add folder upload on upload page
fix(backend): validate workspace role before repo delete
docs: add AGENTS harness documentation
chore(deps): bump antd to 6.4.4
```

### 禁止

- `update`、`fix bug`、`WIP`、`tmp`
- 无 type 的裸 message
- 一个 commit 混合不相关改动

## Pull Request

### 标题

与 commit 格式一致：`feat(frontend): add folder upload`

### 描述模板

```markdown
## Summary
- 变更点 1
- 变更点 2

## Test plan
- [ ] pnpm lint
- [ ] pnpm build
- [ ] 手动验证 xxx 页面
```

### Review 检查项

- [ ] 无重复代码块、无死代码
- [ ] 无 `.env` / 密钥 / `dist/`
- [ ] API 变更有对应 frontend types 更新
- [ ] Prisma schema 变更有说明

## 本地 Git Hooks

项目配置了 Husky：

- **commit-msg**：校验 Conventional Commits 格式
- **pre-commit**：对 staged 文件运行 lint-staged（eslint）

## 获取帮助

- 架构概览：[README.md](README.md)
- AI 约束：[AGENTS.md](AGENTS.md)
