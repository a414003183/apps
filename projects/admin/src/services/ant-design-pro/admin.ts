import { request } from '@umijs/max'
import type { ApiResponse, UserRow, RegistrationApplicationRow, CustomerLevelConfigRow } from '../../types/models'

// 辅助函数：统一处理后端返回数组的情况
function normalizeListResponse<T = any>(response: ApiResponse<T>, params?: { page?: number; pageSize?: number }) {
  const data = response.data as any
  if (Array.isArray(data)) {
    return {
      list: data,
      total: data.length,
      page: params?.page || 1,
      pageSize: params?.pageSize || 10,
    }
  }
  return data || { list: [], total: 0, page: 1, pageSize: 10 }
}

// 平台管理相关API

// 获取管理首页数据
export async function fetchAdminDashboard() {
  const response = await request<ApiResponse<any>>('/api/admin/dashboard', {
    method: 'GET',
  })
  return response.data
}

// 获取用户列表
export async function fetchAdminUsers(params?: {
  page?: number
  pageSize?: number
  keyword?: string
  role?: string
  status?: string
}) {
  const response = await request<ApiResponse<any[]>>('/api/admin/users', {
    method: 'GET',
    params,
  })
  return normalizeListResponse(response, params)
}

// 创建管理员用户
export async function createAdminUser(payload: {
  username: string
  password: string
  displayName: string
  roleId: string
}) {
  const response = await request<ApiResponse<any>>('/api/admin/users', {
    method: 'POST',
    data: payload,
  })
  return response.data
}

// 更新管理员用户
export async function updateAdminUser(userId: string, payload: any) {
  const response = await request<ApiResponse<any>>(`/api/admin/users/${userId}`, {
    method: 'PUT',
    data: payload,
  })
  return response.data
}

// 删除管理员用户
export async function deleteAdminUser(userId: string) {
  const response = await request<ApiResponse<any>>(`/api/admin/users/${userId}`, {
    method: 'DELETE',
  })
  return response.data
}

// 重置用户密码
export async function resetAdminUserPassword(userId: string, newPassword: string) {
  const response = await request<ApiResponse<any>>(`/api/admin/users/${userId}/password`, {
    method: 'PUT',
    data: { password: newPassword },
  })
  return response.data
}

// 更新用户状态
export async function updateUserStatus(userId: string, status: string) {
  const response = await request<ApiResponse<any>>(`/api/admin/users/${userId}/status`, {
    method: 'PUT',
    data: { status },
  })
  return response.data
}

// 分配用户角色
export async function assignUserRole(userId: string, roleId: string) {
  const response = await request<ApiResponse<any>>(`/api/admin/users/${userId}/role`, {
    method: 'POST',
    data: { roleId },
  })
  return response.data
}

// 获取注册审核列表
export async function fetchRegistrations(params?: {
  page?: number
  pageSize?: number
  identityType?: string
  status?: string
}) {
  const response = await request<ApiResponse<any[]>>('/api/admin/registrations', {
    method: 'GET',
    params,
  })
  return normalizeListResponse(response, params)
}

// 审核注册申请
export async function approveRegistration(registrationId: string, approved: boolean, remark?: string) {
  const response = await request<ApiResponse<any>>(`/api/admin/registrations/${registrationId}/review`, {
    method: 'POST',
    data: { action: approved ? 'APPROVE' : 'REJECT', remark },
  })
  return response.data
}

// 获取品牌列表
export async function fetchAdminBrands(params?: { page?: number; pageSize?: number; keyword?: string }) {
  const response = await request<ApiResponse<any[]>>('/api/admin/products/brands', {
    method: 'GET',
    params,
  })
  return normalizeListResponse(response, params)
}

// 创建品牌
export async function createBrand(payload: { brandName: string; logo?: string; description?: string }) {
  const response = await request<ApiResponse<any>>('/api/admin/products/brands', {
    method: 'POST',
    data: payload,
  })
  return response.data
}

