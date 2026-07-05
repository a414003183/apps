import { ArrowRight, Building2, Mail, Phone, Store, User, Users } from 'lucide-react'
import { Button, Card, InputGroup, Label, Tabs, TextField } from '@heroui/react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { registerCustomer, registerMerchant, registerSupplier } from '../api/auth'
import { getErrorMessage } from '../lib/errors'

type IdentityType = 'CUSTOMER' | 'MERCHANT' | 'SUPPLIER'

const IDENTITY_TABS: { key: IdentityType; label: string; icon: React.ReactNode }[] = [
  { key: 'CUSTOMER', label: '客户', icon: <User size={14} /> },
  { key: 'MERCHANT', label: '商家', icon: <Store size={14} /> },
  { key: 'SUPPLIER', label: '供应商', icon: <Users size={14} /> },
]

export function RegisterPage() {
  const navigate = useNavigate()
  const [identityType, setIdentityType] = useState<IdentityType>('CUSTOMER')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [form, setForm] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    orgName: '',
    contactName: '',
    contactPhone: '',
    email: '',
    inviteCode: '',
  })

  function updateField<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!form.username || !form.password || !form.confirmPassword || !form.contactName || !form.contactPhone) {
      setError('请填写所有必填项')
      return
    }

    if (identityType !== 'CUSTOMER' && !form.orgName.trim()) {
      setError('请填写所有必填项')
      return
    }

    if (form.password !== form.confirmPassword) {
      setError('两次输入的密码不一致')
      return
    }

    if (form.password.length < 6) {
      setError('密码长度不能少于6位')
      return
    }

    setSubmitting(true)
    try {
      const basePayload = {
        username: form.username.trim(),
        password: form.password,
        contactName: form.contactName.trim(),
        contactPhone: form.contactPhone.trim(),
        email: form.email.trim() || undefined,
      }

      let result: { status: string; message: string }

      if (identityType === 'CUSTOMER') {
        result = await registerCustomer({
          ...basePayload,
          companyName: form.orgName.trim() || undefined,
          inviteCode: form.inviteCode.trim() || undefined,
        })
      } else if (identityType === 'MERCHANT') {
        result = await registerMerchant({
          ...basePayload,
          shopName: form.orgName.trim(),
        })
      } else {
        result = await registerSupplier({
          ...basePayload,
          supplierName: form.orgName.trim(),
        })
      }

      setSuccess(result.message || '注册成功，请登录')
      setTimeout(() => {
        navigate('/login')
      }, 1500)
    } catch (err) {
      setError(getErrorMessage(err, '注册失败'))
    } finally {
      setSubmitting(false)
    }
  }

  const orgLabel = identityType === 'CUSTOMER' ? '公司名称' : identityType === 'MERCHANT' ? '店铺名称' : '供应商名称'
  const orgPlaceholder =
    identityType === 'CUSTOMER' ? '公司全称（选填）' : identityType === 'MERCHANT' ? '店铺名称' : '供应商名称'

  return (
    <div className="flex items-center justify-center min-h-[500px] py-10">
      <div className="w-full max-w-[520px]">
        <Card>
          <Card.Content className="p-8">
            <h2 className="text-xl font-bold text-foreground mb-4">账号注册</h2>

            <Tabs selectedKey={identityType} onSelectionChange={(key) => setIdentityType(String(key) as IdentityType)}>
              <Tabs.ListContainer>
                <Tabs.List aria-label="注册身份">
                  {IDENTITY_TABS.map((tab) => (
                    <Tabs.Tab key={tab.key} id={tab.key}>
                      <span className="flex items-center gap-1">
                        {tab.icon}
                        {tab.label}
                      </span>
                    </Tabs.Tab>
                  ))}
                </Tabs.List>
              </Tabs.ListContainer>
            </Tabs>

            {error && (
              <div className="mt-4 mb-2 p-3 bg-danger/10 border border-danger/20 rounded-lg text-sm text-danger">
                {error}
              </div>
            )}
            {success && (
              <div className="mt-4 mb-2 p-3 bg-success/10 border border-success/20 rounded-lg text-sm text-success">
                {success}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <TextField isRequired>
                  <Label className="text-xs text-muted">登录账号</Label>
                  <InputGroup>
                    <InputGroup.Prefix>
                      <User size={16} className="text-muted" />
                    </InputGroup.Prefix>
                    <InputGroup.Input
                      value={form.username}
                      onChange={(e) => updateField('username', e.target.value)}
                      placeholder="请输入登录账号"
                      required
                    />
                  </InputGroup>
                </TextField>

                <TextField isRequired>
                  <Label className="text-xs text-muted">手机号码</Label>
                  <InputGroup>
                    <InputGroup.Prefix>
                      <Phone size={16} className="text-muted" />
                    </InputGroup.Prefix>
                    <InputGroup.Input
                      value={form.contactPhone}
                      onChange={(e) => updateField('contactPhone', e.target.value)}
                      placeholder="请输入手机号码"
                      required
                    />
                  </InputGroup>
                </TextField>

                <TextField isRequired>
                  <Label className="text-xs text-muted">联系人</Label>
                  <InputGroup>
                    <InputGroup.Prefix>
                      <User size={16} className="text-muted" />
                    </InputGroup.Prefix>
                    <InputGroup.Input
                      value={form.contactName}
                      onChange={(e) => updateField('contactName', e.target.value)}
                      placeholder="联系人姓名"
                      required
                    />
                  </InputGroup>
                </TextField>

                <TextField isRequired>
                  <Label className="text-xs text-muted">密码</Label>
                  <InputGroup>
                    <InputGroup.Prefix>
                      <User size={16} className="text-muted" />
                    </InputGroup.Prefix>
                    <InputGroup.Input
                      type="password"
                      value={form.password}
                      onChange={(e) => updateField('password', e.target.value)}
                      placeholder="至少6位"
                      required
                    />
                  </InputGroup>
                </TextField>

                <TextField isRequired>
                  <Label className="text-xs text-muted">确认密码</Label>
                  <InputGroup>
                    <InputGroup.Input
                      type="password"
                      value={form.confirmPassword}
                      onChange={(e) => updateField('confirmPassword', e.target.value)}
                      placeholder="再次输入密码"
                      required
                    />
                  </InputGroup>
                </TextField>

                <TextField isRequired={identityType !== 'CUSTOMER'}>
                  <Label className="text-xs text-muted">{orgLabel}</Label>
                  <InputGroup>
                    <InputGroup.Prefix>
                      <Building2 size={16} className="text-muted" />
                    </InputGroup.Prefix>
                    <InputGroup.Input
                      value={form.orgName}
                      onChange={(e) => updateField('orgName', e.target.value)}
                      placeholder={orgPlaceholder}
                      required={identityType !== 'CUSTOMER'}
                    />
                  </InputGroup>
                </TextField>

                <TextField>
                  <Label className="text-xs text-muted">邮箱</Label>
                  <InputGroup>
                    <InputGroup.Prefix>
                      <Mail size={16} className="text-muted" />
                    </InputGroup.Prefix>
                    <InputGroup.Input
                      type="email"
                      value={form.email}
                      onChange={(e) => updateField('email', e.target.value)}
                      placeholder="选填"
                    />
                  </InputGroup>
                </TextField>
              </div>

              {identityType === 'CUSTOMER' && (
                <TextField>
                  <Label className="text-xs text-muted">邀请码</Label>
                  <InputGroup>
                    <InputGroup.Input
                      value={form.inviteCode}
                      onChange={(e) => updateField('inviteCode', e.target.value)}
                      placeholder="如有邀请码请填写（选填）"
                    />
                  </InputGroup>
                </TextField>
              )}

              <Button type="submit" isPending={submitting} fullWidth size="lg">
                {submitting ? '注册中...' : '立即注册'} {!submitting && <ArrowRight size={17} />}
              </Button>

              <div className="text-center text-sm text-muted">
                已有账号？
                <Link to="/login" className="text-accent hover:underline ml-1">
                  去登录
                </Link>
              </div>
            </form>
          </Card.Content>
        </Card>
      </div>
    </div>
  )
}
