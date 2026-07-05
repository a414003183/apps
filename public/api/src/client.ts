import axios from 'axios'
import type { ApiResponse } from '@apps/types'
import type { StorageAdapter } from '@apps/utils'

export interface ApiClientOptions {
  baseURL: string
  storage: StorageAdapter
  tokenKey?: string
  timeout?: number
}

export interface ApiClient {
  client: ReturnType<typeof axios.create>
  request: <T>(method: string, url: string, data?: unknown, config?: unknown) => Promise<T>
  get: <T>(url: string, params?: unknown) => Promise<T>
  post: <T>(url: string, data?: unknown) => Promise<T>
  put: <T>(url: string, data?: unknown) => Promise<T>
  del: <T>(url: string) => Promise<T>
}

export function createApiClient(options: ApiClientOptions): ApiClient {
  const { baseURL, storage, tokenKey = 'telecom-scm-auth-token', timeout = 15000 } = options
  const client = axios.create({ baseURL, timeout })

  client.interceptors.request.use(async (config) => {
    const token = await storage.getItem(tokenKey)
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  })

  async function request<T>(method: string, url: string, data?: unknown, config?: unknown): Promise<T> {
    const axiosConfig = config && typeof config === 'object' ? { ...(config as object), method, url } : { method, url }
    const response = await client.request<ApiResponse<T>>({ ...axiosConfig, data })
    const payload = response.data
    if (payload.code !== 200) {
      throw new Error(payload.message || `请求失败 (${payload.code})`)
    }
    return payload.data
  }

  return {
    client,
    request,
    get: (url, params) => request('GET', url, undefined, { params }),
    post: (url, data) => request('POST', url, data),
    put: (url, data) => request('PUT', url, data),
    del: (url) => request('DELETE', url),
  }
}
