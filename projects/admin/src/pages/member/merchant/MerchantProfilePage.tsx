import { Card, Form, Input, Button, message, Spin } from 'antd'
import { useState, useEffect } from 'react'
import { fetchMerchantProfile, updateMerchantProfile } from '../../../services/ant-design-pro/merchant'

interface MerchantProfileData {
  shopName?: string
  contactName?: string
  phone?: string
  email?: string
  address?: string
}

export function MerchantProfilePage() {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadProfile()
  }, [])

  async function loadProfile() {
    try {
      setLoading(true)
      const profile = await fetchMerchantProfile()
      if (profile) {
        form.setFieldsValue({
          shopName: profile.shopName || profile.memberName,
          contactName: profile.contactName,
          phone: profile.phone,
          email: profile.email,
          address: profile.address,
        })
      }
    } catch (error) {
      console.error('加载商家资料失败:', error)
      message.error('加载商家资料失败')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    try {
      setSaving(true)
      const values = await form.validateFields()
      await updateMerchantProfile(values)
      message.success('保存成功')
      loadProfile()
    } catch (error) {
      console.error('保存商家资料失败:', error)
      message.error('保存失败')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Card title="商家资料" size="small">
        <div style={{ textAlign: 'center', padding: 20 }}>
          <Spin size="large" />
        </div>
      </Card>
    )
  }

  return (
    <Card title="商家资料" size="small">
      <Form form={form} layout="vertical" style={{ maxWidth: 480 }}>
        <Form.Item label="店铺名称" name="shopName" rules={[{ required: true, message: '请输入店铺名称' }]}>
          <Input />
        </Form.Item>
        <Form.Item label="联系人" name="contactName" rules={[{ required: true, message: '请输入联系人' }]}>
          <Input />
        </Form.Item>
        <Form.Item label="联系电话" name="phone" rules={[{ required: true, message: '请输入联系电话' }]}>
          <Input />
        </Form.Item>
        <Form.Item label="邮箱" name="email">
          <Input />
        </Form.Item>
        <Form.Item label="地址" name="address">
          <Input.TextArea rows={3} />
        </Form.Item>
        <Form.Item>
          <Button type="primary" onClick={handleSubmit} loading={saving}>
            保存
          </Button>
        </Form.Item>
      </Form>
    </Card>
  )
}

export default MerchantProfilePage
