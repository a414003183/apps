import { createAuthApi, toProfile } from '@apps/api'
import { api } from './http'

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

export { toProfile }
