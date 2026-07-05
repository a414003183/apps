import type { ApiResponse } from '../types/models'

/**
 * 统一处理后端返回数组的情况
 * 后端可能返回两种格式:
 * 1. 直接返回数组: [item1, item2, ...]
 * 2. 返回分页对象: { list: [...], total: number, page: number, pageSize: number }
 */
export function normalizeListResponse<T = any>(
  response: ApiResponse<T>,
  params?: { page?: number; pageSize?: number },
) {
  const data = response.data as any
  if (Array.isArray(data)) {
    return {
      list: data,
      total: data.length,
      page: params?.page || 1,
      pageSize: params?.pageSize || 10,
    }
  }
  // 如果后端已经返回了分页对象
  return data || { list: [], total: 0, page: 1, pageSize: 10 }
}

/**
 * 获取API响应中的data字段
 * 用于不需要分页包装的API响应
 */
export function getResponseData<T>(response: ApiResponse<T>): T | undefined {
  return response.data
}
