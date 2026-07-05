import { createApiClient, createFileApi, createMallApi } from '@apps/api'
import { localStorageAdapter, resolveFileUrl as resolveFileUrlBase } from '@apps/utils'

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api'

export const api = createApiClient({
  baseURL: API_BASE_URL,
  storage: localStorageAdapter,
  tokenKey: 'telecom-scm-auth-token',
})

export const http = api.client
export const fileApi = createFileApi(api)
export const mallApi = createMallApi(api, { prefix: '/mall' })

export function resolveFileUrl(fileId?: number) {
  return resolveFileUrlBase(API_BASE_URL, fileId)
}
