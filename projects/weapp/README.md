# 电信供应链管理系统 - 微信小程序端

## 项目简介

本项目是 `apps` 前端 monorepo 的第四个端（`@projects/weapp`），基于 **Taro 4 + React + TypeScript** 开发，目标平台为微信小程序。实现了网页版商城（`@projects/mall`）的全部核心功能：

- 首页商品橱窗、分类浏览、热门推荐
- 商品搜索、筛选、排序
- 商品详情、加购、立即购买
- 店铺主页
- 购物车管理
- 订单结算（线下支付 + 上传凭证）
- 订单列表/详情、确认收货
- 账号密码登录/注册、个人中心

## 技术栈

- Taro 4.0.12
- React 18.3.1
- TypeScript 5.3.3
- Zustand（状态管理）
- SCSS（样式）

## 目录结构

```
weapp/
├── config/              # Taro 编译配置
├── src/
│   ├── api/             # API 封装与业务接口
│   ├── components/      # 公共组件
│   ├── pages/           # 小程序页面
│   ├── stores/          # Zustand 状态管理
│   ├── types/           # TypeScript 类型
│   ├── utils/           # 工具函数
│   ├── app.tsx          # 应用入口
│   ├── app.config.ts    # 全局配置
│   └── app.scss         # 全局样式
├── package.json
├── tsconfig.json
├── project.config.json  # 微信开发者工具项目配置
└── babel.config.js
```

## 环境变量

复制 `.env.example` 为 `.env`，并根据本地环境修改：

```bash
TARO_APP_API_BASE_URL=http://127.0.0.1:8080/api
TARO_APP_FILE_BASE_URL=http://127.0.0.1:8080/api/files
```

## 常用命令

```bash
# 安装依赖
pnpm install

# 开发模式（生成 dist/ 目录，微信开发者工具导入该目录）
pnpm --filter @projects/weapp dev:weapp

# 或者从根目录启动
pnpm start:weapp

# 生产构建
pnpm --filter @projects/weapp build:weapp

# TypeScript 类型检查
pnpm --filter @projects/weapp type-check
```

## 开发调试

1. 确保后端服务已启动（默认 `http://127.0.0.1:8080`）。
2. 运行 `pnpm start:weapp`，等待编译生成 `apps/apps/projects/weapp/dist/`。
3. 打开微信开发者工具，选择「导入项目」，目录指向 `apps/apps/projects/weapp/dist/`。
4. 在 `project.config.json` 中可修改 `appid`，测试阶段可保留 `touristappid`。
5. 若在微信开发者工具中请求失败，请检查「详情 → 本地设置 → 不校验合法域名、web-view...」是否已勾选。

## 后端接口复用

小程序端复用后端已有的接口：

- 公开商品接口：`/api/mall/products`、`/api/mall/products/{id}`、`/api/mall/shops/**`
- 登录/注册：`/api/auth/**`
- 客户业务（需 CUSTOMER 角色）：`/api/app/mall/**`、`/api/app/customer/**`
- 支付登记：`/api/member/customer/orders/{id}/payment-register`
- 文件上传/下载：`/api/files/**`

## 注意事项

- 本项目未接入微信一键登录与微信支付，登录采用账号密码方式，支付采用线下转账 + 上传凭证方式。
- 如需正式部署，请在微信小程序后台配置 `request`、`uploadFile`、`downloadFile` 合法域名。
- 购物车数量角标会在登录后自动同步到 TabBar。
