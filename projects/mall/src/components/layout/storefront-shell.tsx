import { ChevronDown, Menu, Search, ShoppingCart, Store, User, X } from 'lucide-react'
import { Button, Chip, Dropdown, InputGroup } from '@heroui/react'
import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useSession } from '../../auth/session'
import { getAccessToken, getStoredProfile } from '@apps/utils'
import { getErrorMessage } from '../../lib/errors'
import type { RoleType } from '../../types/models'

const WORKSPACE_URL = import.meta.env.VITE_WORKSPACE_URL ?? ''

const PRIMARY_NAV = [
  { label: '首页', to: '/' },
  { label: '热门推荐', to: '/search?sort=sales' },
  { label: '新品上新', to: '/search?sort=newest' },
  { label: '全部商品', to: '/search' },
]

function navigateToWorkspace(path: string) {
  const targetOrigin = WORKSPACE_URL || window.location.origin
  const url = new URL(path, targetOrigin)
  const isCrossOrigin = url.origin !== window.location.origin

  if (isCrossOrigin) {
    const token = getAccessToken()
    const profile = getStoredProfile()

    if (token) {
      url.searchParams.set('_handoff_token', token)
    }

    if (profile) {
      const slim = {
        role: profile.role,
        identityType: profile.identityType,
        username: profile.username,
        name: profile.name,
        headline: profile.headline,
        route: profile.route,
        identities: profile.identities,
        memberLevel: profile.memberLevel,
      }

      url.searchParams.set('_handoff_profile', btoa(encodeURIComponent(JSON.stringify(slim))))
    }
  }

  window.location.href = url.toString()
}

function isNavActive(currentPathname: string, currentSearch: string, target: string) {
  const [targetPath, targetQuery = ''] = target.split('?')
  const normalizedPathname = currentPathname === '/home' ? '/' : currentPathname

  if (targetPath !== normalizedPathname) {
    return false
  }

  if (!targetQuery) {
    return true
  }

  const currentParams = new URLSearchParams(currentSearch)
  const targetParams = new URLSearchParams(targetQuery)

  return Array.from(targetParams.entries()).every(([key, value]) => currentParams.get(key) === value)
}

