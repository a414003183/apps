import { Button, Card, Input, Select, Space, Table, Tag, Typography, message, Modal } from 'antd'
import { useEffect, useMemo, useState } from 'react'
import { CheckOutlined, CloseOutlined } from '@ant-design/icons'
import type { RegistrationApplicationRow } from '../../types/models'
import { fetchRegistrations, approveRegistration } from '../../services/ant-design-pro/admin'
import { ListSearchToolbar } from '../../components/ListSearchToolbar'

export function AdminRegistrationsPage() {
  const [data, setData] = useState<RegistrationApplicationRow[]>([])
  const [loading, setLoading] = useState(false)
  const [keyword, setKeyword] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 })

  useEffect(() => {
    loadData(1, pagination.pageSize)
  }, [])

  useEffect(() => {
    loadData(1, pagination.pageSize)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter])

  async function loadData(page = 1, pageSize = 10) {
    try {
      setLoading(true)
      const params: any = { page, pageSize }
      if (statusFilter !== 'ALL') params.status = statusFilter
      const result = await fetchRegistrations(params)
      setData(result?.list || [])
      setPagination((prev) => ({ ...prev, current: page, pageSize, total: result?.total || 0 }))
    } catch (error) {
      console.error('加载注册申请失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const filtered = useMemo(() => {
    let list = data
    const kw = keyword.trim().toLowerCase()
    if (kw)
      list = list.filter((r) =>
        [r.username, r.displayName, r.phone, r.email].some((f) => (f || '').toLowerCase().includes(kw)),
      )
    return list
  }, [data, keyword])

  const handleApprove = async (record: RegistrationApplicationRow) => {
    Modal.confirm({
      title: '确认审核',
      content: '确定要通过该注册申请吗？',
      onOk: async () => {
        try {
          await approveRegistration(record.id, true)
          message.success('审核通过')
          loadData(pagination.current, pagination.pageSize)
        } catch (error) {
          message.error('操作失败')
        }
      },
    })
  }

  const handleReject = async (record: RegistrationApplicationRow) => {
    Modal.confirm({
      title: '确认拒绝',
      content: '确定要拒绝该注册申请吗？',
      onOk: async () => {
        try {
          await approveRegistration(record.id, false)
          message.success('已拒绝')
          loadData(pagination.current, pagination.pageSize)
        } catch (error) {
          message.error('操作失败')
        }
      },
    })
  }

  const handleReset = () => {
    setKeyword('')
    setStatusFilter('ALL')
    loadData(1, pagination.pageSize)
  }

  const handleSearch = () => {
    setPagination((prev) => ({ ...prev, current: 1 }))
  }

  const columns = [
    { title: '账号', dataIndex: 'username', width: 120 },
    {
      title: '身份类型',
      dataIndex: 'identityType',
      width: 100,
      render: (t: string) => {
        const map: Record<string, string> = { MERCHANT: '商家', SUPPLIER: '供应商', CUSTOMER: '客户' }
        return <Tag>{map[t] || t}</Tag>
      },
    },
    { title: '显示名称', dataIndex: 'displayName', width: 120 },
    { title: '手机号', dataIndex: 'phone', width: 130 },
    { title: '邮箱', dataIndex: 'email', width: 180 },
    {
      title: '状态',
      dataIndex: 'status',
      width: 90,
      render: (s: string) => (
        <Tag color={s === 'PENDING' ? 'orange' : s === 'APPROVED' ? 'green' : 'red'}>
          {s === 'PENDING' ? '待审核' : s === 'APPROVED' ? '已通过' : '已拒绝'}
        </Tag>
      ),
    },
    { title: '申请时间', dataIndex: 'createdAt', width: 120 },
    {
      title: '操作',
      key: 'action',
      width: 140,
      render: (_: any, r: RegistrationApplicationRow) =>
        r.status === 'PENDING' ? (
          <Space size={0} wrap>
            <Button type="link" size="small" icon={<CheckOutlined />} onClick={() => handleApprove(r)}>
              {'通过'}
            </Button>
            <Button type="link" size="small" danger icon={<CloseOutlined />} onClick={() => handleReject(r)}>
              {'拒绝'}
            </Button>
          </Space>
        ) : null,
    },
  ]

  const advancedFilter = (
    <Select value={statusFilter} onChange={setStatusFilter} style={{ width: 120 }} size="small">
      <Select.Option value="ALL">{'全部状态'}</Select.Option>
      <Select.Option value="PENDING">{'待审核'}</Select.Option>
      <Select.Option value="APPROVED">{'已通过'}</Select.Option>
      <Select.Option value="REJECTED">{'已拒绝'}</Select.Option>
    </Select>
  )

  return (
    <Card size="small" styles={{ body: { padding: '8px 12px' } }}>
      <Space direction="vertical" size={8} style={{ width: '100%' }}>
        <ListSearchToolbar
          searchPlaceholder="搜索账号/名称/手机"
          keyword={keyword}
          onKeywordChange={setKeyword}
          onSearch={handleSearch}
          onReset={handleReset}
          advancedFilter={advancedFilter}
          resultCount={filtered.length}
        />
        <Table
          dataSource={filtered}
          columns={columns}
          rowKey="id"
          loading={loading}
          size="small"
          scroll={{ y: 'calc(100vh - 280px)' }}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            pageSizeOptions: [10, 20, 50, 100],
            showTotal: (t) => `共 ${t} 条`,
            size: 'small',
            onChange: (page, pageSize) => loadData(page, pageSize),
          }}
        />
      </Space>
    </Card>
  )
}

export default AdminRegistrationsPage
