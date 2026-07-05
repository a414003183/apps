import { request } from '@umijs/max'
import type { ApiResponse, MetricCardItem } from '../../types/models'

function normalizeListResponse<T = unknown>(response: ApiResponse<T>, params?: { page?: number; pageSize?: number }) {
  const data = response.data as any
  if (Array.isArray(data)) {
    return {
      list: data,
      total: data.length,
      page: params?.page || 1,
      pageSize: params?.pageSize || 10,
    }
  }

  return data || { list: [], total: 0, page: params?.page || 1, pageSize: params?.pageSize || 10 }
}

interface MerchantSupplyImportPayload {
  supplierSkuId: number
  salePrice: number
  rebateRate?: number
  saleStatus?: string
}

interface MerchantAuthorizationApplyPayload {
  supplierId: number
  supplierSkuId: number
  remark?: string
}

function shouldRetryWithFallback(error: unknown) {
  const status = (error as { response?: { status?: number } })?.response?.status
  return status === undefined || status === 404 || status === 405
}

async function postWithFallback<T>(primaryUrl: string, fallbackUrl: string, data: unknown) {
  try {
    return await request<ApiResponse<T>>(primaryUrl, {
      method: 'POST',
      data,
    })
  } catch (error) {
    if (!shouldRetryWithFallback(error)) {
      throw error
    }

    return request<ApiResponse<T>>(fallbackUrl, {
      method: 'POST',
      data,
    })
  }
}

export async function fetchMerchantDashboard() {
  const response = await request<
    ApiResponse<{
      metrics: MetricCardItem[]
      recentOrders: any[]
      pendingAftersales: number
      lowStockGoods: number
    }>
  >('/api/member/merchant/dashboard', {
    method: 'GET',
  })
  return response.data
}

export async function fetchMerchantGoods(params?: {
  page?: number
  pageSize?: number
  keyword?: string
  status?: string
  categoryId?: number
}) {
  const response = await request<ApiResponse<any[]>>('/api/member/merchant/goods', {
    method: 'GET',
    params,
  })
  return normalizeListResponse(response, params)
}

export async function fetchMerchantGoodsDetail(goodsId: string) {
  const response = await request<ApiResponse<any>>(`/api/member/merchant/goods/${goodsId}`, {
    method: 'GET',
  })
  return response.data
}

export async function createMerchantProduct(payload: {
  brandId: number
  categoryId: number
  spuName: string
  skuName: string
  specText: string
  salePrice: number
  stockQty: number
  safetyStock: number
  freightAmount?: number
  description?: string
  keywords?: string
  detailContent?: string
  mainImageId?: number
  saleStatus?: string
  deliveryMode?: string
}) {
  const response = await request<ApiResponse<any>>('/api/member/merchant/goods', {
    method: 'POST',
    data: payload,
  })
  return response.data
}

export async function createMerchantGoods(payload: {
  productId: number
  skuId: number
  supplierId?: number
  costPrice?: number
  stock: number
  status?: string
}) {
  const response = await request<ApiResponse<any>>('/api/member/merchant/goods', {
    method: 'POST',
    data: payload,
  })
  return response.data
}

export async function updateMerchantGoods(goodsId: string, payload: any) {
  const response = await request<ApiResponse<any>>(`/api/member/merchant/goods/${goodsId}`, {
    method: 'PUT',
    data: payload,
  })
  return response.data
}

export async function deleteMerchantGoods(goodsId: string) {
  const response = await request<ApiResponse<any>>(`/api/member/merchant/goods/${goodsId}`, {
    method: 'DELETE',
  })
  return response.data
}

export async function fetchMerchantSupply(params?: { page?: number; pageSize?: number; status?: string }) {
  const response = await request<ApiResponse<any[]>>('/api/member/merchant/supply', {
    method: 'GET',
    params,
  })
  return normalizeListResponse(response, params)
}

export async function fetchMerchantSupplyCatalog(params?: { page?: number; pageSize?: number }) {
  const response = await request<ApiResponse<any[]>>('/api/member/merchant/supply/catalog', {
    method: 'GET',
    params,
  })
  return normalizeListResponse(response, params)
}

export async function fetchMerchantSupplyRelations(params?: {
  page?: number
  pageSize?: number
  supplierId?: number
  status?: string
}) {
  const response = await request<ApiResponse<any[]>>('/api/member/merchant/supply', {
    method: 'GET',
    params,
  })
  return normalizeListResponse(response, params)
}

