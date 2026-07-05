# 电信供应链管理系统前端

文档请查看 [.docs](./.docs) 目录下的文件。

## 项目简介

本项目为电信供应链管理统一前端工程，采用 pnpm workspace 组织多包仓库：

- `apps/projects/*`：可独立部署的业务应用
- `apps/public/*`：业务共享包（配置、常量、类型、工具、组件、API 等）
- `packages/*`：通用基础库（如 `tsconfig`）

## 快速开始

```bash
# 安装依赖
pnpm install

# 启动管理后台
pnpm start:admin

# 启动商城前台
pnpm start:mall

# 启动移动端
pnpm start:mobile

# 启动微信小程序
pnpm start:weapp
```

## 技术栈

- 包管理：pnpm 10.4.1
- 构建工具：Vite / Umi Max / Expo / Taro
- 前端框架：React 18.3.1（mall 通过 overrides 使用 React 19 运行时）
- 类型语言：TypeScript 5.3.3
- 代码规范：ESLint + Prettier + Stylelint + Husky + lint-staged
- 版本发布：standard-version

## 目录结构

```text
.
├── apps/
│   ├── projects/             # 业务应用
│   │   ├── admin/            # 管理后台（Umi Max + Ant Design）
│   │   ├── mall/             # 商城前台（Vite + React）
│   │   ├── mobile/           # 移动端（Expo + React Native）
│   │   └── weapp/            # 微信小程序（Taro）
│   └── public/               # 业务共享包
│       ├── api/              # 公共 API 客户端（axios 通用版）
│       ├── components/       # 公共业务组件
│       ├── config/           # 公共配置
│       ├── constants/        # 公共常量
│       ├── types/            # 公共业务类型
│       └── utils/            # 公共工具函数
├── packages/
│   └── tsconfig/             # 共享 TypeScript 配置
├── .docs/                    # 项目文档
├── package.json              # 根工程配置
└── pnpm-workspace.yaml       # workspace 定义
```

## 共享包说明

| 包名 | 说明 | 被引用方 |
|------|------|----------|
| `@apps/types` | 公共业务类型（RoleType、Product、AuthProfile 等） | admin / mall / mobile / weapp |
| `@apps/api` | axios 通用 API 客户端 + auth API | mall / mobile |
| `@apps/utils` | storage 适配、JWT 解析、session 工具 | admin / mall / mobile |
| `@apps/config` | 公共配置（端口、API_BASE_URL、环境判断） | admin / mall / mobile / weapp |
| `@apps/constants` | 公共常量（APP_NAME、默认权限等） | admin |
| `@apps/components` | 公共业务组件 | 待扩展 |
