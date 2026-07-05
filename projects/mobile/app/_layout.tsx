import { Stack } from 'expo-router'
import { PaperProvider } from 'react-native-paper'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { StatusBar } from 'expo-status-bar'
import { theme } from '../src/theme'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000,
    },
  },
})

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <PaperProvider theme={theme}>
          <StatusBar style="auto" />
          <Stack
            screenOptions={{
              headerStyle: { backgroundColor: theme.colors.background },
              headerTintColor: theme.colors.onBackground,
              headerTitleStyle: { fontWeight: '600' },
              headerShadowVisible: false,
            }}
          >
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="login" options={{ headerShown: false }} />
            <Stack.Screen name="register" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="product/[id]" options={{ title: '商品详情' }} />
            <Stack.Screen name="search" options={{ title: '搜索商品' }} />
            <Stack.Screen name="shop/[merchantId]" options={{ title: '店铺详情' }} />
            <Stack.Screen name="checkout" options={{ title: '确认订单' }} />
            <Stack.Screen name="order-result" options={{ headerShown: false }} />
            <Stack.Screen name="order/[id]" options={{ title: '订单详情' }} />
            <Stack.Screen name="profile/edit" options={{ title: '编辑资料' }} />
          </Stack>
        </PaperProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  )
}
