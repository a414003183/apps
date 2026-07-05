import { Button, Card, Col, Input, Modal, Row, Select, Space, Spin, Statistic, Table, Tag, Upload, message } from 'antd'
import { useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import {
  assignRoleMenus,
  downloadAdminExport,
  fetchAdminImportExportLogs,
  fetchAdminImportExportOverview,
  fetchAdminLoginLogs,
  fetchAdminMenus,
  fetchAdminOperationLogs,
  fetchAdminRoles,
  fetchRoleMenuIds,
  importAdminData,
  updateRoleStatus,
  updateMenuStatus,
} from '../../services/ant-design-pro/admin'
import { hasPermission } from '../../utils/auth'
import { ListSearchToolbar } from '../../components/ListSearchToolbar'

type Mode = 'roles' | 'menus' | 'login-log' | 'operation-log' | 'import-export'

function getModeFromPath(pathname: string): Mode {
  if (pathname.includes('/admin/roles')) return 'roles'
  if (pathname.includes('/admin/menus')) return 'menus'
  if (pathname.includes('/admin/login-log')) return 'login-log'
  if (pathname.includes('/admin/operation-log')) return 'operation-log'
  return 'import-export'
}

function triggerDownload(blob: Blob, fallbackName: string) {
  const url = window.URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = fallbackName
  anchor.click()
  window.URL.revokeObjectURL(url)
}

function filterRows<T extends object>(rows: T[], keyword: string): T[] {
  const normalizedKeyword = keyword.trim().toLowerCase()
  if (!normalizedKeyword) {
    return rows
  }
  return rows.filter((row) =>
    Object.values(row)
      .map((value) => String(value ?? '').toLowerCase())
      .some((value) => value.includes(normalizedKeyword)),
  )
}

export function AdminGovernancePage() {
  const location = useLocation()
  const mode = getModeFromPath(location.pathname)

  const [roles, setRoles] = useState<any[]>([])
  const [menus, setMenus] = useState<any[]>([])
  const [logRows, setLogRows] = useState<any[]>([])
  const [overview, setOverview] = useState<any>(null)
  const [lastImportResult, setLastImportResult] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [menuRoleTarget, setMenuRoleTarget] = useState<any>(null)
  const [selectedMenuIds, setSelectedMenuIds] = useState<string[]>([])
  const [savingMenus, setSavingMenus] = useState(false)
  const [keyword, setKeyword] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 })

  const [logModalType, setLogModalType] = useState<string | null>(null)
  const [logModalData, setLogModalData] = useState<any[]>([])
  const [logModalLoading, setLogModalLoading] = useState(false)
  const [logModalPagination, setLogModalPagination] = useState({ current: 1, pageSize: 10, total: 0 })

  const canImport = hasPermission('admin:import:run')
  const canExport = hasPermission('admin:export:view')
  const canAssignMenus = hasPermission('admin:menu:assign')

  async function loadData(page = 1, pageSize = 10) {
    setLoading(true)
    try {
      if (mode === 'roles') {
        const roleParams: any = { page, pageSize }
        if (statusFilter !== 'ALL') roleParams.status = statusFilter
        const [roleResult, menuResult] = await Promise.all([
          fetchAdminRoles(roleParams),
          fetchAdminMenus({ page: 1, pageSize: 1000 }),
        ])
        setRoles(roleResult?.list || [])
        setMenus(menuResult?.list || [])
        setPagination((prev) => ({ ...prev, current: page, pageSize, total: roleResult?.total || 0 }))
      } else if (mode === 'menus') {
        const menuParams: any = { page, pageSize }
        if (statusFilter !== 'ALL') menuParams.status = statusFilter
        const menuResult = await fetchAdminMenus(menuParams)
        setMenus(menuResult?.list || [])
        setPagination((prev) => ({ ...prev, current: page, pageSize, total: menuResult?.total || 0 }))
      } else if (mode === 'login-log') {
        const logParams: any = { page, pageSize }
        if (statusFilter !== 'ALL') logParams.loginStatus = statusFilter
        const result = await fetchAdminLoginLogs(logParams)
        setLogRows(result?.list || [])
        setPagination((prev) => ({ ...prev, current: page, pageSize, total: result?.total || 0 }))
      } else if (mode === 'operation-log') {
        const logParams: any = { page, pageSize }
        if (statusFilter !== 'ALL') logParams.operationStatus = statusFilter
        const result = await fetchAdminOperationLogs(logParams)
        setLogRows(result?.list || [])
        setPagination((prev) => ({ ...prev, current: page, pageSize, total: result?.total || 0 }))
      } else {
        setOverview(await fetchAdminImportExportOverview())
      }
    } catch (error: any) {
      message.error(error?.message || '加载失败')
      setRoles([])
      setMenus([])
      setLogRows([])
      setOverview(null)
      setPagination((prev) => ({ ...prev, current: page, pageSize, total: 0 }))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setKeyword('')
    setStatusFilter('ALL')
    setPagination({ current: 1, pageSize: 10, total: 0 })
    loadData(1, 10)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode])

  useEffect(() => {
    if (mode === 'import-export') {
      setPagination((prev) => ({ ...prev, current: 1 }))
    } else {
      loadData(1, pagination.pageSize)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter])

  const supportedTypes = overview?.supportedTypes ?? []
  const filteredRoles = useMemo(() => {
    let list = filterRows(roles, keyword)
    if (statusFilter !== 'ALL') list = list.filter((r) => r.status === statusFilter)
    return list
  }, [keyword, roles, statusFilter])
  const filteredMenus = useMemo(() => {
    let list = filterRows(menus, keyword)
    if (statusFilter !== 'ALL') list = list.filter((r) => r.status === statusFilter)
    return list
  }, [keyword, menus, statusFilter])
  const filteredLogs = useMemo(() => {
    let list = filterRows(logRows, keyword)
    if (statusFilter !== 'ALL') list = list.filter((r: any) => (r.loginStatus || r.operationStatus) === statusFilter)
    return list
  }, [keyword, logRows, statusFilter])

  async function openAssignMenus(role: any) {
    try {
      const menuIds = await fetchRoleMenuIds(role.id)
      setSelectedMenuIds(menuIds)
      setMenuRoleTarget(role)
    } catch (error: any) {
      message.error(error?.message || '获取角色菜单失败')
    }
  }

  async function handleSaveMenus() {
    if (!menuRoleTarget) return
    setSavingMenus(true)
    try {
      await assignRoleMenus(menuRoleTarget.id, selectedMenuIds)
      message.success('角色菜单已更新')
      setMenuRoleTarget(null)
      const roleResult = await fetchAdminRoles()
      setRoles(roleResult?.list || [])
    } catch (error: any) {
      message.error(error?.message || '保存失败')
    } finally {
      setSavingMenus(false)
    }
  }

  async function handleToggleRoleStatus(role: any) {
    const isEnabled = role.status === 'ENABLED'
    const nextStatus = isEnabled ? 'DISABLED' : 'ENABLED'
    Modal.confirm({
      title: isEnabled ? '确认禁用' : '确认启用',
      content: `确定要${isEnabled ? '禁用' : '启用'}角色「${role.roleName}」吗？`,
      onOk: async () => {
        try {
          await updateRoleStatus(String(role.id), nextStatus)
          message.success(`已${isEnabled ? '禁用' : '启用'}`)
          setRoles(await fetchAdminRoles())
        } catch (error) {
          message.error('操作失败')
        }
      },
    })
  }

  async function handleToggleMenuStatus(menu: any) {
    const isEnabled = menu.status === 'ENABLED'
    const nextStatus = isEnabled ? 'DISABLED' : 'ENABLED'
    Modal.confirm({
      title: isEnabled ? '确认禁用' : '确认启用',
      content: `确定要${isEnabled ? '禁用' : '启用'}菜单「${menu.menuName}」吗？`,
      onOk: async () => {
        try {
          await updateMenuStatus(String(menu.id), nextStatus)
          message.success(`已${isEnabled ? '禁用' : '启用'}`)
          const menuResult = await fetchAdminMenus()
          setMenus(menuResult?.list || [])
        } catch (error) {
          message.error('操作失败')
        }
      },
    })
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 24 }}>
        <Spin size="large" />
      </div>
    )
  }

  const compactPagination = {
    current: pagination.current,
    pageSize: pagination.pageSize,
    total: pagination.total,
    showSizeChanger: true,
    pageSizeOptions: [10, 20, 50, 100] as number[],
    showTotal: (t: number) => `共 ${t} 条`,
    size: 'small' as const,
    onChange: (page: number, pageSize: number) => loadData(page, pageSize),
  }

  const logModalPaginationObj = {
    current: logModalPagination.current,
    pageSize: logModalPagination.pageSize,
    total: logModalPagination.total,
    showSizeChanger: true,
    pageSizeOptions: [10, 20, 50, 100] as number[],
    showTotal: (t: number) => `共 ${t} 条`,
    size: 'small' as const,
    onChange: (page: number, pageSize: number) => {
      setLogModalPagination((prev) => ({ ...prev, current: page, pageSize }))
      if (logModalType) {
        loadLogModalData(logModalType, page, pageSize)
      }
    },
  }

  const handleReset = () => {
    setKeyword('')
    setStatusFilter('ALL')
    if (mode === 'import-export') {
      setPagination((prev) => ({ ...prev, current: 1 }))
    } else {
      loadData(1, pagination.pageSize)
    }
  }

  const handleSearch = () => {
    if (mode === 'import-export') {
      setPagination((prev) => ({ ...prev, current: 1 }))
    } else {
      loadData(1, pagination.pageSize)
    }
  }

  async function loadLogModalData(type: string, page = 1, pageSize = 10) {
    setLogModalLoading(true)
    try {
      const result = await fetchAdminImportExportLogs(type, { page, pageSize })
      setLogModalData(result?.list || [])
      setLogModalPagination((prev) => ({
        ...prev,
        current: result?.page || page,
        pageSize: result?.pageSize || pageSize,
        total: result?.total || 0,
      }))
    } catch (error: any) {
      message.error(error?.message || '加载日志失败')
      setLogModalData([])
    } finally {
      setLogModalLoading(false)
    }
  }

  const statusAdvancedFilter = (
    <Select value={statusFilter} onChange={setStatusFilter} style={{ width: 120 }} size="small">
      <Select.Option value="ALL">{'全部状态'}</Select.Option>
      <Select.Option value="ENABLED">{'启用'}</Select.Option>
      <Select.Option value="DISABLED">{'禁用'}</Select.Option>
    </Select>
  )

  const logResultAdvancedFilter = (
    <Select value={statusFilter} onChange={setStatusFilter} style={{ width: 120 }} size="small">
      <Select.Option value="ALL">{'全部结果'}</Select.Option>
      <Select.Option value="SUCCESS">{'成功'}</Select.Option>
      <Select.Option value="FAILURE">{'失败'}</Select.Option>
    </Select>
  )

  // 角色管理模式
  if (mode === 'roles') {
    return (
      <div>
        <Card size="small" styles={{ body: { padding: '8px 12px' } }}>
          <Space direction="vertical" size={8} style={{ width: '100%' }}>
            <ListSearchToolbar
              searchPlaceholder="搜索角色"
              keyword={keyword}
              onKeywordChange={setKeyword}
              onSearch={handleSearch}
              onReset={handleReset}
              advancedFilter={statusAdvancedFilter}
              resultCount={pagination.total}
            />
            <Table
              rowKey="id"
              dataSource={filteredRoles}
              size="small"
              pagination={compactPagination}
              columns={[
                { title: '角色编码', dataIndex: 'roleCode' },
                { title: '角色名称', dataIndex: 'roleName' },
                { title: '数据范围', dataIndex: 'dataScope' },
                { title: '成员数', dataIndex: 'memberCount' },
                { title: '菜单数', dataIndex: 'menuCount' },
                {
                  title: '状态',
                  dataIndex: 'status',
                  render: (v: string) => (
                    <Tag color={v === 'ENABLED' ? 'green' : 'red'}>{v === 'ENABLED' ? '启用' : '禁用'}</Tag>
                  ),
                },
                {
                  title: '操作',
                  render: (_: any, row: any) => (
                    <Space size={0} wrap>
                      {canAssignMenus ? (
                        <Button type="link" size="small" onClick={() => openAssignMenus(row)}>
                          {'分配菜单'}
                        </Button>
                      ) : null}
                      {row.status === 'ENABLED' ? (
                        <Button type="link" size="small" danger onClick={() => handleToggleRoleStatus(row)}>
                          {'禁用'}
                        </Button>
                      ) : (
                        <Button
                          type="link"
                          size="small"
                          style={{ color: '#52c41a' }}
                          onClick={() => handleToggleRoleStatus(row)}
                        >
                          {'启用'}
                        </Button>
                      )}
                    </Space>
                  ),
                },
              ]}
            />
          </Space>
        </Card>

        <Modal
          title={menuRoleTarget ? `分配菜单 - ${menuRoleTarget.roleName}` : '分配菜单'}
          open={!!menuRoleTarget}
          onCancel={() => setMenuRoleTarget(null)}
          onOk={handleSaveMenus}
          confirmLoading={savingMenus}
          width={800}
        >
          <Table
            rowKey="id"
            dataSource={filteredMenus}
            size="small"
            pagination={compactPagination}
            rowSelection={{
              selectedRowKeys: selectedMenuIds,
              onChange: (keys) => setSelectedMenuIds(keys.map(String)),
            }}
            columns={[
              { title: '菜单名称', dataIndex: 'menuName' },
              { title: '上级菜单', dataIndex: 'parentName' },
              { title: '路径', dataIndex: 'path' },
              { title: '权限码', dataIndex: 'permissionCode' },
            ]}
          />
        </Modal>
      </div>
    )
  }

  // 菜单权限模式
  if (mode === 'menus') {
    return (
      <Card size="small" styles={{ body: { padding: '8px 12px' } }}>
        <Space direction="vertical" size={8} style={{ width: '100%' }}>
          <ListSearchToolbar
            searchPlaceholder="搜索菜单"
            keyword={keyword}
            onKeywordChange={setKeyword}
            onSearch={handleSearch}
            onReset={handleReset}
            advancedFilter={statusAdvancedFilter}
            resultCount={pagination.total}
          />
          <Table
            rowKey="id"
            dataSource={filteredMenus}
            size="small"
            pagination={compactPagination}
            columns={[
              { title: '菜单名称', dataIndex: 'menuName' },
              { title: '上级菜单', dataIndex: 'parentName' },
              { title: '菜单类型', dataIndex: 'menuType' },
              { title: '路径', dataIndex: 'path' },
              { title: '权限码', dataIndex: 'permissionCode' },
              { title: '排序', dataIndex: 'sortNo' },
              {
                title: '状态',
                dataIndex: 'status',
                render: (v: string) => (
                  <Tag color={v === 'ENABLED' ? 'green' : 'red'}>{v === 'ENABLED' ? '启用' : '禁用'}</Tag>
                ),
              },
              {
                title: '操作',
                render: (_: any, row: any) =>
                  row.status === 'ENABLED' ? (
                    <Button type="link" size="small" danger onClick={() => handleToggleMenuStatus(row)}>
                      {'禁用'}
                    </Button>
                  ) : (
                    <Button
                      type="link"
                      size="small"
                      style={{ color: '#52c41a' }}
                      onClick={() => handleToggleMenuStatus(row)}
                    >
                      {'启用'}
                    </Button>
                  ),
              },
            ]}
          />
        </Space>
      </Card>
    )
  }

  // 登录日志模式
  if (mode === 'login-log') {
    return (
      <Card size="small" styles={{ body: { padding: '8px 12px' } }}>
        <Space direction="vertical" size={8} style={{ width: '100%' }}>
          <ListSearchToolbar
            searchPlaceholder="搜索日志"
            keyword={keyword}
            onKeywordChange={setKeyword}
            onSearch={handleSearch}
            onReset={handleReset}
            advancedFilter={logResultAdvancedFilter}
            resultCount={pagination.total}
          />
          <Table
            rowKey="id"
            dataSource={filteredLogs}
            size="small"
            pagination={compactPagination}
            columns={[
              { title: '登录账号', dataIndex: 'username' },
              { title: '角色', dataIndex: 'roleCode' },
              { title: 'IP地址', dataIndex: 'ipAddress' },
              {
                title: '结果',
                dataIndex: 'loginStatus',
                render: (v: string) => (
                  <Tag color={v === 'SUCCESS' ? 'green' : 'red'}>{v === 'SUCCESS' ? '成功' : '失败'}</Tag>
                ),
              },
              { title: '提示信息', dataIndex: 'loginMessage' },
              { title: '登录时间', dataIndex: 'loginTime' },
            ]}
          />
        </Space>
      </Card>
    )
  }

  // 操作日志模式
  if (mode === 'operation-log') {
    return (
      <Card size="small" styles={{ body: { padding: '8px 12px' } }}>
        <Space direction="vertical" size={8} style={{ width: '100%' }}>
          <ListSearchToolbar
            searchPlaceholder="搜索日志"
            keyword={keyword}
            onKeywordChange={setKeyword}
            onSearch={handleSearch}
            onReset={handleReset}
            advancedFilter={logResultAdvancedFilter}
            resultCount={pagination.total}
          />
          <Table
            rowKey="id"
            dataSource={filteredLogs}
            size="small"
            pagination={compactPagination}
            columns={[
              { title: '操作账号', dataIndex: 'username' },
              { title: '模块', dataIndex: 'moduleName' },
              { title: '业务类型', dataIndex: 'businessType' },
              { title: '请求URI', dataIndex: 'requestUri' },
              {
                title: '结果',
                dataIndex: 'operationStatus',
                render: (v: string) => (
                  <Tag color={v === 'SUCCESS' ? 'green' : 'red'}>{v === 'SUCCESS' ? '成功' : '失败'}</Tag>
                ),
              },
              { title: '响应信息', dataIndex: 'responseMessage' },
              { title: '操作时间', dataIndex: 'operationTime' },
            ]}
          />
        </Space>
      </Card>
    )
  }

  // 导入导出模式
  return (
    <div>
      <Row gutter={[8, 8]} style={{ marginBottom: 8 }}>
        <Col xs={24} md={8}>
          <Card size="small" styles={{ body: { padding: '10px 14px' } }}>
            <Statistic title="支持类型" value={supportedTypes.length} />
          </Card>
        </Col>
      </Row>

      <Card title="模板与传输动作" size="small" styles={{ body: { padding: '8px 12px' } }}>
        <Table
          rowKey="code"
          dataSource={supportedTypes}
          pagination={false}
          size="small"
          columns={[
            { title: '类型名称', dataIndex: 'name' },
            { title: '类型编码', dataIndex: 'code' },
            {
              title: '操作',
              render: (_: any, row: any) => (
                <div style={{ display: 'flex', gap: 8 }}>
                  <Button
                    onClick={async () => {
                      try {
                        const blob = await downloadAdminExport(String(row.code), true)
                        triggerDownload(blob as unknown as Blob, `${row.code}-template.csv`)
                        message.success('模板已下载')
                      } catch (error) {
                        message.error('下载失败')
                      }
                    }}
                  >
                    下载模板
                  </Button>
                  {canImport && (
                    <Upload
                      accept=".csv,.xls,.xlsx"
                      showUploadList={false}
                      customRequest={async (options) => {
                        try {
                          const result = await importAdminData(String(row.code), options.file as File)
                          setLastImportResult(result)
                          setOverview(await fetchAdminImportExportOverview())
                          message.success(`已导入 ${result.successCount ?? 0} 条记录`)
                        } catch (error: any) {
                          message.error(error?.message || '导入失败')
                        }
                      }}
                    >
                      <Button>导入数据</Button>
                    </Upload>
                  )}
                  {canExport && (
                    <Button
                      type="primary"
                      onClick={async () => {
                        try {
                          const blob = await downloadAdminExport(String(row.code), false)
                          triggerDownload(blob as unknown as Blob, `${row.code}.csv`)
                          message.success('数据已导出')
                        } catch (error) {
                          message.error('导出失败')
                        }
                      }}
                    >
                      导出数据
                    </Button>
                  )}
                  <Button
                    onClick={async () => {
                      setLogModalType(row.code)
                      setLogModalPagination({ current: 1, pageSize: 10, total: 0 })
                      await loadLogModalData(row.code, 1, 10)
                    }}
                  >
                    查看日志
                  </Button>
                </div>
              ),
            },
          ]}
        />
      </Card>

      {lastImportResult && (
        <Card title="最近一次导入结果" size="small" style={{ marginTop: 8 }} styles={{ body: { padding: '8px 12px' } }}>
          <Table
            rowKey="key"
            size="small"
            dataSource={[
              { key: 'type', label: '导入类型', value: lastImportResult.type },
              { key: 'fileName', label: '文件名', value: lastImportResult.fileName },
              { key: 'totalRows', label: '总行数', value: lastImportResult.totalRows },
              { key: 'successCount', label: '成功数', value: lastImportResult.successCount },
              { key: 'skippedCount', label: '跳过数', value: lastImportResult.skippedCount },
              { key: 'messages', label: '提示信息', value: (lastImportResult.messages ?? []).join(' | ') || '-' },
            ]}
            columns={[
              { title: '字段', dataIndex: 'label' },
              { title: '值', dataIndex: 'value' },
            ]}
            pagination={false}
          />
        </Card>
      )}

      <Modal
        title={
          logModalType
            ? `${supportedTypes.find((t: any) => t.code === logModalType)?.name || logModalType} - 导入导出日志`
            : '导入导出日志'
        }
        open={!!logModalType}
        onCancel={() => setLogModalType(null)}
        width={960}
        footer={null}
      >
        <Table
          rowKey="id"
          dataSource={logModalData}
          size="small"
          loading={logModalLoading}
          pagination={logModalPaginationObj}
          columns={[
            { title: '操作账号', dataIndex: 'username' },
            { title: '业务类型', dataIndex: 'businessType' },
            { title: '请求URI', dataIndex: 'requestUri' },
            {
              title: '结果',
              dataIndex: 'operationStatus',
              render: (v: string) => (
                <Tag color={v === 'SUCCESS' ? 'green' : 'red'}>{v === 'SUCCESS' ? '成功' : '失败'}</Tag>
              ),
            },
            { title: '响应信息', dataIndex: 'responseMessage' },
            { title: '操作时间', dataIndex: 'operationTime' },
          ]}
        />
      </Modal>
    </div>
  )
}

export default AdminGovernancePage
