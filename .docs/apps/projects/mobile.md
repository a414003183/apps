# 移动端（@projects/mobile）

## 技术栈

- Expo 52
- React Native 0.76.9
- React 18.3.1
- TypeScript 5.3.3
- Expo Router（文件式路由）

## 目录结构

```text
apps/projects/mobile/
├── app/              # 文件式路由页面
├── src/              # 源码
│   ├── components/   # 组件
│   ├── hooks/        # Hooks
│   ├── stores/       # 状态管理
│   └── utils/        # 工具函数
├── assets/           # 资源
├── android/          # Android 原生工程
├── package.json
├── app.json
└── babel.config.js
```

## 常用脚本

```bash
pnpm --filter @projects/mobile dev        # 启动 Expo
pnpm --filter @projects/mobile android    # 运行 Android
pnpm --filter @projects/mobile ios        # 运行 iOS
pnpm --filter @projects/mobile prebuild   # 预构建原生工程
```

## 包名

Android 包名：`com.telecom.customer.mall`