// 更新品牌
export async function updateBrand(brandId: string, payload: any) {
  const response = await request<ApiResponse<any>>(`/api/admin/products/brands/${brandId}`, {
    method: 'PUT',
    data: payload,
  })
  return response.data
}

// 更新品牌状态
export async function updateBrandStatus(brandId: string, status: string) {
  const response = await request<ApiResponse<any>>(`/api/admin/products/brands/${brandId}/status`, {
    method: 'PUT',
    data: { status },
  })
  return response.data
}

// 删除品牌
export async function deleteBrand(brandId: string) {
  const response = await request<ApiResponse<any>>(`/api/admin/products/brands/${brandId}`, {
    method: 'DELETE',
  })
  return response.data
}

// 获取分类列表
export async function fetchAdminCategories(params?: {
  page?: number
  pageSize?: number
  parentId?: number
  keyword?: string
}) {
  const response = await request<ApiResponse<any[]>>('/api/admin/products/categories', {
    method: 'GET',
    params,
  })
  return normalizeListResponse(response, params)
}

// 创建分类
export async function createCategory(payload: {
  categoryName: string
  parentId?: number
  sortNo?: number
  icon?: string
}) {
  const response = await request<ApiResponse<any>>('/api/admin/products/categories', {
    method: 'POST',
    data: payload,
  })
  return response.data
}

// 更新分类
export async function updateCategory(categoryId: string, payload: any) {
  const response = await request<ApiResponse<any>>(`/api/admin/products/categories/${categoryId}`, {
    method: 'PUT',
    data: payload,
  })
  return response.data
}

// 更新分类状态
export async function updateCategoryStatus(categoryId: string, status: string) {
  const response = await request<ApiResponse<any>>(`/api/admin/products/categories/${categoryId}/status`, {
    method: 'PUT',
    data: { status },
  })
  return response.data
}

// 删除分类
export async function deleteCategory(categoryId: string) {
  const response = await request<ApiResponse<any>>(`/api/admin/products/categories/${categoryId}`, {
    method: 'DELETE',
  })
  return response.data
}

// 获取客户等级配置
export async function fetchCustomerLevels(params?: { page?: number; pageSize?: number }) {
  const response = await request<ApiResponse<CustomerLevelConfigRow[]>>('/api/admin/customer-levels', {
    method: 'GET',
    params,
  })
  return normalizeListResponse(response, params)
}

// 创建客户等级
export async function createCustomerLevel(payload: {
  levelName: string
  levelCode: string
  upgradeThresholdAmount?: number
  sortNo?: number
}) {
  const response = await request<ApiResponse<any>>('/api/admin/customer-levels', {
    method: 'POST',
    data: payload,
  })
  return response.data
}

// 更新客户等级
export async function updateCustomerLevel(levelId: string, payload: any) {
  const response = await request<ApiResponse<any>>(`/api/admin/customer-levels/${levelId}`, {
    method: 'PUT',
    data: payload,
  })
  return response.data
}

// 更新客户等级状态（后端用 levelCode 作为路径参数）
export async function updateCustomerLevelStatus(levelCode: string, status: string) {
  const response = await request<ApiResponse<any>>(`/api/admin/customer-levels/${levelCode}/status`, {
    method: 'PUT',
    data: { status },
  })
  return response.data
}

// 删除客户等级
export async function deleteCustomerLevel(levelId: string) {
  const response = await request<ApiResponse<any>>(`/api/admin/customer-levels/${levelId}`, {
    method: 'DELETE',
  })
  return response.data
}

// 获取账号治理数据
export async function fetchAdminGovernance(params?: { startDate?: string; endDate?: string }) {
  const response = await request<ApiResponse<any>>('/api/admin/governance', {
    method: 'GET',
    params,
  })
  return response.data
}