export async function fetchPlatformSuppliers(params?: { page?: number; pageSize?: number; keyword?: string }) {
  const response = await request<ApiResponse<any[]>>('/api/platform/suppliers', {
    method: 'GET',
    params,
  })
  return normalizeListResponse(response, params)
}

export async function applyMerchantRelation(payload: { supplierId: number; remark?: string }) {
  const response = await request<ApiResponse<any>>('/api/member/merchant/supply/relations', {
    method: 'POST',
    data: payload,
  })
  return response.data
}

export async function createSupplyRequest(payload: { supplierId: number; supplierSkuIds: number[] }) {
  const response = await request<ApiResponse<any>>('/api/member/merchant/supply', {
    method: 'POST',
    data: payload,
  })
  return response.data
}

export async function importMerchantSupply(payload: MerchantSupplyImportPayload) {
  const response = await request<ApiResponse<any>>('/api/member/merchant/supply/import', {
    method: 'POST',
    data: payload,
  })
  return response.data
}

export async function applyMerchantAuthorization(payload: MerchantAuthorizationApplyPayload) {
  const response = await request<ApiResponse<any>>('/api/member/merchant/supply/authorizations', {
    method: 'POST',
    data: payload,
  })
  return response.data
}

export async function fetchGoodsAuthRules(params?: { page?: number; pageSize?: number }) {
  const response = await request<ApiResponse<any[]>>('/api/member/merchant/goods/auth', {
    method: 'GET',
    params,
  })
  return normalizeListResponse(response, params)
}

export async function saveGoodsAuthRule(payload: {
  authType: string
  targetId: number
  status?: string
  remark?: string
}) {
  const response = await request<ApiResponse<any>>('/api/member/merchant/goods/auth', {
    method: 'POST',
    data: payload,
  })
  return response.data
}

export async function fetchLevelDiscountRules(params?: { page?: number; pageSize?: number }) {
  const response = await request<ApiResponse<any[]>>('/api/member/merchant/pricing/level', {
    method: 'GET',
    params,
  })
  return normalizeListResponse(response, params)
}

export async function saveLevelDiscountRule(payload: {
  memberLevel: string
  targetType: string
  targetId: number
  discountRate: number
  status?: string
  remark?: string
}) {
  const response = await request<ApiResponse<any>>('/api/member/merchant/pricing/level', {
    method: 'POST',
    data: payload,
  })
  return response.data
}

export async function fetchCustomerPriceRules(params?: { page?: number; pageSize?: number }) {
  const response = await request<ApiResponse<any[]>>('/api/member/merchant/pricing/customer', {
    method: 'GET',
    params,
  })
  return normalizeListResponse(response, params)
}

export async function saveCustomerPriceRule(payload: {
  customerId: number
  skuId: number
  specialPrice: number
  status?: string
  remark?: string
}) {
  const response = await request<ApiResponse<any>>('/api/member/merchant/pricing/customer', {
    method: 'POST',
    data: payload,
  })
  return response.data
}

export async function fetchPricingOptions() {
  const response = await request<ApiResponse<any>>('/api/member/merchant/pricing/options', {
    method: 'GET',
  })
  return response.data ?? {}
}

// 更新定价规则状态
export async function updatePricingRuleStatus(
  ruleType: 'goods-auth' | 'level' | 'customer',
  ruleId: string,
  status: string,
) {
  const urlMap = {
    'goods-auth': '/api/member/merchant/goods/auth',
    level: '/api/member/merchant/pricing/level',
    customer: '/api/member/merchant/pricing/customer',
  }
  const response = await request<ApiResponse<any>>(`${urlMap[ruleType]}/${ruleId}/status`, {
    method: 'PUT',
    data: { status },
  })
  return response.data
}

export async function fetchMerchantReports(params?: { startDate?: string; endDate?: string; reportType?: string }) {
  const response = await request<ApiResponse<any>>('/api/member/merchant/reports', {
    method: 'GET',
    params,
  })
  return response.data
}

export async function fetchMerchantProfile() {
  const response = await request<ApiResponse<any>>('/api/member/merchant/profile', {
    method: 'GET',
  })
  return response.data
}

export async function updateMerchantProfile(payload: any) {
  const response = await request<ApiResponse<any>>('/api/member/merchant/profile', {
    method: 'PUT',
    data: payload,
  })
  return response.data
}

export async function fetchMerchantShipping(params?: { page?: number; pageSize?: number; status?: string }) {
  const response = await request<ApiResponse<any[]>>('/api/member/merchant/shipping', {
    method: 'GET',
    params,
  })
  return normalizeListResponse(response, params)
}
