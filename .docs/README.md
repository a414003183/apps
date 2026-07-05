# 项目架构文档

## 整体结构

```text
.
├── apps/
│   ├── package.json          # @apps/* 聚合包
│   ├── projects/             # 可部署应用
│   │   ├── admin/            # 管理后台
│   │   ├── mall/             # 商城前台
│   │   └── mobile/           # 移动端
│   └── public/               # 业务共享包
│       ├── components/       # 公共业务组件
│       ├── config/           # 公共配置
│       ├── constants/        # 公共常量
│       └── utils/            # 公共工具函数
├── packages/
│   └── tsconfig/             # 共享 TS 配置
├── scripts/                  # 工程脚本
└── .docs/                    # 本文档目录
```

## 包作用域约定

| 作用域                 | 说明                 | 位置                |
| ---------------------- | -------------------- | ------------------- |
| `@projects/*`          | 业务应用             | `apps/projects/*`   |
| `@apps/*`              | 业务共享包           | `apps/public/*`     |
| `tsconfig`             | 共享 TypeScript 配置 | `packages/tsconfig` |
| `@telecom-scm/scripts` | 工程脚本             | `scripts`           |

## 统一规范

- 所有包 `version` 统一为 `1.0.0`，`private: true`
- 内部包依赖统一使用 `workspace:^1.0.0`
- React / React DOM / TypeScript 通过根 `pnpm.overrides` 强制统一
- 代码风格统一采用根目录 `.prettierrc` / `.eslintrc.js`
- Git 提交遵循 `.commitlintrc.json` 规范

## 更多信息

- [新手文档](./新手文档.md)
- [管理后台](./apps/projects/admin.md)
- [商城前台](./apps/projects/mall.md)
- [移动端](./apps/projects/mobile.md)
- [公共配置](./apps/public/config.md)
