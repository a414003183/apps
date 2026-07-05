import type { AuthProfile, RoleType } from '@apps/types'
import { DEFAULT_PERMISSIONS } from '@apps/constants'
import {
  AUTH_SESSION_EVENT,
  AUTH_PROFILE_KEY,
  clearStoredSession as clearBaseSession,
  ensureValidAuthSession,
  getAccessToken as getBaseAccessToken,
  localStorageAdapter,
  saveStoredSession as saveBaseSession,
} from '@apps/utils'
import { normalizeWorkspaceMenus } from './menuNormalizer'

export { AUTH_SESSION_EVENT }

export function getAuthProfile(): AuthProfile | null {
  if (!ensureValidAuthSession()) {
    return null
  }

  const raw = localStorageAdapter.getItem(AUTH_PROFILE_KEY)
  if (!raw) {
    return null
  }

  try {
    const parsed = JSON.parse(raw) as Partial<AuthProfile> & { role?: RoleType }
    if (!parsed.role) {
      return null
    }

    return {
      ...parsed,
      role: parsed.role,
      identityType: parsed.identityType ?? parsed.role,
      name: parsed.name ?? parsed.username ?? '未登录用户',
      headline: parsed.headline ?? '已登录',
      route: parsed.route ?? '/',
      permissions: Array.isArray(parsed.permissions) ? parsed.permissions : DEFAULT_PERMISSIONS[parsed.role],
      menus: Array.isArray(parsed.menus) ? normalizeWorkspaceMenus(parsed.menus) : undefined,
    } as AuthProfile
  } catch {
    return null
  }
}

export function getAccessToken() {
  if (!ensureValidAuthSession()) {
    return null
  }

  return getBaseAccessToken()
}

export function saveAuthSession(profile: AuthProfile, token?: string) {
  saveBaseSession(
    {
      ...profile,
      menus: normalizeWorkspaceMenus(profile.menus),
    },
    token,
  )
}

export function logout() {
  clearBaseSession()
}

export function hasAnyRole(roles: RoleType[]) {
  const profile = getAuthProfile()
  return !!profile && roles.includes(profile.identityType)
}

export function hasPermission(permission?: string) {
  if (!permission) {
    return true
  }
  const profile = getAuthProfile()
  if (!profile || !Array.isArray(profile.permissions)) {
    return true
  }
  return profile.permissions.includes(permission)
}

export function hasAnyPermission(permissions: string[]) {
  return permissions.some((permission) => hasPermission(permission))
}
