# AI Doc Hub 核心功能测试用例

> 基于当前实现的核心模块编写，覆盖认证、工作空间、仓库/版本、分享、MCP 及 UI 主流程。
> 自动化标记：✅ Playwright E2E | 🔧 API E2E | ⬜ 手工

---

## 1. 系统初始化与认证

| ID | 模块 | 用例 | 前置条件 | 步骤 | 预期结果 | 自动化 |
|----|------|------|----------|------|----------|--------|
| AUTH-01 | 注册 | 新用户注册成功 | 系统已初始化、开放注册 | 提交合法手机号+密码 | 返回 JWT，可访问受保护接口 | ✅ |
| AUTH-02 | 注册 | 重复手机号注册 | 手机号已存在 | 同手机号再次注册 | 409 冲突错误 | 🔧 |
| AUTH-03 | 登录 | 正确凭证登录 | 用户已注册 | 提交手机号+密码 | 返回 JWT | 🔧 |
| AUTH-04 | 登录 | 错误密码 | 用户已注册 | 错误密码登录 | 401 未授权 | 🔧 |
| AUTH-05 | Token | 创建 READ PAT | 已登录 | POST /tokens scope=READ | 返回 adh_ 明文 Token | 🔧 |
| AUTH-06 | Token | 创建 READ_WRITE PAT | 已登录 | POST /tokens scope=READ_WRITE | 返回 adh_ 明文 Token | 🔧 |
| AUTH-07 | Token | 撤销 PAT | 已有 Token | DELETE /tokens/:id | 撤销后 MCP 鉴权失败 | 🔧 |
| AUTH-08 | UI | Token 管理页可访问 | 已登录 | 访问 /settings/tokens | 页面标题与创建按钮可见 | ✅ |

---

## 2. 工作空间（Workspace）

| ID | 模块 | 用例 | 前置条件 | 步骤 | 预期结果 | 自动化 |
|----|------|------|----------|------|----------|--------|
| WS-01 | 创建 | 创建团队空间 | 已登录 | POST workspaces name | 返回 workspaceId，创建者为 ADMIN | ✅ |
| WS-02 | 列表 | 列出用户空间 | 已有空间 | GET /workspaces | 包含刚创建的空间 | 🔧 |
| WS-03 | 详情 | 查看空间详情 | 成员身份 | GET /workspaces/:id | 返回名称、成员数等 | 🔧 |
| WS-04 | 成员 | 邀请成员 | ADMIN 身份 | POST members | 成员加入，默认 VIEWER | ⬜ |
| WS-05 | 角色 | 修改成员角色 | ADMIN 身份 | PUT member role=EDITOR | 角色更新成功 | ⬜ |
| WS-06 | 软删 | 删除空间进回收站 | ADMIN 身份 | DELETE workspace | 列表不可见，回收站可见 | ⬜ |
| WS-07 | 恢复 | 从回收站恢复 | 已软删 | POST restore | 空间重新可见 | ⬜ |
| WS-08 | UI | 创建空间流程 | 已登录 | 点击创建空间→填表→提交 | 进入空间详情页 | ✅ |

---

## 3. 仓库与文档版本（Repository / Git）

| ID | 模块 | 用例 | 前置条件 | 步骤 | 预期结果 | 自动化 |
|----|------|------|----------|------|----------|--------|
| REPO-01 | 创建 | 在空间下创建仓库 | 空间成员 | POST repos | 返回 repoId | ✅ |
| REPO-02 | 提交 | 上传 HTML 首版 | 已有仓库 | POST commits files+message | 生成版本 OID | ✅ |
| REPO-03 | 读取 | 读取文件内容 | 已有提交 | GET file?path= | 返回 HTML 内容 | 🔧 |
| REPO-04 | 列表 | 列出仓库文件树 | 已有提交 | GET files | 包含 index.html | 🔧 |
| REPO-05 | 版本 | 版本历史列表 | 多次提交 | GET versions | 按时间倒序 | ✅ |
| REPO-06 | Diff | 两版本对比 | ≥2 版本 | GET versions/diff | 返回 diff 结果 | ✅ |
| REPO-07 | 恢复 | 恢复到历史版本 | ≥2 版本 | POST versions/restore | 生成新版本指向旧内容 | ✅ |
| REPO-08 | 冲突 | 基于过期 base 提交 | 并发修改场景 | commit baseVersion 过期 | 409 冲突提示 | ⬜ |
| REPO-09 | 预览 | HTML 预览 | 已有 HTML | GET preview | 可渲染预览 | ⬜ |
| REPO-10 | 下载 | 单文件/文件夹 ZIP 下载 | 已有文件 | GET download | 返回正确内容 | ⬜ |
| REPO-11 | UI | 提交新版本页上传 | 仓库详情 | 上传 index.html 并提交 | 预览区显示 HTML 预览 | ✅ |

---

## 4. 分享（Share）

