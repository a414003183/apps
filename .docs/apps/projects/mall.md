# 商城前台（@projects/mall）

## 技术栈

- Vite 6
- React 18.3.1
- TypeScript 5.3.3
- Tailwind CSS 4
- HeroUI

## 目录结构

```text
apps/projects/mall/
├── public/           # 静态资源
├── src/              # 源码
│   ├── api/          # 接口
│   ├── auth/         # 认证
│   ├── components/   # 组件
│   ├── lib/          # 库
│   ├── pages/        # 页面
│   ├── styles/       # 样式
│   └── types/        # 类型
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## 常用脚本

```bash
pnpm --filter @projects/mall dev
pnpm --filter @projects/mall build
pnpm --filter @projects/mall lint
```

## 代理配置

开发服务器运行在 `5174` 端口，`/api` 代理到后端服务，具体配置见 `vite.config.ts`。
