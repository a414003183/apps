import { createApiClient, createFileApi, createMallApi } from '@apps/api'
import { createSecureStoreAdapter } from '@apps/utils'
import * as SecureStore from 'expo-secure-store'

// 优先从 .env 读取，模拟器默认用 10.0.2.2，真机请设置电脑实际局域网 IP
const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://10.0.2.2:8080/api'

export const api = createApiClient({
  baseURL: BASE_URL,
  storage: createSecureStoreAdapter(() => SecureStore),
  tokenKey: 'auth_token',
})

export default api.client
export const fileApi = createFileApi(api)
export const mallApi = createMallApi(api, { prefix: '/app/mall' })
