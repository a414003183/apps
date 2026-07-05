import { Card, Table, Tag, Input, Select, Space, Typography, Button, Modal, message } from 'antd'
import { CheckCircleOutlined, CloseOutlined, StopOutlined } from '@ant-design/icons'
import { useState, useEffect } from 'react'
import { fetchCooperationRelations, handleCooperationRequest } from '../../../services/ant-design-pro/supplier'

const STATUS_OPTIONS = [
  { value: 'ALL', label: '全部状态' },
  { value: 'PENDING', label: '待审核' },
  { value: 'ACTIVE', label: '合作中' },
  { value: 'ENDED', label: '已终止' },
  { value: 'REJECTED', label: '已拒绝' },
]

export function SupplierCooperationRelationsPage() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [keyword, setKeyword] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [pagination, setPagination] = useState({ current: 1, pageSize: 15, total: 0 })

  useEffect(() => {
    loadData(1, pagination.pageSize)
  }, [])
  useEffect(() => {
    loadData(1, pagination.pageSize)
  }, [statusFilter])

  async function loadData(page = 1, pageSize = 15) {
    try {
      setLoading(true)
      const params: any = { page, pageSize }
      if (statusFilter !== 'ALL') params.status = statusFilter
      const result = await fetchCooperationRelations(params)
      setData(result?.list || [])
      setPagination((prev) => ({ ...prev, current: page, pageSize, total: result?.total || 0 }))
    } catch (error) {
      console.error('加载合作关系失败:', error)
      message.error('加载失败')
      setData([])
    } finally {
      setLoading(false)
    }
  }

  async function handleAction(id: string, status: string, remark?: string) {
    try {
      setLoading(true)
      await handleCooperationRequest(id, status, remark)
      message.success('操作成功')
      loadData(pagination.current, pagination.pageSize)
    } catch (e: any) {
      message.error(e?.message || '操作失败')
    } finally {
      setLoading(false)
    }
  }

  const getStatusTag = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <Tag color="green">合作中</Tag>
      case 'PENDING':
        return <Tag color="orange">待审核</Tag>
      case 'ENDED':
        return <Tag color="red">已终止</Tag>
      case 'REJECTED':
        return <Tag color="default">已拒绝</Tag>
      default:
        return <Tag>{status}</Tag>
    }
  }

  const columns = [
    { title: '商家', dataIndex: 'merchantName', width: 180, ellipsis: true },
    { title: '联系人', dataIndex: 'contactName', width: 100 },
    { title: '电话', dataIndex: 'contactPhone', width: 130 },
    {
      title: '状态',
      dataIndex: 'status',
      width: 90,
      render: getStatusTag,
    },
    {
      title: '合作开始时间',
      dataIndex: 'cooperationStartAt',
      width: 150,
    },
    {
      title: '授权商品',
      dataIndex: 'authorizedSkuCount',
      width: 90,
      align: 'center' as const,
    },
    {
      title: '引入商品',
      dataIndex: 'importedSkuCount',
      width: 90,
      align: 'center' as const,
    },
    {
      title: '备注',
      dataIndex: 'remark',
      ellipsis: true,
      width: 150,
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      render: (_: any, record: any) => {
        if (record.status === 'PENDING') {
          return (
            <Space size={0} wrap>
              <Button
                type="link"
                size="small"
                style={{ color: '#52c41a' }}
                icon={<CheckCircleOutlined />}
                onClick={() => {
                  Modal.confirm({
                    title: '确认同意',
                    content: `确定同意与「${record.merchantName}」建立合作关系吗？`,
                    onOk: () => handleAction(record.id, 'ACTIVE'),
                  })
                }}
              >
                同意
              </Button>
              <Button
                type="link"
                size="small"
                danger
                icon={<CloseOutlined />}
                onClick={() => {
                  Modal.confirm({
                    title: '确认拒绝',
                    content: `确定拒绝「${record.merchantName}」的合作申请吗？`,
                    okButtonProps: { danger: true },
                    onOk: () => handleAction(record.id, 'REJECTED'),
                  })
                }}
              >
                拒绝
              </Button>
            </Space>
          )
        }
        if (record.status === 'ACTIVE') {
          return (
            <Space size={0} wrap>
              <Button
                type="link"
                size="small"
                danger
                icon={<StopOutlined />}
                onClick={() => {
                  Modal.confirm({
                    title: '确认终止合作',
                    content: `确定终止与「${record.merchantName}」的合作关系吗？`,
                    okButtonProps: { danger: true },
                    onOk: () => handleAction(record.id, 'ENDED'),
                  })
                }}
              >
                终止合作
              </Button>
            </Space>
          )
        }
        return null
      },
    },
  ]

  const filteredData = keyword.trim()
    ? data.filter((r) =>
        [r.merchantName, r.contactName, r.contactPhone].some((f) =>
          (f || '').toLowerCase().includes(keyword.trim().toLowerCase()),
        ),
      )
    : data

  return (
    <Card size="small" styles={{ body: { padding: '8px 12px' } }}>
      <Space direction="vertical" size={8} style={{ width: '100%' }}>
        <Space align="center" style={{ width: '100%', justifyContent: 'space-between', flexWrap: 'wrap' }}>
          <Typography.Title level={5} style={{ margin: 0, fontSize: 14 }}>
            合作关系
          </Typography.Title>
          <Space size={4} wrap>
            <Input.Search
              allowClear
              placeholder="搜索商家/联系人/电话"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              style={{ width: 220 }}
              size="small"
            />
            <Select
              size="small"
              value={statusFilter}
              onChange={setStatusFilter}
              options={STATUS_OPTIONS}
              style={{ width: 110 }}
            />
          </Space>
        </Space>
        <Table
          dataSource={filteredData}
          columns={columns}
          rowKey="id"
          loading={loading}
          size="small"
          scroll={{ x: 1100, y: 'calc(100vh - 280px)' }}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            pageSizeOptions: [10, 15, 20, 50],
            showTotal: (t) => `共 ${t} 条`,
            size: 'small',
            onChange: (page, pageSize) => loadData(page, pageSize),
          }}
        />
      </Space>
    </Card>
  )
}

export default SupplierCooperationRelationsPage
