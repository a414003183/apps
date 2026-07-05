import client from './client'
import type { ApiResponse, CustomerProfile, OrderSummary, TimelineEvent } from '../types/api'

export async function fetchCustomerProfile(): Promise<CustomerProfile> {
  const response = await client.get<ApiResponse<CustomerProfile>>('/app/customer/profile')
  if (response.data.code !== 200) throw new Error(response.data.message)
  return response.data.data
}

export async function updateCustomerProfile(params: { contactName?: string; contactPhone?: string }): Promise<void> {
  const response = await client.post<ApiResponse<null>>('/app/customer/profile', params)
  if (response.data.code !== 200) throw new Error(response.data.message)
}

export async function fetchCustomerOrders(): Promise<OrderSummary[]> {
  const response = await client.get<ApiResponse<OrderSummary[]>>('/app/customer/orders')
  if (response.data.code !== 200) throw new Error(response.data.message)
  return response.data.data
}

export async function fetchOrderDetail(orderId: string): Promise<OrderSummary & { items: any[] }> {
  const response = await client.get<ApiResponse<any>>(`/app/customer/orders/${orderId}`)
  if (response.data.code !== 200) throw new Error(response.data.message)
  return response.data.data
}

export async function fetchOrderTimeline(orderId: string): Promise<TimelineEvent[]> {
  const response = await client.get<ApiResponse<TimelineEvent[]>>(`/app/customer/orders/${orderId}/timeline`)
  if (response.data.code !== 200) throw new Error(response.data.message)
  return response.data.data
}

export async function confirmReceive(orderId: string): Promise<void> {
  const response = await client.post<ApiResponse<null>>(`/app/customer/orders/${orderId}/confirm-receive`)
  if (response.data.code !== 200) throw new Error(response.data.message)
}
