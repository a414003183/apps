import { Button, Card, Table, Tag, message, Modal, Input, Form, Space, Typography } from 'antd'
import { useEffect, useMemo, useState } from 'react'
import { TruckOutlined } from '@ant-design/icons'
import { fetchMerchantShipping } from '../../../services/ant-design-pro/merchant'
import { shipOrder } from '../../../services/ant-design-pro/order'
import { ListSearchToolbar } from '../../../components/ListSearchToolbar'

export function MerchantShippingPage() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [keyword, setKeyword] = useState('')
  const [shipModalVisible, setShipModalVisible] = useState(false)
  const [currentOrder, setCurrentOrder] = useState<any>(null)
  const [form] = Form.useForm()
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 })

  const filteredData = useMemo(() => {
    const kw = keyword.trim().toLowerCase()
    if (!kw) return data
    return data.filter((r) => [r.orderNo, r.customerName, r.address].some((f) => (f || '').toLowerCase().includes(kw)))
  }, [data, keyword])

  useEffect(() => {
    loadData(1, pagination.pageSize)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function loadData(page = 1, pageSize = 10) {
    try {
      setLoading(true)
      const result = await fetchMerchantShipping({ page, pageSize })
      setData(result?.list || [])
      setPagination((prev) => ({ ...prev, current: page, pageSize, total: result?.total || 0 }))
    } catch (error: any) {
      console.error('加载发货列表失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleShip = (record: any) => {
    setCurrentOrder(record)
    setShipModalVisible(true)
  }

  const handleShipSubmit = async () => {
    try {
      const values = await form.validateFields()
      if (currentOrder) {
        await shipOrder(currentOrder.id, values.logisticsCompany, values.trackingNumber)
        message.success('发货成功')
        setShipModalVisible(false)
        form.resetFields()
        loadData(pagination.current, pagination.pageSize)
      }
    } catch (error: any) {
      message.error('发货失败')
    }
  }

  const handleReset = () => {
    setKeyword('')
    loadData(1, pagination.pageSize)
  }

  const handleSearch = () => {
    loadData(1, pagination.pageSize)
  }

  const columns = [
    { title: '订单号', dataIndex: 'orderNo', width: 180 },
    { title: '客户', dataIndex: 'customerName', width: 120 },
    { title: '金额', dataIndex: 'amount', render: (v: number) => `￥${v}` },
    { title: '收货地址', dataIndex: 'address', width: 200 },
    { title: '时间', dataIndex: 'createdAt', width: 160 },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_: any, record: any) => (
        <Space size={0}>
          <Button type="link" size="small" icon={<TruckOutlined />} onClick={() => handleShip(record)}>
            发货
          </Button>
        </Space>
      ),
    },
  ]

  return (
    <Card size="small" styles={{ body: { padding: '8px 12px' } }}>
      <Space direction="vertical" size={8} style={{ width: '100%' }}>
        <ListSearchToolbar
          searchPlaceholder="搜索订单号/客户/地址"
          keyword={keyword}
          onKeywordChange={setKeyword}
          onSearch={handleSearch}
          onReset={handleReset}
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
        />
      </Space>

      <Modal title="发货" open={shipModalVisible} onOk={handleShipSubmit} onCancel={() => setShipModalVisible(false)}>
        <Form form={form} layout="vertical">
          <Form.Item name="logisticsCompany" label="物流公司" rules={[{ required: true, message: '请输入物流公司' }]}>
            <Input placeholder="请输入物流公司名称" />
          </Form.Item>
          <Form.Item name="trackingNumber" label="物流单号" rules={[{ required: true, message: '请输入物流单号' }]}>
            <Input placeholder="请输入物流单号" />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  )
}

export default MerchantShippingPage
