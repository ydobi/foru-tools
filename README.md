# 数据处理工具集

这是一个基于Vue 3开发的数据处理工具集合，包含三个主要工具：

1. **公司关联关系处理工具** - 处理授权公司与订货公司的关联关系
2. **Excel文件合并工具** - 支持多种方式合并Excel文件
3. **智能地图工具** - 生成中国地图销量标注

## 功能特点

- 使用Vue 3框架开发
- 使用Vite作为构建工具
- 支持路由导航
- 响应式设计，适配不同设备
- 集成Bootstrap 5样式
- 使用SheetJS处理Excel文件
- 使用ECharts生成地图可视化

## 安装与运行

### 安装依赖

\`\`\`bash
npm install
\`\`\`

### 开发模式运行

\`\`\`bash
npm run dev
\`\`\`

### 构建生产版本

\`\`\`bash
npm run build
\`\`\`

### 预览生产版本

\`\`\`bash
npm run preview
\`\`\`

## 工具说明

### 公司关联关系处理工具

上传包含三个工作表的Excel文件，自动处理授权公司与订货公司的关联关系。

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

- Vue 3
- Vite
- Vue Router
- Bootstrap 5
- SheetJS
- ECharts

## 登录 API（foru-next-server）

登录请求 [foru-next-server](https://github.com/ydobi/foru-next-server)（Cloudflare Worker 名：`foru-next-server`）：

- `POST /api/login`  JSON：username、password
- `GET /api/me`  Authorization Bearer JWT

账号：`admin`（管理员）、`user`。密码存在 D1，明文不进仓库。

### Cloudflare Pages

构建变量 `VITE_API_BASE` 为 Worker origin（不要末尾斜杠）：

```
VITE_API_BASE=https://foru-next-server.hkiexx.workers.dev
```

不设的话，线上登录会打到 Pages 自己的域名，接口不存在。改环境变量后需要重新构建；推送 `main` 会触发 Pages 部署。

### 本地开发

可留空 `VITE_API_BASE`。Vite 把 `/api` 代理到 `http://127.0.0.1:3001`（`VITE_API_PROXY` 可覆盖）。本地对接 Next 时改代理目标端口即可。
