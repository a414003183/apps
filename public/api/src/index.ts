export { createApiClient, type ApiClient } from './client'
export { createAuthApi, toProfile } from './auth'
export { createFileApi } from './file'
export { createMallApi } from './mall'

export type {
  AuthApi,
  RegisterCustomerPayload,
  RegisterMerchantPayload,
  RegisterSupplierPayload,
} from './auth'
export type { FileApi, UploadedFile } from './file'
export type {
  MallApi,
  MallApiOptions,
  ProductListParams,
  AddCartItemPayload,
  CheckoutPayload,
  DirectBuyPayload,
} from './mall'
