import { Button, Card, Table, Tag, Space, Input, Select, Typography, message } from 'antd'
import { EyeOutlined, FileTextOutlined, CustomerServiceOutlined } from '@ant-design/icons'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { OrderItem } from '../../../types/models'
import { fetchCustomerOrders } from '../../../services/ant-design-pro/order'
import { ListSearchToolbar } from '../../../components/ListSearchToolbar'

const STATUS_OPTIONS = [
  { value: 'ALL', label: '全部状态' },
  { value: 'WAIT_PAY', label: '待付款' },
  { value: 'PENDING_PAYMENT', label: '待付款' },
  { value: 'WAIT_SHIP', label: '待发货' },
  { value: 'WAIT_RECEIVE', label: '待收货' },
  { value: 'FINISHED', label: '已完成' },
  { value: 'CANCELLED', label: '已取消' },
  { value: 'REFUNDED', label: '已退款' },
]

const PAY_OPTIONS = [
  { value: 'ALL', label: '全部支付' },
  { value: 'PAID', label: '已支付' },
  { value: 'UNPAID', label: '待支付' },
]

const SOURCE_OPTIONS = [
  { value: 'ALL', label: '全部来源' },
  { value: 'WEB_MALL', label: '网页商城' },
  { value: 'ANDROID_APP', label: '安卓App' },
]

export function CustomerOrdersPage() {
  const [data, setData] = useState<OrderItem[]>([])
  const [loading, setLoading] = useState(true)
  const [keyword, setKeyword] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [payFilter, setPayFilter] = useState('ALL')
  const [sourceFilter, setSourceFilter] = useState('ALL')
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 })
  const navigate = useNavigate()

  const filteredData = useMemo(() => {
    let list = data
    if (payFilter !== 'ALL') list = list.filter((r) => r.payStatus === payFilter)
    if (sourceFilter !== 'ALL') list = list.filter((r) => r.orderSource === sourceFilter)
    const kw = keyword.trim().toLowerCase()
    if (kw) list = list.filter((r) => [r.orderNo, r.merchantName].some((f) => (f || '').toLowerCase().includes(kw)))
    return list
  }, [data, keyword, payFilter, sourceFilter])

  useEffect(() => {
    loadOrders(1, pagination.pageSize)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    loadOrders(1, pagination.pageSize)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter])

  async function loadOrders(page = 1, pageSize = 10) {
    try {
      setLoading(true)
      const params: any = { page, pageSize }
      if (statusFilter !== 'ALL') params.status = statusFilter
      if (keyword.trim()) params.keyword = keyword.trim()
      const result = await fetchCustomerOrders(params)
      setData(result?.list || [])
      setPagination((prev) => ({ ...prev, current: page, pageSize, total: result?.total || 0 }))
    } catch (error: any) {
      console.error('加载订单失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const statusMap: Record<string, { text: string; color: string }> = {
    WAIT_PAY: { text: '待付款', color: 'orange' },
    PENDING_PAYMENT: { text: '待付款', color: 'orange' },
    PENDING_AUDIT: { text: '待审核', color: 'gold' },
    WAIT_SHIP: { text: '待发货', color: 'blue' },
    SHIPPED: { text: '已发货', color: 'cyan' },
    WAIT_RECEIVE: { text: '待收货', color: 'cyan' },
    RECEIVED: { text: '已收货', color: 'geekblue' },
    FINISHED: { text: '已完成', color: 'green' },
    COMPLETED: { text: '已完成', color: 'green' },
    CANCELLED: { text: '已取消', color: 'default' },
    CLOSED: { text: '已关闭', color: 'default' },
    REFUNDING: { text: '退款中', color: 'purple' },
    REFUNDED: { text: '已退款', color: 'purple' },
  }

  const payStatusMap: Record<string, { text: string; color: string }> = {
    UNPAID: { text: '未支付', color: 'default' },
    PAID_REGISTERED: { text: '已登记支付', color: 'blue' },
    PAID: { text: '已支付', color: 'green' },
    PARTIAL_REFUND: { text: '部分退款', color: 'orange' },
    REFUNDED: { text: '已退款', color: 'red' },
  }

  const handleReset = () => {
    setKeyword('')
    setStatusFilter('ALL')
    setPayFilter('ALL')
    setSourceFilter('ALL')
    loadOrders(1, pagination.pageSize)
  }

  const handleSearch = () => {
    loadOrders(1, pagination.pageSize)
  }

  const columns = [
    { title: '订单号', dataIndex: 'orderNo', width: 180 },
    {
      title: '来源',
      dataIndex: 'orderSource',
      width: 90,
      render: (v: string) => {
        if (v === 'ANDROID_APP') return <Tag color="blue">安卓App</Tag>
        return <Tag color="green">网页商城</Tag>
      },
    },
    { title: '商家', dataIndex: 'merchantName', width: 150 },
    { title: '金额', dataIndex: 'amount', render: (v: number) => `￥${v}` },
    {
      title: '支付状态',
      dataIndex: 'payStatus',
      render: (s: string) => {
        const item = payStatusMap[s] || { text: s, color: 'default' }
        return <Tag color={item.color}>{item.text}</Tag>
      },
    },
    {
      title: '订单状态',
      dataIndex: 'status',
      render: (s: string) => {
        const item = statusMap[s] || { text: s, color: 'default' }
        return <Tag color={item.color}>{item.text}</Tag>
      },
    },
    { title: '时间', dataIndex: 'createdAt', width: 160 },
    {
      title: '操作',
      key: 'action',
      width: 160,
      render: (_: any, record: OrderItem) => (
        <Space size={0} wrap>
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/member/customer/orders/${record.id}`)}
          >
            查看
          </Button>
          {record.status === 'FINISHED' && (!record.aftersaleStatus || record.aftersaleStatus === 'NONE') && (
            <Button
              type="link"
              size="small"
              icon={<CustomerServiceOutlined />}
              onClick={() => navigate(`/member/customer/orders/${record.id}`)}
            >
              申请售后
            </Button>
          )}
          {record.aftersaleStatus && record.aftersaleStatus !== 'NONE' && (
            <Button
              type="link"
              size="small"
              icon={<FileTextOutlined />}
              onClick={() => navigate(`/member/customer/orders/${record.id}`)}
            >
              售后详情
            </Button>
          )}
        </Space>
      ),
    },
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
      <Select size="small" value={payFilter} onChange={setPayFilter} options={PAY_OPTIONS} style={{ width: 120 }} />
      <Select
        size="small"
        value={sourceFilter}
        onChange={setSourceFilter}
        options={SOURCE_OPTIONS}
        style={{ width: 120 }}
      />
    </>
  )

  return (
    <Card size="small" styles={{ body: { padding: '8px 12px' } }}>
      <Space direction="vertical" size={8} style={{ width: '100%' }}>
        <ListSearchToolbar
          searchPlaceholder="搜索订单号/商家"
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
            onChange: (page, pageSize) => loadOrders(page, pageSize),
          }}
        />
      </Space>
    </Card>
  )
}

export default CustomerOrdersPage
