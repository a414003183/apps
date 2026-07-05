import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import Taro from '@tarojs/taro'
import type { AuthProfile, RoleType } from '../types/models'
import { getAuthToken, setAuthToken } from '../api/http'
import { fetchCart } from '../api/cart'

interface SessionState {
  token: string
  profile: AuthProfile | null
  cartCount: number
  ready: boolean
  setToken: (token: string) => void
  setProfile: (profile: AuthProfile | null) => void
  setReady: (ready: boolean) => void
  refreshCartCount: () => Promise<void>
  login: (token: string, profile: AuthProfile) => void
  logout: () => void
}

const taroStorage = {
  getItem: (name: string) => {
    try {
      return Taro.getStorageSync<string>(name) || null
    } catch {
      return null
    }
  },
  setItem: (name: string, value: string) => {
    Taro.setStorageSync(name, value)
  },
  removeItem: (name: string) => {
    Taro.removeStorageSync(name)
  },
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set, get) => ({
      token: '',
      profile: null,
      cartCount: 0,
      ready: false,
      setToken: (token) => {
        setAuthToken(token)
        set({ token })
      },
      setProfile: (profile) => set({ profile }),
      setReady: (ready) => set({ ready }),
      refreshCartCount: async () => {
        try {
          const result = await fetchCart({ page: 1, pageSize: 999 })
          const count = result.list.reduce((sum, item) => sum + item.quantity, 0)
          set({ cartCount: count })
          if (count > 0) {
            Taro.setTabBarBadge({ index: 2, text: String(count > 99 ? '99+' : count) })
          } else {
            Taro.removeTabBarBadge({ index: 2 })
          }
        } catch {
          set({ cartCount: 0 })
          Taro.removeTabBarBadge({ index: 2 })
        }
      },
      login: (token, profile) => {
        setAuthToken(token)
        Taro.setStorageSync('telecom-scm-weapp-token', token)
        set({ token, profile })
        get().refreshCartCount()
      },
      logout: () => {
        setAuthToken('')
        Taro.removeStorageSync('telecom-scm-weapp-token')
        set({ token: '', profile: null, cartCount: 0 })
      },
    }),
    {
      name: 'telecom-scm-weapp-session',
      storage: createJSONStorage(() => taroStorage),
      partialize: (state) => ({
        token: state.token,
        profile: state.profile,
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.token) {
          setAuthToken(state.token)
        }
        state?.setReady(true)
      },
    },
  ),
)

export function requireCustomer(profile: AuthProfile | null): profile is AuthProfile {
  return profile?.identityType === 'CUSTOMER'
}

export function isCustomerIdentity(identityType?: RoleType) {
  return identityType === 'CUSTOMER'
}
