import { useState } from 'react'
import { View, Text, Input, Button } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { registerCustomer } from '../../api/auth'
import './index.scss'

export default function RegisterPage() {
  const [form, setForm] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    contactName: '',
    contactPhone: '',
    companyName: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  function update(key: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit() {
    if (!form.username || !form.password || !form.contactName || !form.contactPhone) {
      setError('请填写必填项')
      return
    }
    if (form.password !== form.confirmPassword) {
      setError('两次输入的密码不一致')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      await registerCustomer({
        username: form.username,
        password: form.password,
        contactName: form.contactName,
        contactPhone: form.contactPhone,
        companyName: form.companyName,
      })
      Taro.showToast({ title: '注册成功', icon: 'success' })
      setTimeout(() => {
        Taro.navigateTo({ url: '/pages/login/index' })
      }, 1000)
    } catch (err: any) {
      setError(err?.message || '注册失败')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <View className='register-page'>
      <View className='header'>
        <Text className='title'>客户注册</Text>
        <Text className='subtitle'>创建采购账号，开始 B2B 采购</Text>
      </View>

      <View className='card form-card'>
        {error ? <Text className='error-text'>{error}</Text> : null}

        <FormItem label='登录账号' required>
          <Input
            className='input'
            placeholder='请输入登录账号'
            value={form.username}
            onInput={(e) => update('username', e.detail.value)}
          />
        </FormItem>

        <FormItem label='密码' required>
          <Input
            className='input'
            type='text'
            password
            placeholder='请输入密码'
            value={form.password}
            onInput={(e) => update('password', e.detail.value)}
          />
        </FormItem>

        <FormItem label='确认密码' required>
          <Input
            className='input'
            type='text'
            password
            placeholder='请再次输入密码'
            value={form.confirmPassword}
            onInput={(e) => update('confirmPassword', e.detail.value)}
          />
        </FormItem>

        <FormItem label='联系人' required>
          <Input
            className='input'
            placeholder='请输入联系人姓名'
            value={form.contactName}
            onInput={(e) => update('contactName', e.detail.value)}
          />
        </FormItem>

        <FormItem label='联系电话' required>
          <Input
            className='input'
            type='number'
            placeholder='请输入联系电话'
            value={form.contactPhone}
            onInput={(e) => update('contactPhone', e.detail.value)}
          />
        </FormItem>

        <FormItem label='公司名称'>
          <Input
            className='input'
            placeholder='请输入公司名称'
            value={form.companyName}
            onInput={(e) => update('companyName', e.detail.value)}
          />
        </FormItem>

        <Button
          className='btn-primary submit-btn'
          disabled={submitting}
          onClick={handleSubmit}
        >
          {submitting ? '注册中...' : '注册'}
        </Button>

        <View className='login-row'>
          <Text className='text-secondary text-sm'>已有账号？</Text>
          <Text
            className='text-primary text-sm link'
            onClick={() => Taro.navigateTo({ url: '/pages/login/index' })}
          >
            去登录
          </Text>
        </View>
      </View>
    </View>
  )
}

function FormItem({
  label,
  required,
  children,
}: {
  label: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <View className='form-item'>
      <Text className='label'>
        {required ? <Text className='required'>*</Text> : null}
        {label}
      </Text>
      {children}
    </View>
  )
}
