import client, { mallApi } from './client'
import type { ApiResponse, HomeData, Product, MallCartItem } from '../types/api'

export const fetchProductDetail = mallApi.fetchProductById
export const fetchShop = mallApi.fetchShop
export const fetchShopProducts = mallApi.fetchShopProducts
export const addCartItem = mallApi.addCartItem
export const updateCartItem = mallApi.updateCartItem
export const removeCartItem = mallApi.removeCartItem
export const directBuy = mallApi.directBuy
export const checkout = mallApi.checkout

export async function fetchHomeData(): Promise<HomeData> {
  const response = await client.get<ApiResponse<HomeData>>('/app/mall/home')
  if (response.data.code !== 200) throw new Error(response.data.message)
  return response.data.data
}

export async function fetchCategories(): Promise<Array<{ id: number; name: string; parentId: number }>> {
  const response = await client.get<ApiResponse<any[]>>('/app/mall/categories')
  if (response.data.code !== 200) throw new Error(response.data.message)
  return response.data.data
}

export async function fetchProducts(params: {
  keyword?: string
  categoryId?: number | string
  sortBy?: string
  sortOrder?: string
  page?: number
  pageSize?: number
}): Promise<{ list: Product[]; total: number; page: number; pageSize: number }> {
  const response = await client.get<ApiResponse<any>>('/app/mall/products', { params })
  if (response.data.code !== 200) throw new Error(response.data.message)
  return response.data.data
}

export async function fetchCart(): Promise<MallCartItem[]> {
  const response = await client.get<ApiResponse<MallCartItem[]>>('/app/mall/cart')
  if (response.data.code !== 200) throw new Error(response.data.message)
  return response.data.data
}
