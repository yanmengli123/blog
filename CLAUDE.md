# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

鱼行尺素（yuxingchisu）- 基于 Node.js + Express + sql.js 的动态个人博客系统，前台页面通过 REST API 动态加载所有数据。

## 常用命令

```bash
node server.js          # 启动服务器（端口 3000）
nodemon server.js        # 开发模式（热重载）
node seed.js             # 重置并填充测试数据
```

## 架构要点

### 目录结构
- `server.js` — Express 入口，启动前必须 `await db.initSQL()`
- `models/database.js` — sql.js 数据库模块（**单例模式**，所有修改需 `saveDb()` 持久化）
- `routes/api.js` — 前台 REST API（无需认证）
- `routes/admin.js` — 管理后台 API（需 Bearer JWT）
- `middleware/auth.js` — JWT 认证中间件，7天有效期
- `public/` — 静态资源，通过 `/public/css/` 和 `/public/js/` 引用
- `views/` — 前台页面 HTML
- `views/admin/` — 管理后台 HTML 页面
- `database/blog.db` — sql.js 数据库文件（自动创建）

### 静态文件路径
所有 CSS/JS 必须使用 `/public/css/` 和 `/public/js/` 前缀，示例：
```html
<link rel="stylesheet" href="/public/css/style.css">
<script src="/public/js/api.js"></script>
```
服务器同时配置了根路径 `app.use(express.static(...))` 和 `/public` 别名，确保两种路径均可访问。

**注意**：根目录下的 `index.html`、`about.html`、`post.html`、`friends.html`、`css/`、`js/` 是旧静态文件，已废弃不再使用。所有前台页面由 `views/` 目录的模板经 Express 路由提供。

### 数据库单例模式
`database.js` 使用闭包变量 `_db` 和 `_initPromise` 保证单例。**关键规则**：
- `params` 中 `undefined` 值会报错，必须转换为 `null`
- 所有写操作后必须调用 `saveDb()` 才持久化到文件
- 新增表字段需要同时添加 `ALTER TABLE` 迁移代码

### 路由顺序（重要）
Express 按顺序匹配，**具体路由必须放在参数路由之前**：
```
router.get('/posts/all')   ← 先匹配这个
router.get('/posts/:id')    ← 后匹配这个
router.get('/comments/recent') ← 先于 /comments
```

### 认证
- 管理后台 `/admin/api/*` 需 Bearer Token
- JWT secret 在 `.env` 的 `JWT_SECRET`
- `AdminAPI` 前端类自动从 `localStorage` 读取 token

### 外部依赖（全部本地化，国内可直接访问）
所有 CDN 资源已下载到 `public/` 目录，**禁止再引用外部 CDN URL**：
- ECharts → `public/js/echarts.min.js`（必须本地，国内 CDN 不通）
- Font Awesome → `public/css/font-awesome.min.css` + `public/webfonts/`（含 woff2 字体）
- Inter 字体 → `public/css/inter/inter.css` + `public/css/inter/*.woff2`
- Tailwind CSS → `https://cdn.tailwindcss.com`（可访问，无需本地）

**后台 HTML 模板规则**：必须引用 `/public/css/inter/inter.css`，禁止残留 `<link href="">` 空标签。

### API 工具方法
`public/js/api.js` 中的 `API` 和 `AdminAPI` 类使用 `_qs()` 方法构建 URL 查询参数，自动过滤 `null`/`undefined`/`''` 空值。**不要用 `URLSearchParams` 直接传含空值的对象**，否则 `undefined` 会被转成字符串 `"undefined"` 导致后端搜到错误的值。

### 单篇文章路由 `/api/posts/:id`
优先按 slug 查，找不到再按 ID 查（因为 slug 可能也是纯数字）。**不要用 `isNaN()` 判断**，统一用：`db.getPostBySlug(raw)` → fallback `db.getPostById(parseInt(raw))`

## 环境变量（.env）

| 变量 | 默认值 | 说明 |
|------|--------|------|
| PORT | 3000 | 监听端口 |
| JWT_SECRET | - | JWT 签名密钥 |
| ADMIN_USERNAME | admin | 管理员用户名 |
| ADMIN_PASSWORD | admin123 | 管理员密码 |
| SITE_NAME | 鱼行尺素 | 站点名称 |
| SITE_URL | http://localhost:3000 | 站点地址 |

## API 端点

### 前台（无需认证）
- `GET /api/settings` — 站点设置
- `GET /api/profile` — 博主信息（含 `skills` JSON 字段）
- `GET /api/posts` — 文章列表（支持 `page`, `limit`, `category`, `tag`, `search`）
- `GET /api/posts/all` — 所有文章（不含分页，用于上下篇导航）
- `GET /api/posts/count` — 文章总数（用于分页）
- `GET /api/posts/:id` — 单篇文章（含 Markdown 转 HTML）
- `GET /api/categories` — 分类列表
- `GET /api/tags` — 标签列表（含 `post_count`）
- `GET /api/friends` — 友链列表
- `GET /api/stats` — 统计数据（含 `blogCreatedAt`）
- `GET /api/stats/charts` — 图表数据（每月文章、分类分布、访问趋势）
- `GET /api/comments` — 评论列表
- `POST /api/comments` — 提交评论

### 管理后台（需 Bearer Token）
- `GET /admin/api/stats` — 仪表盘数据
- `GET/POST/PUT/DELETE /admin/api/posts` — 文章 CRUD
- `GET/POST/DELETE /admin/api/categories` — 分类 CRUD
- `GET/POST/DELETE /admin/api/tags` — 标签 CRUD
- `GET/POST/PUT/DELETE /admin/api/friends` — 友链 CRUD
- `GET /admin/api/comments` — 评论管理
- `PUT /admin/api/comments/:id/approve` — 审核评论
- `GET/PUT /admin/api/profile` — 个人信息
- `GET/PUT /admin/api/settings` — 站点设置
- `PUT /admin/api/password` — 修改密码
