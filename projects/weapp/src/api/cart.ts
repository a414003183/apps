import { request } from './http'
import type { CreateOrderResult, MallCartItem, PageResult } from '../types/models'

export async function fetchCart(params?: { page?: number; pageSize?: number }) {
  return request<PageResult<MallCartItem>>({
    url: '/app/mall/cart',
    method: 'GET',
    data: params,
  })
}

export async function addCartItem(payload: { merchantGoodsId: number; quantity: number }) {
  return request<MallCartItem[]>({
    url: '/app/mall/cart',
    method: 'POST',
    data: payload,
  })
}

export async function updateCartItem(merchantGoodsId: number, quantity: number) {
  return request<MallCartItem[]>({
    url: `/app/mall/cart/${merchantGoodsId}`,
    method: 'PUT',
    data: { quantity },
  })
}

export async function removeCartItem(merchantGoodsId: number) {
  return request<void>({
    url: `/app/mall/cart/${merchantGoodsId}`,
    method: 'DELETE',
  })
}

export interface CheckoutPayload {
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
}

export async function checkoutCart(payload: CheckoutPayload) {
  return request<CreateOrderResult>({
    url: '/app/mall/cart/checkout',
    method: 'POST',
    data: payload,
  })
}

export interface DirectBuyPayload {
  merchantGoodsId: number
  skuId: number
  quantity: number
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
}

export async function directBuy(payload: DirectBuyPayload) {
  return request<CreateOrderResult>({
    url: '/app/mall/cart/direct-buy',
    method: 'POST',
    data: payload,
  })
}
