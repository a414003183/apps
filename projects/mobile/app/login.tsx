import { useState } from 'react'
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity } from 'react-native'
import { Text } from 'react-native-paper'
import { useRouter } from 'expo-router'
import { useAuthStore } from '../src/store/authStore'
import { login as apiLogin, switchIdentity } from '../src/api/auth'
import { Card } from '../src/components/ui/Card'
import { Button } from '../src/components/ui/Button'
import { Input } from '../src/components/ui/Input'
import { Tokens } from '../src/theme'

export default function LoginPage() {
  const router = useRouter()
  const { setUser } = useAuthStore()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      setError('请输入用户名和密码')
      return
    }

    setLoading(true)
    setError('')
    try {
      const user = await apiLogin(username, password)

      let finalUser = user
      if (user.identityType !== 'CUSTOMER') {
        const customerIdentity = user.identities?.find((id: any) => id.identityType === 'CUSTOMER' && id.active)

        if (!customerIdentity) {
          setError('此账号不是客户身份，无法使用App')
          setLoading(false)
          return
        }

        finalUser = await switchIdentity('CUSTOMER')
      }

      setUser(finalUser, finalUser.token)
      router.replace('/(tabs)' as const)
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || '登录失败，请检查用户名和密码')
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Card style={styles.card} padding="lg">
          <Text style={styles.title}>账号登录</Text>

          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <Input
            label="手机号码"
            icon="phone"
            value={username}
            onChangeText={setUsername}
            placeholder="请输入手机号码"
            keyboardType="phone-pad"
            containerStyle={styles.input}
          />

          <Input
            label="密码"
            icon="lockKeyhole"
            value={password}
            onChangeText={setPassword}
            placeholder="请输入密码"
            secureTextEntry
            containerStyle={styles.input}
          />

          <Button
            variant="primary"
            size="lg"
            fullWidth
            onPress={handleLogin}
            loading={loading}
            disabled={loading}
            icon="arrowRight"
            iconRight
            style={styles.button}
          >
            {loading ? '登录中...' : '登录'}
          </Button>

          <TouchableOpacity onPress={() => router.push('/register' as any)} style={styles.registerLink}>
            <Text style={styles.registerText}>还没有账号？立即注册</Text>
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
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: Tokens.foreground,
    marginBottom: 20,
  },
  errorBox: {
    backgroundColor: Tokens.dangerSoft,
    borderRadius: Tokens.radius,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: Tokens.danger,
    fontSize: 13,
  },
  input: {
    marginBottom: 14,
  },
  button: {
    marginTop: 6,
  },
  registerLink: {
    marginTop: 16,
    alignItems: 'center',
  },
  registerText: {
    color: Tokens.accent,
    fontSize: 14,
    fontWeight: '500',
  },
})
