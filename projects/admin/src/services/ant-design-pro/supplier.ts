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

interface SupplierProductPayload {
  brandId: number
  categoryId: number
  spuName: string
  skuName: string
  specText: string
  basePrice: number
  description?: string
  keywords?: string
  detailContent?: string
  mainImageId?: number
  imageIds?: number[]
  stockQty: number
  safetyStock: number
}

interface OptionItem {
  value: number | string
  label: string
}

function normalizeOptions(items: any[], valueKeys: string[], labelKeys: string[]) {
  return items
    .map((item) => {
      const valueKey = valueKeys.find((key) => item?.[key] !== undefined)
      const labelKey = labelKeys.find((key) => item?.[key] !== undefined)
      if (!valueKey || !labelKey) {
        return null
      }

      return {
        value: item[valueKey],
        label: String(item[labelKey]),
      } satisfies OptionItem
    })
    .filter((item): item is OptionItem => item !== null)
}

function shouldRetryWithFallback(error: unknown) {
  const status = (error as { response?: { status?: number } })?.response?.status
  return status === undefined || status === 404 || status === 405
}

export async function fetchSupplierDashboard() {
  const response = await request<
    ApiResponse<{
      metrics: MetricCardItem[]
      pendingAuthorizations: number
      activeCooperations: number
    }>
  >('/api/member/supplier/dashboard', {
    method: 'GET',
  })
  return response.data
}

export async function fetchSupplierProducts(params?: {
  page?: number
  pageSize?: number
  keyword?: string
  categoryId?: number
  status?: string
}) {
  const response = await request<ApiResponse<any[]>>('/api/member/supplier/products', {
    method: 'GET',
    params,
  })
  return normalizeListResponse(response, params)
}

export async function fetchSupplierProductDetail(productId: string) {
  const response = await request<ApiResponse<any>>(`/api/member/supplier/products/${productId}`, {
    method: 'GET',
  })
  return response.data
}

export async function fetchSupplierProductOptions() {
  try {
    const response = await request<ApiResponse<{ brands?: any[]; categories?: any[] }>>(
      '/api/member/supplier/product-options',
      {
        method: 'GET',
      },
    )
    const data = response.data ?? {}

    return {
      brands: normalizeOptions(
        Array.isArray(data.brands) ? data.brands : [],
        ['value', 'id', 'brandId'],
        ['label', 'brandName', 'name'],
      ),
      categories: normalizeOptions(
        Array.isArray(data.categories) ? data.categories : [],
        ['value', 'id', 'categoryId'],
        ['label', 'categoryName', 'name'],
      ),
    }
  } catch (error) {
    if (!shouldRetryWithFallback(error)) {
      throw error
    }

    const [brandsResponse, categoriesResponse] = await Promise.all([
      request<ApiResponse<any[]>>('/api/admin/products/brands', {
        method: 'GET',
      }),
      request<ApiResponse<any[]>>('/api/admin/products/categories', {
        method: 'GET',
      }),
    ])

    return {
      brands: normalizeOptions(
        Array.isArray(brandsResponse.data) ? brandsResponse.data : [],
        ['value', 'id', 'brandId'],
        ['label', 'brandName', 'name'],
      ),
      categories: normalizeOptions(
        Array.isArray(categoriesResponse.data) ? categoriesResponse.data : [],
        ['value', 'id', 'categoryId'],
        ['label', 'categoryName', 'name'],
      ),
    }
  }
}

export async function createSupplierProduct(payload: SupplierProductPayload) {
  const response = await request<ApiResponse<any>>('/api/member/supplier/products', {
    method: 'POST',
    data: payload,
  })
  return response.data
}

export async function updateSupplierProduct(productId: string, payload: SupplierProductPayload) {
  const response = await request<ApiResponse<any>>(`/api/member/supplier/products/${productId}`, {
    method: 'PUT',
    data: payload,
  })
  return response.data
}

export async function deleteSupplierProduct(productId: string) {
  const response = await request<ApiResponse<any>>(`/api/member/supplier/products/${productId}`, {
    method: 'DELETE',
  })
  return response.data
}

export async function fetchSupplyStatus(params?: {
  page?: number
  pageSize?: number
  merchantId?: number
  status?: string
}) {
  const response = await request<ApiResponse<any[]>>('/api/member/supplier/supply-status', {
    method: 'GET',
    params,
  })
  return normalizeListResponse(response, params)
}

export async function fetchSupplierCooperations(params?: { page?: number; pageSize?: number; status?: string }) {
  const response = await request<ApiResponse<any[]>>('/api/member/supplier/cooperation', {
    method: 'GET',
    params,
  })
  return normalizeListResponse(response, params)
}

export async function fetchCooperationRelations(params?: {
  page?: number
  pageSize?: number
  merchantId?: number
  status?: string
}) {
  const response = await request<ApiResponse<any[]>>('/api/member/supplier/cooperation/relations', {
    method: 'GET',
    params,
  })
  return normalizeListResponse(response, params)
}

export async function fetchSupplierAuthorizations(params?: {
  page?: number
  pageSize?: number
  merchantId?: number
  status?: string
}) {
  const response = await request<ApiResponse<any[]>>('/api/member/supplier/cooperation/authorizations', {
    method: 'GET',
    params,
  })
  return normalizeListResponse(response, params)
}

export async function saveSupplierAuthorization(payload: {
  merchantId: number
  supplierSkuId: number
  authorizedPrice: number
  allocatedStockQty?: number
  authStatus?: string
  remark?: string
}) {
  const response = await request<ApiResponse<any>>('/api/member/supplier/cooperation/authorizations', {
    method: 'POST',
    data: payload,
  })
  return response.data
}

export async function revokeAuthorization(authorizationId: string) {
  const response = await request<ApiResponse<any>>(
    `/api/member/supplier/cooperation/authorizations/${authorizationId}/revoke`,
    {
      method: 'POST',
    },
  )
  return response.data
}

export async function handleCooperationRequest(relationId: string, status: string, remark?: string) {
  const response = await request<ApiResponse<any>>(`/api/member/supplier/cooperation/relations/${relationId}`, {
    method: 'PUT',
    data: { status, remark },
  })
  return response.data
}

export async function handleSupplierAuthorization(authorizationId: string, status: string, remark?: string) {
  const response = await request<ApiResponse<any>>(
    `/api/member/supplier/cooperation/authorizations/${authorizationId}`,
    {
      method: 'PUT',
      data: { status, remark },
    },
  )
  return response.data
}
