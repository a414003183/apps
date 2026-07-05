import Taro from '@tarojs/taro'

const PREFIX = 'telecom-scm-weapp-'

export function getStorage<T>(key: string): T | undefined {
  try {
    const value = Taro.getStorageSync<T>(PREFIX + key)
    return value
  } catch {
    return undefined
  }
}

export function setStorage<T>(key: string, value: T) {
  try {
    Taro.setStorageSync(PREFIX + key, value)
  } catch (error) {
    console.error('setStorage error', error)
  }
}

export function removeStorage(key: string) {
  try {
    Taro.removeStorageSync(PREFIX + key)
  } catch (error) {
    console.error('removeStorage error', error)
  }
}
