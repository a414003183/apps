import Taro from '@tarojs/taro'
import type { ApiResponse } from '../types/models'

declare const API_BASE_URL: string
declare const FILE_BASE_URL: string

const API_BASE_URL_VALUE = API_BASE_URL
const FILE_BASE_URL_VALUE = FILE_BASE_URL

let authToken = ''

export function setAuthToken(token: string) {
  authToken = token
}

export function getAuthToken() {
  return authToken
}

export function resolveFileUrl(fileId?: number | string) {
  if (!fileId) return ''
  return `${FILE_BASE_URL_VALUE}/${fileId}`
}

export async function request<T>(options: Taro.request.Option) {
  const header: TaroGeneral.IAnyObject = {
    'Content-Type': 'application/json',
    ...(options.header || {}),
  }

  const token = authToken || Taro.getStorageSync<string>('telecom-scm-weapp-token')
  if (token) {
    header.Authorization = `Bearer ${token}`
  }

  const response = await Taro.request<ApiResponse<T>>({
    ...options,
    url: `${API_BASE_URL_VALUE}${options.url}`,
    header,
    timeout: options.timeout || 15000,
  })

  const { statusCode, data } = response

  if (statusCode >= 200 && statusCode < 300 && data.code === 200) {
    return data.data
  }

  const message = data?.message || `请求失败 (${statusCode})`
  throw new Error(message)
}

export async function uploadFile(filePath: string, bizType?: string, bizId?: string | number) {
  const token = authToken || Taro.getStorageSync<string>('telecom-scm-weapp-token')

  return Taro.uploadFile({
    url: `${API_BASE_URL_VALUE}/files/upload`,
    filePath,
    name: 'file',
    header: token ? { Authorization: `Bearer ${token}` } : {},
    formData: {
      ...(bizType ? { bizType } : {}),
      ...(bizId ? { bizId: String(bizId) } : {}),
    },
  })
}
