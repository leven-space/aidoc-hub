# AI Doc Hub E2E 测试报告

> 执行时间：2026-06-20（更新：补全版本升级/回退用例）  
> 环境：本地开发（`localhost:3000` API + `localhost:5173` Frontend）  
> 命令：`pnpm test:e2e`  
> Playwright：@playwright/test ^1.61.0

---

## 汇总

| 指标 | 结果 |
|------|------|
| 总用例数 | **24** |
| 通过 | **24** |
| 失败 | 0 |
| 跳过 | 0 |
| 总耗时 | ~9.5s |

**结论：全部自动化 E2E 用例通过。**

---

## 版本升级与回退（`frontend/e2e/version-flow.spec.ts`）— 新增

| 用例 ID | 场景 | 结果 |
|---------|------|------|
| VER-API-01 | 连续 3 次提交，版本历史 ≥3 条且顺序正确 | ✅ |
| VER-API-02 | REST `readFile` 指定 v1 OID / 最新版内容正确 | ✅ |
| VER-API-03 | MCP `read_file` 带 `version` 参数读历史版本 | ✅ |
| VER-API-04 | REST `versions/diff` v1↔v3 有增删差异 | ✅ |
| VER-API-05 | REST `versions/restore` 回退到 v1，最新内容恢复 | ✅ |
| VER-API-06 | MCP `get_version_history` + `read_file` 验证恢复后状态 | ✅ |
| VER-UI-01 | UI 上传 v2 → 版本历史页恢复 v1 → 预览显示 Version One | ✅ |

### 版本测试覆盖说明

- **升级**：REST 多次 `commits`、UI `Commit New Version`、MCP `write_file`（见 mcp-api MCP-08）
- **读历史版本**：REST `/file?version=`、MCP `read_file` + `version` OID
- **对比**：REST `versions/diff`
- **回退**：REST `POST versions/restore`（生成新提交，不删历史）；UI「Restore This Version」+ 预览验证

---

## MCP API E2E（`frontend/e2e/mcp-api.spec.ts`）

| 用例 ID | 场景 | 结果 |
|---------|------|------|
| MCP-01 ~ MCP-16 | 鉴权、工具、权限、并发 | ✅ 15 项全部通过 |

---

## UI 主流程（`frontend/e2e/workspace-flow.spec.ts`）

| 用例 ID | 场景 | 结果 |
|---------|------|------|
| E2E-01 | 注册 → 空间 → 仓库 → 上传 → 预览 | ✅ |
| E2E-02 | 登录 → Token 管理页 | ✅ |

---

## 与测试用例文档对照

完整用例设计见 [`docs/test-cases.md`](./test-cases.md)。

| 模块 | 文档用例数 | 本次自动化覆盖 |
|------|-----------|----------------|
| 认证 / Token | 8 | 2（UI + MCP 鉴权） |
| 工作空间 | 8 | 3 |
| 仓库 / 版本 | 11 | **8**（含 Diff、Restore、多版本） |
| 分享 | 5 | 0（待补充） |
| MCP | 16 | 15 |
| 审计 / 系统 | 3 | 0（待补充） |
| UI 主流程 + 版本 UI | 4 | 4 |

---

## 后续建议

1. **分享模块**：SHARE-01 ~ SHARE-05
2. **冲突场景**：REPO-08 过期 `baseVersion` 提交 409
3. **权限矩阵**：VIEWER 用户禁止 `write_file` / `restore`
4. **审计日志**：AUDIT-01 / AUDIT-02

---

## 执行命令

```bash
# 全量 E2E
pnpm test:e2e

# 仅版本相关
pnpm exec playwright test frontend/e2e/version-flow.spec.ts

# 仅 MCP
pnpm exec playwright test frontend/e2e/mcp-api.spec.ts
```
