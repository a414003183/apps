import {
  Button,
  Card,
  Col,
  Descriptions,
  Empty,
  Form,
  Image,
  Input,
  message,
  Modal,
  Row,
  Select,
  Space,
  Spin,
  Table,
  Tag,
  Timeline,
  Typography,
  Upload,
} from 'antd'
import type { UploadProps } from 'antd'
import {
  ArrowLeftOutlined,
  CheckOutlined,
  DownloadOutlined,
  FileExcelOutlined,
  FileImageOutlined,
  FilePdfOutlined,
  FileTextOutlined,
  FileUnknownOutlined,
  FileWordOutlined,
  PaperClipOutlined,
  TruckOutlined,
  UploadOutlined,
} from '@ant-design/icons'
import { uploadAttachment } from '../../../services/ant-design-pro/file'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  fetchOrderDetail,
  fetchOrderTimeline,
  confirmReceive,
  registerCustomerPayment,
} from '../../../services/ant-design-pro/order'
import { createAftersale } from '../../../services/ant-design-pro/aftersale'
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
}

const PAY_STATUS_MAP: Record<string, { text: string; color: string }> = {
  UNPAID: { text: '未支付', color: 'default' },
  PAID_REGISTERED: { text: '已登记支付', color: 'blue' },
  PAID: { text: '已支付', color: 'green' },
  PARTIAL_REFUND: { text: '部分退款', color: 'orange' },
  REFUNDED: { text: '已退款', color: 'red' },
}

const fmtCny = (v: any) => `￥${Number(v || 0).toFixed(2)}`

