import { request } from './http'
import type { PageResult, Product, ShopInfo } from '../types/models'

export interface MallCategoryResponse {
  id: number
  name: string
  productCount: number
}

export interface MallHomeResponse {
  categories: MallCategoryResponse[]
  featured: Product[]
  memberDeals: Product[]
  newArrivals: Product[]
}

export interface MallProductListResponse {
  list: Product[]
  total: number
  page: number
  pageSize: number
}

export async function fetchHome() {
  return request<MallHomeResponse>({
    url: '/app/mall/home',
    method: 'GET',
  })
}

export async function fetchCategories() {
  return request<MallCategoryResponse[]>({
    url: '/app/mall/categories',
    method: 'GET',
  })
}

export async function fetchProducts(params?: {
  page?: number
  pageSize?: number
  keyword?: string
  categoryId?: number | string
  sortBy?: string
}) {
  return request<MallProductListResponse>({
    url: '/app/mall/products',
    method: 'GET',
    data: params,
  })
}

export async function fetchPublicProducts(params?: { page?: number; pageSize?: number }) {
  return request<PageResult<Product>>({
    url: '/mall/products',
    method: 'GET',
    data: params,
  })
}

export async function fetchProductById(id: string | number) {
  return request<Product>({
    url: `/app/mall/products/${id}`,
    method: 'GET',
  })
}

export async function fetchPublicProductById(id: string | number) {
  return request<Product>({
    url: `/mall/products/${id}`,
    method: 'GET',
  })
}

export async function fetchShop(merchantId: number) {
  return request<ShopInfo>({
    url: `/mall/shops/${merchantId}`,
    method: 'GET',
  })
}

export async function fetchShopProducts(merchantId: number, params?: { page?: number; pageSize?: number }) {
  return request<PageResult<Product>>({
    url: `/mall/shops/${merchantId}/products`,
    method: 'GET',
    data: params,
  })
}
