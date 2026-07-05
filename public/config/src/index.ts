/**
 * 电信供应链管理系统公共配置
 * 供 admin / mall / mobile / weapp 等子项目引用
 */

export const BACKEND_PORT = 8080
export const ADMIN_PORT = 8000
export const MALL_PORT = 5174
export const MOBILE_PORT = 8081
export const MYSQL_PORT = 3306

export const BACKEND_HOST = '127.0.0.1'

export const API_BASE_URL = `http://${BACKEND_HOST}:${BACKEND_PORT}/api`

export const MALL_DEV_URL = `http://127.0.0.1:${MALL_PORT}`

export interface EnvFlags {
  NODE_ENV?: string
  UMI_ENV?: string
  VITE_ENV?: string
}

export function isDev(env: EnvFlags = readProcessEnv()): boolean {
  return env.NODE_ENV === 'development' || env.UMI_ENV === 'dev' || env.VITE_ENV === 'dev'
}

export function isTest(env: EnvFlags = readProcessEnv()): boolean {
  return env.NODE_ENV === 'test' || env.UMI_ENV === 'test'
}

export function isProduction(env: EnvFlags = readProcessEnv()): boolean {
  return env.NODE_ENV === 'production' || env.UMI_ENV === 'prod' || env.VITE_ENV === 'prod'
}

export * from './theme'

export function buildApiBaseUrl(options?: { host?: string; port?: number; prefix?: string }): string {
  const host = options?.host ?? BACKEND_HOST
  const port = options?.port ?? BACKEND_PORT
  const prefix = options?.prefix ?? '/api'
  return `http://${host}:${port}${prefix}`
}

function readProcessEnv(): EnvFlags {
  try {
    if (typeof process !== 'undefined' && process.env) {
      return {
        NODE_ENV: process.env.NODE_ENV,
        UMI_ENV: process.env.UMI_ENV,
        VITE_ENV: process.env.VITE_ENV,
      }
    }
  } catch {
    // ignore
  }
  return {}
}