| ID | 模块 | 用例 | 前置条件 | 步骤 | 预期结果 | 自动化 |
|----|------|------|----------|------|----------|--------|
| SHARE-01 | 创建 | 只读预览分享 | EDITOR+ | POST shares mode=VIEW | 返回 share token | ⬜ |
| SHARE-02 | 创建 | 源码访问分享 | EDITOR+ | POST shares mode=SOURCE | 可获取源码 | ⬜ |
| SHARE-03 | 密码 | 密码保护分享 | 已创建分享 | validate 错误/正确密码 | 错误拒绝，正确通过 | ⬜ |
| SHARE-04 | 过期 | 过期链接不可访问 | expiresAt 已过 | 访问分享 URL | 403/404 | ⬜ |
| SHARE-05 | 次数 | 访问次数限制 | maxVisits=1 | 第二次访问 | 拒绝访问 | ⬜ |

---

## 5. MCP 集成（重点）

| ID | 模块 | 用例 | 前置条件 | 步骤 | 预期结果 | 自动化 |
|----|------|------|----------|------|----------|--------|
| MCP-01 | 鉴权 | 无 Token 访问 | — | GET /mcp/tools 无 Header | 401 | 🔧 |
| MCP-02 | 鉴权 | JWT 访问 tools | 已登录 JWT | GET /mcp/tools | 返回 5 个工具定义 | 🔧 |
| MCP-03 | 鉴权 | PAT 访问 tools | READ PAT | GET /mcp/tools | 返回工具列表 | 🔧 |
| MCP-04 | 工具 | list_workspaces | PAT/JWT | execute list_workspaces | 返回用户空间数组 | 🔧 |
| MCP-05 | 工具 | list_repositories | 已有空间 | execute + workspaceId | 返回仓库列表 | 🔧 |
| MCP-06 | 工具 | read_file | 已有提交 | execute read_file | 返回文件内容与 OID | ✅ |
| MCP-07 | 工具 | get_version_history | 多次提交 | execute get_version_history | 返回版本列表 | ✅ |
| MCP-08 | 工具 | write_file 成功 | READ_WRITE PAT + EDITOR | execute write_file | 新版本创建成功 | 🔧 |
| MCP-09 | 权限 | READ PAT 禁止 write | READ PAT | execute write_file | 403 TOKEN_WRITE_PERMISSION_REQUIRED | 🔧 |
| MCP-10 | 权限 | VIEWER 禁止 write | VIEWER 用户 JWT | execute write_file | 403 无编辑权限 | ⬜ |
| MCP-11 | 参数 | 缺少 workspaceId | PAT | list_repositories 空参数 | 400 校验失败 | 🔧 |
| MCP-12 | 参数 | 越权文件路径 read | PAT | read_file path=../etc | 400 FILE_NOT_FOUND 或 INVALID_FILE_PATH | 🔧 |
| MCP-13 | 并发 | 并行 read_file | 已有文件 | 10 路并发 read | 全部成功、内容一致 | 🔧 |
| MCP-14 | 并发 | 并行 write_file 不同文件 | READ_WRITE PAT | 5 路写不同 path | 全部成功，历史≥5 条 | 🔧 |
| MCP-15 | 并发 | 并行 list_workspaces | 多 PAT | 20 路并发 list | 全部成功、结果一致 | 🔧 |
| MCP-16 | 设置 | setup-snippets | PAT | GET /mcp/setup-snippets | 含 mcpUrl 与工具文档 | 🔧 |

---

## 6. 审计与系统管理

| ID | 模块 | 用例 | 前置条件 | 步骤 | 预期结果 | 自动化 |
|----|------|------|----------|------|----------|--------|
| AUDIT-01 | 审计 | 查询操作日志 | SYSTEM_ADMIN | GET /audit-logs | 返回分页日志 | ⬜ |
| AUDIT-02 | 权限 | 普通用户不可查审计 | USER 角色 | GET /audit-logs | 403 | ⬜ |
| SYS-01 | 配置 | 公开配置可读 | — | GET /system/config | 返回 publicApiUrl 等 | 🔧 |

---

## 7. UI 端到端主流程（Playwright）

| ID | 场景 | 步骤摘要 | 自动化 |
|----|------|----------|--------|
| E2E-01 | 注册→空间→仓库→上传 | 完整新用户上手路径 | ✅ workspace-flow.spec |
| E2E-02 | 登录→Token 管理 | 已有账号访问设置 | ✅ workspace-flow.spec |
| VER-API-01 ~ 06 | 多版本提交、指定版本读取、Diff、REST 恢复 | API/MCP 全链路 | ✅ version-flow.spec |
| VER-UI-01 | UI 二次提交 + 版本历史页恢复 | 预览验证回退内容 | ✅ version-flow.spec |

---

## 测试环境与数据隔离

- E2E 使用 `138{timestamp}` 动态手机号，避免与生产数据冲突
- MCP API 测试独立注册 `E2E-MCP-{timestamp}` 用户与空间
- 并发测试在同一仓库内执行，测试后数据可保留或定期清理 `backend/repos/`

## 执行命令

```bash
# 全量 Playwright E2E（自动拉起 dev server）
pnpm test:e2e

# 仅 MCP API 测试
pnpm exec playwright test frontend/e2e/mcp-api.spec.ts

# 仅 UI 主流程
pnpm exec playwright test frontend/e2e/workspace-flow.spec.ts
```
