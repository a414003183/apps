import { request } from '@umijs/max'
import type { ApiResponse, MallCartItem } from '../../types/models'

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

// 购物车相关API

// 获取购物车列表
export async function fetchCartItems(params?: { page?: number; pageSize?: number }) {
  const response = await request<ApiResponse<MallCartItem[]>>('/api/mall/cart/items', {
    method: 'GET',
    params,
  })
  return normalizeListResponse(response, params)
}

// 添加商品到购物车
export async function addCartItem(payload: { merchantGoodsId: number; skuId: number; quantity: number }) {
  const response = await request<ApiResponse<any>>('/api/mall/cart/items', {
    method: 'POST',
    data: payload,
  })
  return response.data
}

// 更新购物车商品数量
export async function updateCartItem(cartItemId: string, quantity: number) {
  const response = await request<ApiResponse<any>>(`/api/mall/cart/items/${cartItemId}`, {
    method: 'PUT',
    data: { quantity },
  })
  return response.data
}

// 删除购物车商品
export async function removeCartItem(cartItemId: string) {
  const response = await request<ApiResponse<any>>(`/api/mall/cart/items/${cartItemId}`, {
    method: 'DELETE',
  })
  return response.data
}

// 清空购物车
export async function clearCart() {
  const response = await request<ApiResponse<any>>('/api/mall/cart/clear', {
    method: 'POST',
  })
  return response.data
}

// 批量删除购物车商品
export async function removeCartItems(cartItemIds: string[]) {
  const response = await request<ApiResponse<any>>('/api/mall/cart/items/batch', {
    method: 'DELETE',
    data: { cartItemIds },
  })
  return response.data
}

// 获取购物车商品数量
export async function fetchCartItemCount() {
  const response = await request<ApiResponse<{ count: number }>>('/api/mall/cart/count', {
    method: 'GET',
  })
  return response.data
}

// 购物车结算下单
export async function checkoutCart(payload: {
  receiverName: string
  receiverPhone: string
  receiverProvince: string
  receiverCity: string
  receiverDistrict: string
  receiverAddress: string
  payMethod: string
  customerRemark?: string
  contractFileId?: number
  usePoints?: boolean
  selectedMerchantGoodsIds?: number[]
}) {
  const response = await request<ApiResponse<any>>('/api/mall/cart/checkout', {
    method: 'POST',
    data: payload,
  })
  return response.data
}
