import { request } from './http'
import type { ApiResponse, AuthProfile, RoleType, UserIdentityOption, WorkspaceMenuNode } from '../types/models'

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
  return request<AuthSessionPayload>({
    url: '/auth/login',
    method: 'POST',
    data: { username, password },
  })
}

export async function getCurrentUser() {
  return request<{
    username: string
    role: RoleType
    identityType: RoleType
    displayName: string
    route: string
    permissions: string[]
    menus: WorkspaceMenuNode[]
    identities: UserIdentityOption[]
    memberLevel?: string
  }>({
    url: '/auth/me',
    method: 'GET',
  })
}

export async function switchIdentity(identityType: RoleType) {
  return request<AuthSessionPayload>({
    url: '/auth/switch-identity',
    method: 'POST',
    data: { identityType },
  })
}

export async function logoutRequest() {
  return request<null>({
    url: '/auth/logout',
    method: 'POST',
  })
}

interface RegisterPayload {
  username: string
  password: string
  contactName: string
  contactPhone: string
  email?: string
}

export async function registerCustomer(
  payload: RegisterPayload & { companyName?: string; inviteCode?: string },
) {
  return request<{ status: string; message: string }>({
    url: '/auth/register/customer',
    method: 'POST',
    data: payload,
  })
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
