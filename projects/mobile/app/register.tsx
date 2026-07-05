import { useState } from 'react'
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity } from 'react-native'
import { Text } from 'react-native-paper'
import { useRouter } from 'expo-router'
import { registerCustomer, registerMerchant, registerSupplier } from '../src/api/auth'
import { Card } from '../src/components/ui/Card'
import { Button } from '../src/components/ui/Button'
import { Input } from '../src/components/ui/Input'
import { Icon } from '../src/components/ui/Icon'
import { Tokens } from '../src/theme'

type IdentityType = 'CUSTOMER' | 'MERCHANT' | 'SUPPLIER'

const IDENTITY_TABS: { key: IdentityType; label: string; icon: any }[] = [
  { key: 'CUSTOMER', label: '客户', icon: 'user' },
  { key: 'MERCHANT', label: '商家', icon: 'store' },
  { key: 'SUPPLIER', label: '供应商', icon: 'users' },
]

export default function RegisterPage() {
  const router = useRouter()
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

  const updateField = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  const validate = () => {
    if (
      !form.username.trim() ||
      !form.password ||
      !form.confirmPassword ||
      !form.contactName.trim() ||
      !form.contactPhone.trim()
    ) {
      return '请填写所有必填项'
    }
    if (identityType !== 'CUSTOMER' && !form.orgName.trim()) {
      return '请填写所有必填项'
    }
    if (form.password !== form.confirmPassword) {
      return '两次输入的密码不一致'
    }
    if (form.password.length < 6) {
      return '密码长度不能少于6位'
    }
    if (!/^1[3-9]\d{9}$/.test(form.contactPhone.trim())) {
      return '手机号格式不正确'
    }
    return ''
  }

  const handleSubmit = async () => {
    const err = validate()
    if (err) {
      setError(err)
      return
    }

    setSubmitting(true)
    setError('')
    setSuccess('')

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
        router.replace('/login')
      }, 1500)
    } catch (e: any) {
      setError(e?.response?.data?.message || e.message || '注册失败')
    } finally {
      setSubmitting(false)
    }
  }

  const orgLabel =
    identityType === 'CUSTOMER'
      ? '公司名称（选填）'
      : identityType === 'MERCHANT'
        ? '店铺名称'
        : '供应商名称'

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Card style={styles.card} padding="lg">
          <Text style={styles.title}>账号注册</Text>

          <View style={styles.tabs}>
            {IDENTITY_TABS.map(tab => {
              const active = tab.key === identityType
              return (
                <TouchableOpacity
                  key={tab.key}
                  style={[styles.tab, active && styles.tabActive]}
                  onPress={() => setIdentityType(tab.key)}
                  activeOpacity={0.8}
                >
                  <Icon name={tab.icon} size={14} color={active ? Tokens.accentForeground : Tokens.foreground} />
                  <Text style={[styles.tabText, active && styles.tabTextActive]}>{tab.label}</Text>
                </TouchableOpacity>
              )
            })}
          </View>

          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}
          {success ? (
            <View style={styles.successBox}>
              <Text style={styles.successText}>{success}</Text>
            </View>
          ) : null}

          <View style={styles.form}>
            <Input label="登录账号" icon="user" value={form.username} onChangeText={v => updateField('username', v)} autoCapitalize="none" />
            <Input label="手机号码" icon="phone" value={form.contactPhone} onChangeText={v => updateField('contactPhone', v)} keyboardType="phone-pad" />
            <Input label="联系人" icon="user" value={form.contactName} onChangeText={v => updateField('contactName', v)} />
            <Input label="密码" icon="lockKeyhole" value={form.password} onChangeText={v => updateField('password', v)} secureTextEntry />
            <Input label="确认密码" value={form.confirmPassword} onChangeText={v => updateField('confirmPassword', v)} secureTextEntry />
            <Input label={orgLabel} icon="building2" value={form.orgName} onChangeText={v => updateField('orgName', v)} />
            <Input label="邮箱" icon="mail" value={form.email} onChangeText={v => updateField('email', v)} keyboardType="email-address" autoCapitalize="none" />
            {identityType === 'CUSTOMER' && (
              <Input label="邀请码" value={form.inviteCode} onChangeText={v => updateField('inviteCode', v)} />
            )}
          </View>

          <Button
            variant="primary"
            size="lg"
            fullWidth
            onPress={handleSubmit}
            loading={submitting}
            disabled={submitting}
            icon="arrowRight"
            iconRight
            style={styles.button}
          >
            {submitting ? '注册中...' : '立即注册'}
          </Button>

          <TouchableOpacity onPress={() => router.replace('/login')} style={styles.loginLink}>
            <Text style={styles.loginText}>已有账号？去登录</Text>
          </TouchableOpacity>
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Tokens.background,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 16,
  },
  card: {
    width: '100%',
    alignSelf: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: Tokens.foreground,
    marginBottom: 16,
  },
  tabs: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: Tokens.radius,
    backgroundColor: Tokens.surfaceSecondary,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 4,
  },
  tabActive: {
    backgroundColor: Tokens.accent,
  },
  tabText: {
    color: Tokens.foreground,
    fontWeight: '500',
    fontSize: 13,
  },
  tabTextActive: {
    color: Tokens.accentForeground,
    fontWeight: '600',
  },
  errorBox: {
    backgroundColor: Tokens.dangerSoft,
    borderRadius: Tokens.radius,
    padding: 10,
    marginBottom: 12,
  },
  errorText: {
    color: Tokens.danger,
    fontSize: 13,
  },
  successBox: {
    backgroundColor: Tokens.successSoft,
    borderRadius: Tokens.radius,
    padding: 10,
    marginBottom: 12,
  },
  successText: {
    color: Tokens.successDark,
    fontSize: 13,
  },
  form: {
    gap: 10,
  },
  button: {
    marginTop: 16,
  },
  loginLink: {
    marginTop: 16,
    alignItems: 'center',
  },
  loginText: {
    color: Tokens.accent,
    fontWeight: '500',
  },
})
