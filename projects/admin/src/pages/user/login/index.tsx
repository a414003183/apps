import { ArrowRightOutlined, LockOutlined, PhoneOutlined } from '@ant-design/icons'
import { App, Button, Card, Form, Input, Typography } from 'antd'
import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { login, toProfile } from '../../../services/auth'
import { saveAuthSession } from '../../../utils/auth'

function getErrorMessage(error: unknown) {
  if (
    typeof error === 'object' &&
    error !== null &&
    'response' in error &&
    typeof (error as { response?: { data?: { message?: string } } }).response?.data?.message === 'string'
  ) {
    return (error as { response?: { data?: { message?: string } } }).response?.data?.message ?? '操作失败'
  }
  if (error instanceof Error && error.message) {
    return error.message
  }
  return '操作失败'
}

export function LoginPage() {
  const [loginForm] = Form.useForm()
  const [submitting, setSubmitting] = useState(false)
  const location = useLocation()
  const { message } = App.useApp()

  async function handleLogin(values: { username: string; password: string }) {
    setSubmitting(true)
    try {
      const payload = await login(values.username, values.password)
      const profile = toProfile({
        username: payload.username,
        role: payload.role,
        identityType: payload.identityType,
        displayName: payload.displayName,
        route: payload.route,
        permissions: payload.permissions,
        menus: payload.menus,
        identities: payload.identities,
      })
      saveAuthSession(profile, payload.token)
      const redirect = new URLSearchParams(location.search).get('redirect')
      const nextPath = redirect && redirect.startsWith('/') ? redirect : profile.route
      message.success('登录成功')
      window.location.replace(nextPath)
    } catch (error) {
      message.error(getErrorMessage(error))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
        }}
      >
        <Card style={{ width: '100%', maxWidth: 400, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
          <Typography.Title level={3} style={{ textAlign: 'center', marginBottom: 24 }}>
            账号登录
          </Typography.Title>

          <Form form={loginForm} layout="vertical" onFinish={(values) => void handleLogin(values)}>
            <Form.Item name="username" label="手机号码" rules={[{ required: true, message: '请输入手机号码' }]}>
              <Input prefix={<PhoneOutlined />} placeholder="请输入手机号码" autoComplete="tel" size="large" />
            </Form.Item>
            <Form.Item name="password" label="密码" rules={[{ required: true, message: '请输入密码' }]}>
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="请输入密码"
                autoComplete="current-password"
                size="large"
              />
            </Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={submitting}
              block
              size="large"
              style={{ height: 44, fontSize: 16 }}
            >
              登录 <ArrowRightOutlined />
            </Button>
          </Form>

          <div style={{ textAlign: 'center', marginTop: 16 }}>
            还没有账号？<Link to="/register">立即注册</Link>
          </div>
        </Card>
      </div>
    </div>
  )
}

export default LoginPage
