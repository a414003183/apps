import { getAuthProfile, saveAuthSession } from '../utils/auth'
import { buildWorkspaceMenuItems } from '../utils/workspaceMenu'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { ProLayout } from '@ant-design/pro-components'
import { useMemo } from 'react'
import { Avatar, Dropdown, Button } from 'antd'
import { LogoutOutlined, HomeOutlined, UserOutlined, SwapOutlined } from '@ant-design/icons'
import type { MenuProps } from 'antd'
import type { RoleType } from '../types/models'
import { request } from '@umijs/max'

const roleLabelMap: Record<RoleType, string> = {
  CUSTOMER: '客户',
  MERCHANT: '商家',
  SUPPLIER: '供应商',
  ADMIN: '平台管理员',
}

export default function AdminLayout() {
  const profile = getAuthProfile()
  const menus = profile?.menus ?? []
  const location = useLocation()
  const navigate = useNavigate()
  const identities = profile?.identities ?? []
  const activeIdentity = profile?.identityType ?? profile?.role ?? 'ADMIN'

  if (!profile) {
    window.location.replace('/login')
    return null
  }

  const menuItems = useMemo(() => {
    return buildWorkspaceMenuItems(menus).map((item) => ({
      ...item,
      onTitleClick: () => navigate(item.path),
    }))
  }, [menus, navigate])

  const switchIdentityItems = useMemo<MenuProps['items']>(
    () =>
      identities
        .filter((id) => id.active === false && id.status === 'ENABLED')
        .map((id) => ({
          key: id.identityType,
          label: id.displayName,
          onClick: async () => {
            try {
              const response = await request<any>('/api/auth/switch-identity', {
                method: 'POST',
                data: { identityType: id.identityType },
              })
              if (response.data?.token) {
                const targetType = response.data.identityType ?? id.identityType
                saveAuthSession(
                  {
                    role: profile.role,
                    identityType: targetType,
                    route: response.data.route,
                    permissions: response.data.permissions ?? profile.permissions,
                    menus: response.data.menus ?? profile.menus,
                    identities: response.data.identities ?? profile.identities,
                    memberLevel:
                      targetType === 'CUSTOMER' ? response.data.memberLevel ?? profile.memberLevel : undefined,
                    name: profile.name,
                    headline: profile.headline,
                    username: profile.username,
                  },
                  response.data.token,
                )
                window.location.href = response.data.route
              }
            } catch (error) {
              console.error('切换身份失败:', error)
            }
          },
        })),
    [profile],
  )

  return (
    <ProLayout
      className="admin-workspace-layout"
      title="平台管理后台"
      logo="https://gw.alipayobjects.com/zos/rmsportal/KDpgvguMpGfqaHPjicRK.svg"
      navTheme="light"
      layout="mix"
      contentWidth="Fixed"
      fixedHeader
      fixSiderbar
      colorPrimary="#1890ff"
      splitMenus={false}
      siderMenuType="sub"
      collapsed={false}
      collapsedButtonRender={false}
      footerRender={false}
      breakpoint={false}
      siderWidth={176}
      token={{
        bgLayout: '#f0f2f5',
        pageContainer: {
          paddingBlockPageContainerContent: 8,
          paddingInlinePageContainerContent: 12,
        },
        sider: {
          paddingBlockLayoutMenu: 2,
          paddingInlineLayoutMenu: 4,
          colorMenuBackground: '#fff',
          menuHeight: 32,
        },
        header: {
          heightLayoutHeader: 42,
          colorBgHeader: '#fff',
        },
      }}
      location={{ pathname: location.pathname }}
      menu={{ locale: false }}
      menuDataRender={() => menuItems}
      menuItemRender={false}
      onMenuHeaderClick={() => navigate('/admin/dashboard')}
      headerTitleRender={(_, title) => (
        <div
          onClick={() => navigate('/admin/dashboard')}
          style={{ cursor: 'pointer', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}
        >
          {title}
        </div>
      )}
      actionsRender={() => [
        <span
          key="user-info"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            padding: '0 4px',
            fontSize: 13,
            whiteSpace: 'nowrap',
          }}
        >
          <Avatar size={20} icon={<UserOutlined />} />
          <span>{profile.name}</span>
        </span>,
        switchIdentityItems && switchIdentityItems.length > 0 ? (
          <Dropdown key="switch-identity" menu={{ items: switchIdentityItems }} placement="bottomRight">
            <Button type="text">
              <SwapOutlined />
              {roleLabelMap[activeIdentity]}
            </Button>
          </Dropdown>
        ) : null,
        <Button
          key="back-to-mall"
          type="text"
          size="small"
          icon={<HomeOutlined />}
          onClick={() => (window.location.href = '/mall/home')}
        >
          {'返回商城'}
        </Button>,
        <Button
          key="logout"
          type="text"
          size="small"
          icon={<LogoutOutlined />}
          onClick={() => {
            localStorage.clear()
            window.location.href = '/mall/home'
          }}
        >
          {'退出登录'}
        </Button>,
      ]}
    >
      <Outlet />
    </ProLayout>
  )
}
