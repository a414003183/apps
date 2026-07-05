import { Card, Table, Tag, Select, Space, Typography, Button, message, Modal, Form, Input, InputNumber } from 'antd'
import { useState, useEffect, useMemo } from 'react'
import {
  fetchSupplierAuthorizations,
  handleSupplierAuthorization,
  saveSupplierAuthorization,
} from '../../../services/ant-design-pro/supplier'
import { ListSearchToolbar } from '../../../components/ListSearchToolbar'
import { CheckCircleOutlined, CloseOutlined, EditOutlined, StopOutlined } from '@ant-design/icons'

const STATUS_OPTIONS = [
  { value: 'ALL', label: '全部状态' },
  { value: 'PENDING', label: '待审核' },
  { value: 'ACTIVE', label: '已授权' },
  { value: 'REVOKED', label: '已撤销' },
]

interface AuthorizationRow {
  id: string
  merchantId: number
  merchantName: string
  supplierSkuId: number
  spuName: string
  skuName: string
  specText: string
  authorizedPrice: number
  allocatedStockQty: number
  authStatus: string
  updatedAt: string
}

export function SupplierCooperationAuthorizationsPage() {
  const [data, setData] = useState<AuthorizationRow[]>([])
  const [loading, setLoading] = useState(false)
  const [keyword, setKeyword] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 })
  const [editRow, setEditRow] = useState<AuthorizationRow | null>(null)
  const [auditRow, setAuditRow] = useState<AuthorizationRow | null>(null)
  const [form] = Form.useForm()
  const [auditForm] = Form.useForm()

  const filteredData = useMemo(() => {
    let list = data
    const kw = keyword.trim().toLowerCase()
    if (kw)
      list = list.filter((r) =>
        [r.merchantName, r.spuName, r.skuName].some((f) => (f || '').toLowerCase().includes(kw)),
      )
    return list
  }, [data, keyword])

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
      const result = await fetchSupplierAuthorizations(params)
      setData(result?.list || [])
      setPagination((prev) => ({ ...prev, current: page, pageSize, total: result?.total || 0 }))
    } catch (error) {
      console.error('加载授权信息失败:', error)
      setData([])
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setKeyword('')
    setStatusFilter('ALL')
    loadData(1, pagination.pageSize)
  }

  const handleSearch = () => {
    loadData(1, pagination.pageSize)
  }

  const onAudit = async (id: string, status: string, remark?: string) => {
    try {
      setLoading(true)
      await handleSupplierAuthorization(id, status, remark)
      message.success(status === 'ACTIVE' ? '已同意授权' : '已拒绝授权')
      loadData(pagination.current, pagination.pageSize)
    } catch (err: any) {
      message.error(err?.response?.data?.message || '操作失败')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveEdit = async (values: any) => {
    try {
      if (!editRow) return
      setLoading(true)
      await saveSupplierAuthorization({
        merchantId: editRow.merchantId,
        supplierSkuId: editRow.supplierSkuId,
        authorizedPrice: values.authorizedPrice,
        allocatedStockQty: values.allocatedStockQty,
        authStatus: editRow.authStatus,
      })
      message.success('授权信息已更新')
      setEditRow(null)
      form.resetFields()
      loadData(pagination.current, pagination.pageSize)
    } catch (err: any) {
      message.error(err?.response?.data?.message || '保存失败')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveAudit = async (values: any) => {
    try {
      if (!auditRow) return
      setLoading(true)
      await handleSupplierAuthorization(auditRow.id, 'ACTIVE', values.remark)
      await saveSupplierAuthorization({
        merchantId: auditRow.merchantId,
        supplierSkuId: auditRow.supplierSkuId,
        authorizedPrice: values.authorizedPrice,
        allocatedStockQty: values.allocatedStockQty,
        authStatus: 'ACTIVE',
      })
      message.success('已同意授权并设置库存配额')
      setAuditRow(null)
      auditForm.resetFields()
      loadData(pagination.current, pagination.pageSize)
    } catch (err: any) {
      message.error(err?.response?.data?.message || '操作失败')
    } finally {
      setLoading(false)
    }
  }

  const columns = [
    { title: '商家', dataIndex: 'merchantName', width: 160, ellipsis: true },
    {
      title: '商品',
      dataIndex: 'spuName',
      width: 180,
      ellipsis: true,
      render: (_: any, record: AuthorizationRow) => (
        <span>
          {record.spuName} / {record.skuName}
        </span>
      ),
    },
    { title: '规格', dataIndex: 'specText', width: 120, ellipsis: true },
    { title: '授权价格', dataIndex: 'authorizedPrice', width: 100, render: (v: number) => v?.toFixed(2) },
    { title: '分配库存', dataIndex: 'allocatedStockQty', width: 100 },
    {
      title: '状态',
      dataIndex: 'authStatus',
      width: 100,
      render: (s: string) => {
        const colorMap: Record<string, string> = { ACTIVE: 'green', PENDING: 'orange', REVOKED: 'red' }
        const textMap: Record<string, string> = { ACTIVE: '已授权', PENDING: '待审核', REVOKED: '已撤销' }
        return <Tag color={colorMap[s] || 'default'}>{textMap[s] || s}</Tag>
      },
    },
    { title: '申请时间', dataIndex: 'updatedAt', width: 140 },
    {
      title: '操作',
      key: 'action',
      width: 200,
      fixed: 'right' as const,
      render: (_: any, record: AuthorizationRow) => {
        if (record.authStatus === 'PENDING') {
          return (
            <Space size={0} wrap>
              <Button
                type="link"
                size="small"
                style={{ color: '#52c41a' }}
                icon={<CheckCircleOutlined />}
                onClick={() => {
                  setAuditRow(record)
                  auditForm.setFieldsValue({
                    authorizedPrice: record.authorizedPrice,
                    allocatedStockQty: record.allocatedStockQty,
                    remark: '',
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
                    content: `确定拒绝「${record.merchantName}」的授权申请吗？`,
                    okButtonProps: { danger: true },
                    onOk: () => onAudit(record.id, 'REVOKED'),
                  })
                }}
              >
                拒绝
              </Button>
            </Space>
          )
        }
        return (
          <Space size={0} wrap>
            <Button
              type="link"
              size="small"
              icon={<EditOutlined />}
              onClick={() => {
                setEditRow(record)
                form.setFieldsValue({
                  authorizedPrice: record.authorizedPrice,
                  allocatedStockQty: record.allocatedStockQty,
                })
              }}
            >
              编辑
            </Button>
            {record.authStatus === 'ACTIVE' ? (
              <Button
                type="link"
                size="small"
                danger
                icon={<StopOutlined />}
                onClick={() => {
                  Modal.confirm({
                    title: '确认撤销',
                    content: `确定撤销「${record.merchantName}」的授权吗？`,
                    okButtonProps: { danger: true },
                    onOk: () => onAudit(record.id, 'REVOKED'),
                  })
                }}
              >
                撤销
              </Button>
            ) : null}
          </Space>
        )
      },
    },
  ]

  const advancedFilter = (
    <Select
      size="small"
      value={statusFilter}
      onChange={setStatusFilter}
      options={STATUS_OPTIONS}
      style={{ width: 110 }}
    />
  )

  return (
    <Card size="small" styles={{ body: { padding: '8px 12px' } }}>
      <Space direction="vertical" size={8} style={{ width: '100%' }}>
        <Space align="center" style={{ width: '100%', justifyContent: 'space-between', flexWrap: 'wrap' }}>
          <Typography.Title level={5} style={{ margin: 0, fontSize: 14 }}>
            授权管理
          </Typography.Title>
          <ListSearchToolbar
            searchPlaceholder="搜索商家/商品"
            keyword={keyword}
            onKeywordChange={setKeyword}
            onSearch={handleSearch}
            onReset={handleReset}
            advancedFilter={advancedFilter}
            resultCount={pagination.total}
          />
        </Space>
        <Table
          dataSource={filteredData}
          columns={columns}
          rowKey="id"
          loading={loading}
          size="small"
          scroll={{ x: 1000, y: 'calc(100vh - 280px)' }}
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

      <Modal
        title="编辑授权信息"
        open={!!editRow}
        onCancel={() => {
          setEditRow(null)
          form.resetFields()
        }}
        footer={null}
        destroyOnHidden
      >
        <Form form={form} layout="vertical" onFinish={handleSaveEdit}>
          <Form.Item label="授权价格" name="authorizedPrice" rules={[{ required: true, message: '请输入授权价格' }]}>
            <InputNumber style={{ width: '100%' }} min={0} precision={2} />
          </Form.Item>
          <Form.Item
            label="分配库存"
            name="allocatedStockQty"
            rules={[{ required: true, message: '请输入分配库存数量' }]}
          >
            <InputNumber style={{ width: '100%' }} min={0} precision={0} />
          </Form.Item>
          <Button htmlType="submit" type="primary" block loading={loading}>
            保存修改
          </Button>
        </Form>
      </Modal>

      <Modal
        title="同意授权并设置配额"
        open={!!auditRow}
        onCancel={() => {
          setAuditRow(null)
          auditForm.resetFields()
        }}
        footer={null}
        destroyOnHidden
      >
        <Form form={auditForm} layout="vertical" onFinish={handleSaveAudit}>
          <Form.Item label="授权价格" name="authorizedPrice" rules={[{ required: true, message: '请输入授权价格' }]}>
            <InputNumber style={{ width: '100%' }} min={0} precision={2} />
          </Form.Item>
          <Form.Item
            label="分配库存"
            name="allocatedStockQty"
            rules={[{ required: true, message: '请输入分配库存数量' }]}
          >
            <InputNumber style={{ width: '100%' }} min={0} precision={0} />
          </Form.Item>
          <Form.Item label="备注" name="remark">
            <Input.TextArea rows={2} placeholder="可选备注" />
          </Form.Item>
          <Button htmlType="submit" type="primary" block loading={loading}>
            确认同意
          </Button>
        </Form>
      </Modal>
    </Card>
  )
}

export default SupplierCooperationAuthorizationsPage
