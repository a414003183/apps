import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const backendOrigin = process.env.VITE_BACKEND_ORIGIN ?? 'https://aixiaoya.site'
const devHost = process.env.VITE_DEV_HOST ?? '0.0.0.0'
const hmrHost = process.env.VITE_HMR_HOST ?? 'localhost'

export default defineConfig({
  base: '/mall/',
  plugins: [react(), tailwindcss()],
  server: {
    host: devHost,
    port: 5174,
    strictPort: true, // 端口被占用时直接报错，不自动递增，确保代理配置一致
    // API proxy — 默认代理到线上环境 https://aixiaoya.site
    // 如需切回本地后端，启动时传入 VITE_BACKEND_ORIGIN=http://127.0.0.1:8080
    proxy: {
      '/api': {
        target: backendOrigin,
        changeOrigin: true,
      },
    },
    // When storefront-v2 is proxied through antd-pro (port 8000),
    // HMR should still connect directly to the Vite dev server.
    hmr: {
      protocol: 'ws',
      host: hmrHost,
      port: 5174,
    },
  },
  build: {
    emptyOutDir: false,
    reportCompressedSize: false,
    chunkSizeWarningLimit: 1600,
  },
})
