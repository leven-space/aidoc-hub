# AI Doc Hub

Enterprise-grade open source platform for HTML asset version management and team collaboration

[Quickstart](#get-started) · [Features](#overview) · [Architecture](#architecture) · [中文说明](#中文说明)

---

## Table of Contents

- [About AI Doc Hub](#about-ai-doc-hub)
- [Get Started](#get-started)
- [Overview](#overview)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Contributing](#contributing)
- [License](#license)
- [中文说明](#中文说明)

---

## About AI Doc Hub

AI Doc Hub is an open source enterprise platform designed to manage HTML documents and assets for teams where not everyone is a developer. It provides a workspace-centric model with built-in version control, shareable previews, and seamless integration with AI-powered tools via the MCP (Model Context Protocol).

> **Note:** AI Doc Hub is under active development. APIs and interfaces may change between releases.

[(back to top)](#ai-doc-hub)

---

## Get Started

### Prerequisites

- [Node.js](https://nodejs.org/) >= 18
- [pnpm](https://pnpm.io/) >= 8
- [Docker](https://www.docker.com/) & Docker Compose (for database)
- PostgreSQL 18 (or use the included Docker Compose setup)

### Local Development

1. **Clone the repository**

   ```bash
   git clone https://github.com/your-org/aidoc-hub.git
   cd aidoc-hub
   ```

2. **Install dependencies**

   ```bash
   pnpm install
   ```

3. **Start PostgreSQL via Docker Compose**

   ```bash
   docker compose up -d postgres
   ```

4. **Configure environment**

   ```bash
   cp backend/.env.example backend/.env  # or edit backend/.env directly
   ```

   Default database URL: `postgresql://postgres:postgres@localhost:5432/aidochub?schema=public`

5. **Push database schema**

   ```bash
   cd backend && npx prisma db push
   ```

6. **Start development servers**

   ```bash
   pnpm dev
   ```

   - Backend: [http://localhost:3000](http://localhost:3000)
   - Frontend: [http://localhost:5173](http://localhost:5173)

### Docker Compose (Full Stack)

To run the entire stack with Docker:

```bash
docker compose up -d
```

This starts PostgreSQL, backend, and frontend in containers.

[(back to top)](#ai-doc-hub)

---

## Overview

- **Workspace-Centric Organization** — Workspaces serve as the top-level container for assets, with role-based member management (Admin / Editor / Viewer).
- **Git-Based Version Control** — Every HTML document change is tracked with a single-trunk linear version model. Browse history, compare diffs, and restore any revision.
- **AI-Native Integration** — Personal Access Tokens and the standard MCP (Model Context Protocol) interface allow AI clients like Cursor, Windsurf, and Open Code to pull and push content programmatically.
- **Dual-Mode Sharing** — Generate shareable links in "View Only" (rendered HTML preview) or "Source Access" (with full source code) mode, with optional password protection, expiration, and visit limits.
- **Enterprise Readiness** — Audit logs, content security (DOMPurify sanitization), conflict handling, soft-delete recycle bin, and global search are built in.
- **Modern UI** — Clean, intuitive interface built with Ant Design, lowering the barrier for non-technical team members.

[(back to top)](#ai-doc-hub)

---

## Architecture

AI Doc Hub follows a monorepo architecture with a clear separation between the backend API and the frontend SPA.

```
┌─────────────────────────────────────────────────────┐
│                    Frontend (SPA)                    │
│         Vite · React · Ant Design · Monaco           │
├─────────────────────────────────────────────────────┤
│                   Backend (REST API)                 │
│        NestJS · Prisma · JWT · MCP Server            │
├─────────────────────────────────────────────────────┤
│                   Data Layer                         │
│         PostgreSQL 18 · isomorphic-git               │
└─────────────────────────────────────────────────────┘
```

### Key Modules

| Module | Description |
|--------|-------------|
| **Auth** | Phone-based registration/login with JWT, access token management |
| **Workspace** | Workspace CRUD, member invitation, role management |
| **Repository** | Document repositories within workspaces |
| **Git** | Version control powered by isomorphic-git (commit, history, diff) |
| **Share** | Dual-mode sharing with token-based access, expiration, and visit tracking |
| **Version** | Version history browsing and diff comparison |
| **MCP** | Model Context Protocol server for AI client integration |
| **Audit** | Comprehensive operation audit logging |
| **Recycle Bin** | Soft-delete with restore capability |

[(back to top)](#ai-doc-hub)

---

## Tech Stack

### Backend

| Technology | Purpose |
|-----------|---------|
| [NestJS](https://nestjs.com/) | Server framework |
| [Prisma](https://www.prisma.io/) | ORM & database migrations |
| [PostgreSQL 18](https://www.postgresql.org/) | Primary database |
| [isomorphic-git](https://isomorphic-git.org/) | Git-based version control |
| [MCP SDK](https://modelcontextprotocol.io/) | AI client protocol integration |
| [Passport.js](http://www.passportjs.org/) | JWT authentication |
| [DOMPurify](https://github.com/cure53/DOMPurify) | HTML content sanitization |

### Frontend

| Technology | Purpose |
|-----------|---------|
| [React](https://react.dev/) | UI framework |
| [Vite](https://vite.dev/) | Build tool & dev server |
| [Ant Design](https://ant.design/) | UI component library |
| [Monaco Editor](https://microsoft.github.io/monaco-editor/) | Code editor |
| [React Router](https://reactrouter.com/) | Client-side routing |
| [Axios](https://axios-http.com/) | HTTP client |

### Infrastructure

| Technology | Purpose |
|-----------|---------|
| [pnpm Workspaces](https://pnpm.io/workspaces) | Monorepo package management |
| [Docker Compose](https://docs.docker.com/compose/) | Local development orchestration |
| [Playwright](https://playwright.dev/) | End-to-end testing |

[(back to top)](#ai-doc-hub)

---

## Project Structure

```
aidoc-hub/
├── backend/                # NestJS backend API
│   ├── prisma/             # Database schema & migrations
│   ├── src/
│   │   ├── auth/           # Authentication & JWT
│   │   ├── workspace/      # Workspace management
│   │   ├── repo/           # Repository management
│   │   ├── git/            # Git version control service
│   │   ├── share/          # Sharing & link generation
│   │   ├── version/        # Version history & diff
│   │   ├── mcp/            # MCP server for AI integration
│   │   ├── audit/          # Audit logging
│   │   └── common/         # Shared utilities, guards, filters
│   └── package.json
├── frontend/               # React frontend SPA
│   ├── src/
│   │   ├── components/     # Shared components
│   │   ├── pages/          # Page components
│   │   ├── layouts/        # Layout components
│   │   ├── contexts/       # React contexts
│   │   ├── services/       # API service layer
│   │   └── theme/          # Ant Design theme config
│   └── package.json
├── docker-compose.yml      # Docker orchestration
├── pnpm-workspace.yaml     # Monorepo config
└── package.json            # Root package.json
```

[(back to top)](#ai-doc-hub)

---

## Contributing

Contributions are welcome! Whether it's bug reports, feature requests, documentation improvements, or code contributions — every bit helps.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

Please follow the [Conventional Commits](https://www.conventionalcommits.org/) specification for commit messages.

[(back to top)](#ai-doc-hub)

---

## License

AI Doc Hub is released under the [MIT License](LICENSE). See the LICENSE file for the full text.

Copyright (c) 2026 AI Doc Hub Contributors

[(back to top)](#ai-doc-hub)

---

## 中文说明

AI Doc Hub 是一个面向企业非技术人员的开源 AI HTML 文档版本管理与协作平台。

### 项目背景

解决企业内 HTML 资产分散、团队协同效率低、非技术人员操作门槛高、AI 工具链打通困难的痛点。

### 核心功能

- **工作空间管理** — 以团队工作空间为顶层资产组织单元，支持空间创建、成员邀请，提供管理员 / 编辑者 / 查看者三种角色
- **Git 版本控制** — 采用单主干线性版本模型，每次修改自动提交，支持版本历史浏览、差异对比、版本回退
- **AI 工具集成** — 提供个人 Access Token 和标准 MCP 协议接口，支持 Cursor、Windsurf、Open Code 等 AI 客户端拉取和上传内容
- **双模式分享** — 支持「只读预览」（渲染后 HTML 预览）和「源码协作」（含完整源代码）两种分享模式，可选密码保护、有效期和访问次数限制
- **企业级能力** — 操作审计日志、内容安全过滤（DOMPurify）、冲突处理、软删除回收站、全局搜索
- **现代 UI** — 基于 Ant Design 构建的简洁企业级界面，降低非技术人员使用门槛

### 技术栈

- **后端**：NestJS + Prisma + PostgreSQL 18 + isomorphic-git + MCP SDK
- **前端**：React + Vite + Ant Design + Monaco Editor + React Router
- **基础设施**：pnpm Monorepo + Docker Compose + Playwright

### 快速开始

1. 克隆仓库并安装依赖：

   ```bash
   git clone https://github.com/your-org/aidoc-hub.git
   cd aidoc-hub
   pnpm install
   ```

2. 启动数据库：

   ```bash
   docker compose up -d postgres
   ```

3. 初始化数据库结构：

   ```bash
   cd backend && npx prisma db push
   ```

4. 启动开发服务：

   ```bash
   pnpm dev
   ```

   - 后端：[http://localhost:3000](http://localhost:3000)
   - 前端：[http://localhost:5173](http://localhost:5173)

### 开源协议

本项目基于 [MIT License](LICENSE) 开源。

Copyright (c) 2026 AI Doc Hub Contributors

[(back to top)](#ai-doc-hub)
