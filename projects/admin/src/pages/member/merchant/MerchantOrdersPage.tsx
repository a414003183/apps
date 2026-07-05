import { Button, Card, Table, Tag, Space, Input, Select, Typography, message, Modal, Form } from 'antd'
import { EyeOutlined, CheckOutlined, CloseOutlined, TruckOutlined } from '@ant-design/icons'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { OrderItem } from '../../../types/models'
import { fetchMerchantOrders, approveOrder, shipOrder } from '../../../services/ant-design-pro/order'
import { ListSearchToolbar } from '../../../components/ListSearchToolbar'

const STATUS_OPTIONS = [
  { value: 'ALL', label: '全部状态' },
  { value: 'WAIT_PAY', label: '待付款' },
  { value: 'PENDING_AUDIT', label: '待审核' },
  { value: 'WAIT_SHIP', label: '待发货' },
  { value: 'WAIT_RECEIVE', label: '待收货' },
  { value: 'FINISHED', label: '已完成' },
  { value: 'CANCELLED', label: '已取消' },
  { value: 'REFUNDED', label: '已退款' },
]

const SOURCE_OPTIONS = [
  { value: 'ALL', label: '全部来源' },
  { value: 'WEB_MALL', label: '网页商城' },
  { value: 'ANDROID_APP', label: '安卓App' },
]

export function MerchantOrdersPage() {
  const [data, setData] = useState<OrderItem[]>([])
  const [loading, setLoading] = useState(true)
  const [keyword, setKeyword] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [sourceFilter, setSourceFilter] = useState('ALL')
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 })
  const [shipModalOpen, setShipModalOpen] = useState(false)
  const [shipOrderId, setShipOrderId] = useState<string | null>(null)
  const [shipLoading, setShipLoading] = useState(false)
  const [shipForm] = Form.useForm()
  const navigate = useNavigate()

  const filteredData = useMemo(() => {
    let list = data
    if (sourceFilter !== 'ALL') list = list.filter((r) => r.orderSource === sourceFilter)
    return list
  }, [data, sourceFilter])

  useEffect(() => {
    loadOrders(1, pagination.pageSize)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    loadOrders(1, pagination.pageSize)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, keyword])

  async function loadOrders(page = 1, pageSize = 10) {
    try {
      setLoading(true)
      const params: any = { page, pageSize }
      if (statusFilter !== 'ALL') params.status = statusFilter
      if (keyword.trim()) params.keyword = keyword.trim()
      const result = await fetchMerchantOrders(params)
      setData(result?.list || [])
      setPagination((prev) => ({ ...prev, current: page, pageSize, total: result?.total || 0 }))
    } catch (error: any) {
      console.error('加载订单失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (orderId: string, approved: boolean) => {
    try {
      await approveOrder(orderId, approved)
      message.success(approved ? '已通过审核' : '已拒绝')
      loadOrders(pagination.current, pagination.pageSize)
    } catch (error: any) {
      message.error('操作失败')
    }
  }

  const openShipModal = (orderId: string) => {
    setShipOrderId(orderId)
    shipForm.resetFields()
    setShipModalOpen(true)
  }

  const handleShip = async () => {
    try {
      const values = await shipForm.validateFields()
      if (!shipOrderId) return
      setShipLoading(true)
      await shipOrder(shipOrderId, values.carrierName.trim(), values.trackingNo.trim())
      message.success('发货成功')
      setShipModalOpen(false)
      shipForm.resetFields()
      loadOrders(pagination.current, pagination.pageSize)
    } catch (err: any) {
      if (err?.response?.data?.message) {
        message.error(err.response.data.message)
      } else if (err?.errorFields) {
        // form validation error, ignore
      } else {
        message.error('发货失败')
      }
    } finally {
      setShipLoading(false)
    }
  }

  const getStatusTag = (status: string) => {
    const map: Record<string, { text: string; color: string }> = {
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
      PAID: { text: '已支付', color: 'green' },
      UNPAID: { text: '待支付', color: 'orange' },
    }
    const item = map[status] || { text: status, color: 'default' }
    return <Tag color={item.color}>{item.text}</Tag>
  }

  const handleReset = () => {
    setKeyword('')
    setStatusFilter('ALL')
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
    { title: '客户', dataIndex: 'customerName', width: 120 },
    { title: '金额', dataIndex: 'amount', render: (v: number) => `￥${v}` },
    { title: '状态', dataIndex: 'status', render: (s: string) => getStatusTag(s) },
    { title: '时间', dataIndex: 'createdAt', width: 160 },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_: any, record: OrderItem) => (
        <Space size={0} wrap>
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/member/merchant/orders/${record.id}`)}
          >
            详情
          </Button>
          {record.status === 'PENDING_AUDIT' && (
            <>
              <Button type="link" size="small" icon={<CheckOutlined />} onClick={() => handleApprove(record.id, true)}>
                通过
              </Button>
              <Button
                type="link"
                size="small"
                danger
                icon={<CloseOutlined />}
                onClick={() => handleApprove(record.id, false)}
              >
                拒绝
              </Button>
            </>
          )}
          {record.status === 'WAIT_SHIP' && (
            <Button type="link" size="small" icon={<TruckOutlined />} onClick={() => openShipModal(record.id)}>
              发货
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
          searchPlaceholder="搜索订单号/客户"
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
      <Modal
        title="填写发货信息"
        open={shipModalOpen}
        onOk={handleShip}
        onCancel={() => {
          setShipModalOpen(false)
          shipForm.resetFields()
        }}
        confirmLoading={shipLoading}
        okText="确认发货"
      >
        <Form form={shipForm} layout="vertical">
          <Form.Item name="carrierName" label="物流公司" rules={[{ required: true, message: '请输入物流公司' }]}>
            <Input placeholder="如：顺丰速运" />
          </Form.Item>
          <Form.Item name="trackingNo" label="运单号" rules={[{ required: true, message: '请输入运单号' }]}>
            <Input placeholder="请输入运单号" />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  )
}

export default MerchantOrdersPage
