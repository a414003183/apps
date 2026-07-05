import type { MenuDataItem } from '@ant-design/pro-components'
import { ProLayout } from '@ant-design/pro-components'
import {
  AppstoreOutlined,
  BarChartOutlined,
  CloudUploadOutlined,
  DashboardOutlined,
  FileTextOutlined,
  GiftOutlined,
  GoldOutlined,
  HomeOutlined,
  IdcardOutlined,
  LogoutOutlined,
  SettingOutlined,
  ShopOutlined,
  ShoppingOutlined,
  SwapOutlined,
  TeamOutlined,
  UserOutlined,
} from '@ant-design/icons'
import { Avatar, Button, Dropdown, Tag } from 'antd'
import type { MenuProps } from 'antd'
import { request } from '@umijs/max'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { type ReactNode, useMemo } from 'react'
import type { RoleType, WorkspaceMenuNode } from '../types/models'
import { getAuthProfile, logout as clearAuthSession, saveAuthSession } from '../utils/auth'

type MemberRole = Exclude<RoleType, 'ADMIN'>

type LayoutMeta = {
  headerTitle: string
  homePath: string
}

const memberLayoutMetaMap: Record<MemberRole, LayoutMeta> = {
  CUSTOMER: {
    headerTitle: '\u5ba2\u6237\u4f1a\u5458\u4e2d\u5fc3',
    homePath: '/member/customer/dashboard',
  },
  MERCHANT: {
    headerTitle: '\u5546\u5bb6\u4f1a\u5458\u4e2d\u5fc3',
    homePath: '/member/merchant/dashboard',
  },
  SUPPLIER: {
    headerTitle: '\u4f9b\u5e94\u5546\u4f1a\u5458\u4e2d\u5fc3',
    homePath: '/member/supplier/dashboard',
  },
}

const levelNameMap: Record<string, string> = {
  NORMAL: '\u666e\u901a\u4f1a\u5458',
  GOLD: '\u91d1\u724c\u4f1a\u5458',
  PROJECT: '\u9879\u76ee\u4f1a\u5458',
}

const roleLabelMap: Record<RoleType, string> = {
  CUSTOMER: '\u5ba2\u6237',
  MERCHANT: '\u5546\u5bb6',
  SUPPLIER: '\u4f9b\u5e94\u5546',
  ADMIN: '\u5e73\u53f0\u7ba1\u7406\u5458',
}

function resolveMemberRole(pathname: string, identityType?: RoleType): MemberRole {
  if (identityType && identityType !== 'ADMIN') {
    return identityType
  }
  if (pathname.startsWith('/member/merchant')) {
    return 'MERCHANT'
  }
  if (pathname.startsWith('/member/supplier')) {
    return 'SUPPLIER'
  }
  return 'CUSTOMER'
}

function getMenuIcon(iconName?: string) {
  const iconMap: Record<string, ReactNode> = {
    DashboardOutlined: <DashboardOutlined />,
    TeamOutlined: <TeamOutlined />,
    ShopOutlined: <ShopOutlined />,
    ShoppingOutlined: <ShoppingOutlined />,
    GiftOutlined: <GiftOutlined />,
    BarChartOutlined: <BarChartOutlined />,
    SettingOutlined: <SettingOutlined />,
    UserOutlined: <UserOutlined />,
    IdcardOutlined: <IdcardOutlined />,
    FileTextOutlined: <FileTextOutlined />,
    CloudUploadOutlined: <CloudUploadOutlined />,
    GoldOutlined: <GoldOutlined />,
    HomeOutlined: <HomeOutlined />,
  }

  return iconName ? iconMap[iconName] ?? <SettingOutlined /> : <SettingOutlined />
}