export function StorefrontShell() {
  const navigate = useNavigate()
  const location = useLocation()
  const session = useSession()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [searchKeyword, setSearchKeyword] = useState('')

  useEffect(() => {
    window.scrollTo({ top: 0 })
    setMobileOpen(false)
  }, [location.pathname, location.search])

  const switchableIdentities = (session.profile?.identities ?? []).filter(
    (identity) => identity.status === 'ENABLED' && !identity.active,
  )
  const hasMultipleIdentities = switchableIdentities.length > 0

  async function handleSignOut() {
    await session.signOut()
    navigate('/')
  }

  async function handleSwitchTo(identityType: RoleType) {
    try {
      await session.switchToIdentity(identityType)
      navigate('/')
    } catch (error) {
      console.error(getErrorMessage(error, '切换身份失败'))
    }
  }

  function handleSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    navigate(searchKeyword.trim() ? `/search?q=${encodeURIComponent(searchKeyword.trim())}` : '/search')
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border/70 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex h-[40px] max-w-[1220px] items-center gap-2 px-3">
          <Button
            variant="ghost"
            className="h-auto shrink-0 rounded-[calc(var(--radius)*3)] px-0"
            onPress={() => navigate('/')}
          >
            <div className="flex items-center gap-1.5">
              <div
                className="flex h-7 w-7 items-center justify-center rounded-[calc(var(--radius)*2)] text-accent-foreground"
                style={{
                  background:
                    'linear-gradient(135deg, var(--accent), color-mix(in oklab, var(--accent) 70%, var(--foreground) 30%))',
                }}
              >
                <Store size={14} />
              </div>
              <span className="hidden text-[14px] font-extrabold tracking-tight text-foreground sm:block">
                小牙商城
              </span>
            </div>
          </Button>

          <nav className="hidden items-center gap-0.5 md:flex">
            <Button
              variant="primary"
              size="sm"
              className="rounded-full px-3 text-xs"
              onPress={() => navigate('/search')}
            >
              全部商品分类
            </Button>
            {PRIMARY_NAV.map((item) => (
              <Button
                key={item.to}
                size="sm"
                variant={isNavActive(location.pathname, location.search, item.to) ? 'primary' : 'ghost'}
                className="rounded-full px-3 text-xs font-medium"
                onPress={() => navigate(item.to)}
              >
                {item.label}
              </Button>
            ))}
          </nav>

          <form onSubmit={handleSearchSubmit} className="flex-1">
            <InputGroup
              fullWidth
              variant="secondary"
              className="rounded-[calc(var(--radius)*3)] bg-white shadow-[var(--shadow-surface)]"
            >
              <InputGroup.Prefix>
                <Search size={14} className="text-accent" />
              </InputGroup.Prefix>
              <InputGroup.Input
                value={searchKeyword}
                onChange={(event) => setSearchKeyword(event.target.value)}
                placeholder="搜索商品"
              />
              <InputGroup.Suffix>
                <Button type="submit" variant="primary" size="sm">
                  搜索
                </Button>
              </InputGroup.Suffix>
            </InputGroup>
          </form>

          <div className="flex items-center gap-1 text-[11px] text-muted">
            {session.profile ? (
              <>
                <span className="hidden items-center gap-1 rounded-full bg-[color:var(--color-accent-soft)] px-2 py-0.5 text-xs font-medium text-foreground sm:inline-flex">
                  <User size={10} className="text-accent" />
                  {session.profile.name}
                </span>

                {hasMultipleIdentities ? (
                  <Dropdown>
                    <Dropdown.Trigger className="inline-flex items-center gap-0.5 rounded-full px-2 py-1 text-xs font-medium text-foreground transition-colors hover:bg-default">
                      切换 <ChevronDown size={10} />
                    </Dropdown.Trigger>
                    <Dropdown.Popover>
                      <Dropdown.Menu
                        aria-label="切换身份"
                        onAction={(key) => {
                          void handleSwitchTo(String(key) as RoleType)
                        }}
                      >
                        {switchableIdentities.map((identity) => (
                          <Dropdown.Item key={identity.identityType}>{identity.displayName}</Dropdown.Item>
                        ))}
                      </Dropdown.Menu>
                    </Dropdown.Popover>
                  </Dropdown>
                ) : null}

                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 rounded-full px-2 text-xs"
                  onPress={() => navigateToWorkspace(session.profile?.route ?? '/')}
                >
                  工作台
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 rounded-full px-2 text-xs"
                  onPress={() => void handleSignOut()}
                >
                  退出
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 rounded-full px-2 text-xs font-semibold text-accent"
                  onPress={() => navigate('/login')}
                >
                  登录
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 rounded-full px-2 text-xs"
                  onPress={() => navigate('/login')}
                >
                  注册
                </Button>
              </>
            )}

            <Button
              variant="ghost"
              size="sm"
              className="hidden h-7 rounded-full px-2 text-xs sm:inline-flex"
              onPress={() => navigate('/cart')}
            >
              <ShoppingCart size={12} />
              {session.cartCount > 0 ? (
                <Chip color="accent" variant="secondary" size="sm">
                  {session.cartCount}
                </Chip>
              ) : null}
            </Button>
          </div>

          <Button isIconOnly variant="ghost" className="md:hidden" onPress={() => setMobileOpen((open) => !open)}>
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </Button>
        </div>

        {mobileOpen ? (
          <div className="border-t border-border bg-white/95 p-2 md:hidden">
            {[
              ['首页', '/'],
              ['全部商品', '/search'],
              ['热门推荐', '/search?sort=sales'],
              ['新品上新', '/search?sort=newest'],
              ['购物车', '/cart'],
            ].map(([label, to]) => (
              <Button
                key={to}
                variant="ghost"
                className="mb-1 flex w-full justify-start rounded-2xl px-4"
                onPress={() => {
                  setMobileOpen(false)
                  navigate(to)
                }}
              >
                {label}
              </Button>
            ))}
          </div>
        ) : null}
      </header>

      <main className="mx-auto min-h-[500px] max-w-[1220px] px-3 py-1">
        <Outlet />
      </main>

      <footer className="mt-6 border-t border-border/80 bg-white/70 backdrop-blur-sm">
        <div className="mx-auto flex max-w-[1220px] items-center justify-between gap-3 px-3 py-3 text-xs text-muted">
          <span>小牙商城</span>
          <span>&copy; {new Date().getFullYear()} 小牙商城 B2B 采购平台</span>
        </div>
      </footer>
    </div>
  )
}