export function CustomerOrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [detail, setDetail] = useState<any>(null)
  const [timeline, setTimeline] = useState<any[]>([])
  const [actionLoading, setActionLoading] = useState(false)
  const [voucherFileId, setVoucherFileId] = useState<number | undefined>(undefined)
  const [transactionNo, setTransactionNo] = useState('')
  const [registerLoading, setRegisterLoading] = useState(false)
  const [contracts, setContracts] = useState<any[]>([])
  const [contractsLoading, setContractsLoading] = useState(false)
  const [aftersaleModalOpen, setAftersaleModalOpen] = useState(false)
  const [aftersaleLoading, setAftersaleLoading] = useState(false)
  const [aftersaleFileId, setAftersaleFileId] = useState<number | undefined>(undefined)

  useEffect(() => {
    if (id) loadDetail()
  }, [id])

  async function loadDetail() {
    try {
      setLoading(true)
      const data = await fetchOrderDetail(id!)
      setDetail(data)
      try {
        const tl = await fetchOrderTimeline(id!)
        setTimeline(tl)
      } catch {
        setTimeline([])
      }
      try {
        await loadContracts()
      } catch {
        setContracts([])
      }
    } catch (error: any) {
      message.error('加载订单详情失败')
    } finally {
      setLoading(false)
    }
  }

  async function loadContracts() {
    try {
      setContractsLoading(true)
      const res = await request<any>(`/api/member/customer/orders/${id}/contracts`, { method: 'GET' })
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

  function handleConfirmReceive() {
    Modal.confirm({
      title: '确认收货',
      content: '确认已收到商品？',
      okText: '确认收货',
      onOk: async () => {
        try {
          setActionLoading(true)
          await confirmReceive(id!)
          message.success('已确认收货')
          loadDetail()
        } catch {
          message.error('操作失败')
        } finally {
          setActionLoading(false)
        }
      },
    })
  }

  const uploadProps: UploadProps = {
    name: 'file',
    action: '/api/files/upload?bizType=ORDER_PAYMENT',
    showUploadList: true,
    maxCount: 1,
    headers: {
      Authorization: `Bearer ${getAccessToken() || ''}`,
    },
    onChange(info) {
      if (info.file.status === 'done') {
        const uploaded = info.file.response?.data
        if (uploaded?.id) {
          setVoucherFileId(Number(uploaded.id))
          message.success('凭证上传成功')
        }
      } else if (info.file.status === 'error') {
        message.error('凭证上传失败')
      }
    },
  }

  async function handleRegisterPayment() {
    if (!transactionNo.trim()) {
      message.warning('请输入交易流水号')
      return
    }
    try {
      setRegisterLoading(true)
      await registerCustomerPayment(id!, {
        payMethod: detail.payMethod || 'BANK_TRANSFER',
        transactionNo: transactionNo.trim(),
        voucherFileId,
        remark: detail.customerRemark || undefined,
      })
      message.success('支付凭证已提交，订单状态已更新')
      setVoucherFileId(undefined)
      setTransactionNo('')
      loadDetail()
    } catch {
      message.error('提交失败，请重试')
    } finally {
      setRegisterLoading(false)
    }
  }

  async function handleCreateAftersale(values: any) {
    try {
      setAftersaleLoading(true)
      await createAftersale({
        orderId: id!,
        aftersaleType: values.aftersaleType,
        reasonType: values.reasonType,
        reasonDesc: values.reasonDesc,
        applyAmount: values.applyAmount,
        attachmentFileId: aftersaleFileId,
      })
      message.success('售后申请已提交')
      setAftersaleModalOpen(false)
      setAftersaleFileId(undefined)
      loadDetail()
    } catch (err: any) {
      message.error(err?.response?.data?.message || '提交失败')
    } finally {
      setAftersaleLoading(false)
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
          <Button type="primary" onClick={() => navigate('/member/customer/orders')}>
            返回订单列表
          </Button>
        </div>
      </Card>
    )
  }

  const orderStatus = detail.orderStatus || detail.status || ''
  const statusItem = STATUS_MAP[orderStatus] || { text: orderStatus, color: 'default' }
  const payStatusItem = PAY_STATUS_MAP[detail.payStatus] || { text: detail.payStatus || '-', color: 'default' }
  const items: any[] = detail.items || []

  const canConfirmReceive = ['SHIPPED', 'WAIT_RECEIVE'].includes(orderStatus)
  const canRegisterPayment = orderStatus === 'WAIT_PAY' && detail.payStatus === 'UNPAID'
  const canApplyAftersale = orderStatus === 'FINISHED' && (!detail.aftersaleStatus || detail.aftersaleStatus === 'NONE')

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
    { title: '单价', dataIndex: 'finalUnitPrice', width: 100, render: fmtCny },
    { title: '金额', dataIndex: 'finalAmount', width: 110, render: fmtCny },
  ]

  return (
    <div>
      {/* 顶部操作栏 */}
      <Card size="small" styles={{ body: { padding: '8px 12px' } }} style={{ marginBottom: 8 }}>
        <Space style={{ width: '100%', justifyContent: 'space-between', flexWrap: 'wrap' }}>
          <Space>
            <Button size="small" icon={<ArrowLeftOutlined />} onClick={() => navigate('/member/customer/orders')}>
              返回列表
            </Button>
            <Typography.Title level={5} style={{ margin: 0, fontSize: 14 }}>
              订单详情 - {detail.orderNo}
            </Typography.Title>
            <Tag color={statusItem.color}>{statusItem.text}</Tag>
          </Space>
          <Space size={4}>
            {canConfirmReceive && (
              <Button
                size="small"
                type="primary"
                icon={<CheckOutlined />}
                loading={actionLoading}
                onClick={handleConfirmReceive}
              >
                确认收货
              </Button>
            )}
            {canApplyAftersale && (
              <Button
                size="small"
                type="primary"
                danger
                icon={<FileTextOutlined />}
                onClick={() => setAftersaleModalOpen(true)}
              >
                申请售后
              </Button>
            )}
          </Space>
        </Space>
      </Card>

      {/* 订单信息 + 收货信息 */}
      <Row gutter={[8, 8]} style={{ marginBottom: 8 }}>
        <Col xs={24} md={14}>
          <Card title="订单信息" size="small" styles={{ body: { padding: '8px 12px' } }}>
            <Descriptions size="small" column={{ xs: 1, sm: 2 }} labelStyle={{ color: '#666', fontSize: 12 }}>
              <Descriptions.Item label="订单号">{detail.orderNo}</Descriptions.Item>
              <Descriptions.Item label="商家">{detail.merchantName || '-'}</Descriptions.Item>
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
              <Descriptions.Item label="收货地址">
                {detail.receiverProvince || detail.receiverCity || detail.receiverDistrict
                  ? `${detail.receiverProvince || ''}${detail.receiverCity || ''}${detail.receiverDistrict || ''} ${
                      detail.receiverAddress || ''
                    }`
                  : detail.receiverAddress || '-'}
              </Descriptions.Item>
              {detail.logisticsCompany && (
                <Descriptions.Item label="物流信息">
                  <Space>
                    <TruckOutlined />
                    <span>{detail.logisticsCompany}</span>
                    <span style={{ color: '#666' }}>运单号：{detail.trackingNo || '-'}</span>
                  </Space>
                </Descriptions.Item>
              )}
            </Descriptions>
          </Card>
        </Col>
      </Row>

      {/* 支付凭证登记 */}
      {canRegisterPayment && (
        <Card title="支付凭证" size="small" styles={{ body: { padding: '8px 12px' } }} style={{ marginBottom: 8 }}>
          <Space direction="vertical" size={12} style={{ width: '100%' }}>
            <div>
              <Typography.Text style={{ fontSize: 12 }}>交易流水号</Typography.Text>
              <Input
                placeholder="请输入转账流水号或交易单号"
                value={transactionNo}
                onChange={(e) => setTransactionNo(e.target.value)}
                size="small"
                style={{ marginTop: 4 }}
              />
            </div>
            <div>
              <Typography.Text style={{ fontSize: 12 }}>上传凭证</Typography.Text>
              <div style={{ marginTop: 4 }}>
                <Upload {...uploadProps}>
                  <Button size="small" icon={<UploadOutlined />}>
                    上传支付凭证
                  </Button>
                </Upload>
              </div>
            </div>
            <Button
              type="primary"
              size="small"
              loading={registerLoading}
              onClick={handleRegisterPayment}
              disabled={!transactionNo.trim()}
            >
              确认已支付
            </Button>
          </Space>
        </Card>
      )}

      {/* 商品明细 */}
      <Card title="商品明细" size="small" styles={{ body: { padding: '8px 12px' } }} style={{ marginBottom: 8 }}>
        <Table
          dataSource={items}
          columns={itemColumns}
          rowKey="id"
          size="small"
          pagination={false}
          scroll={{ x: 600 }}
          summary={() => (
            <Table.Summary fixed>
              <Table.Summary.Row>
                <Table.Summary.Cell index={0} colSpan={4} align="right">
                  <Typography.Text strong>合计</Typography.Text>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={4}>
                  <Typography.Text strong>{fmtCny(detail.goodsAmount)}</Typography.Text>
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

      {/* 附件/凭证 */}
      <Card
        title={
          <Space size={4}>
            <PaperClipOutlined />
            附件/凭证
          </Space>
        }
        size="small"
        styles={{ body: { padding: '8px 12px' } }}
        style={{ marginBottom: 8 }}
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
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无附件/凭证" />
        )}
      </Card>

      {/* 订单时间线 */}
      {timeline.length > 0 && (
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
      )}

      {/* 申请售后弹窗 */}
      <Modal
        title="申请售后"
        open={aftersaleModalOpen}
        onCancel={() => {
          setAftersaleModalOpen(false)
          setAftersaleFileId(undefined)
        }}
        footer={null}
        destroyOnHidden
      >
        <Form layout="vertical" onFinish={handleCreateAftersale}>
          <Form.Item
            name="aftersaleType"
            label="售后类型"
            rules={[{ required: true, message: '请选择售后类型' }]}
            initialValue="RETURN_REFUND"
          >
            <Select
              options={[
                { label: '退货退款', value: 'RETURN_REFUND' },
                { label: '仅退款', value: 'REFUND_ONLY' },
              ]}
            />
          </Form.Item>
          <Form.Item name="reasonType" label="退款原因" rules={[{ required: true, message: '请选择退款原因' }]}>
            <Select
              placeholder="请选择退款原因"
              options={[
                { label: '质量问题', value: 'QUALITY_ISSUE' },
                { label: '七天无理由', value: 'SEVEN_DAYS_NO_REASON' },
                { label: '发错货', value: 'WRONG_ITEM' },
                { label: '物流损坏', value: 'LOGISTICS_DAMAGE' },
                { label: '与描述不符', value: 'NOT_AS_DESCRIBED' },
                { label: '其他', value: 'OTHER' },
              ]}
            />
          </Form.Item>
          <Form.Item
            name="applyAmount"
            label="申请退款金额"
            rules={[{ required: true, message: '请输入退款金额' }]}
            initialValue={detail?.payAmount}
          >
            <Input type="number" min={0.01} max={detail?.payAmount} step={0.01} />
          </Form.Item>
          <Form.Item name="reasonDesc" label="原因描述">
            <Input.TextArea rows={3} placeholder="请描述具体问题（选填）" />
          </Form.Item>
          <Form.Item label="上传凭证">
            <Upload
              name="file"
              action="/api/files/upload?bizType=AFTERSALE_APPLY"
              showUploadList={true}
              maxCount={1}
              headers={{ Authorization: `Bearer ${getAccessToken() || ''}` }}
              onChange={(info) => {
                if (info.file.status === 'done') {
                  const uploaded = info.file.response?.data
                  if (uploaded?.id) {
                    setAftersaleFileId(Number(uploaded.id))
                    message.success('凭证上传成功')
                  }
                } else if (info.file.status === 'error') {
                  message.error('凭证上传失败')
                }
              }}
            >
              <Button size="small" icon={<UploadOutlined />}>
                上传凭证
              </Button>
            </Upload>
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block loading={aftersaleLoading}>
              提交售后申请
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default CustomerOrderDetailPage
