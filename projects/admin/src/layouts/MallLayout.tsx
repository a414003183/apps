import {
  ArrowRightOutlined,
  LoginOutlined,
  LogoutOutlined,
  ShoppingCartOutlined,
  UserOutlined,
} from '@ant-design/icons'
import { Button, Layout, Select } from 'antd'
import { Link, Outlet, useNavigate } from 'react-router-dom'
import type { RoleType } from '../types/models'
import { getAuthProfile, logout } from '../utils/auth'
import { Avatar, Dropdown } from 'antd'
import type { MenuProps } from 'antd'

const { Header, Content, Footer } = Layout

const navItems = [
  { label: '首页', href: '/mall/home' },
  { label: '分类', href: '/mall/home#company' },
  { label: '商品', href: '/mall/home#pricing' },
]

const roleLabelMap: Record<RoleType, string> = {
  CUSTOMER: '客户',
  MERCHANT: '商家',
  SUPPLIER: '供应商',
  ADMIN: '平台管理员',
}

const roleHomePathMap: Record<RoleType, string> = {
  CUSTOMER: '/member/customer/dashboard',
  MERCHANT: '/member/merchant/dashboard',
  SUPPLIER: '/member/supplier/dashboard',
  ADMIN: '/admin/dashboard',
}

export function MallLayout() {
  const navigate = useNavigate()
  const profile = getAuthProfile()
  const activeIdentity = profile?.identityType ?? profile?.role

  function handleLogout() {
    logout()
    navigate('/mall/home')
  }

  const userMenuItems: MenuProps['items'] = profile
    ? [
        {
          key: 'workspace',
          label: '进入工作台',
          onClick: () => navigate(profile?.route ?? '/login'),
        },
        {
          type: 'divider',
        },
        {
          key: 'logout',
          label: '退出登录',
          onClick: handleLogout,
        },
      ]
    : []

  return (
    <Layout className="mall-layout" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
          background: '#fff',
          borderBottom: '1px solid #f0f0f0',
          position: 'sticky',
          top: 0,
          zIndex: 100,
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
          <Link to="/mall/home" style={{ fontSize: 20, fontWeight: 'bold', color: '#1890ff' }}>
            链讯智采
          </Link>
          <nav style={{ display: 'flex', gap: 24 }}>
            {navItems.map((item) => (
              <Link key={item.label} to={item.href} style={{ color: '#666' }}>
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Link to="/mall/cart">
            <Button icon={<ShoppingCartOutlined />}>购物车</Button>
          </Link>

          {profile ? (
            <>
              {(profile.identities?.length ?? 0) > 0 && (
                <Select<RoleType>
                  value={activeIdentity}
                  style={{ width: 120 }}
                  onChange={(value) => {
                    navigate(roleHomePathMap[value])
                  }}
                  options={(profile.identities ?? []).map((identity) => ({
                    value: identity.identityType,
                    label: roleLabelMap[identity.identityType],
                    disabled: identity.status !== 'ENABLED',
                  }))}
                />
              )}
              <Button type="primary" onClick={() => navigate(profile.route)}>
                能力中心
              </Button>
              <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
                <Avatar icon={<UserOutlined />} style={{ cursor: 'pointer' }} />
              </Dropdown>
            </>
          ) : (
            <Link to="/login">
              <Button type="primary" icon={<LoginOutlined />}>
                登录 / 注册
              </Button>
            </Link>
          )}
        </div>
      </Header>

      <Content style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#f5f5f5' }}>
        <div
          style={{
            maxWidth: 1200,
            margin: '0 auto',
            padding: '24px 16px',
            width: '100%',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <Outlet />
        </div>
      </Content>

      <Footer style={{ textAlign: 'center', background: '#fff', borderTop: '1px solid #f0f0f0', flexShrink: 0 }}>
        B2B采购商城 &copy;{new Date().getFullYear()}
      </Footer>
    </Layout>
  )
}
