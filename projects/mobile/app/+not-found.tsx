import { useRouter } from 'expo-router'
import { StatePanel } from '../src/components/ui/StatePanel'

export default function NotFoundPage() {
  const router = useRouter()

  return (
    <StatePanel
      icon="search"
      eyebrow="404"
      title="页面不存在"
      description="当前路由没有对应页面，可能是链接已变更。"
      primaryAction={{
        label: '回到首页',
        onPress: () => router.replace('/(tabs)' as any),
      }}
      secondaryAction={{
        label: '去选品中心',
        onPress: () => router.replace('/search' as any),
      }}
    />
  )
}
