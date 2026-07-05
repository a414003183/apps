import { request } from './http'
import type { PageResult } from '../types/models'

export interface CustomerProfileResponse {
  username: string
  displayName: string
  customerId: number
  customerName: string
  contactName: string
  contactPhone: string
  memberLevel: string
  memberLevelName: string
  availablePoints: number
  defaultAddress?: CustomerAddress
}

export interface CustomerAddress {
  id: number
  receiverName: string
  receiverPhone: string
  province: string
  city: string
  district: string
  detailAddress: string
  isDefault: boolean
}

export interface UpdateCustomerProfileRequest {
  contactName?: string
  contactPhone?: string
}

export interface OrderSummary {
  orderId: number
  orderNo: string
  orderStatus: string
  payStatus: string
  payAmount: number
  totalAmount: number
  freightAmount: number
  productCount: number
  createTime: string
  merchantName: string
}

export interface OrderDetailResponse {
  orderId: number
  orderNo: string
  orderStatus: string
  payStatus: string
  payAmount: number
  totalAmount: number
  freightAmount: number
  receiverName: string
  receiverPhone: string
  receiverAddress: string
  payMethod: string
  customerRemark?: string
  createTime: string
  items: OrderItem[]
}

export interface OrderItem {
  itemId: number
  productName: string
  skuName: string
  quantity: number
  unitPrice: number
  lineAmount: number
  mainImageId?: number
}

export interface OrderTimelineEvent {
  time: string
  title: string
  content: string
}

export async function fetchCustomerProfile() {
  return request<CustomerProfileResponse>({
    url: '/app/customer/profile',
    method: 'GET',
  })
}

export async function updateCustomerProfile(payload: UpdateCustomerProfileRequest) {
  return request<void>({
    url: '/app/customer/profile',
    method: 'POST',
    data: payload,
  })
}

export async function fetchCustomerOrders(params?: { page?: number; pageSize?: number }) {
  return request<PageResult<OrderSummary>>({
    url: '/app/customer/orders',
    method: 'GET',
    data: params,
  })
}

export async function fetchCustomerOrderDetail(orderId: string | number) {
  return request<OrderDetailResponse>({
    url: `/app/customer/orders/${orderId}`,
    method: 'GET',
  })
}

export async function fetchCustomerOrderTimeline(orderId: string | number) {
  return request<OrderTimelineEvent[]>({
    url: `/app/customer/orders/${orderId}/timeline`,
    method: 'GET',
  })
}

export async function confirmReceive(orderId: string | number) {
  return request<any>({
    url: `/app/customer/orders/${orderId}/confirm-receive`,
    method: 'POST',
  })
}

export async function registerPayment(
  orderId: string | number,
  payload: {
    payMethod: string
    transactionNo: string
    voucherFileId?: number
    remark?: string
  },
) {
  return request<any>({
    url: `/member/customer/orders/${orderId}/payment-register`,
    method: 'POST',
    data: payload,
  })
}