function buildMemberMenuData(menus: WorkspaceMenuNode[], meta: LayoutMeta): MenuDataItem[] {
  const rootPath = meta.homePath.replace(/\/dashboard$/, '')
  const menuItems = menus
    .filter((menu) => menu.visible !== false && !!menu.path && menu.path !== rootPath)
    .sort((left, right) => left.sortNo - right.sortNo)
    .reduce<MenuDataItem[]>((accumulator, menu) => {
      if (accumulator.some((item) => item.path === menu.path)) {
        return accumulator
      }

      accumulator.push({
        key: menu.path,
        path: menu.path,
        name: menu.menuName,
        icon: getMenuIcon(menu.icon),
      })
      return accumulator
    }, [])

  if (menuItems.length === 0) {
    menuItems.push({
      key: meta.homePath,
      path: meta.homePath,
      name: '\u9996\u9875',
      icon: <HomeOutlined />,
    })
  }

  return menuItems
}

export function MemberLayout({ children }: { children?: ReactNode }) {
  const profile = getAuthProfile()
  const location = useLocation()
  const navigate = useNavigate()

  if (!profile) {
    window.location.replace('/login')
    return null
  }

  const currentRole = resolveMemberRole(location.pathname, profile.identityType)
  const meta = memberLayoutMetaMap[currentRole]
  const menus = profile.menus ?? []

  const levelDisplay =
    currentRole === 'CUSTOMER' && profile.memberLevel ? (
      <Tag color="gold" style={{ marginInlineStart: 8 }}>
        {levelNameMap[profile.memberLevel] || profile.memberLevel}
      </Tag>
    ) : null

  const switchIdentityItems = useMemo<MenuProps['items']>(
    () =>
      (profile.identities ?? [])
        .filter((identity) => identity.active === false && identity.status === 'ENABLED')
        .map((identity) => ({
          key: identity.identityType,
          label: identity.displayName,
          onClick: async () => {
            try {
              const response = await request<any>('/api/auth/switch-identity', {
                method: 'POST',
                data: { identityType: identity.identityType },
              })

              if (response.data?.token) {
                const targetType = response.data.identityType ?? identity.identityType
                saveAuthSession(
                  {
                    ...profile,
                    identityType: targetType,
                    route: response.data.route,
                    permissions: response.data.permissions ?? profile.permissions,
                    menus: response.data.menus ?? profile.menus,
                    identities: response.data.identities ?? profile.identities,
                    // memberLevel 仅在客户身份下保留，其他身份清除
                    memberLevel:
                      targetType === 'CUSTOMER' ? response.data.memberLevel ?? profile.memberLevel : undefined,
                  },
                  response.data.token,
                )
                window.location.href = response.data.route
              }
            } catch (error) {
              console.error('\u5207\u6362\u8eab\u4efd\u5931\u8d25:', error)
            }
          },
        })),
    [profile],
  )

  const menuData = useMemo(() => {
    return buildMemberMenuData(menus, meta).map((item) => ({
      ...item,
      onTitleClick: () => navigate(item.path ?? meta.homePath),
    }))
  }, [menus, meta, navigate])

  const handleBackToMall = () => {
    window.location.href = '/mall/home'
  }

  const handleLogout = () => {
    clearAuthSession()
    window.location.href = '/mall/home'
  }

  return (
    <ProLayout
      className="member-workspace-layout"
      title={meta.headerTitle}
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
      menu={{
        locale: false,
      }}
      menuDataRender={() => menuData}
      menuItemRender={false}
      onMenuHeaderClick={() => navigate(meta.homePath)}
      headerTitleRender={(_, title) => (
        <div
          onClick={() => navigate(meta.homePath)}
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
          {levelDisplay}
        </span>,
        switchIdentityItems && switchIdentityItems.length > 0 ? (
          <Dropdown key="switch-identity" menu={{ items: switchIdentityItems }} placement="bottomRight">
            <Button type="text">
              <SwapOutlined />
              {roleLabelMap[currentRole]}
            </Button>
          </Dropdown>
        ) : null,
        <Button key="back-to-mall" type="text" size="small" icon={<HomeOutlined />} onClick={handleBackToMall}>
          {'返回商城'}
        </Button>,
        <Button key="logout" type="text" size="small" icon={<LogoutOutlined />} onClick={handleLogout}>
          {'退出登录'}
        </Button>,
      ]}
    >
      {children ?? <Outlet />}
    </ProLayout>
  )
}

export default MemberLayout
