/**
 * @name 代理的配置
 * @see 在生产环境 代理是无法生效的，所以这里没有生产环境的配置
 * -------------------------------
 * The agent cannot take effect in the production environment
 * so there is no configuration of the production environment
 * For details, please see
 * https://pro.ant.design/docs/deploy
 *
 * @doc https://umijs.org/docs/guides/proxy
 */
import { MALL_DEV_URL } from '@apps/config'

const mallTarget = process.env.UMI_MALL_TARGET ?? MALL_DEV_URL
const apiTarget = process.env.UMI_API_TARGET ?? 'http://127.0.0.1:8080'

export default {
  // 开发环境代理
  dev: {
    // 商城前端 storefront-v2 (Vite dev server)
    '/mall': {
      target: mallTarget,
      changeOrigin: true,
      ws: true,
    },
    // 后端 API
    '/api/': {
      target: apiTarget,
      changeOrigin: true,
    },
  },
  /**
   * @name 详细的代理配置
   * @doc https://github.com/chimurai/http-proxy-middleware
   */
  test: {
    // localhost:8000/api/** -> https://preview.pro.ant.design/api/**
    '/api/': {
      target: 'https://proapi.azurewebsites.net',
      changeOrigin: true,
      pathRewrite: { '^': '' },
    },
  },
  pre: {
    '/api/': {
      target: 'your pre url',
      changeOrigin: true,
      pathRewrite: { '^': '' },
    },
  },
}
