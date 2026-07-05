import { useState } from 'react'
import { View, Text, Input, Button, Form } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { login, switchIdentity, toProfile, getCurrentUser } from '../../api/auth'
import { useSessionStore } from '../../stores/session'
import './index.scss'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const sessionLogin = useSessionStore((s) => s.login)

  async function handleSubmit() {
    if (!username || !password) {
      setError('请输入账号和密码')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      let payload = await login(username, password)
      let profile = toProfile(payload)

      const canSwitch = profile.identities?.some(
        (i) => i.identityType === 'CUSTOMER' && i.status === 'ENABLED',
      )
      if (profile.identityType !== 'CUSTOMER' && canSwitch) {
        payload = await switchIdentity('CUSTOMER')
        profile = toProfile(payload)
      }

      try {
        const current = await getCurrentUser()
        profile = toProfile(current)
      } catch {
        // ignore
      }

      sessionLogin(payload.token, profile)
      Taro.switchTab({ url: '/pages/home/index' })
    } catch (err: any) {
      setError(err?.message || '登录失败')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <View className='login-page'>
      <View className='header'>
        <Text className='title'>账号登录</Text>
        <Text className='subtitle'>欢迎回到电信供应链</Text>
      </View>

      <View className='card form-card'>
        {error ? <Text className='error-text'>{error}</Text> : null}

        <View className='form-item'>
          <Text className='label'>账号</Text>
          <Input
            className='input'
            type='text'
            placeholder='请输入账号/手机号'
            value={username}
            onInput={(e) => setUsername(e.detail.value)}
          />
        </View>

        <View className='form-item'>
          <Text className='label'>密码</Text>
          <Input
            className='input'
            type='text'
            password
            placeholder='请输入密码'
            value={password}
            onInput={(e) => setPassword(e.detail.value)}
          />
        </View>

        <Button
          className='btn-primary submit-btn'
          disabled={submitting}
          onClick={handleSubmit}
        >
          {submitting ? '登录中...' : '登录'}
        </Button>

        <View className='register-row'>
          <Text className='text-secondary text-sm'>还没有账号？</Text>
          <Text
            className='text-primary text-sm link'
            onClick={() => Taro.navigateTo({ url: '/pages/register/index' })}
          >
            立即注册
          </Text>
        </View>
      </View>
    </View>
  )
}
