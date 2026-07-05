import client from '../api/client'

export function getImageUrl(imageId: number | string | undefined): string | null {
  if (!imageId) return null
  const baseURL = client.defaults.baseURL || ''
  // baseURL is like "http://192.168.0.27:8080/api", image path is "/files/{id}"
  return `${baseURL}/files/${imageId}`
}
