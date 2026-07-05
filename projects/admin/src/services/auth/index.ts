import { request } from '@umijs/max'
import type { ApiResponse, AuthProfile, RoleType, UserIdentityOption, WorkspaceMenuNode } from '../../types/models'

interface AuthSessionPayload {
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

export async function login(username: string, password: string) {
  const response = await request<ApiResponse<AuthSessionPayload>>('/api/auth/login', {
    method: 'POST',
    data: { username, password },
  })
  return response.data
}

export async function getCurrentUser() {
  const response = await request<
    ApiResponse<{
      username: string
      role: RoleType
      identityType: RoleType
      displayName: string
      route: string
      permissions: string[]
      menus: WorkspaceMenuNode[]
      identities: UserIdentityOption[]
      memberLevel?: string
    }>
  >('/api/auth/me')
  return response.data
}

export async function switchIdentity(identityType: RoleType) {
  const response = await request<ApiResponse<AuthSessionPayload>>('/api/auth/switch-identity', {
    method: 'POST',
    data: { identityType },
  })
  return response.data
}

export async function logoutRequest() {
  const response = await request<ApiResponse<null>>('/api/auth/logout', {
    method: 'POST',
  })
  return response.code === 0
}

export async function registerCustomer(payload: {
  username: string
  password: string
  companyName?: string
  contactName: string
  contactPhone: string
  email?: string
  inviteCode?: string
}) {
  const response = await request<ApiResponse<{ status: string; message: string }>>('/api/auth/register/customer', {
    method: 'POST',
    data: payload,
  })
  return response.data
}

export async function registerMerchant(payload: {
  username: string
  password: string
  shopName: string
  contactName: string
  contactPhone: string
  email?: string
}) {
  const response = await request<ApiResponse<{ status: string; message: string }>>('/api/auth/register/merchant', {
    method: 'POST',
    data: payload,
  })
  return response.data
}

export async function registerSupplier(payload: {
  username: string
  password: string
  supplierName: string
  contactName: string
  contactPhone: string
  email?: string
}) {
  const response = await request<ApiResponse<{ status: string; message: string }>>('/api/auth/register/supplier', {
    method: 'POST',
    data: payload,
  })
  return response.data
}

export function toProfile(payload: {
  username: string
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
