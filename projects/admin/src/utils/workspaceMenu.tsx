import {
  AppstoreOutlined,
  BarChartOutlined,
  CloudUploadOutlined,
  ClusterOutlined,
  DashboardOutlined,
  FileSearchOutlined,
  FileTextOutlined,
  GiftOutlined,
  GoldOutlined,
  HomeOutlined,
  IdcardOutlined,
  LineChartOutlined,
  PartitionOutlined,
  ProfileOutlined,
  SafetyOutlined,
  SettingOutlined,
  ShopOutlined,
  ShoppingCartOutlined,
  ShoppingOutlined,
  TeamOutlined,
  ToolOutlined,
  TruckOutlined,
  UsergroupAddOutlined,
  UserOutlined,
} from '@ant-design/icons'
import type { WorkspaceMenuItem } from '../types/models'

// 定义菜单项类型
export interface MenuItem {
  path: string
  name?: string
  icon?: React.ReactNode
  children?: MenuItem[]
}

function getIcon(iconName?: string) {
  const iconMap: Record<string, React.ReactNode> = {
    AppstoreOutlined: <AppstoreOutlined />,
    BarChartOutlined: <BarChartOutlined />,
    CloudUploadOutlined: <CloudUploadOutlined />,
    ClusterOutlined: <ClusterOutlined />,
    DashboardOutlined: <DashboardOutlined />,
    FileSearchOutlined: <FileSearchOutlined />,
    FileTextOutlined: <FileTextOutlined />,
    GiftOutlined: <GiftOutlined />,
    GoldOutlined: <GoldOutlined />,
    HomeOutlined: <HomeOutlined />,
    IdcardOutlined: <IdcardOutlined />,
    LineChartOutlined: <LineChartOutlined />,
    PartitionOutlined: <PartitionOutlined />,
    ProfileOutlined: <ProfileOutlined />,
    SafetyOutlined: <SafetyOutlined />,
    SettingOutlined: <SettingOutlined />,
    ShopOutlined: <ShopOutlined />,
    ShoppingCartOutlined: <ShoppingCartOutlined />,
    ShoppingOutlined: <ShoppingOutlined />,
    TeamOutlined: <TeamOutlined />,
    ToolOutlined: <ToolOutlined />,
    TruckOutlined: <TruckOutlined />,
    UsergroupAddOutlined: <UsergroupAddOutlined />,
    UserOutlined: <UserOutlined />,
  }
  return iconName ? iconMap[iconName] ?? <AppstoreOutlined /> : <AppstoreOutlined />
}

export function buildWorkspaceMenuItems(menus: WorkspaceMenuItem[]): MenuItem[] {
  if (!menus || menus.length === 0) {
    return []
  }

  // 只展示第一级菜单，不处理子菜单
  return menus.map((menu) => ({
    path: menu.path,
    name: menu.menuName,
    icon: getIcon(menu.icon),
    // 注释掉子菜单处理，只展示一级
    // children: menu.children && menu.children.length > 0
    //   ? buildWorkspaceMenuItems(menu.children)
    //   : undefined
  }))
}

export function resolveWorkspaceHomePath(role?: string): string {
  const pathMap: Record<string, string> = {
    ADMIN: '/admin/dashboard',
    MERCHANT: '/member/merchant/dashboard',
    CUSTOMER: '/member/customer/dashboard',
    SUPPLIER: '/member/supplier/dashboard',
  }
  return pathMap[role || 'CUSTOMER'] || '/member/customer/dashboard'
}
