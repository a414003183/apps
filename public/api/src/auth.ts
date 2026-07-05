import type { ApiResponse, AuthProfile, AuthUser, RoleType, UserIdentityOption, WorkspaceMenuNode } from '@apps/types'
import type { ApiClient } from './client'

export interface AuthSessionPayload {
  token: string
  tokenType: string
  username: string
  role: RoleType
  identityType: RoleType
  displayName: string
  route: string
  permissions: string[]
  menus: WorkspaceMenuNode[]
  identities: UserIdentityOption[]
}

export interface RegisterCustomerPayload {
  username: string
  password: string
  contactName: string
  contactPhone: string
  email?: string
  companyName?: string
  inviteCode?: string
}

export interface RegisterMerchantPayload {
  username: string
  password: string
  contactName: string
  contactPhone: string
  email?: string
  shopName: string
}

export interface RegisterSupplierPayload {
  username: string
  password: string
  contactName: string
  contactPhone: string
  email?: string
  supplierName: string
}

export interface AuthApi {
  login(username: string, password: string): Promise<AuthSessionPayload>
  getCurrentUser(): Promise<AuthUser>
  switchIdentity(identityType: RoleType): Promise<AuthSessionPayload>
  logoutRequest(): Promise<void>
  registerCustomer(payload: RegisterCustomerPayload): Promise<{ status: string; message: string }>
  registerMerchant(payload: RegisterMerchantPayload): Promise<{ status: string; message: string }>
  registerSupplier(payload: RegisterSupplierPayload): Promise<{ status: string; message: string }>
}

export function createAuthApi(api: ApiClient): AuthApi {
  const { client } = api

  return {
    async login(username: string, password: string) {
      const response = await client.post<ApiResponse<AuthSessionPayload>>('/auth/login', {
        username,
        password,
      })
      return response.data.data
    },
    async getCurrentUser() {
      const response = await client.get<ApiResponse<AuthUser>>('/auth/me')
      return response.data.data
    },
    async switchIdentity(identityType: RoleType) {
      const response = await client.post<ApiResponse<AuthSessionPayload>>('/auth/switch-identity', {
        identityType,
      })
      return response.data.data
    },
    async logoutRequest() {
      await client.post<ApiResponse<null>>('/auth/logout')
    },
    async registerCustomer(payload: RegisterCustomerPayload) {
      const response = await client.post<ApiResponse<{ status: string; message: string }>>(
        '/auth/register/customer',
        payload,
      )
      return response.data.data
    },
    async registerMerchant(payload: RegisterMerchantPayload) {
      const response = await client.post<ApiResponse<{ status: string; message: string }>>(
        '/auth/register/merchant',
        payload,
      )
      return response.data.data
    },
    async registerSupplier(payload: RegisterSupplierPayload) {
      const response = await client.post<ApiResponse<{ status: string; message: string }>>(
        '/auth/register/supplier',
        payload,
      )
      return response.data.data
    },
  }
}

export function toProfile(payload: {
  username?: string
  role: RoleType
  identityType: RoleType
  displayName: string
  route: string
  permissions?: string[]
  menus?: WorkspaceMenuNode[]
  identities?: UserIdentityOption[]
  memberLevel?: string
}): AuthProfile {
  return {
    role: payload.role,
    identityType: payload.identityType,
    username: payload.username,
    name: payload.displayName,
    headline: '已登录',
    route: payload.route,
    permissions: payload.permissions,
    menus: payload.menus,
    identities: payload.identities,
    memberLevel: payload.memberLevel,
  }
}
