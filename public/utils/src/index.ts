/**
 * 公共工具函数
 * 供 admin / mall / mobile / weapp 等子项目引用
 */

import type { AuthProfile } from '@apps/types'

export interface SyncStorageAdapter {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

export interface StorageAdapter {
  getItem(key: string): string | null | Promise<string | null>
  setItem(key: string, value: string): void | Promise<void>
  removeItem(key: string): void | Promise<void>
}

export const AUTH_PROFILE_KEY = 'telecom-scm-auth-profile'
export const AUTH_TOKEN_KEY = 'telecom-scm-auth-token'
export const AUTH_SESSION_EVENT = 'telecom-scm-auth-session-change'

export const localStorageAdapter: SyncStorageAdapter = {
  getItem(key) {
    if (typeof window === 'undefined') return null
    return window.localStorage.getItem(key)
  },
  setItem(key, value) {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(key, value)
  },
  removeItem(key) {
    if (typeof window === 'undefined') return
    window.localStorage.removeItem(key)
  },
}

export interface SecureStoreLike {
  getItemAsync(key: string): Promise<string | null>
  setItemAsync(key: string, value: string): Promise<void>
  deleteItemAsync(key: string): Promise<void>
}

export function createSecureStoreAdapter(getStore: () => SecureStoreLike): StorageAdapter {
  return {
    async getItem(key) {
      return getStore().getItemAsync(key)
    },
    async setItem(key, value) {
      await getStore().setItemAsync(key, value)
    },
    async removeItem(key) {
      await getStore().deleteItemAsync(key)
    },
  }
}

export function dispatchAuthSessionEvent(action: 'login' | 'logout') {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(AUTH_SESSION_EVENT, { detail: { action } }))
  }
}

export function decodeJwtPayload(token: string): { exp?: number } | null {
  const segments = token.split('.')
  if (segments.length < 2) {
    return null
  }

  try {
    const normalized = segments[1].replace(/-/g, '+').replace(/_/g, '/')
    const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '=')
    if (typeof window !== 'undefined') {
      return JSON.parse(window.atob(padded)) as { exp?: number }
    }
    return JSON.parse(Buffer.from(padded, 'base64').toString()) as { exp?: number }
  } catch {
    return null
  }
}

export function resolveFileUrl(baseUrl: string, fileId?: number | string) {
  if (!fileId) {
    return undefined
  }
  return `${baseUrl.replace(/\/$/, '')}/files/${fileId}`
}

export function isJwtExpired(token?: string | null) {
  if (!token) return true
  const payload = decodeJwtPayload(token)
  if (!payload || typeof payload.exp !== 'number') return false
  return Date.now() >= payload.exp * 1000
}

export function getStoredProfile(): AuthProfile | null {
  const raw = localStorageAdapter.getItem(AUTH_PROFILE_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as AuthProfile
  } catch {
    return null
  }
}

export function getAccessToken(): string | null {
  return localStorageAdapter.getItem(AUTH_TOKEN_KEY)
}

export function saveStoredSession(profile: AuthProfile, token?: string) {
  localStorageAdapter.setItem(AUTH_PROFILE_KEY, JSON.stringify(profile))
  if (token) {
    localStorageAdapter.setItem(AUTH_TOKEN_KEY, token)
  }
  dispatchAuthSessionEvent('login')
}

export function clearStoredSession() {
  localStorageAdapter.removeItem(AUTH_PROFILE_KEY)
  localStorageAdapter.removeItem(AUTH_TOKEN_KEY)
  dispatchAuthSessionEvent('logout')
}

export function ensureValidAuthSession(): boolean {
  const rawProfile = localStorageAdapter.getItem(AUTH_PROFILE_KEY)
  if (!rawProfile) return true

  const token = localStorageAdapter.getItem(AUTH_TOKEN_KEY)
  if (!token) {
    clearStoredSession()
    return false
  }

  if (isJwtExpired(token)) {
    clearStoredSession()
    return false
  }

  return true
}
