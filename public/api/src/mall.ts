import type { CreateOrderResult, MallCartItem, PageResult, Product, ShopInfo } from '@apps/types'
import type { ApiClient } from './client'

export interface MallApiOptions {
  prefix?: string
}

export interface ProductListParams {
  page?: number
  pageSize?: number
  keyword?: string
  categoryId?: number | string
  sortBy?: string
  sortOrder?: string
}

export interface AddCartItemPayload {
  merchantGoodsId: number
  quantity: number
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

export interface DirectBuyPayload extends CheckoutPayload {
  merchantGoodsId: number
  skuId: number
  quantity: number
}

export interface MallApi {
  fetchProductById(id: string | number): Promise<Product>
  fetchShop(merchantId: number): Promise<ShopInfo>
  fetchShopProducts(merchantId: number, params?: { page?: number; pageSize?: number }): Promise<PageResult<Product>>
  addCartItem(payload: AddCartItemPayload): Promise<MallCartItem[]>
  updateCartItem(merchantGoodsId: number, quantity: number): Promise<MallCartItem[]>
  removeCartItem(merchantGoodsId: number): Promise<MallCartItem[]>
  checkout(payload: CheckoutPayload): Promise<CreateOrderResult>
  directBuy(payload: DirectBuyPayload): Promise<CreateOrderResult>
}

export function createMallApi(api: ApiClient, options: MallApiOptions = {}): MallApi {
  const prefix = options.prefix ?? '/mall'

  return {
    fetchProductById(id) {
      return api.get<Product>(`${prefix}/products/${id}`)
    },
    fetchShop(merchantId) {
      return api.get<ShopInfo>(`${prefix}/shops/${merchantId}`)
    },
    fetchShopProducts(merchantId, params) {
      return api.get<PageResult<Product>>(`${prefix}/shops/${merchantId}/products`, params)
    },
    addCartItem(payload) {
      return api.post<MallCartItem[]>(`${prefix}/cart`, payload)
    },
    updateCartItem(merchantGoodsId, quantity) {
      return api.put<MallCartItem[]>(`${prefix}/cart/${merchantGoodsId}`, { quantity })
    },
    removeCartItem(merchantGoodsId) {
      return api.del<MallCartItem[]>(`${prefix}/cart/${merchantGoodsId}`)
    },
    checkout(payload) {
      return api.post<CreateOrderResult>(`${prefix}/cart/checkout`, payload)
    },
    directBuy(payload) {
      return api.post<CreateOrderResult>(`${prefix}/cart/direct-buy`, payload)
    },
  }
}
