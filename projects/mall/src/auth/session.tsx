import { createContext, useCallback, useContext, useEffect, useState, type PropsWithChildren } from 'react'
import { getCurrentUser, login, logoutRequest, switchIdentity, toProfile } from '../api/auth'
import { fetchMallCart } from '../api/mall'
import {
  AUTH_SESSION_EVENT,
  clearStoredSession,
  getAccessToken,
  getStoredProfile,
  saveStoredSession,
} from '@apps/utils'
import type { AuthProfile, RoleType } from '../types/models'

interface SessionContextValue {
  ready: boolean
  profile: AuthProfile | null
  token: string | null
  cartCount: number
  isAuthenticated: boolean
  isCustomer: boolean
  signIn: (username: string, password: string) => Promise<AuthProfile>
  signOut: () => Promise<void>
  switchToIdentity: (identityType: RoleType) => Promise<AuthProfile>
  refreshProfile: () => Promise<void>
  refreshCartCount: () => Promise<void>
}

const SessionContext = createContext<SessionContextValue | null>(null)

export function SessionProvider({ children }: PropsWithChildren) {
  const [profile, setProfile] = useState<AuthProfile | null>(() => getStoredProfile())
  const [token, setToken] = useState<string | null>(() => getAccessToken())
  const [ready, setReady] = useState(() => !getAccessToken())
  const [cartCount, setCartCount] = useState(0)

  const syncFromStorage = useCallback(() => {
    setProfile(getStoredProfile())
    setToken(getAccessToken())
  }, [])

  async function refreshProfile() {
    if (!token) {
      setReady(true)
      return
    }

    try {
      const current = await getCurrentUser()
      const nextProfile = toProfile(current)
      saveStoredSession(nextProfile, token)
      setProfile(nextProfile)
    } catch {
      clearStoredSession()
      setProfile(null)
      setToken(null)
      setCartCount(0)
    } finally {
      setReady(true)
    }
  }

  async function refreshCartCount() {
    if (!token || !profile || profile.identityType !== 'CUSTOMER') {
      setCartCount(0)
      return
    }

    try {
      const result = await fetchMallCart({ pageSize: 1000 })
      const items = (result?.list ?? []) as { quantity: number }[]
      setCartCount(items.reduce((sum, item) => sum + item.quantity, 0))
    } catch {
      setCartCount(0)
    }
  }

  useEffect(() => {
    const handleSessionChange = () => syncFromStorage()
    const handleStorage = (event: StorageEvent) => {
      if (!event.key || event.key.startsWith('telecom-scm-auth-')) {
        syncFromStorage()
      }
    }

    window.addEventListener(AUTH_SESSION_EVENT, handleSessionChange)
    window.addEventListener('storage', handleStorage)
    return () => {
      window.removeEventListener(AUTH_SESSION_EVENT, handleSessionChange)
      window.removeEventListener('storage', handleStorage)
    }
  }, [syncFromStorage])

  useEffect(() => {
    void refreshProfile()
  }, [token])

  useEffect(() => {
    void refreshCartCount()
  }, [token, profile?.identityType, profile?.username])

  async function signIn(username: string, password: string) {
    const payload = await login(username, password)
    const baseProfile = toProfile({
      username: payload.username,
      role: payload.role,
      identityType: payload.identityType,
      displayName: payload.displayName,
      route: payload.route,
      permissions: payload.permissions,
      menus: payload.menus,
      identities: payload.identities,
    })

    saveStoredSession(baseProfile, payload.token)
    setProfile(baseProfile)
    setToken(payload.token)
    setReady(true)

    try {
      const current = await getCurrentUser()
      const nextProfile = toProfile(current)
      saveStoredSession(nextProfile, payload.token)
      setProfile(nextProfile)
      return nextProfile
    } catch {
      return baseProfile
    }
  }

  async function signOut() {
    try {
      await logoutRequest()
    } catch {
      // Ignore logout transport errors and clear local state regardless.
    }

    clearStoredSession()
    setProfile(null)
    setToken(null)
    setCartCount(0)
    setReady(true)
  }

  async function switchToIdentity(identityType: RoleType) {
    const payload = await switchIdentity(identityType)
    const nextProfile = toProfile({
      username: payload.username,
      role: payload.role,
      identityType: payload.identityType,
      displayName: payload.displayName,
      route: payload.route,
      permissions: payload.permissions,
      menus: payload.menus,
      identities: payload.identities,
    })

    saveStoredSession(nextProfile, payload.token)
    setProfile(nextProfile)
    setToken(payload.token)

    try {
      const current = await getCurrentUser()
      const refreshedProfile = toProfile(current)
      saveStoredSession(refreshedProfile, payload.token)
      setProfile(refreshedProfile)
      return refreshedProfile
    } catch {
      return nextProfile
    }
  }

  const value: SessionContextValue = {
    ready,
    profile,
    token,
    cartCount,
    isAuthenticated: !!token && !!profile,
    isCustomer: profile?.identityType === 'CUSTOMER',
    signIn,
    signOut,
    switchToIdentity,
    refreshProfile,
    refreshCartCount,
  }

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}

export function useSession() {
  const context = useContext(SessionContext)
  if (!context) {
    throw new Error('useSession must be used within SessionProvider')
  }

  return context
}
