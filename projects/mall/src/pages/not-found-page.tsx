import { useNavigate } from 'react-router-dom'
import { StatePanel } from '../components/common/state-panel'

export function NotFoundPage() {
  const navigate = useNavigate()

  return (
    <StatePanel
      eyebrow="404"
      title="页面不存在"
      description="当前路由没有对应页面，可能是链接已变更。"
      primaryAction={{
        label: '回到首页',
        onPress: () => navigate('/'),
      }}
      secondaryAction={{
        label: '去选品中心',
        onPress: () => navigate('/search'),
      }}
    />
  )
}
