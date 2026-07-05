import { fileApi } from './http'

export type { UploadedFile } from '@apps/api'

export const uploadFile = fileApi.upload
