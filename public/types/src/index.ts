/**
 * 公共业务类型定义
 * 供 admin / mall / mobile / weapp 等子项目引用
 */

export type RoleType = 'CUSTOMER' | 'MERCHANT' | 'SUPPLIER' | 'ADMIN'

export interface UserIdentityOption {
  identityType: RoleType
  displayName: string
  status: string
  defaultIdentity: boolean
  active: boolean
  route: string
}

export interface WorkspaceMenuNode {
  id: number
  parentId: number
  menuName: string
  path: string
  component: string
  icon?: string
  permissionCode?: string
  sortNo: number
  visible: boolean
}

export interface WorkspaceMenuItem extends WorkspaceMenuNode {
  children?: WorkspaceMenuItem[]
  name?: string
}

export interface AuthProfile {
  role: RoleType
  identityType: RoleType
  username?: string
  name: string
  headline: string
  route: string
  permissions?: string[]
  menus?: WorkspaceMenuNode[]
  identities?: UserIdentityOption[]
  memberLevel?: string
}

export interface AuthUser {
  username: string
  role: RoleType
  identityType: RoleType
  displayName: string
  route: string
  permissions: string[]
  menus: WorkspaceMenuNode[]
  identities: UserIdentityOption[]
  memberLevel?: string
}

export interface AuthSession extends AuthUser {
  token: string
  tokenType: string
}

export interface ApiResponse<T> {
  code: number
  message: string
  data: T
}

export interface PageResult<T> {
  list: T[]
  total: number
  page: number
  pageSize: number
}

export interface SelectOption {
  value: string
  label: string
}

export interface Product {
  id: number
  merchantId: number
  merchantGoodsId: number
  skuId: number
  name: string
  brand: string
  category: string
  categoryId?: number
  parentCategory?: string
  rootCategory?: string
  summary: string
  price: number
  memberPrice: number
  freightAmount?: number
  stock: number
  specs: string
  leadTime: string
  badge: string
  mainImageId?: number
  keywords?: string
  detailContent?: string
  description?: string
  shopName: string
  saleCount?: number
  currentLevel?: string
  currentLevelName?: string
  currentDiscountValue?: number
  levelPrices?: Array<{
    levelCode: string
    levelName: string
    price: number
    discountValue: number
  }>
}

export interface ShopInfo {
  id: number
  shopName: string
  shopDesc?: string
  contactName: string
  contactPhone: string
  status: string
  productCount: number
  totalSales: number
}

export interface MallCartItem {
  id: string
  merchantGoodsId: number
  skuId: number
  productName: string
  skuName: string
  specText: string
  unitPrice: number
  memberPrice: number
  finalUnitPrice: number
  quantity: number
  stockQty: number
  lineAmount: number
  freightAmount?: number
  badge: string
  mainImageId?: number
}

export interface CreateOrderResult {
  id: string
  orderNo: string
  payAmount: number
  usedPoints: number
  pointsDeductionAmount: number
  orderStatus: string
  payStatus: string
}

export interface OrderItem {
  id: string
  orderNo: string
  customerName: string
  merchantName: string
  amount: number
  status: string
  payStatus: string
  logisticsNo: string
  createdAt: string
  aftersaleStatus?: string
  orderSource?: string
}

export interface OrderSummary {
  id: string
  orderNo: string
  customerName: string
  merchantName: string
  amount: number
  status: string
  payStatus: string
  logisticsNo: string
  createdAt: string
  aftersaleStatus: string
  orderSource: string
}

export interface OrderLineItem {
  id: string
  merchantGoodsId: string
  skuId: string
  spuName: string
  skuName: string
  specText: string
  quantity: number
  unitPrice: number
  lineAmount: number
}

export interface OrderTimelineEvent {
  id: string
  eventType: string
  title: string
  description: string
  operatorName: string
  eventTime: string
}

export interface TimelineEvent {
  id: string
  eventType: string
  title: string
  description: string
  operatorName: string
  eventTime: string
}

export interface CustomerProfile {
  customerId: number
  companyName: string
  contactName: string
  contactPhone: string
  memberLevel?: string
  defaultAddress: Address
}

export interface Address {
  receiverName: string
  receiverPhone: string
  receiverProvince: string
  receiverCity: string
  receiverDistrict: string
  receiverAddress: string
}

export interface HomeData {
  categories: Array<{ id: number; name: string; parentId?: number }>
  featuredProducts: Product[]
  memberDeals: Product[]
  newArrivals: Product[]
}

export interface CustomerLevelConfigRow {
  id: string
  levelCode: string
  levelName: string
  upgradeThresholdAmount: number
  discountScope?: string
  discountValue?: number
  sortNo: number
  status: string
  remark?: string
  updatedAt: string
}

export interface UserRow {
  id: string
  username: string
  displayName: string
  roleId: string
  roleCode: string
  role: string
  status: string
  phone: string
  email: string
  createdAt: string
  identityTypes?: string[]
}

export interface RegistrationApplicationRow {
  id: string
  username: string
  identityType: RoleType
  displayName: string
  phone: string
  email: string
  status: string
  createdAt: string
}

export interface RoleRow {
  id: string
  roleName: string
  roleCode: string
  dataScope: string
  memberCount: number
  menuCount: number
  status: string
}

export interface MenuRow {
  id: string
  menuName: string
  menuType: string
  path?: string
  permissionCode?: string
  parentName: string
  sortNo: number
  status: string
}

export interface PointRecord {
  id: string
  source: string
  points: number
  type: 'INCREASE' | 'DECREASE'
  createdAt: string
}

export interface MetricCardItem {
  label: string
  value: string
  unit?: string
  trend?: string
}

export interface AftersaleItem {
  id: string
  aftersaleNo: string
  orderNo: string
  customerName: string
  merchantName: string
  aftersaleType: string
  applyAmount: number
  aftersaleStatus: string
  needReturn: boolean
  returnTrackingNo: string
  remark?: string
  createdAt: string
}
