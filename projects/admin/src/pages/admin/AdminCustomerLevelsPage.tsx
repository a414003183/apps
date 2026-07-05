import { Button, Card, Input, Select, Space, Table, Tag, Typography, Modal, message } from 'antd'
import { useEffect, useMemo, useState } from 'react'
import { PlusOutlined, EditOutlined, StopOutlined, CheckCircleOutlined } from '@ant-design/icons'
import { fetchCustomerLevels, updateCustomerLevelStatus } from '../../services/ant-design-pro/admin'
import { ListSearchToolbar } from '../../components/ListSearchToolbar'

export function AdminCustomerLevelsPage() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [keyword, setKeyword] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 })

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      setLoading(true)
      const result = await fetchCustomerLevels()
      setData(result?.list || [])
      setPagination((prev) => ({ ...prev, total: result?.total || 0 }))
    } catch (error) {
      console.error('加载客户等级失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const filtered = useMemo(() => {
    let list = data
    const kw = keyword.trim().toLowerCase()
    if (kw) {
      list = list.filter((r) => [r.levelCode, r.levelName].some((f) => (f || '').toLowerCase().includes(kw)))
    }
    if (statusFilter !== 'ALL') {
      list = list.filter((r) => r.status === statusFilter)
    }
    return list
  }, [data, keyword, statusFilter])

  const paginatedData = useMemo(() => {
    const start = (pagination.current - 1) * pagination.pageSize
    return filtered.slice(start, start + pagination.pageSize)
  }, [filtered, pagination.current, pagination.pageSize])

  const handleToggleStatus = (record: any) => {
    const isEnabled = record.status === 'ENABLED'
    const nextStatus = isEnabled ? 'DISABLED' : 'ENABLED'
    Modal.confirm({
      title: isEnabled ? '确认禁用' : '确认启用',
      content: `确定要${isEnabled ? '禁用' : '启用'}等级「${record.levelName}」吗？`,
      onOk: async () => {
        try {
          await updateCustomerLevelStatus(String(record.levelCode), nextStatus)
          message.success(`已${isEnabled ? '禁用' : '启用'}`)
          loadData()
        } catch (error) {
          message.error('操作失败')
        }
      },
    })
  }

  const handleReset = () => {
    setKeyword('')
    setStatusFilter('ALL')
    setPagination((prev) => ({ ...prev, current: 1 }))
  }

  const handleSearch = () => {
    setPagination((prev) => ({ ...prev, current: 1 }))
  }

  const advancedFilter = (
    <Select value={statusFilter} onChange={setStatusFilter} style={{ width: 120 }} size="small">
      <Select.Option value="ALL">{'全部状态'}</Select.Option>
      <Select.Option value="ENABLED">{'启用'}</Select.Option>
      <Select.Option value="DISABLED">{'禁用'}</Select.Option>
    </Select>
  )

  const columns = [
    { title: '等级编码', dataIndex: 'levelCode', width: 120 },
    { title: '等级名称', dataIndex: 'levelName', width: 120 },
    { title: '升级门槛(元)', dataIndex: 'upgradeThresholdAmount', width: 140 },
    { title: '折扣(%)', dataIndex: 'discountValue', width: 100 },
    { title: '排序', dataIndex: 'sortNo', width: 80 },
    {
      title: '状态',
      dataIndex: 'status',
      width: 80,
      render: (s: string) => <Tag color={s === 'ENABLED' ? 'green' : 'red'}>{s === 'ENABLED' ? '启用' : '禁用'}</Tag>,
    },
    {
      title: '操作',
      key: 'action',
      width: 140,
      render: (_: any, record: any) => (
        <Space size={0} wrap>
          <Button type="link" size="small" icon={<EditOutlined />}>
            {'编辑'}
          </Button>
          {record.status === 'ENABLED' ? (
            <Button type="link" size="small" danger icon={<StopOutlined />} onClick={() => handleToggleStatus(record)}>
              {'禁用'}
            </Button>
          ) : (
            <Button
              type="link"
              size="small"
              style={{ color: '#52c41a' }}
              icon={<CheckCircleOutlined />}
              onClick={() => handleToggleStatus(record)}
            >
              {'启用'}
            </Button>
          )}
        </Space>
      ),
    },
  ]

  return (
    <Card size="small" styles={{ body: { padding: '8px 12px' } }}>
      <Space direction="vertical" size={8} style={{ width: '100%' }}>
        <ListSearchToolbar
          searchPlaceholder="搜索等级"
          keyword={keyword}
          onKeywordChange={setKeyword}
          onSearch={handleSearch}
          onReset={handleReset}
          advancedFilter={advancedFilter}
          resultCount={filtered.length}
          extraActions={
            <Button type="primary" size="small" icon={<PlusOutlined />}>
              新增等级
            </Button>
          }
        />
        <Table
          dataSource={paginatedData}
          columns={columns}
          rowKey="id"
          loading={loading}
          size="small"
          scroll={{ y: 'calc(100vh - 280px)' }}
          pagination={{
            ...pagination,
            total: filtered.length,
            showSizeChanger: true,
            pageSizeOptions: [10, 20, 50, 100],
            showTotal: (t) => `共 ${t} 条`,
            size: 'small',
            onChange: (page, pageSize) => setPagination((prev) => ({ ...prev, current: page, pageSize })),
          }}
        />
      </Space>
    </Card>
  )
}

export default AdminCustomerLevelsPage
