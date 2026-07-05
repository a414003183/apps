import { Button, Card, Form, Input, InputNumber, Select, Space, Table, Tag, Typography, Modal, message } from 'antd'
import { useEffect, useState } from 'react'
import { PlusOutlined, EditOutlined, DeleteOutlined, StopOutlined, CheckCircleOutlined } from '@ant-design/icons'
import {
  fetchAdminBrands,
  createBrand,
  updateBrand,
  deleteBrand,
  updateBrandStatus,
} from '../../services/ant-design-pro/admin'
import { ListSearchToolbar } from '../../components/ListSearchToolbar'

export function AdminBrandsPage() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [keyword, setKeyword] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingRecord, setEditingRecord] = useState<any>(null)
  const [submitting, setSubmitting] = useState(false)
  const [form] = Form.useForm()
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 })

  useEffect(() => {
    loadData(1, pagination.pageSize)
  }, [])

  useEffect(() => {
    loadData(1, pagination.pageSize)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keyword, statusFilter])

  async function loadData(page = 1, pageSize = 10) {
    try {
      setLoading(true)
      const params: any = { page, pageSize }
      if (keyword.trim()) params.keyword = keyword.trim()
      if (statusFilter !== 'ALL') params.status = statusFilter
      const result = await fetchAdminBrands(params)
      setData(result?.list || [])
      setPagination((prev) => ({ ...prev, current: page, pageSize, total: result?.total || 0 }))
    } catch (error) {
      console.error('加载品牌失败:', error)
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

  const openCreate = () => {
    setEditingRecord(null)
    form.resetFields()
    form.setFieldsValue({ brandName: '', brandDesc: '', sortNo: 0 })
    setModalOpen(true)
  }

  const openEdit = (record: any) => {
    setEditingRecord(record)
    form.setFieldsValue({ brandName: record.brandName, brandDesc: record.brandDesc || '', sortNo: record.sortNo ?? 0 })
    setModalOpen(true)
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      setSubmitting(true)
      if (editingRecord) {
        await updateBrand(String(editingRecord.id), {
          ...values,
          brandId: editingRecord.id,
          status: editingRecord.status,
        })
        message.success('品牌已更新')
      } else {
        await createBrand(values)
        message.success('品牌已创建')
      }
      setModalOpen(false)
      loadData(pagination.current, pagination.pageSize)
    } catch (error: any) {
      if (error?.errorFields) return
      message.error('操作失败')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = (record: any) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除品牌「${record.brandName}」吗？删除后不可恢复。`,
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await deleteBrand(String(record.id))
          message.success('已删除')
          loadData(pagination.current, pagination.pageSize)
        } catch (error: any) {
          message.error(error?.message || '删除失败，品牌可能已被商品使用')
        }
      },
    })
  }

  const handleToggleStatus = (record: any) => {
    const isEnabled = record.status === 'ENABLED'
    const nextStatus = isEnabled ? 'DISABLED' : 'ENABLED'
    Modal.confirm({
      title: isEnabled ? '确认禁用' : '确认启用',
      content: `确定要${isEnabled ? '禁用' : '启用'}品牌「${record.brandName}」吗？`,
      onOk: async () => {
        try {
          await updateBrandStatus(String(record.id), nextStatus)
          message.success(`已${isEnabled ? '禁用' : '启用'}`)
          loadData(pagination.current, pagination.pageSize)
        } catch (error) {
          message.error('操作失败')
        }
      },
    })
  }

  const advancedFilter = (
    <Select value={statusFilter} onChange={setStatusFilter} style={{ width: 120 }} size="small">
      <Select.Option value="ALL">{'全部状态'}</Select.Option>
      <Select.Option value="ENABLED">{'启用'}</Select.Option>
      <Select.Option value="DISABLED">{'禁用'}</Select.Option>
    </Select>
  )

  const columns = [
    { title: '品牌名称', dataIndex: 'brandName', width: 200 },
    { title: '商品数量', dataIndex: 'productCount', width: 120 },
    { title: '排序', dataIndex: 'sortNo', width: 80 },
    {
      title: '状态',
      dataIndex: 'status',
      width: 80,
      render: (s: string) => <Tag color={s === 'ENABLED' ? 'green' : 'red'}>{s === 'ENABLED' ? '启用' : '禁用'}</Tag>,
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_: any, record: any) => (
        <Space size={0} wrap>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => openEdit(record)}>
            {'编辑'}
          </Button>
          {record.status === 'ENABLED' ? (
            <Button type="link" size="small" danger icon={<StopOutlined />} onClick={() => handleToggleStatus(record)}>
              {'禁用'}
            </Button>
          ) : (
            <Button
              type="link"
              size="small"
              style={{ color: '#52c41a' }}
              icon={<CheckCircleOutlined />}
              onClick={() => handleToggleStatus(record)}
            >
              {'启用'}
            </Button>
          )}
          <Button type="link" size="small" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record)}>
            {'删除'}
          </Button>
        </Space>
      ),
    },
  ]

  return (
    <Card size="small" styles={{ body: { padding: '8px 12px' } }}>
      <Space direction="vertical" size={8} style={{ width: '100%' }}>
        <ListSearchToolbar
          searchPlaceholder="搜索品牌"
          keyword={keyword}
          onKeywordChange={setKeyword}
          onSearch={handleSearch}
          onReset={handleReset}
          advancedFilter={advancedFilter}
          resultCount={pagination.total}
          extraActions={
            <Button type="primary" size="small" icon={<PlusOutlined />} onClick={openCreate}>
              新增品牌
            </Button>
          }
        />
        <Table
          dataSource={data}
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
      <Modal
        title={editingRecord ? '编辑品牌' : '新增品牌'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={handleSubmit}
        confirmLoading={submitting}
        destroyOnClose
        width={420}
      >
        <Form form={form} layout="vertical" size="small" style={{ marginTop: 16 }}>
          <Form.Item name="brandName" label="品牌名称" rules={[{ required: true, message: '请输入品牌名称' }]}>
            <Input placeholder="请输入品牌名称" maxLength={50} />
          </Form.Item>
          <Form.Item name="brandDesc" label="品牌描述">
            <Input.TextArea placeholder="请输入品牌描述" rows={3} maxLength={200} />
          </Form.Item>
          <Form.Item name="sortNo" label="排序号">
            <InputNumber min={0} max={9999} style={{ width: '100%' }} placeholder="数值越小越靠前" />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  )
}

export default AdminBrandsPage
