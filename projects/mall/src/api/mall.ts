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

const CATALOG_PAGE_SIZE = 100
const MAX_CATALOG_PRODUCTS = 500

// 首页要按全量商品算分类树和各榜单，而列表接口按页返回，这里翻完所有页
export async function fetchAllProducts() {
  const firstPage = await fetchProducts({ page: 1, pageSize: CATALOG_PAGE_SIZE })

  if (Array.isArray(firstPage)) {
    return firstPage
  }

  const products = [...firstPage.list]
  const total = firstPage.total ?? products.length

  for (let page = 2; products.length < total && products.length < MAX_CATALOG_PRODUCTS; page += 1) {
    const nextPage = await fetchProducts({ page, pageSize: CATALOG_PAGE_SIZE })
    const nextProducts = Array.isArray(nextPage) ? nextPage : nextPage.list

    if (nextProducts.length === 0) {
      break
    }

    products.push(...nextProducts)
  }

  return products
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
