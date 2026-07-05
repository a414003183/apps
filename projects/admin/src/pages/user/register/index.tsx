import {
  ArrowLeftOutlined,
  LockOutlined,
  ShopOutlined,
  TeamOutlined,
  TruckOutlined,
  UserOutlined,
  PhoneOutlined,
} from '@ant-design/icons'
import { App, Button, Card, Form, Input, Typography } from 'antd'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { registerCustomer, registerMerchant, registerSupplier } from '../../../services/auth'

type RoleChoice = 'customer' | 'merchant' | 'supplier'

const ROLE_OPTIONS: { key: RoleChoice; icon: React.ReactNode; title: string; desc: string }[] = [
  { key: 'customer', icon: <TeamOutlined />, title: '客户', desc: '采购商品，管理订单' },
  { key: 'merchant', icon: <ShopOutlined />, title: '商家', desc: '上架商品，处理销售' },
  { key: 'supplier', icon: <TruckOutlined />, title: '供应商', desc: '供应货源，对接商家' },
]

const ROLE_EXTRA_FIELD: Record<RoleChoice, { name: string; label: string; placeholder: string }> = {
  customer: { name: 'companyName', label: '企业名称', placeholder: '请输入企业名称' },
  merchant: { name: 'shopName', label: '店铺名称', placeholder: '请输入店铺名称' },
  supplier: { name: 'supplierName', label: '供应商名称', placeholder: '请输入供应商名称' },
}

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

export function RegisterPage() {
  const [form] = Form.useForm()
  const [selectedRole, setSelectedRole] = useState<RoleChoice | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const navigate = useNavigate()
  const { message } = App.useApp()

  function handleBack() {
    setSelectedRole(null)
    form.resetFields()
  }

  async function handleSubmit(values: Record<string, string | undefined>) {
    if (!selectedRole) return
    setSubmitting(true)
    try {
      const result =
        selectedRole === 'customer'
          ? await registerCustomer({
              username: values.username ?? '',
              password: values.password ?? '',
              companyName: values.companyName,
              contactName: values.contactName ?? '',
              contactPhone: values.contactPhone ?? '',
              email: values.email,
              inviteCode: values.inviteCode,
            })
          : selectedRole === 'merchant'
          ? await registerMerchant({
              username: values.username ?? '',
              password: values.password ?? '',
              shopName: values.shopName ?? '',
              contactName: values.contactName ?? '',
              contactPhone: values.contactPhone ?? '',
              email: values.email,
            })
          : await registerSupplier({
              username: values.username ?? '',
              password: values.password ?? '',
              supplierName: values.supplierName ?? '',
              contactName: values.contactName ?? '',
              contactPhone: values.contactPhone ?? '',
              email: values.email,
            })

      message.success(result.message || '注册成功')
      navigate('/login')
    } catch (error) {
      message.error(getErrorMessage(error))
    } finally {
      setSubmitting(false)
    }
  }

  const extraField = selectedRole ? ROLE_EXTRA_FIELD[selectedRole] : null

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      }}
    >
      <section
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '0 10%',
          color: '#fff',
        }}
      >
        <div>
          <Typography.Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14 }}>链讯智采</Typography.Text>
          <Typography.Title level={1} style={{ color: '#fff', marginTop: 8 }}>
            企业采购协同平台
          </Typography.Title>
          <Typography.Paragraph style={{ color: 'rgba(255,255,255,0.8)', fontSize: 16 }}>
            {selectedRole ? '填写注册信息' : '选择您的身份'}
          </Typography.Paragraph>
        </div>
      </section>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
          background: '#fff',
          minWidth: 480,
        }}
      >
        <Card style={{ width: '100%', maxWidth: 400, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
          {!selectedRole ? (
            <>
              <Typography.Title level={3} style={{ textAlign: 'center', marginBottom: 24 }}>
                选择注册身份
              </Typography.Title>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {ROLE_OPTIONS.map((opt) => (
                  <Button
                    key={opt.key}
                    size="large"
                    icon={opt.icon}
                    onClick={() => setSelectedRole(opt.key)}
                    style={{
                      height: 'auto',
                      padding: '16px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                    }}
                  >
                    <strong style={{ fontSize: 16 }}>{opt.title}</strong>
                    <span style={{ fontSize: 12, color: '#666' }}>{opt.desc}</span>
                  </Button>
                ))}
              </div>
            </>
          ) : (
            <>
              <Button type="text" icon={<ArrowLeftOutlined />} onClick={handleBack} style={{ marginBottom: 8 }}>
                重选身份
              </Button>
              <Typography.Title level={4} style={{ marginBottom: 16 }}>
                {ROLE_OPTIONS.find((o) => o.key === selectedRole)?.title}注册
              </Typography.Title>

              <Form form={form} layout="vertical" onFinish={(values) => void handleSubmit(values)}>
                <Form.Item name="username" label="登录账号" rules={[{ required: true, message: '请输入登录账号' }]}>
                  <Input prefix={<UserOutlined />} placeholder="请输入登录账号" autoComplete="username" size="large" />
                </Form.Item>
                <Form.Item name="password" label="登录密码" rules={[{ required: true, message: '请输入登录密码' }]}>
                  <Input.Password
                    prefix={<LockOutlined />}
                    placeholder="请输入登录密码"
                    autoComplete="new-password"
                    size="large"
                  />
                </Form.Item>
                <Form.Item name="contactPhone" label="手机号码" rules={[{ required: true, message: '请输入手机号码' }]}>
                  <Input prefix={<PhoneOutlined />} placeholder="请输入手机号码" autoComplete="tel" size="large" />
                </Form.Item>
                {extraField && (
                  <Form.Item
                    name={extraField.name}
                    label={extraField.label}
                    rules={
                      selectedRole === 'customer'
                        ? undefined
                        : [{ required: true, message: `请输入${extraField.label}` }]
                    }
                  >
                    <Input placeholder={extraField.placeholder} size="large" />
                  </Form.Item>
                )}
                <Form.Item name="contactName" label="联系人" rules={[{ required: true, message: '请输入联系人' }]}>
                  <Input placeholder="请输入联系人" size="large" />
                </Form.Item>
                {selectedRole === 'customer' && (
                  <Form.Item name="inviteCode" label="邀请码">
                    <Input placeholder="请输入邀请码（选填）" size="large" />
                  </Form.Item>
                )}
                <Form.Item name="email" label="邮箱">
                  <Input placeholder="请输入邮箱（选填）" size="large" />
                </Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={submitting}
                  block
                  size="large"
                  style={{ height: 44, fontSize: 16 }}
                >
                  提交注册
                </Button>
              </Form>
            </>
          )}

          <div style={{ textAlign: 'center', marginTop: 16 }}>
            已有账号？<Link to="/login">返回登录</Link>
          </div>
        </Card>
      </div>
    </div>
  )
}

export default RegisterPage
