# Bug Feedback System

一个轻量级 Bug 反馈系统，推荐使用下面这套部署方式：

- `apps/api`: Hono + Prisma + PostgreSQL，部署到 Railway
- `apps/widget`: 原生 JavaScript 组件，由 API 服务提供 `widget.js`
- `apps/dashboard`: React + Vite 管理后台，部署到 Vercel

## 推荐架构

```text
Client Site
  -> https://your-api.up.railway.app/widget.js
  -> https://your-api.up.railway.app/api/*

Developer Dashboard
  -> https://your-dashboard.vercel.app
  -> calls https://your-api.up.railway.app/api/*
```

这样拆开以后：

- API 回到标准 Node 服务，不再依赖 Vercel Serverless 适配
- Widget 默认和 API 同域，`apiBaseUrl` 可以自动推断
- Dashboard 只负责静态页面，构建和部署都更简单

## 常用脚本

```bash
npm install
npm run db:generate
npm run db:migrate
npm run db:seed
npm run build:api-service
npm run start:api-service
npm run build:vercel
```

说明：

- `build:api-service`: 构建 API 和 widget，给 Railway 服务用
- `start:api-service`: 启动编译后的 API 服务
- `build:vercel`: 只构建 Dashboard 静态产物

## 本地开发

### 1. 安装依赖

```bash
npm install
```

### 2. 准备环境变量

根目录复制 `.env.example` 为 `.env`

如果你希望 Dashboard 本地直接指向远程 API，可以在 `apps/dashboard` 下复制 `.env.example` 为 `.env.local`

### 3. 初始化数据库

```bash
npm run db:generate
npm run db:migrate
npm run db:seed
```

默认会创建：

- 开发者账号：`dev@example.com`
- 默认密码：`ChangeMe123!`
- 演示项目 API Key：`proj_demo_local`

### 4. 启动服务

```bash
npm run dev:api
npm run dev:dashboard
```

默认地址：

- API: `http://localhost:3000`
- Dashboard: `http://localhost:5173`

Vite 本地开发时会把 `/api`、`/uploads`、`/widget.js` 代理到 `localhost:3000`

## Railway 部署 API

推荐把 Railway 服务的仓库根目录设为 `/`

Build Command:

```bash
npm install && npm run build:api-service
```

Start Command:

```bash
npm run start:api-service
```

Healthcheck Path:

```text
/health
```

必须的环境变量：

- `DATABASE_URL`
- `DIRECT_URL`
- `JWT_SECRET`
- `CORS_ALLOWED_ORIGINS`

可选环境变量：

- `BLOB_READ_WRITE_TOKEN`
- `S3_BUCKET`
- `S3_REGION`
- `S3_ENDPOINT`
- `S3_ACCESS_KEY_ID`
- `S3_SECRET_ACCESS_KEY`
- `S3_PUBLIC_URL_BASE`
- `SEED_DEVELOPER_EMAIL`
- `SEED_DEVELOPER_PASSWORD`

建议：

- `CORS_ALLOWED_ORIGINS` 可以先填 Dashboard 的线上域名，或先用 `*`
- 数据库迁移和 seed 不要放进构建流程，第一次部署后单独执行

第一次部署完成后，再执行一次：

```bash
npm run db:migrate
npm run db:seed
```

这两步可以在 Railway 的 shell / one-off command 里跑，也可以在本地对着同一个生产数据库跑。

Railway API 验证地址：

- `https://your-api.up.railway.app/health`
- `https://your-api.up.railway.app/api/health`
- `https://your-api.up.railway.app/widget.js`

## Vercel 部署 Dashboard

Vercel 继续从仓库根目录部署即可。

推荐设置：

- Framework Preset: `Other`
- Install Command: `npm install`
- Build Command: `npm run build:vercel`
- Output Directory: `dist`

Dashboard 需要配置：

```text
VITE_API_BASE_URL=https://your-api.up.railway.app
```

如果不配置它，Dashboard 会默认请求同域 `/api/*`，在“Vercel 前端 + Railway API”的架构下会直接 404。

## Widget 嵌入

推荐直接从 Railway API 域名加载 widget，这样组件会自动把 API 地址推断成同域。

```html
<script>
  window.BugWidget = {
    apiKey: 'proj_xxxxxxxxxxxx',
    position: 'bottom-right'
  };
</script>
<script src="https://your-api.up.railway.app/widget.js" async></script>
```

如果你把 widget 放到别的域名，也可以显式指定：

```html
<script>
  window.BugWidget = {
    apiKey: 'proj_xxxxxxxxxxxx',
    apiBaseUrl: 'https://your-api.up.railway.app',
    position: 'bottom-right'
  };
</script>
```

## API 路由

- `POST /api/auth/login`
- `GET /api/bugs`
- `GET /api/bugs/:id`
- `POST /api/bugs`
- `PATCH /api/bugs/:id/status`
- `POST /api/bugs/:id/comments`
- `GET /api/projects`
- `POST /api/projects`
- `POST /api/upload`
- `POST /api/upload/client`
- `GET /widget.js`

## 上传策略

- 支持 `image/png`、`image/jpeg`、`image/webp`
- 单文件最大 `5MB`
- 优先使用 Vercel Blob 直传
- 如果没有 Blob，也支持走 API 上传
- 本地且未配置 Blob / S3 时，会回退到 `apps/api/uploads`

## 已验证

- `npm install`
- `npm run build --workspace @bug-feedback/api`
- `npm run test --workspace @bug-feedback/api`
- `npm run build --workspace @bug-feedback/dashboard`
- `npm run build --workspace @bug-feedback/widget`
- `npm run build:api-service`
- `npm run build:vercel`

Widget 体积：

- `apps/widget/dist/widget.js` 原始约 `42 KB`
- gzip 后约 `14 KB`

## 示例页

本地挂载 widget 的示例页面：

- [examples/widget-host.html](C:/Users/Jiang/Documents/bug反馈/examples/widget-host.html)
