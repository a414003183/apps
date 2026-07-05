import { request } from '@umijs/max'
import type { ApiResponse } from '../../types/models'

export interface UploadedAttachment {
  id: string
  originalName: string
  contentType: string
  fileSize: number
  downloadUrl?: string
}

export async function uploadAttachment(file: File, bizType: string = 'TEMP', bizId?: number) {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('bizType', bizType)
  if (typeof bizId === 'number') {
    formData.append('bizId', String(bizId))
  }

  const response = await request<ApiResponse<UploadedAttachment>>('/api/files/upload', {
    method: 'POST',
    data: formData,
  })
  return response.data
}
