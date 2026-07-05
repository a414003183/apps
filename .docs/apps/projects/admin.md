# 管理后台（@projects/admin）

## 技术栈

- Umi Max 4
- Ant Design 6
- React 18.3.1
- TypeScript 5.3.3
- Tailwind CSS 3

## 目录结构

```text
apps/projects/admin/
├── config/           # Umi 配置、路由、代理
├── mock/             # 本地 Mock 数据
├── public/           # 静态资源
├── scripts/          # 脚本
├── src/              # 源码
│   ├── components/   # 业务组件
│   ├── layouts/      # 布局
│   ├── locales/      # 国际化
│   ├── pages/        # 页面
│   ├── services/     # 接口服务
│   ├── types/        # 类型定义
│   └── utils/        # 工具函数
├── tests/            # 测试
├── types/            # 全局类型
└── package.json
```

## 常用脚本

```bash
pnpm --filter @projects/admin dev
pnpm --filter @projects/admin build
pnpm --filter @projects/admin lint
pnpm --filter @projects/admin test
```
