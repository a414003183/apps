import { request } from '@umijs/max'
import type { ApiResponse, AftersaleItem } from '../../types/models'

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

// 售后相关API

// 获取客户售后列表
export async function fetchCustomerAftersales(params?: { page?: number; pageSize?: number; status?: string }) {
  const response = await request<ApiResponse<any[]>>('/api/member/customer/aftersales', {
    method: 'GET',
    params,
  })
  return normalizeListResponse(response, params)
}

// 获取售后详情
export async function fetchAftersaleDetail(aftersaleId: string) {
  const response = await request<ApiResponse<any>>(`/api/member/customer/aftersales/${aftersaleId}`, {
    method: 'GET',
  })
  return response.data
}

// 创建售后申请
export async function createAftersale(payload: {
  orderId: string
  aftersaleType: 'REFUND_ONLY' | 'RETURN_REFUND'
  reasonType: string
  reasonDesc?: string
  applyAmount: number
  attachmentFileId?: number
}) {
  const response = await request<ApiResponse<any>>('/api/member/customer/aftersales', {
    method: 'POST',
    data: payload,
  })
  return response.data
}

// 取消售后申请
export async function cancelAftersale(aftersaleId: string) {
  const response = await request<ApiResponse<any>>(`/api/member/customer/aftersales/${aftersaleId}/cancel`, {
    method: 'POST',
  })
  return response.data
}

// 填写退货物流
export async function submitReturnShipment(aftersaleId: string, logisticsCompany: string, trackingNumber: string) {
  const response = await request<ApiResponse<any>>(`/api/member/customer/aftersales/${aftersaleId}/return-shipment`, {
    method: 'POST',
    data: { logisticsCompany, trackingNumber },
  })
  return response.data
}

// 获取商家售后列表
export async function fetchMerchantAftersales(params?: { page?: number; pageSize?: number; status?: string }) {
  const response = await request<ApiResponse<any[]>>('/api/member/merchant/aftersales', {
    method: 'GET',
    params,
  })
  return normalizeListResponse(response, params)
}

// 商家审批售后
export async function approveAftersale(aftersaleId: string, approved: boolean, remark?: string) {
  const response = await request<ApiResponse<any>>(`/api/member/merchant/aftersales/${aftersaleId}/approve`, {
    method: 'POST',
    data: { approved, remark },
  })
  return response.data
}

// 商家拒绝售后
export async function rejectAftersale(aftersaleId: string, reason: string) {
  const response = await request<ApiResponse<any>>(`/api/member/merchant/aftersales/${aftersaleId}/reject`, {
    method: 'POST',
    data: { reason },
  })
  return response.data
}

// 商家确认收货
export async function confirmReturnReceive(aftersaleId: string) {
  const response = await request<ApiResponse<any>>(`/api/member/merchant/aftersales/${aftersaleId}/receive-return`, {
    method: 'POST',
  })
  return response.data
}

// 商家退款
export async function refundAftersale(
  aftersaleId: string,
  payload: {
    payMethod: string
    transactionNo: string
    remark?: string
  },
) {
  const response = await request<ApiResponse<any>>(`/api/member/merchant/aftersales/${aftersaleId}/refund`, {
    method: 'POST',
    data: payload,
  })
  return response.data
}
