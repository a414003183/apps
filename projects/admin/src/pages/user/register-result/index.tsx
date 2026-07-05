import { Link, useSearchParams } from '@umijs/max'
import { Button, Result } from 'antd'

const RegisterResult: React.FC<Record<string, unknown>> = () => {
  const [params] = useSearchParams()

  const email = params?.get('account') || ''
  return (
    <Result
      status="success"
      title="注册成功"
      subTitle={email ? `您的账号 ${email} 注册成功` : '注册成功，请登录'}
      extra={
        <div style={{ display: 'flex', gap: 16 }}>
          <Link to="/login">
            <Button size="large" type="primary">
              立即登录
            </Button>
          </Link>
          <Link to="/">
            <Button size="large">返回首页</Button>
          </Link>
        </div>
      }
    />
  )
}

export default RegisterResult
