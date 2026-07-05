import { createAuthApi, toProfile } from '@apps/api'
import * as SecureStore from 'expo-secure-store'
import { api } from './client'

export const authApi = createAuthApi(api)

export const {
  login,
  getCurrentUser,
  switchIdentity,
  logoutRequest,
  registerCustomer,
  registerMerchant,
  registerSupplier,
} = authApi

export const logout = logoutRequest

export { toProfile }

export async function saveToken(token: string): Promise<void> {
  await SecureStore.setItemAsync('auth_token', token)
}

export async function getToken(): Promise<string | null> {
  return await SecureStore.getItemAsync('auth_token')
}

export async function clearToken(): Promise<void> {
  await SecureStore.deleteItemAsync('auth_token')
}
