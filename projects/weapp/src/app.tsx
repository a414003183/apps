import { PropsWithChildren, useEffect } from 'react'
import Taro from '@tarojs/taro'
import { getCurrentUser, toProfile } from './api/auth'
import { setAuthToken } from './api/http'
import { useSessionStore } from './stores/session'
import './app.scss'

function App({ children }: PropsWithChildren<any>) {
  const { token, setProfile, setReady, logout } = useSessionStore()

  useEffect(() => {
    async function init() {
      const storedToken = Taro.getStorageSync<string>('telecom-scm-weapp-token')
      if (!storedToken) {
        setReady(true)
        return
      }
      setAuthToken(storedToken)
      try {
        const current = await getCurrentUser()
        setProfile(toProfile(current))
      } catch {
        logout()
      } finally {
        setReady(true)
      }
    }
    void init()
  }, [])

  return children
}

export default App
