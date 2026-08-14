# 数据处理工具集 (foru-tools)

Vue 3 + Vite 前端与 NestJS 登录 API 的 npm workspaces 单体仓库。

本阶段（Phase 1）只把登录接到后端；Excel / 地图 / 分析工具仍在浏览器中运行，尚未迁到服务端。

## 仓库布局

```
foru-tools/
  package.json              # workspaces: packages/*
  packages/
    web/                    # Vue 3 + Vite 前端（原应用）
    server/                 # NestJS + TypeScript 登录 API
```

- `@foru/web`：现有数据处理工具 UI（公司关联、Excel 合并、智能地图等）
- `@foru/server`：登录 API（JWT）。无数据库，演示账号写在服务端种子数据中（密码为 bcrypt 哈希，源码不含明文密码）

## 功能特点

- Vue 3 + Vite + Vue Router + Element Plus
- NestJS + JWT 登录（`POST /api/login`、`GET /api/me`）
- 开发时 Vite 将 `/api` 代理到 Nest（Vite 端口 3000，API 端口 3001）
- 生产时 Nest 同时提供 `/api/*` 和前端 `dist` 静态资源
- SheetJS 处理 Excel；ECharts 生成地图可视化

## 安装与运行

### 安装依赖

在仓库根目录：

```bash
npm install
```

### 开发模式（同时启动 web + server）

```bash
npm run dev
```

- 前端：http://localhost:3000 （`/api` 代理到 3001）
- API：http://127.0.0.1:3001

也可分别启动：

```bash
npm run start:dev -w @foru/server
npm run dev -w @foru/web
```

### 演示账号

| 用户名 | 密码 | 角色 |
|--------|------|------|
| admin  | admin123 | admin |
| user   | user123  | user |

密码只用于登录；仓库源码里保存的是 bcrypt 哈希，没有明文密码。

### 生产构建与启动

```bash
npm run start:prod
```

等价于先构建前端和 Nest，再由 Nest 监听 **3001**（可用环境变量 `PORT` 覆盖），同时提供：

- `POST /api/login`、`GET /api/me`、`POST /api/logout`
- 已构建的 Vue 静态资源（`packages/web/dist`）

单独构建：

```bash
npm run build
npm start
```

## 认证说明

- `POST /api/login` 请求体 `{ "username", "password" }`，成功返回 `access_token` 与 `user: { username, role }`
- `GET /api/me` 需要 `Authorization: Bearer <token>`
- `POST /api/logout` 需要登录（JWT 无状态，主要清理客户端）
- 前端用 `localStorage` 保存 `user`（username/role）和 `token`，`src/utils/auth.js` 与 vue-router 守卫仍按角色控制菜单/路由

**注意：** 单页应用的路由守卫只在浏览器里执行，不能当作安全边界。会改 `localStorage` 的人可以伪造前端角色并看到对应页面；真正的接口鉴权要以服务端 JWT 为准。本阶段业务工具仍全部在前端运行。

## 工具说明

### 公司关联关系处理工具

上传包含三个工作表的 Excel 文件，自动处理授权公司与订货公司的关联关系。

- 第一个工作表：授权公司
- 第二个工作表：订货公司
- 第三个工作表：关联关系（包含经销商名称和关联编号）

处理规则：
- 如果授权公司A有关联公司BCD，但只有C订货，那么关联公司只写C
- 如果授权公司A有关联公司BCD，BC都有订货，就写B/C
- 如果授权公司A有关联公司BCD，但都没有订货，就写#N/A

### Excel文件合并工具

支持多种方式合并Excel文件：

- 垂直合并（上下合并）
- 水平合并（左右合并）
- 分表合并（每个文件作为单独的工作表）

可选配置：
- 是否使用第一个文件的表头作为合并后的表头
- 是否使用文件名作为工作表名

### 智能地图工具

上传Excel数据，生成中国地图销量标注。

- 支持自定义分段配置（最小值、最大值、颜色）
- 可导出为PNG图片
- 支持重新渲染地图

## 技术栈

- Vue 3 / Vite / Vue Router / Element Plus
- NestJS / TypeScript / @nestjs/jwt / bcrypt
- SheetJS / ECharts
