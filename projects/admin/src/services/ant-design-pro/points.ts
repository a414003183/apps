import { request } from '@umijs/max'
import type { ApiResponse, PointRecord } from '../../types/models'

// 积分相关API

// 获取客户积分信息
export async function fetchCustomerPoints() {
  const response = await request<
    ApiResponse<{
      currentPoints: number
      totalPoints: number
      expiredPoints: number
      levelName: string
      levelProgress: number
    }>
  >('/api/member/customer/points', {
    method: 'GET',
  })
  return response.data
}

// 获取客户积分记录
export async function fetchPointRecords(params?: {
  page?: number
  pageSize?: number
  type?: string
  startDate?: string
  endDate?: string
}) {
  const response = await request<
    ApiResponse<{
      list: PointRecord[]
      total: number
      page: number
      pageSize: number
    }>
  >('/api/member/customer/points/records', {
    method: 'GET',
    params,
  })
  return response.data
}

// 积分抵扣计算
export async function calculatePointDeduction(points: number, amount: number) {
  const response = await request<
    ApiResponse<{
      deductPoints: number
      deductAmount: number
      finalAmount: number
    }>
  >('/api/member/customer/points/calculate', {
    method: 'POST',
    data: { points, amount },
  })
  return response.data
}

// 获取积分商城商品列表
export async function fetchPointProducts(params?: { page?: number; pageSize?: number; categoryId?: number }) {
  const response = await request<
    ApiResponse<{
      list: any[]
      total: number
    }>
  >('/api/member/customer/points/products', {
    method: 'GET',
    params,
  })
  return response.data
}

// 兑换积分商品
export async function redeemPointProduct(productId: string, quantity: number, addressId: number) {
  const response = await request<ApiResponse<any>>('/api/member/customer/points/redeem', {
    method: 'POST',
    data: { productId, quantity, addressId },
  })
  return response.data
}

// 获取积分规则配置
export async function fetchPointRules() {
  const response = await request<ApiResponse<any>>('/api/member/customer/points/rules', {
    method: 'GET',
  })
  return response.data
}
