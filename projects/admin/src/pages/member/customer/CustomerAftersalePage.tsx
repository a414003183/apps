import { Card, Empty, Table, Tag, Space, Input, Select, Typography } from 'antd'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { AftersaleItem } from '../../../types/models'
import { fetchCustomerAftersales } from '../../../services/ant-design-pro/aftersale'
import { ListSearchToolbar } from '../../../components/ListSearchToolbar'

const STATUS_OPTIONS = [
  { value: 'ALL', label: '全部状态' },
  { value: 'WAIT_AUDIT', label: '待审核' },
  { value: 'WAIT_RETURN', label: '待退货' },
  { value: 'WAIT_RECEIVE', label: '待收货' },
  { value: 'WAIT_REFUND', label: '待退款' },
  { value: 'FINISHED', label: '已完成' },
  { value: 'REJECTED', label: '已拒绝' },
]

const TYPE_OPTIONS = [
  { value: 'ALL', label: '全部类型' },
  { value: 'RETURN_REFUND', label: '退货退款' },
  { value: 'REFUND_ONLY', label: '仅退款' },
]

export function CustomerAftersalePage() {
  const [data, setData] = useState<AftersaleItem[]>([])
  const [loading, setLoading] = useState(true)
  const [keyword, setKeyword] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [typeFilter, setTypeFilter] = useState('ALL')
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 })
  const navigate = useNavigate()

  const filteredData = useMemo(() => {
    let list = data
    if (typeFilter !== 'ALL') list = list.filter((r) => r.aftersaleType === typeFilter)
    const kw = keyword.trim().toLowerCase()
    if (kw)
      list = list.filter((r) =>
        [r.aftersaleNo, r.orderNo, r.merchantName].some((f) => (f || '').toLowerCase().includes(kw)),
      )
    return list
  }, [data, keyword, typeFilter])

  useEffect(() => {
    loadData(1, pagination.pageSize)
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      const result = await fetchCustomerAftersales(params)
      setData(result?.list || [])
      setPagination((prev) => ({ ...prev, current: page, pageSize, total: result?.total || 0 }))
    } catch (error) {
      console.error('加载售后列表失败:', error)
      setData([])
    } finally {
      setLoading(false)
    }
  }

  const statusColorMap: Record<string, string> = {
    WAIT_AUDIT: 'orange',
    WAIT_RETURN: 'cyan',
    WAIT_RECEIVE: 'blue',
    WAIT_REFUND: 'purple',
    FINISHED: 'green',
    REJECTED: 'red',
  }
  const statusTextMap: Record<string, string> = {
    WAIT_AUDIT: '待审核',
    WAIT_RETURN: '待退货',
    WAIT_RECEIVE: '待收货',
    WAIT_REFUND: '待退款',
    FINISHED: '已完成',
    REJECTED: '已拒绝',
  }

  const handleReset = () => {
    setKeyword('')
    setStatusFilter('ALL')
    setTypeFilter('ALL')
    loadData(1, pagination.pageSize)
  }

  const handleSearch = () => {
    loadData(1, pagination.pageSize)
  }

  const columns = [
    { title: '售后单号', dataIndex: 'aftersaleNo', width: 180 },
    { title: '订单号', dataIndex: 'orderNo', width: 180 },
    { title: '商家', dataIndex: 'merchantName', width: 120 },
    {
      title: '类型',
      dataIndex: 'aftersaleType',
      width: 100,
      render: (v: string) => (v === 'RETURN_REFUND' ? '退货退款' : '仅退款'),
    },
    {
      title: '金额',
      dataIndex: 'applyAmount',
      width: 100,
      render: (v: number) => `￥${v}`,
    },
    {
      title: '状态',
      dataIndex: 'aftersaleStatus',
      width: 100,
      render: (v: string) => <Tag color={statusColorMap[v] || 'blue'}>{statusTextMap[v] || v}</Tag>,
    },
    { title: '创建时间', dataIndex: 'createdAt', width: 160 },
  ]

  const advancedFilter = (
    <>
      <Select
        size="small"
        value={statusFilter}
        onChange={setStatusFilter}
        options={STATUS_OPTIONS}
        style={{ width: 120 }}
      />
      <Select size="small" value={typeFilter} onChange={setTypeFilter} options={TYPE_OPTIONS} style={{ width: 120 }} />
    </>
  )

  return (
    <Card size="small" styles={{ body: { padding: '8px 12px' } }}>
      <Space direction="vertical" size={8} style={{ width: '100%' }}>
        <ListSearchToolbar
          searchPlaceholder="搜索售后单号/订单号/商家"
          keyword={keyword}
          onKeywordChange={setKeyword}
          onSearch={handleSearch}
          onReset={handleReset}
          advancedFilter={advancedFilter}
          resultCount={pagination.total}
        />
        <Table
          dataSource={filteredData}
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
          locale={{ emptyText: <Empty description="暂无售后记录" /> }}
        />
      </Space>
    </Card>
  )
}

export default CustomerAftersalePage
