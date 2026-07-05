import { http } from './http'
import { mallApi } from './http'
import type { ApiResponse, MallCartItem, PageResult, Product } from '../types/models'

export const fetchProductById = mallApi.fetchProductById
export const fetchShop = mallApi.fetchShop
export const fetchShopProducts = mallApi.fetchShopProducts
export const addMallCartItem = mallApi.addCartItem
export const updateMallCartItem = mallApi.updateCartItem
export const removeMallCartItem = mallApi.removeCartItem
export const checkoutMallCart = mallApi.checkout
export const directBuyMallCart = mallApi.directBuy

export type { CheckoutPayload, DirectBuyPayload } from '@apps/api'

export async function fetchProducts(params?: {
  page?: number
  pageSize?: number
  keyword?: string
  categoryId?: number | string
  sortBy?: string
  sortOrder?: string
}) {
  const response = await http.get<ApiResponse<PageResult<Product> | Product[]>>('/mall/products', { params })
  return response.data.data
}

export async function fetchMallCart(params?: { page?: number; pageSize?: number }) {
  const response = await http.get<ApiResponse<PageResult<MallCartItem>>>('/mall/cart', { params })
  return response.data.data
}

export async function registerCustomerPayment(
  orderId: string,
  payload: {
    payMethod: string
    transactionNo: string
    voucherFileId?: number
    remark?: string
  },
) {
  const response = await http.post<ApiResponse<any>>(`/member/customer/orders/${orderId}/payment-register`, payload)
  return response.data.data
}

export async function fetchCustomerOrderDetail(orderId: string) {
  const response = await http.get<ApiResponse<Record<string, unknown>>>(`/app/customer/orders/${orderId}`)
  return response.data.data
}

export async function fetchCustomerPoints() {
  const response = await http.get<ApiResponse<any>>('/member/customer/points')
  return response.data.data
}
