import type { ApiClient } from './client'

export interface UploadedFile {
  id: number
  originalName: string
  fileSize: number
  contentType: string
  url: string
}

export interface FileApi {
  upload(file: File, bizType?: string, bizId?: number | string): Promise<UploadedFile>
}

export function createFileApi(api: ApiClient): FileApi {
  return {
    async upload(file, bizType, bizId) {
      const formData = new FormData()
      formData.append('file', file)
      if (bizType) formData.append('bizType', bizType)
      if (bizId) formData.append('bizId', String(bizId))

      return api.post<UploadedFile>('/files/upload', formData)
    },
  }
}
