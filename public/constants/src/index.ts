/**
 * 公共常量
 * 供 admin / mall / mobile / weapp 等子项目引用
 */

import type { RoleType } from '@apps/types'

export const APP_NAME = '电信供应链管理系统'

export const DEFAULT_PERMISSIONS: Record<RoleType, string[]> = {
  CUSTOMER: [
    'customer:dashboard:view',
    'customer:profile:view',
    'customer:order:view',
    'customer:aftersale:view',
    'customer:point:view',
    'customer:referral:view',
  ],
  MERCHANT: [
    'merchant:dashboard:view',
    'merchant:profile:view',
    'merchant:goods:view',
    'merchant:goods:edit',
    'merchant:supply:view',
    'merchant:supply:import',
    'merchant:pricing:customer:view',
    'merchant:order:view',
    'merchant:order:approve',
    'merchant:order:ship',
    'merchant:aftersale:view',
    'merchant:aftersale:approve',
    'merchant:aftersale:reject',
    'merchant:aftersale:refund',
    'merchant:report:view',
    'merchant:report:export',
    'merchant:cost:view',
    'merchant:profit:view',
  ],
  SUPPLIER: [
    'supplier:dashboard:view',
    'supplier:profile:view',
    'supplier:product:view',
    'supplier:stock:view',
    'supplier:cooperation:view',
    'supplier:cooperation:edit',
    'supplier:authorization:edit',
  ],
  ADMIN: [
    'admin:dashboard:view',
    'admin:user:view',
    'admin:role:view',
    'admin:role:assign',
    'admin:registration:view',
    'admin:registration:review',
    'admin:customer-level:view',
    'admin:customer-level:edit',
    'admin:menu:view',
    'admin:menu:assign',
    'admin:login-log:view',
    'admin:operation-log:view',
    'admin:transfer:view',
    'admin:import:run',
    'admin:export:view',
  ],
}
