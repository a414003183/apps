import {
  Button,
  Card,
  Col,
  Descriptions,
  Empty,
  Image,
  message,
  Modal,
  Row,
  Space,
  Spin,
  Table,
  Tag,
  Timeline,
  Typography,
  Input,
  Upload,
} from 'antd'
import type { UploadProps } from 'antd'
import {
  ArrowLeftOutlined,
  CheckOutlined,
  CloseOutlined,
  TruckOutlined,
  FileTextOutlined,
  UploadOutlined,
  DownloadOutlined,
  PaperClipOutlined,
  FilePdfOutlined,
  FileWordOutlined,
  FileExcelOutlined,
  FileImageOutlined,
  FileUnknownOutlined,
} from '@ant-design/icons'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { fetchMerchantOrderDetail, approveOrder, shipOrder } from '../../../services/ant-design-pro/order'
import { getAccessToken } from '../../../utils/auth'
import { request } from '@umijs/max'

const STATUS_MAP: Record<string, { text: string; color: string }> = {
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

const PAY_STATUS_MAP: Record<string, { text: string; color: string }> = {
  UNPAID: { text: '未支付', color: 'default' },
  PAID_REGISTERED: { text: '已登记支付', color: 'blue' },
  PAID: { text: '已支付', color: 'green' },
  PARTIAL_REFUND: { text: '部分退款', color: 'orange' },
  REFUNDED: { text: '已退款', color: 'red' },
}

const fmtCny = (v: any) => `￥${Number(v || 0).toFixed(2)}`

export function MerchantOrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [detail, setDetail] = useState<any>(null)
  const [timeline, setTimeline] = useState<any[]>([])
  const [shipModalOpen, setShipModalOpen] = useState(false)
  const [shipForm, setShipForm] = useState({ company: '', trackingNo: '' })
  const [actionLoading, setActionLoading] = useState(false)
  const [contracts, setContracts] = useState<any[]>([])
  const [contractsLoading, setContractsLoading] = useState(false)

  useEffect(() => {
    if (id) loadDetail()
  }, [id])

  async function loadDetail() {
    try {
      setLoading(true)
      const data = await fetchMerchantOrderDetail(id!)
      setDetail(data)
      // 并行加载时间线和合同
      await Promise.all([
        (async () => {
          try {
            const tlRes = await request<any>(`/api/orders/${id}/timeline`, { method: 'GET' })
            setTimeline(Array.isArray(tlRes?.data) ? tlRes.data : [])
          } catch {
            setTimeline([])
          }
        })(),
        loadContracts(),
      ])
    } catch (error: any) {
      message.error('加载订单详情失败')
    } finally {
      setLoading(false)
    }
  }

  async function loadContracts() {
    try {
      setContractsLoading(true)
      const res = await request<any>(`/api/member/merchant/orders/${id}/contracts`, { method: 'GET' })
      setContracts(Array.isArray(res?.data) ? res.data : [])
    } catch {
      setContracts([])
    } finally {
      setContractsLoading(false)
    }
  }

  function getFileIcon(name: string) {
    const ext = (name || '').split('.').pop()?.toLowerCase() || ''
    if (['pdf'].includes(ext)) return <FilePdfOutlined style={{ color: '#ff4d4f' }} />
    if (['doc', 'docx'].includes(ext)) return <FileWordOutlined style={{ color: '#1677ff' }} />
    if (['xls', 'xlsx', 'csv'].includes(ext)) return <FileExcelOutlined style={{ color: '#52c41a' }} />
    if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(ext))
      return <FileImageOutlined style={{ color: '#faad14' }} />
    return <FileUnknownOutlined style={{ color: '#999' }} />
  }

  function formatFileSize(bytes: number) {
    if (!bytes || bytes <= 0) return '-'
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  const uploadProps: UploadProps = {
    name: 'file',
    action: `/api/files/upload?bizType=ORDER_CONTRACT&bizId=${id}`,
    showUploadList: false,
    headers: {
      Authorization: `Bearer ${getAccessToken() || ''}`,
    },
    beforeUpload(file) {
      const isLt20M = file.size / 1024 / 1024 < 20
      if (!isLt20M) {
        message.error('文件大小不能超过 20MB')
      }
      return isLt20M
    },
    onChange(info) {
      if (info.file.status === 'done') {
        message.success(`${info.file.name} 上传成功`)
        loadContracts()
      } else if (info.file.status === 'error') {
        message.error(`${info.file.name} 上传失败`)
      }
    },
  }

  async function handleApprove(approved: boolean) {
    Modal.confirm({
      title: approved ? '确认通过审核？' : '确认拒绝订单？',
      okText: '确定',
      cancelText: '取消',
      okButtonProps: { danger: !approved },
      onOk: async () => {
        try {
          setActionLoading(true)
          await approveOrder(id!, approved)
          message.success(approved ? '已通过审核' : '已拒绝')
          loadDetail()
        } catch {
          message.error('操作失败')
        } finally {
          setActionLoading(false)
        }
      },
    })
  }

  async function handleShip() {
    if (!shipForm.company.trim() || !shipForm.trackingNo.trim()) {
      message.warning('请填写物流公司和运单号')
      return
    }
    try {
      setActionLoading(true)
      await shipOrder(id!, shipForm.company.trim(), shipForm.trackingNo.trim())
      message.success('发货成功')
      setShipModalOpen(false)
      setShipForm({ company: '', trackingNo: '' })
      loadDetail()
    } catch {
      message.error('发货失败')
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 40 }}>
        <Spin size="large" />
      </div>
    )
  }

  if (!detail) {
    return (
      <Card size="small" styles={{ body: { padding: '8px 12px' } }}>
        <div style={{ textAlign: 'center', padding: 40 }}>
          <p>订单不存在或无权访问</p>
          <Button type="primary" onClick={() => navigate('/member/merchant/orders')}>
            返回订单列表
          </Button>
        </div>
      </Card>
    )
  }

  const orderStatus = detail.orderStatus || ''
  const statusItem = STATUS_MAP[orderStatus] || { text: orderStatus, color: 'default' }
  const payStatusItem = PAY_STATUS_MAP[detail.payStatus] || { text: detail.payStatus || '-', color: 'default' }
  const items: any[] = detail.items || []
  const adjustLogs: any[] = detail.adjustLogs || []

  const itemColumns = [
    {
      title: '图片',
      dataIndex: 'mainImageId',
      width: 70,
      align: 'center' as const,
      render: (v: string) =>
        v ? (
          <Image
            src={`/api/files/${v}`}
            width={44}
            height={44}
            style={{ borderRadius: 4, objectFit: 'cover' }}
            preview={false}
          />
        ) : (
          <div style={{ width: 44, height: 44, background: '#f5f5f5', borderRadius: 4, margin: '0 auto' }} />
        ),
    },
    {
      title: '商品',
      dataIndex: 'spuName',
      width: 200,
      render: (v: string, r: any) => (
        <div>
          <div style={{ fontWeight: 500 }}>{v}</div>
          {r.skuName && <div style={{ fontSize: 12, color: '#999' }}>{r.skuName}</div>}
          {r.specText && <div style={{ fontSize: 12, color: '#999' }}>{r.specText}</div>}
        </div>
      ),
    },
    { title: '数量', dataIndex: 'quantity', width: 70, align: 'center' as const },
    { title: '基础价', dataIndex: 'basePrice', width: 100, render: fmtCny },
    { title: '会员价', dataIndex: 'memberPrice', width: 100, render: fmtCny },
    { title: '成交单价', dataIndex: 'finalUnitPrice', width: 100, render: fmtCny },
    { title: '成交金额', dataIndex: 'finalAmount', width: 110, render: fmtCny },
    { title: '成本价', dataIndex: 'costPrice', width: 100, render: fmtCny },
    {
      title: '利润',
      dataIndex: 'profitAmount',
      width: 100,
      render: (v: any) => {
        const val = Number(v || 0)
        return <span style={{ color: val >= 0 ? '#52c41a' : '#ff4d4f' }}>{fmtCny(val)}</span>
      },
    },
  ]

  return (
    <div>
      {/* 顶部操作栏 */}
      <Card size="small" styles={{ body: { padding: '8px 12px' } }} style={{ marginBottom: 8 }}>
        <Space style={{ width: '100%', justifyContent: 'space-between', flexWrap: 'wrap' }}>
          <Space>
            <Button size="small" icon={<ArrowLeftOutlined />} onClick={() => navigate('/member/merchant/orders')}>
              返回列表
            </Button>
            <Typography.Title level={5} style={{ margin: 0, fontSize: 14 }}>
              订单详情 - {detail.orderNo}
            </Typography.Title>
            <Tag color={statusItem.color}>{statusItem.text}</Tag>
          </Space>
          <Space size={4}>
            {orderStatus === 'PENDING_AUDIT' && (
              <>
                <Button
                  size="small"
                  type="primary"
                  icon={<CheckOutlined />}
                  loading={actionLoading}
                  onClick={() => handleApprove(true)}
                >
                  通过审核
                </Button>
                <Button
                  size="small"
                  danger
                  icon={<CloseOutlined />}
                  loading={actionLoading}
                  onClick={() => handleApprove(false)}
                >
                  拒绝
                </Button>
              </>
            )}
            {orderStatus === 'WAIT_SHIP' && (
              <Button size="small" type="primary" icon={<TruckOutlined />} onClick={() => setShipModalOpen(true)}>
                发货
              </Button>
            )}
            <Button
              size="small"
              icon={<FileTextOutlined />}
              onClick={() => window.open(`/api/member/merchant/orders/${id}/quote-export`, '_blank')}
            >
              导出报价单
            </Button>
          </Space>
        </Space>
      </Card>

      {/* 订单信息 + 收货信息 */}
      <Row gutter={[8, 8]} style={{ marginBottom: 8 }}>
        <Col xs={24} md={14}>
          <Card title="订单信息" size="small" styles={{ body: { padding: '8px 12px' } }}>
            <Descriptions size="small" column={{ xs: 1, sm: 2 }} labelStyle={{ color: '#666', fontSize: 12 }}>
              <Descriptions.Item label="订单号">{detail.orderNo}</Descriptions.Item>
              <Descriptions.Item label="客户">{detail.customerName || '-'}</Descriptions.Item>
              <Descriptions.Item label="订单状态">
                <Tag color={statusItem.color}>{statusItem.text}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="支付状态">
                <Tag color={payStatusItem.color}>{payStatusItem.text}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="创建时间">{detail.createdAt || '-'}</Descriptions.Item>
              <Descriptions.Item label="客户备注">{detail.customerRemark || '-'}</Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
        <Col xs={24} md={10}>
          <Card title="收货信息" size="small" styles={{ body: { padding: '8px 12px' } }}>
            <Descriptions size="small" column={1} labelStyle={{ color: '#666', fontSize: 12 }}>
              <Descriptions.Item label="收货人">{detail.receiverName || '-'}</Descriptions.Item>
              <Descriptions.Item label="联系电话">{detail.receiverPhone || '-'}</Descriptions.Item>
              <Descriptions.Item label="收货地址">{detail.receiverAddress || '-'}</Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
      </Row>

      {/* 商品明细 */}
      <Card title="商品明细" size="small" styles={{ body: { padding: '8px 12px' } }} style={{ marginBottom: 8 }}>
        <Table
          dataSource={items}
          columns={itemColumns}
          rowKey="id"
          size="small"
          pagination={false}
          scroll={{ x: 800 }}
          summary={() => (
            <Table.Summary fixed>
              <Table.Summary.Row>
                <Table.Summary.Cell index={0} colSpan={6} align="right">
                  <Typography.Text strong>合计</Typography.Text>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={6}>
                  <Typography.Text strong>{fmtCny(detail.goodsAmount)}</Typography.Text>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={7} />
                <Table.Summary.Cell index={8}>
                  <Typography.Text
                    strong
                    style={{ color: Number(detail.profitAmount || 0) >= 0 ? '#52c41a' : '#ff4d4f' }}
                  >
                    {fmtCny(detail.profitAmount)}
                  </Typography.Text>
                </Table.Summary.Cell>
              </Table.Summary.Row>
            </Table.Summary>
          )}
        />
        <Row gutter={[8, 4]} style={{ marginTop: 8 }}>
          <Col xs={12} sm={6}>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              商品金额：{fmtCny(detail.goodsAmount)}
            </Typography.Text>
          </Col>
          <Col xs={12} sm={6}>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              运费：{fmtCny(detail.freightAmount)}
            </Typography.Text>
          </Col>
          <Col xs={12} sm={6}>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              优惠：{fmtCny(detail.discountAmount)}
            </Typography.Text>
          </Col>
          <Col xs={12} sm={6}>
            <Typography.Text strong style={{ fontSize: 13 }}>
              应付金额：{fmtCny(detail.payAmount)}
            </Typography.Text>
          </Col>
        </Row>
      </Card>

      {/* 合同/附件 */}
      <Card
        title={
          <Space size={4}>
            <PaperClipOutlined />
            合同/附件
          </Space>
        }
        size="small"
        styles={{ body: { padding: '8px 12px' } }}
        style={{ marginBottom: 8 }}
        extra={
          <Upload {...uploadProps}>
            <Button size="small" icon={<UploadOutlined />}>
              上传附件
            </Button>
          </Upload>
        }
      >
        {contractsLoading ? (
          <div style={{ textAlign: 'center', padding: 16 }}>
            <Spin size="small" />
          </div>
        ) : contracts.length > 0 ? (
          <Table
            dataSource={contracts}
            rowKey="id"
            size="small"
            pagination={false}
            columns={[
              {
                title: '文件名',
                dataIndex: 'originalName',
                render: (name: string) => (
                  <Space size={4}>
                    {getFileIcon(name)}
                    <span style={{ fontSize: 13 }}>{name}</span>
                  </Space>
                ),
              },
              {
                title: '大小',
                dataIndex: 'fileSize',
                width: 100,
                render: (v: number) => formatFileSize(v),
              },
              {
                title: '上传时间',
                dataIndex: 'uploadTime',
                width: 160,
              },
              {
                title: '操作',
                key: 'action',
                width: 80,
                render: (_: any, record: any) => (
                  <Button
                    type="link"
                    size="small"
                    icon={<DownloadOutlined />}
                    onClick={() => window.open(record.downloadUrl, '_blank')}
                  >
                    下载
                  </Button>
                ),
              },
            ]}
          />
        ) : (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无合同/附件" />
        )}
      </Card>

      {/* 操作记录 + 时间线 */}
      <Row gutter={[8, 8]}>
        {adjustLogs.length > 0 && (
          <Col xs={24} md={14}>
            <Card title="操作记录" size="small" styles={{ body: { padding: '8px 12px' } }}>
              <Table
                dataSource={adjustLogs}
                rowKey="id"
                size="small"
                pagination={false}
                columns={[
                  { title: '操作类型', dataIndex: 'operationType', width: 100 },
                  { title: '操作人', dataIndex: 'operatorName', width: 100 },
                  {
                    title: '原状态',
                    dataIndex: 'oldStatus',
                    width: 90,
                    render: (s: string) => {
                      const item = STATUS_MAP[s]
                      return item ? <Tag color={item.color}>{item.text}</Tag> : s
                    },
                  },
                  {
                    title: '新状态',
                    dataIndex: 'newStatus',
                    width: 90,
                    render: (s: string) => {
                      const item = STATUS_MAP[s]
                      return item ? <Tag color={item.color}>{item.text}</Tag> : s
                    },
                  },
                  { title: '备注', dataIndex: 'remark' },
                  { title: '时间', dataIndex: 'createdAt', width: 150 },
                ]}
              />
            </Card>
          </Col>
        )}
        {timeline.length > 0 && (
          <Col xs={24} md={adjustLogs.length > 0 ? 10 : 24}>
            <Card title="订单时间线" size="small" styles={{ body: { padding: '8px 12px' } }}>
              <Timeline
                items={timeline.map((t: any) => ({
                  children: (
                    <div>
                      <div style={{ fontWeight: 500, fontSize: 13 }}>{t.title}</div>
                      {t.description && <div style={{ fontSize: 12, color: '#666' }}>{t.description}</div>}
                      <div style={{ fontSize: 11, color: '#999' }}>
                        {t.operatorName} · {t.eventTime}
                      </div>
                    </div>
                  ),
                }))}
              />
            </Card>
          </Col>
        )}
      </Row>

      {/* 发货弹窗 */}
      <Modal
        title="填写发货信息"
        open={shipModalOpen}
        onCancel={() => setShipModalOpen(false)}
        onOk={handleShip}
        confirmLoading={actionLoading}
        okText="确认发货"
      >
        <Space direction="vertical" size={12} style={{ width: '100%' }}>
          <div>
            <Typography.Text style={{ fontSize: 12 }}>物流公司</Typography.Text>
            <Input
              placeholder="如：顺丰速运"
              value={shipForm.company}
              onChange={(e) => setShipForm((p) => ({ ...p, company: e.target.value }))}
            />
          </div>
          <div>
            <Typography.Text style={{ fontSize: 12 }}>运单号</Typography.Text>
            <Input
              placeholder="请输入运单号"
              value={shipForm.trackingNo}
              onChange={(e) => setShipForm((p) => ({ ...p, trackingNo: e.target.value }))}
            />
          </div>
        </Space>
      </Modal>
    </div>
  )
}

export default MerchantOrderDetailPage
