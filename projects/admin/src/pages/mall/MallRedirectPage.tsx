import { useEffect } from 'react'

/**
 * 硬跳转到 storefront-v2 商城前端。
 *
 * 在开发环境中, webpack-dev-server 的代理会将 /mall/* 请求
 * 转发到 storefront-v2 的 Vite dev server (port 5174)。
 * 但 UmiJS 的客户端路由不会触发真正的 HTTP 请求,
 * 所以需要通过 window.location 强制一次完整页面刷新,
 * 使请求经过代理层到达 storefront-v2。
 */
export default function MallRedirectPage() {
  useEffect(() => {
    const { pathname, search, hash } = window.location
    if (pathname === '/') {
      // 根路径跳转到商城首页
      window.location.replace('/mall/')
    } else {
      // /mall/* 路径保持原样，强制全页面重载以命中代理
      window.location.replace(pathname + search + hash)
    }
  }, [])

  return null
}
