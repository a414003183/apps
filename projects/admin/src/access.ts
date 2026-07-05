import { getAuthProfile, hasPermission } from './utils/auth'

/**
 * @see https://umijs.org/docs/max/access#access
 * */
export default function access() {
  const profile = getAuthProfile()

  // 如果没有登录信息，拒绝所有访问
  if (!profile) {
    return {
      canAdmin: false,
      canMerchant: false,
      canCustomer: false,
      canSupplier: false,
      canAccessMerchant: false,
      canAccessCustomer: false,
      canAccessSupplier: false,
      hasPermission: () => false,
    }
  }

  const permissions = profile?.permissions || []

  return {
    canAdmin: profile?.identityType === 'ADMIN',
    canMerchant: profile?.identityType === 'MERCHANT',
    canCustomer: profile?.identityType === 'CUSTOMER',
    canSupplier: profile?.identityType === 'SUPPLIER',
    canAccessMerchant: profile?.identityType === 'MERCHANT' || profile?.identityType === 'ADMIN',
    canAccessCustomer: profile?.identityType === 'CUSTOMER' || profile?.identityType === 'ADMIN',
    canAccessSupplier: profile?.identityType === 'SUPPLIER' || profile?.identityType === 'ADMIN',
    // 检查具体权限
    hasPermission: (permission: string) => hasPermission(permission),
  }
}
