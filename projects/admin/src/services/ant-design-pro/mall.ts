import { request } from '@umijs/max'
import type { ApiResponse, Product } from '../../types/models'

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

// 商城相关API

// 获取商品列表
export async function fetchMallProducts(params: {
  page?: number
  pageSize?: number
  keyword?: string
  categoryId?: number
  brandId?: number
  minPrice?: number
  maxPrice?: number
  sortBy?: string
  sortOrder?: string
}) {
  const response = await request<ApiResponse<any[]>>('/api/mall/products', {
    method: 'GET',
    params,
  })
  return normalizeListResponse(response, params)
}

// 获取商品详情
export async function fetchMallProductDetail(productId: number) {
  const response = await request<ApiResponse<Product>>(`/api/mall/products/${productId}`, {
    method: 'GET',
  })
  return response.data
}

// 获取商品SKU详情
export async function fetchMallProductSku(skuId: number) {
  const response = await request<ApiResponse<any>>(`/api/mall/skus/${skuId}`, {
    method: 'GET',
  })
  return response.data
}

// 搜索商品
export async function searchMallProducts(keyword: string, page = 1, pageSize = 20) {
  return fetchMallProducts({ keyword, page, pageSize })
}

// 获取首页推荐商品
export async function fetchFeaturedProducts(limit = 8) {
  const response = await request<ApiResponse<Product[]>>('/api/mall/products/featured', {
    method: 'GET',
    params: { limit },
  })
  return Array.isArray(response.data) ? response.data : []
}

// 获取商品分类
export async function fetchMallCategories() {
  const response = await request<ApiResponse<any[]>>('/api/mall/categories', {
    method: 'GET',
  })
  return Array.isArray(response.data) ? response.data : []
}

// 获取商品品牌
export async function fetchMallBrands(categoryId?: number) {
  const response = await request<ApiResponse<any[]>>('/api/mall/brands', {
    method: 'GET',
    params: categoryId ? { categoryId } : undefined,
  })
  return Array.isArray(response.data) ? response.data : []
}

// 获取店铺信息
export async function fetchShopInfo(merchantId: number) {
  const response = await request<ApiResponse<any>>(`/api/mall/shops/${merchantId}`, {
    method: 'GET',
  })
  return response.data
}

// 获取店铺商品列表
export async function fetchShopProducts(merchantId: number, params?: any) {
  const response = await request<ApiResponse<any[]>>(`/api/mall/shops/${merchantId}/products`, {
    method: 'GET',
    params,
  })
  return normalizeListResponse(response, params)
}
