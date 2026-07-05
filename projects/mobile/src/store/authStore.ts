import { create } from 'zustand'
import type { AuthUser, RoleType } from '../types/api'
import {
  getCurrentUser,
  switchIdentity as apiSwitchIdentity,
  logout as apiLogout,
  saveToken,
  getToken,
  clearToken,
} from '../api/auth'

interface AuthState {
  user: AuthUser | null
  isLoading: boolean
  isInitialized: boolean
  setUser: (user: AuthUser | null, token?: string) => void
  initAuth: () => Promise<boolean>
  switchIdentity: (identityType: RoleType) => Promise<void>
  logout: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: false,
  isInitialized: false,

  setUser: (user, token) => {
    set({ user })
    if (token) {
      saveToken(token).catch(console.error)
    }
  },

  initAuth: async () => {
    set({ isLoading: true })
    try {
      const token = await getToken()
      if (!token) {
        set({ isLoading: false, isInitialized: true })
        return false
      }

      const user = await getCurrentUser()

      if (user.identityType !== 'CUSTOMER') {
        const customerIdentity = user.identities?.find((id: any) => id.identityType === 'CUSTOMER' && id.active)

        if (customerIdentity) {
          const switched = await apiSwitchIdentity('CUSTOMER')
          saveToken(switched.token).catch(console.error)
          set({ user: switched, isLoading: false, isInitialized: true })
          return true
        } else {
          await clearToken()
          set({ user: null, isLoading: false, isInitialized: true })
          return false
        }
      }

      set({ user, isLoading: false, isInitialized: true })
      return true
    } catch (error) {
      await clearToken()
      set({ user: null, isLoading: false, isInitialized: true })
      return false
    }
  },

  switchIdentity: async (identityType: RoleType) => {
    set({ isLoading: true })
    try {
      const user = await apiSwitchIdentity(identityType)
      saveToken(user.token).catch(console.error)
      set({ user, isLoading: false })
    } catch (error) {
      set({ isLoading: false })
      throw error
    }
  },

  logout: async () => {
    try {
      await apiLogout()
    } catch {
      // Ignore
    }
    await clearToken()
    set({ user: null })
  },
}))
