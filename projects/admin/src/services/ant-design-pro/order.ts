import { request } from '@umijs/max'
import type { ApiResponse, OrderItem, OrderTimelineEvent } from '../../types/models'

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

// 订单相关API

// 获取客户订单列表
export async function fetchCustomerOrders(params?: {
  page?: number
  pageSize?: number
  status?: string
  keyword?: string
  startDate?: string
  endDate?: string
}) {
  const response = await request<ApiResponse<any[]>>('/api/member/customer/orders', {
    method: 'GET',
    params,
  })
  return normalizeListResponse(response, params)
}

// 获取订单详情
export async function fetchOrderDetail(orderId: string) {
  const response = await request<ApiResponse<any>>(`/api/app/customer/orders/${orderId}`, {
    method: 'GET',
  })
  return response.data
}

// 创建订单
export async function createOrder(payload: {
  cartItemIds?: string[]
  addressId: number
  remark?: string
  paymentMethod: string
}) {
  const response = await request<ApiResponse<any>>('/api/member/customer/orders', {
    method: 'POST',
    data: payload,
  })
  return response.data
}

// 取消订单
export async function cancelOrder(orderId: string, reason: string) {
  const response = await request<ApiResponse<any>>(`/api/member/customer/orders/${orderId}/cancel`, {
    method: 'POST',
    data: { reason },
  })
  return response.data
}

// 确认收货
export async function confirmReceive(orderId: string) {
  const response = await request<ApiResponse<any>>(`/api/member/customer/orders/${orderId}/confirm-receive`, {
    method: 'POST',
  })
  return response.data
}

// 客户登记支付凭证
export async function registerCustomerPayment(
  orderId: string,
  payload: {
    payMethod: string
    transactionNo: string
    voucherFileId?: number
    remark?: string
  },
) {
  const response = await request<ApiResponse<any>>(`/api/member/customer/orders/${orderId}/payment-register`, {
    method: 'POST',
    data: payload,
  })
  return response.data
}

// 获取订单时间线
export async function fetchOrderTimeline(orderId: string) {
  const response = await request<ApiResponse<OrderTimelineEvent[]>>(`/api/orders/${orderId}/timeline`, {
    method: 'GET',
  })
  return Array.isArray(response.data) ? response.data : []
}

// 获取商家订单列表
export async function fetchMerchantOrders(params?: {
  page?: number
  pageSize?: number
  status?: string
  keyword?: string
  startDate?: string
  endDate?: string
}) {
  const response = await request<ApiResponse<any[]>>('/api/member/merchant/orders', {
    method: 'GET',
    params,
  })
  return normalizeListResponse(response, params)
}

// 获取商家订单详情
export async function fetchMerchantOrderDetail(orderId: string) {
  const response = await request<ApiResponse<any>>(`/api/member/merchant/orders/${orderId}/detail`, {
    method: 'GET',
  })
  return response.data
}

// 商家审批订单
export async function approveOrder(orderId: string, approved: boolean, remark?: string) {
  const response = await request<ApiResponse<any>>(`/api/member/merchant/orders/${orderId}/approve`, {
    method: 'POST',
    data: { approved, remark },
  })
  return response.data
}

// 商家发货
export async function shipOrder(orderId: string, carrierName: string, trackingNo: string) {
  const response = await request<ApiResponse<any>>(`/api/member/merchant/orders/${orderId}/ship`, {
    method: 'POST',
    data: { carrierName, trackingNo },
  })
  return response.data
}

// 商家修改订单
export async function updateMerchantOrder(orderId: string, payload: any) {
  const response = await request<ApiResponse<any>>(`/api/member/merchant/orders/${orderId}`, {
    method: 'PUT',
    data: payload,
  })
  return response.data
}

// 商家修改订单商品
export async function updateOrderItem(orderId: string, itemId: string, payload: any) {
  const response = await request<ApiResponse<any>>(`/api/member/merchant/orders/${orderId}/items/${itemId}`, {
    method: 'PUT',
    data: payload,
  })
  return response.data
}

// 绑定订单合同
export async function bindOrderContract(orderId: string, contractId: number) {
  const response = await request<ApiResponse<any>>(`/api/member/merchant/orders/${orderId}/contract`, {
    method: 'POST',
    data: { contractId },
  })
  return response.data
}
