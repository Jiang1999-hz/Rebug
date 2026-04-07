# Bug Feedback System

一个轻量级缺陷反馈系统，包含三部分：

- `apps/api`: Hono + Prisma + PostgreSQL 后端
- `apps/dashboard`: React + Vite + TypeScript 管理后台
- `apps/widget`: 原生 JavaScript 嵌入式缺陷上报组件

这份仓库已经改成适合 Vercel 导入的结构：

- 同一个 Vercel 项目可以同时提供 Dashboard、`/api/*` 接口、`/widget.js`
- Dashboard 走静态构建输出到根目录 `dist/`
- API 走 Vercel Function
- Widget 默认同域访问 `/api/*`
- 上传优先使用 Vercel Blob 直传，避免 Vercel Function 的请求体限制

## 已实现功能

### API

- `POST /api/auth/login`
- `GET /api/projects`
- `POST /api/projects`
- `POST /api/bugs`
- `GET /api/bugs`
- `GET /api/bugs/:id`
- `PATCH /api/bugs/:id/status`
- `POST /api/bugs/:id/comments`
- `POST /api/upload`
- `POST /api/upload/client`
- `GET /widget.js`

### Dashboard

- 登录页 `/login`
- 缺陷列表 `/bugs`
- 状态、严重级别、标题搜索、分页
- 列表页内联状态切换
- 缺陷详情 `/bugs/:id`
- 评论回复
- 项目管理 `/projects`

### Widget

- 浮动按钮 + 滑出表单
- Shadow DOM 样式隔离
- 标题、描述、严重级别、截图、联系邮箱
- 自动附带当前页面 URL 和浏览器信息
- 手动上传截图
- 自动截图 `html2canvas`
- 成功态显示 `Reference #编号`

## 目录结构

```text
.
├── api/                        # Vercel Function 入口
├── apps/
│   ├── api/
│   ├── dashboard/
│   └── widget/
├── dist/                       # 根级 Vercel 静态输出
├── examples/
│   └── widget-host.html
├── scripts/
├── vercel.json
└── README.md
```

## 环境变量

先复制根目录 `.env.example` 为 `.env`。

核心变量：

- `DATABASE_URL`: PostgreSQL 连接串
- `JWT_SECRET`: 开发者 JWT 密钥
- `CORS_ALLOWED_ORIGINS`: 允许的前端来源，逗号分隔
- `BLOB_READ_WRITE_TOKEN`: Vercel Blob 读写令牌
- `VERCEL_BLOB_CALLBACK_URL`: 本地调试 Blob 回调时可选
- `S3_*`: 如果不用 Vercel Blob，也可以改接 R2 / S3
- `SEED_DEVELOPER_EMAIL`
- `SEED_DEVELOPER_PASSWORD`

说明：

- 在 Vercel 正式部署时，推荐使用 `Neon / Supabase` 提供 PostgreSQL
- 在 Vercel 上，截图上传推荐配置 `BLOB_READ_WRITE_TOKEN`
- 本地开发时，如果没有 Blob 和 S3，上传会自动回退到 `apps/api/uploads`

## 本地开发

### 1. 安装依赖

```bash
npm install
```

### 2. 生成 Prisma Client

```bash
npm run db:generate
```

### 3. 执行数据库迁移

```bash
npm run db:migrate
```

### 4. 初始化开发者账号和演示项目

```bash
npm run db:seed
```

默认会创建：

- 开发者账号：`dev@example.com`
- 默认密码：`ChangeMe123!`
- 演示项目 `apiKey`：`proj_demo_local`

### 5. 启动服务

```bash
npm run dev:api
npm run dev:dashboard
npm run dev:widget
```

默认地址：

- API: `http://localhost:3000`
- Dashboard: `http://localhost:5173`

本地开发时，Vite 已经把 `/api`、`/uploads`、`/widget.js` 代理到 `localhost:3000`。

## Vercel 部署

这份仓库已经适配成“一个仓库导入一个 Vercel 项目”的方式。

### 1. 导入仓库

在 Vercel 里选择 Import Git Repository，直接导入这个仓库。

不需要额外指定多项目 monorepo 目录，根目录即可。

### 2. 配置数据库

推荐任选其一：

- Neon
- Supabase

把连接串填到：

- `DATABASE_URL`

### 3. 配置 Blob 存储

在 Vercel 项目里创建 Blob Store，然后把自动生成的：

- `BLOB_READ_WRITE_TOKEN`

注入到项目环境变量。

### 4. 配置应用环境变量

至少补齐：

- `DATABASE_URL`
- `JWT_SECRET`
- `CORS_ALLOWED_ORIGINS`
- `BLOB_READ_WRITE_TOKEN`

如果 Dashboard、API、Widget 都在同一个 Vercel 项目下，`CORS_ALLOWED_ORIGINS` 可以直接填你的生产域名。

### 5. 部署

Vercel 会自动执行：

```bash
npm run build:vercel
```

最终：

- Dashboard 从根目录 `dist/` 提供
- Widget 从 `/widget.js` 提供
- API 从 `/api/*` 提供

## Widget 嵌入

把下面代码放到客户页面：

```html
<script>
  window.BugWidget = {
    apiKey: 'proj_xxxxxxxxxxxx',
    position: 'bottom-right'
  };
</script>
<script src="https://your-domain.com/widget.js" async></script>
```

如果 Widget 和 API 不在同一个域名，也可以显式指定：

```html
<script>
  window.BugWidget = {
    apiKey: 'proj_xxxxxxxxxxxx',
    apiBaseUrl: 'https://api.your-domain.com',
    position: 'bottom-right'
  };
</script>
```

## 状态流转规则

- `OPEN -> IN_PROGRESS`
- `OPEN -> CLOSED`
- `IN_PROGRESS -> RESOLVED`
- `IN_PROGRESS -> CLOSED`
- `RESOLVED -> CLOSED`
- `RESOLVED -> OPEN`
- `CLOSED -> OPEN`

后端会强校验，前端也会禁用不允许的选项。

## 上传策略

- 支持 `image/png`、`image/jpeg`、`image/webp`
- 单文件最大 5MB
- Vercel 环境下优先使用 Blob 直传
- 本地环境无 Blob 时回退到传统 `/api/upload`
- 本地环境无 S3/Blob 时，回退到 `apps/api/uploads`

## 已验证

已确认通过：

- `npm install`
- `npm run build --workspace @bug-feedback/api`
- `npm run test --workspace @bug-feedback/api`
- `npm run build --workspace @bug-feedback/dashboard`
- `npm run build --workspace @bug-feedback/widget`
- `npm run build:vercel`
- `npm run db:generate`
- `npm run typecheck:dashboard`
- `npm run typecheck:widget`

额外结果：

- `apps/widget/dist/widget.js` 未压缩约 `42 KB`
- `apps/widget/dist/widget.js` gzip 约 `14 KB`

## 示例页

如果你想快速验证 Widget 挂载，可以直接打开：

- [examples/widget-host.html](C:/Users/Jiang/Documents/bug反馈/examples/widget-host.html)
