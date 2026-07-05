import { Card, Table, Tag, Button, message, Modal, Space, Input, Select, Typography, Form } from 'antd'
import { CheckOutlined, CloseOutlined } from '@ant-design/icons'
import { useEffect, useMemo, useState } from 'react'
import {
  fetchMerchantAftersales,
  approveAftersale,
  rejectAftersale,
  confirmReturnReceive,
  refundAftersale,
} from '../../../services/ant-design-pro/aftersale'
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

export function MerchantAftersalePage() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [keyword, setKeyword] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [typeFilter, setTypeFilter] = useState('ALL')
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 })

  const filteredData = useMemo(() => {
    let list = data
    if (typeFilter !== 'ALL') list = list.filter((r) => r.aftersaleType === typeFilter)
    const kw = keyword.trim().toLowerCase()
    if (kw)
      list = list.filter((r) =>
        [r.aftersaleNo, r.orderNo, r.customerName].some((f) => (f || '').toLowerCase().includes(kw)),
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
      const result = await fetchMerchantAftersales(params)
      setData(result?.list || [])
      setPagination((prev) => ({ ...prev, current: page, pageSize, total: result?.total || 0 }))
    } catch (error: any) {
      console.error('加载售后失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (record: any) => {
    try {
      await approveAftersale(record.id, true)
      message.success('已通过')
      loadData(pagination.current, pagination.pageSize)
    } catch (error: any) {
      message.error(error?.response?.data?.message || '操作失败')
    }
  }

  const handleReject = async (record: any) => {
    try {
      await rejectAftersale(record.id, '商家拒绝')
      message.success('已拒绝')
      loadData(pagination.current, pagination.pageSize)
    } catch (error: any) {
      message.error(error?.response?.data?.message || '操作失败')
    }
  }

  const handleReceive = async (record: any) => {
    try {
      await confirmReturnReceive(record.id)
      message.success('已确认收货')
      loadData(pagination.current, pagination.pageSize)
    } catch (error: any) {
      message.error(error?.response?.data?.message || '操作失败')
    }
  }

  const [refundModalOpen, setRefundModalOpen] = useState(false)
  const [refundRecord, setRefundRecord] = useState<any>(null)
  const [refundForm] = Form.useForm()

  const openRefundModal = (record: any) => {
    setRefundRecord(record)
    refundForm.resetFields()
    setRefundModalOpen(true)
  }

  const handleRefundSubmit = async (values: any) => {
    if (!refundRecord) return
    try {
      await refundAftersale(refundRecord.id, {
        payMethod: values.payMethod,
        transactionNo: values.transactionNo,
        remark: values.remark,
      })
      message.success('退款成功')
      setRefundModalOpen(false)
      setRefundRecord(null)
      loadData(pagination.current, pagination.pageSize)
    } catch (error: any) {
      message.error(error?.response?.data?.message || '操作失败')
    }
  }

  const handleRefundCancel = () => {
    setRefundModalOpen(false)
    setRefundRecord(null)
  }

  const getStatusTag = (status: string) => {
    const map: Record<string, { text: string; color: string }> = {
      WAIT_AUDIT: { text: '待审核', color: 'orange' },
      WAIT_RETURN: { text: '待退货', color: 'cyan' },
      WAIT_RECEIVE: { text: '待收货', color: 'blue' },
      WAIT_REFUND: { text: '待退款', color: 'purple' },
      FINISHED: { text: '已完成', color: 'green' },
      REJECTED: { text: '已拒绝', color: 'red' },
    }
    const item = map[status] || { text: status, color: 'default' }
    return <Tag color={item.color}>{item.text}</Tag>
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
    { title: '客户', dataIndex: 'customerName', width: 100 },
    {
      title: '类型',
      dataIndex: 'aftersaleType',
      width: 90,
      render: (v: string) => {
        const typeMap: Record<string, string> = { RETURN_REFUND: '退货退款', REFUND_ONLY: '仅退款' }
        return typeMap[v] || v
      },
    },
    { title: '金额', dataIndex: 'applyAmount', render: (v: number) => `￥${v}` },
    { title: '状态', dataIndex: 'aftersaleStatus', render: (s: string) => getStatusTag(s) },
    { title: '时间', dataIndex: 'createdAt', width: 160 },
    {
      title: '操作',
      key: 'action',
      width: 180,
      render: (_: any, record: any) => (
        <Space size={0} wrap>
          {record.aftersaleStatus === 'WAIT_AUDIT' && (
            <>
              <Button type="link" size="small" icon={<CheckOutlined />} onClick={() => handleApprove(record)}>
                通过
              </Button>
              <Button type="link" size="small" danger icon={<CloseOutlined />} onClick={() => handleReject(record)}>
                拒绝
              </Button>
            </>
          )}
          {record.aftersaleStatus === 'WAIT_RECEIVE' && (
            <Button type="link" size="small" icon={<CheckOutlined />} onClick={() => handleReceive(record)}>
              确认收货
            </Button>
          )}
          {record.aftersaleStatus === 'WAIT_REFUND' && (
            <Button type="link" size="small" icon={<CheckOutlined />} onClick={() => openRefundModal(record)}>
              退款
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
      <Select size="small" value={typeFilter} onChange={setTypeFilter} options={TYPE_OPTIONS} style={{ width: 120 }} />
    </>
  )

  return (
    <Card size="small" styles={{ body: { padding: '8px 12px' } }}>
      <Space direction="vertical" size={8} style={{ width: '100%' }}>
        <ListSearchToolbar
          searchPlaceholder="搜索售后单号/订单号/客户"
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
        />
      </Space>

      {/* 退款弹窗 */}
      <Modal
        title="确认退款"
        open={refundModalOpen}
        onCancel={handleRefundCancel}
        onOk={() => refundForm.submit()}
        okText="确认退款"
        cancelText="取消"
      >
        {refundRecord && (
          <div style={{ marginBottom: 16 }}>
            <Typography.Text type="secondary">售后单号：{refundRecord.aftersaleNo}</Typography.Text>
            <br />
            <Typography.Text type="secondary">退款金额：￥{refundRecord.applyAmount}</Typography.Text>
          </div>
        )}
        <Form form={refundForm} layout="vertical" onFinish={handleRefundSubmit}>
          <Form.Item
            name="payMethod"
            label="退款方式"
            rules={[{ required: true, message: '请选择退款方式' }]}
            initialValue="BANK_TRANSFER"
          >
            <Select
              options={[
                { label: '银行转账', value: 'BANK_TRANSFER' },
                { label: '支付宝', value: 'ALIPAY' },
                { label: '微信支付', value: 'WECHAT_PAY' },
                { label: '原路退回', value: 'ORIGINAL' },
              ]}
            />
          </Form.Item>
          <Form.Item name="transactionNo" label="退款流水号" rules={[{ required: true, message: '请输入退款流水号' }]}>
            <Input placeholder="请输入转账流水号或交易单号" />
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={2} placeholder="选填" />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  )
}

export default MerchantAftersalePage