// 执行账号治理操作
export async function executeGovernanceAction(action: string, targetIds: string[]) {
  const response = await request<ApiResponse<any>>('/api/admin/governance/actions', {
    method: 'POST',
    data: { action, targetIds },
  })
  return response.data
}

// ========== 角色管理 API ==========

// 获取角色列表
export async function fetchAdminRoles(params?: { page?: number; pageSize?: number }) {
  const response = await request<ApiResponse<any[]>>('/api/admin/roles', {
    method: 'GET',
    params,
  })
  return normalizeListResponse(response, params)
}

// 获取角色菜单ID列表
export async function fetchRoleMenuIds(roleId: string) {
  const response = await request<ApiResponse<string[]>>(`/api/admin/roles/${roleId}/menus`, {
    method: 'GET',
  })
  return Array.isArray(response.data) ? response.data : []
}

// 更新角色状态
export async function updateRoleStatus(roleId: string, status: string) {
  const response = await request<ApiResponse<any>>(`/api/admin/roles/${roleId}/status`, {
    method: 'PUT',
    data: { status },
  })
  return response.data
}

// 分配角色菜单
export async function assignRoleMenus(roleId: string, menuIds: string[]) {
  const response = await request<ApiResponse<any>>(`/api/admin/roles/${roleId}/menus`, {
    method: 'PUT',
    data: { menuIds },
  })
  return response.data
}

// 更新菜单状态
export async function updateMenuStatus(menuId: string, status: string) {
  const response = await request<ApiResponse<any>>(`/api/admin/menus/${menuId}/status`, {
    method: 'PUT',
    data: { status },
  })
  return response.data
}

// ========== 菜单管理 API ==========

// 获取菜单列表
export async function fetchAdminMenus(params?: { page?: number; pageSize?: number }) {
  const response = await request<ApiResponse<any[]>>('/api/admin/menus', {
    method: 'GET',
    params,
  })
  return normalizeListResponse(response, params)
}

// ========== 日志管理 API ==========

// 获取登录日志
export async function fetchAdminLoginLogs(params?: {
  page?: number
  pageSize?: number
  username?: string
  startDate?: string
  endDate?: string
}) {
  const response = await request<ApiResponse<any[]>>('/api/admin/login-logs', {
    method: 'GET',
    params,
  })
  return normalizeListResponse(response, params)
}

// 获取操作日志
export async function fetchAdminOperationLogs(params?: {
  page?: number
  pageSize?: number
  username?: string
  moduleName?: string
  startDate?: string
  endDate?: string
}) {
  const response = await request<ApiResponse<any[]>>('/api/admin/operation-logs', {
    method: 'GET',
    params,
  })
  return normalizeListResponse(response, params)
}

// ========== 导入导出 API ==========

// 获取导入导出概览
export async function fetchAdminImportExportOverview() {
  const response = await request<
    ApiResponse<{
      supportedTypes: Array<{ name: string; code: string }>
    }>
  >('/api/admin/import-export', {
    method: 'GET',
  })
  return response.data
}

// 获取某类型的导入导出日志
export async function fetchAdminImportExportLogs(type: string, params?: { page?: number; pageSize?: number }) {
  const response = await request<ApiResponse<any>>('/api/admin/import-export/logs', {
    method: 'GET',
    params: { type, ...(params || {}) },
  })
  return normalizeListResponse(response, params)
}

// 下载导出数据/模板
export async function downloadAdminExport(type: string, template: boolean = false) {
  const response = await request<Blob>(`/api/admin/export`, {
    method: 'GET',
    params: { type, template },
    responseType: 'blob',
  })
  return response
}

// 导入数据
export async function importAdminData(type: string, file: File) {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('type', type)
  const response = await request<
    ApiResponse<{
      type: string
      fileName: string
      totalRows: number
      successCount: number
      skippedCount: number
      messages: string[]
    }>
  >('/api/admin/import', {
    method: 'POST',
    data: formData,
  })
  return response.data
}
