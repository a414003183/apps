import { uploadFile, resolveFileUrl } from './http'

export { resolveFileUrl }

export async function uploadImage(filePath: string, bizType?: string, bizId?: string | number) {
  const result = await uploadFile(filePath, bizType, bizId)
  const data = JSON.parse(result.data)
  if (data.code !== 200) {
    throw new Error(data.message || '上传失败')
  }
  return data.data as { id: number; fileName: string; fileUrl: string }
}
