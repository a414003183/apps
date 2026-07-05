# 公共配置（@apps/config）

## 说明

`@apps/config` 为整个前端工程提供统一的运行时配置，包括：

- 服务端口号
- API 基础地址
- 环境判断辅助函数（`isDev`、`isTest`、`isProduction`）

## 使用方式

```typescript
import { getEnvConfig } from '@apps/config'

const config = getEnvConfig()
```

## 构建

```bash
pnpm --filter @apps/config build
```

输出目录为 `dist/`，产物包含 `index.js` 与类型声明 `index.d.ts`。
