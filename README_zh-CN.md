<div align="center">

# AI Doc Hub

**面向团队与 AI 工作流的企业级开源 HTML 资产版本管理与协作平台**

[English](README.md) · [简体中文](README_zh-CN.md)

维护者：[**leven-space**](https://github.com/leven-space)

[快速开始](#快速开始) · [功能特性](#功能特性) · [功能截图](#功能截图) · [MCP 集成](#mcp-集成) · [架构](#架构) · [参与贡献](CONTRIBUTING.md)

<br/>

[![MIT License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![pnpm](https://img.shields.io/badge/pnpm-8+-F69220?logo=pnpm&logoColor=white)](https://pnpm.io/)
[![NestJS](https://img.shields.io/badge/后端-NestJS-E0234E?logo=nestjs&logoColor=white)](https://nestjs.com/)
[![React](https://img.shields.io/badge/前端-React-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Playwright](https://img.shields.io/badge/E2E-Playwright-2EAD33?logo=playwright&logoColor=white)](https://playwright.dev/)

<br/>

[![GitHub stars](https://img.shields.io/github/stars/leven-space/aidoc-hub?style=social)](https://github.com/leven-space/aidoc-hub/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/leven-space/aidoc-hub?style=social)](https://github.com/leven-space/aidoc-hub/network/members)
[![GitHub issues](https://img.shields.io/github/issues/leven-space/aidoc-hub)](https://github.com/leven-space/aidoc-hub/issues)
[![GitHub pull requests](https://img.shields.io/github/issues-pr/leven-space/aidoc-hub)](https://github.com/leven-space/aidoc-hub/pulls)
[![GitHub contributors](https://img.shields.io/github/contributors/leven-space/aidoc-hub)](https://github.com/leven-space/aidoc-hub/graphs/contributors)
[![Last commit](https://img.shields.io/github/last-commit/leven-space/aidoc-hub)](https://github.com/leven-space/aidoc-hub/commits/main)

<br/>

<img src="docs/images/workspaces.png" alt="AI Doc Hub — 工作空间" width="720" />

<sub>以工作空间为中心组织 HTML 文档仓库</sub>

</div>

---

## 项目简介

AI Doc Hub 帮助团队**管理、版本化、预览和分享 HTML 资产**，无需每个人都具备开发背景。产品以**工作空间**和 **Git 单主干线性版本**为核心，并通过标准 **MCP（Model Context Protocol）** 接口，让 **Cursor**、**Claude Code**、**Windsurf** 等 AI 工具可以程序化读写文档内容。

> **状态：** 积极开发中，版本间 API 与界面可能调整。

| 面向人群 | 能力 |
|----------|------|
| **产品 / 运营** | 上传 HTML 包、浏览器预览、生成只读分享链接 |
| **编辑者** | 版本历史、差异对比、版本回退、文件夹上传 |
| **开发者 / AI Agent** | REST API + PAT + MCP `read_file` / `write_file` |
| **管理员** | 角色权限、审计日志、回收站、系统配置 |

---

## 功能截图

<table>
  <tr>
    <td align="center"><b>工作空间</b></td>
    <td align="center"><b>HTML 预览</b></td>
    <td align="center"><b>版本历史</b></td>
  </tr>
  <tr>
    <td><img src="docs/images/workspaces.png" alt="工作空间列表" width="400" /></td>
    <td><img src="docs/images/repo-preview.png" alt="仓库 HTML 预览" width="400" /></td>
    <td><img src="docs/images/version-history.png" alt="版本历史时间线" width="400" /></td>
  </tr>
  <tr>
    <td align="center"><b>提交新版本</b></td>
    <td align="center"><b>MCP 集成</b></td>
    <td align="center"><b>Access Token</b></td>
  </tr>
  <tr>
    <td><img src="docs/images/upload.png" alt="上传与提交页面" width="400" /></td>
    <td><img src="docs/images/mcp-settings.png" alt="MCP 配置页" width="400" /></td>
    <td><img src="docs/images/token-settings.png" alt="个人访问令牌管理" width="400" /></td>
  </tr>
</table>

---

## 功能特性

### 核心能力

- **工作空间模型** — 顶层资产容器，支持 **管理员 / 编辑者 / 查看者** 角色与成员管理
- **Git 版本控制** — 基于 `isomorphic-git` 的单主干线性历史，每次修改生成带说明与 OID 的提交
- **HTML 预览** — 应用内渲染预览，内容经 [DOMPurify](https://github.com/cure53/DOMPurify) 过滤
- **版本操作** — 历史时间线、差异对比、恢复到任意版本（新建提交，不删历史）
- **批量上传** — 支持文件或整个文件夹（HTML、CSS、JS、图片等）

### 协作与分享

- **双模式分享** — **只读预览** 或 **源码协作**（可读源码并协同编辑）
- **分享管控** — 可选密码、有效期、访问次数、下载权限
- **全局搜索** — 快速定位工作空间与仓库
- **回收站** — 工作空间/仓库软删除，保留期内可恢复

### AI 与自动化

- **个人访问令牌（PAT）** — `adh_` 前缀，支持 `READ` / `READ_WRITE` 范围
- **MCP 服务** — `/api/mcp` HTTP Streamable MCP，工具包括：
  - `list_workspaces` · `create_workspace` · `list_repositories` · `create_repository` · `read_file` · `write_file` · `get_version_history`
- **接入片段** — 一键复制 Cursor / Claude Code / Codex 的 MCP 配置

### 企业级能力

- **审计日志** — 记录关键操作（系统管理员可查）
- **JWT + PAT 鉴权** — 支持 Cookie 与 Bearer Token
- **国际化** — 中文 / 英文界面
- **E2E 测试** — Playwright 覆盖 UI、MCP API、版本回退（见 [`docs/test-cases.md`](docs/test-cases.md)）

---

## 快速开始

### 环境要求

- [Node.js](https://nodejs.org/) **>= 18**
- [pnpm](https://pnpm.io/) **>= 8**
- [Docker](https://www.docker.com/)（用于 Compose 启动 PostgreSQL）

### 本地开发

```bash
git clone https://github.com/leven-space/aidoc-hub.git
cd aidoc-hub
pnpm install

docker compose up -d postgres
cp backend/.env.example backend/.env   # 可选，本地默认连接 Docker Postgres

cd backend && npx prisma db push && cd ..
pnpm dev
```

| 服务 | 地址 |
|------|------|
| 前端 | http://localhost:5173 |
| 后端 API | http://localhost:3000/api |

首次访问需完成**系统初始化**（管理员与站点配置），之后可注册用户并创建工作空间。

### Docker Compose 全栈

```bash
docker compose up -d
```

### 运行 E2E 测试

```bash
pnpm test:e2e
```

最新自动化测试报告见 [`docs/test-results.md`](docs/test-results.md)。

---

## MCP 集成

将 AI 客户端连接到工作空间中的文档：

```json
{
  "mcpServers": {
    "aidoc-hub": {
      "url": "https://your-host/api/mcp",
      "headers": {
        "Authorization": "Bearer adh_YOUR_TOKEN"
      }
    }
  }
}
```

典型 Agent 流程：

1. `create_workspace`（可选）→ 创建工作空间，或 `list_workspaces` → 获取 `workspaceId`
2. `create_repository`（可选）→ 创建仓库，或 `list_repositories` → 获取 `repoId`
3. `read_file` / `write_file` / `get_version_history`

在 **设置 → Token 管理** 创建令牌。`create_workspace`、`create_repository`、`write_file` 需要 **READ_WRITE** PAT；`create_repository` 需 **管理员** 权限；`write_file` 需 **编辑者** 或更高权限。

---

## 架构

```
┌─────────────────────────────────────────────────────┐
│           前端 SPA（Vite · React · Ant Design）      │
├─────────────────────────────────────────────────────┤
│        后端 API（NestJS · Prisma · JWT · MCP）        │
├─────────────────────────────────────────────────────┤
│   PostgreSQL 18  ·  isomorphic-git（按仓库存储）       │
└─────────────────────────────────────────────────────┘
```

| 模块 | 职责 |
|------|------|
| `auth` | 注册登录、JWT、PAT |
| `workspace` | 工作空间、成员、角色 |
| `repo` | 仓库、提交、文件、预览、下载 |
| `git` | 版本控制引擎 |
| `version` | 历史、Diff、恢复 |
| `share` | 分享链接与公开访问 |
| `mcp` | Model Context Protocol 服务 |
| `audit` | 审计日志查询 |
| `system` | 初始化与公开配置 |

Monorepo：`backend/`（NestJS）+ `frontend/`（React SPA）。工程约束详见 [AGENTS.md](AGENTS.md)。

---

## 技术栈

| 层级 | 技术 |
|------|------|
| 后端 | NestJS、Prisma、PostgreSQL 18、isomorphic-git、MCP SDK、Passport JWT、DOMPurify |
| 前端 | React 19、Vite、Ant Design 6、Monaco Editor、React Router、Axios |
| 工具链 | pnpm workspaces、Docker Compose、Playwright、Husky、commitlint |

---

## 项目结构

```
aidoc-hub/
├── backend/           # NestJS API + Prisma
├── frontend/          # React SPA + Playwright E2E
├── docs/              # 测试文档、README 截图
├── scripts/           # 工具脚本（如截图生成）
├── docker-compose.yml
└── playwright.config.ts
```

---

## 参与贡献

欢迎提交 Issue、文档改进与 Pull Request。

1. 阅读 [AGENTS.md](AGENTS.md) 与 [CONTRIBUTING.md](CONTRIBUTING.md)
2. Fork → 分支（`feat/…` / `fix/…`）→ 提交（Conventional Commits）→ PR
3. 提交前运行 `pnpm lint` 与 `pnpm build`

---

## Star 增长趋势

[![Star History Chart](https://api.star-history.com/svg?repos=leven-space/aidoc-hub&type=Date)](https://star-history.com/#leven-space/aidoc-hub&Date)

---

## 贡献者

感谢每一位为 AI Doc Hub 做出贡献的开发者。

<a href="https://github.com/leven-space/aidoc-hub/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=leven-space/aidoc-hub" alt="Contributors" />
</a>

由 [contrib.rocks](https://contrib.rocks) 生成贡献者头像墙。

---

## 开源协议

[MIT License](LICENSE) — Copyright (c) 2026 AI Doc Hub Contributors

---

<div align="center">

**[⬆ 返回顶部](#ai-doc-hub)**

如果本项目对你有帮助，欢迎给仓库点个 **⭐**。

</div>
