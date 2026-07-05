import { ArrowRight, LockKeyhole, Phone } from 'lucide-react'
import { Button, Card, InputGroup, Label, TextField } from '@heroui/react'
import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useSession } from '../auth/session'
import { getErrorMessage } from '../lib/errors'

export function LoginPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const session = useSession()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const redirect = searchParams.get('redirect') || '/'

  useEffect(() => {
    if (session.ready && session.isAuthenticated) navigate(redirect, { replace: true })
  }, [session.ready, session.isAuthenticated, redirect, navigate])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!username || !password) return
    setSubmitting(true)
    setError('')
    try {
      let p = await session.signIn(username, password)
      const canSwitch = !!p.identities?.some((i) => i.identityType === 'CUSTOMER' && i.status === 'ENABLED')
      if (p.identityType !== 'CUSTOMER' && canSwitch) p = await session.switchToIdentity('CUSTOMER')
      navigate(redirect, { replace: true })
    } catch (err) {
      setError(getErrorMessage(err, '登录失败'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-[500px] py-10">
      <div className="w-full max-w-[400px]">
        <Card>
          <Card.Content className="p-8">
            <h2 className="text-xl font-bold text-foreground mb-6">账号登录</h2>
            {error && (
              <div className="mb-4 p-3 bg-danger/10 border border-danger/20 rounded-lg text-sm text-danger">
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <TextField isRequired>
                <Label className="text-xs text-muted">手机号码</Label>
                <InputGroup>
                  <InputGroup.Prefix>
                    <Phone size={16} className="text-muted" />
                  </InputGroup.Prefix>
                  <InputGroup.Input
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="请输入手机号码"
                    required
                  />
                </InputGroup>
              </TextField>
              <TextField isRequired>
                <Label className="text-xs text-muted">密码</Label>
                <InputGroup>
                  <InputGroup.Prefix>
                    <LockKeyhole size={16} className="text-muted" />
                  </InputGroup.Prefix>
                  <InputGroup.Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="请输入密码"
                    required
                  />
                </InputGroup>
              </TextField>
              <Button type="submit" isPending={submitting} fullWidth size="lg">
                {submitting ? '登录中...' : '登录'} {!submitting && <ArrowRight size={17} />}
              </Button>

              <div className="text-center text-sm text-muted">
                还没有账号？
                <Link to="/register" className="text-accent hover:underline ml-1">
                  立即注册
                </Link>
              </div>
            </form>
          </Card.Content>
        </Card>
      </div>
    </div>
  )
}
