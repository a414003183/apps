import { useEffect } from 'react'
import { View, ActivityIndicator } from 'react-native'
import { useRouter } from 'expo-router'
import { useAuthStore } from '../src/store/authStore'
import { Tokens } from '../src/theme'

export default function Index() {
  const router = useRouter()
  const { user, isInitialized, initAuth } = useAuthStore()

  useEffect(() => {
    initAuth()
  }, [initAuth])

  useEffect(() => {
    if (!isInitialized) return

    if (!user) {
      router.replace('/login')
    } else {
      router.replace('/(tabs)' as const)
    }
  }, [isInitialized, user, router])

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Tokens.background }}>
      <ActivityIndicator size="large" color={Tokens.accent} />
    </View>
  )
}
