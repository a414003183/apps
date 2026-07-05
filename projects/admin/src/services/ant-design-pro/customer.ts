import { request } from '@umijs/max'
import type { ApiResponse, MetricCardItem } from '../../types/models'

// 辅助函数：统一处理后端返回数组的情况
function normalizeListResponse<T = any>(response: ApiResponse<T>, params?: { page?: number; pageSize?: number }) {
  const data = response.data as any
  if (Array.isArray(data)) {
    return {
      list: data,
      total: data.length,
      page: params?.page || 1,
      pageSize: params?.pageSize || 10,
    }
  }
  return data || { list: [], total: 0, page: 1, pageSize: 10 }
}

// 客户中心相关API

// 获取客户工作台数据
export async function fetchCustomerDashboard() {
  const response = await request<
    ApiResponse<{
      metrics: MetricCardItem[]
      recentOrders: any[]
      pendingAftersales: number
      points: number
    }>
  >('/api/member/customer/dashboard', {
    method: 'GET',
  })
  // Dashboard返回对象，不需要normalizeListResponse包装
  return response.data
}

// 获取客户资料
export async function fetchCustomerProfile() {
  const response = await request<ApiResponse<any>>('/api/member/customer/profile', {
    method: 'GET',
  })
  return response.data
}

// 更新客户资料
export async function updateCustomerProfile(payload: {
  companyName?: string
  contactName?: string
  contactPhone?: string
  email?: string
  address?: string
}) {
  const response = await request<ApiResponse<any>>('/api/member/customer/profile', {
    method: 'PUT',
    data: payload,
  })
  return response.data
}

// 获取客户地址列表
export async function fetchCustomerAddresses() {
  const response = await request<ApiResponse<any[]>>('/api/member/customer/addresses', {
    method: 'GET',
  })
  return Array.isArray(response.data) ? response.data : []
}

// 添加客户地址
export async function addCustomerAddress(payload: {
  receiverName: string
  phone: string
  province: string
  city: string
  district: string
  detailAddress: string
  isDefault?: boolean
}) {
  const response = await request<ApiResponse<any>>('/api/member/customer/addresses', {
    method: 'POST',
    data: payload,
  })
  return response.data
}

// 更新客户地址
export async function updateCustomerAddress(addressId: string, payload: any) {
  const response = await request<ApiResponse<any>>(`/api/member/customer/addresses/${addressId}`, {
    method: 'PUT',
    data: payload,
  })
  return response.data
}

// 删除客户地址
export async function deleteCustomerAddress(addressId: string) {
  const response = await request<ApiResponse<any>>(`/api/member/customer/addresses/${addressId}`, {
    method: 'DELETE',
  })
  return response.data
}

// 设置默认地址
export async function setDefaultAddress(addressId: string) {
  const response = await request<ApiResponse<any>>(`/api/member/customer/addresses/${addressId}/default`, {
    method: 'POST',
  })
  return response.data
}

// 获取客户收藏
export async function fetchCustomerFavorites(params?: { page?: number; pageSize?: number }) {
  const response = await request<ApiResponse<any[]>>('/api/member/customer/favorites', {
    method: 'GET',
    params,
  })
  return normalizeListResponse(response, params)
}

// 添加收藏
export async function addFavorite(merchantGoodsId: number) {
  const response = await request<ApiResponse<any>>('/api/member/customer/favorites', {
    method: 'POST',
    data: { merchantGoodsId },
  })
  return response.data
}

// 取消收藏
export async function removeFavorite(favoriteId: string) {
  const response = await request<ApiResponse<any>>(`/api/member/customer/favorites/${favoriteId}`, {
    method: 'DELETE',
  })
  return response.data
}

// 获取客户等级信息
export async function fetchCustomerLevel() {
  const response = await request<ApiResponse<any>>('/api/member/customer/level', {
    method: 'GET',
  })
  return response.data
}

// 获取客户发票信息
export async function fetchCustomerInvoices() {
  const response = await request<ApiResponse<any[]>>('/api/member/customer/invoices', {
    method: 'GET',
  })
  return Array.isArray(response.data) ? response.data : []
}

// 添加发票信息
export async function addCustomerInvoice(payload: {
  invoiceType: 'PERSONAL' | 'COMPANY'
  title?: string
  taxId?: string
  receiverPhone: string
  receiverEmail: string
  address: string
}) {
  const response = await request<ApiResponse<any>>('/api/member/customer/invoices', {
    method: 'POST',
    data: payload,
  })
  return response.data
}
