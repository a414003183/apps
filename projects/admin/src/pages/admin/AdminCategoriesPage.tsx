import {
  Button,
  Card,
  Form,
  Input,
  InputNumber,
  Select,
  Space,
  Table,
  Tag,
  TreeSelect,
  Typography,
  Modal,
  message,
} from 'antd'
import { useEffect, useMemo, useState } from 'react'
import { PlusOutlined, EditOutlined, DeleteOutlined, StopOutlined, CheckCircleOutlined } from '@ant-design/icons'
import {
  fetchAdminCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  updateCategoryStatus,
} from '../../services/ant-design-pro/admin'
import { ListSearchToolbar } from '../../components/ListSearchToolbar'

interface CatNode {
  id: number
  categoryName: string
  parentId: number
  levelNo: number
  sortNo: number
  status: string
  parentName?: string
  productCount?: number
  children?: CatNode[]
}

function buildTree(flat: CatNode[]): CatNode[] {
  const map = new Map<number, CatNode>()
  const roots: CatNode[] = []
  flat.forEach((c) => map.set(c.id, { ...c, children: [] }))
  flat.forEach((c) => {
    const node = map.get(c.id)!
    if (c.parentId && c.parentId > 0 && map.has(c.parentId)) {
      map.get(c.parentId)!.children!.push(node)
    } else {
      roots.push(node)
    }
  })
  const sortFn = (arr: CatNode[]) => {
    arr.sort((a, b) => (a.sortNo ?? 0) - (b.sortNo ?? 0) || a.id - b.id)
    arr.forEach((n) => n.children && sortFn(n.children))
  }
  sortFn(roots)
  return roots
}

function buildTreeSelectData(flat: CatNode[], excludeId?: number): any[] {
  const map = new Map<number, any>()
  const roots: any[] = []
  flat.forEach((c) => {
    if (c.id === excludeId) return
    if (c.levelNo >= 3) return // only L1/L2 can be parent
    map.set(c.id, { value: c.id, title: c.categoryName, children: [] })
  })
  flat.forEach((c) => {
    if (!map.has(c.id)) return
    const node = map.get(c.id)!
    if (c.parentId && c.parentId > 0 && map.has(c.parentId)) {
      map.get(c.parentId)!.children.push(node)
    } else {
      roots.push(node)
    }
  })
  return roots
}

const LEVEL_LABEL: Record<number, { text: string; color: string }> = {
  1: { text: '一级', color: 'blue' },
  2: { text: '二级', color: 'cyan' },
  3: { text: '三级', color: 'geekblue' },
}

export function AdminCategoriesPage() {
  const [flat, setFlat] = useState<CatNode[]>([])
  const [loading, setLoading] = useState(false)
  const [keyword, setKeyword] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingRecord, setEditingRecord] = useState<CatNode | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [form] = Form.useForm()
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 })

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      setLoading(true)
      const result = await fetchAdminCategories({})
      const list = result?.list || []
      setFlat(Array.isArray(list) ? list : [])
      setPagination((prev) => ({ ...prev, total: result?.total || 0 }))
    } catch (error) {
      console.error('加载分类失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const treeData = useMemo(() => buildTree(flat), [flat])

  const filtered = useMemo(() => {
    let list = flat
    const kw = keyword.trim().toLowerCase()
    if (kw) {
      list = list.filter((r) => (r.categoryName || '').toLowerCase().includes(kw))
    }
    if (statusFilter !== 'ALL') {
      list = list.filter((r) => r.status === statusFilter)
    }
    return buildTree(list)
  }, [flat, keyword, statusFilter])

  const paginatedData = useMemo(() => {
    const start = (pagination.current - 1) * pagination.pageSize
    return filtered.slice(start, start + pagination.pageSize)
  }, [filtered, pagination.current, pagination.pageSize])

  const treeSelectData = useMemo(() => buildTreeSelectData(flat, editingRecord?.id), [flat, editingRecord])

  const openCreate = (parentRecord?: CatNode) => {
    setEditingRecord(null)
    form.resetFields()
    form.setFieldsValue({
      categoryName: '',
      parentId: parentRecord?.id ?? null,
      sortNo: 0,
    })
    setModalOpen(true)
  }

  const openEdit = (record: CatNode) => {
    setEditingRecord(record)
    form.setFieldsValue({
      categoryName: record.categoryName,
      parentId: record.parentId > 0 ? record.parentId : null,
      sortNo: record.sortNo ?? 0,
    })
    setModalOpen(true)
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      setSubmitting(true)
      const payload = {
        categoryName: values.categoryName,
        parentId: values.parentId ?? 0,
        sortNo: values.sortNo ?? 0,
        status: editingRecord?.status ?? 'ENABLED',
      }
      if (editingRecord) {
        await updateCategory(String(editingRecord.id), payload)
        message.success('分类已更新')
      } else {
        await createCategory(payload)
        message.success('分类已创建')
      }
      setModalOpen(false)
      form.resetFields()
      await loadData()
    } catch (error: any) {
      if (error?.errorFields) return
      message.error(error?.data?.message || error?.message || '操作失败')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = (record: CatNode) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除分类「${record.categoryName}」吗？删除后不可恢复。`,
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await deleteCategory(String(record.id))
          message.success('已删除')
          loadData()
        } catch (error: any) {
          message.error(error?.data?.message || '删除失败')
        }
      },
    })
  }

  const handleToggleStatus = (record: CatNode) => {
    const isEnabled = record.status === 'ENABLED'
    const nextStatus = isEnabled ? 'DISABLED' : 'ENABLED'
    Modal.confirm({
      title: isEnabled ? '确认禁用' : '确认启用',
      content: `确定要${isEnabled ? '禁用' : '启用'}分类「${record.categoryName}」吗？`,
      onOk: async () => {
        try {
          await updateCategoryStatus(String(record.id), nextStatus)
          message.success(`已${isEnabled ? '禁用' : '启用'}`)
          loadData()
        } catch (error) {
          message.error('操作失败')
        }
      },
    })
  }

  const handleReset = () => {
    setKeyword('')
    setStatusFilter('ALL')
    setPagination((prev) => ({ ...prev, current: 1 }))
  }

  const handleSearch = () => {
    setPagination((prev) => ({ ...prev, current: 1 }))
  }

  const advancedFilter = (
    <Select value={statusFilter} onChange={setStatusFilter} style={{ width: 120 }} size="small">
      <Select.Option value="ALL">{'全部状态'}</Select.Option>
      <Select.Option value="ENABLED">{'启用'}</Select.Option>
      <Select.Option value="DISABLED">{'禁用'}</Select.Option>
    </Select>
  )

  const columns = [
    {
      title: '分类名称',
      dataIndex: 'categoryName',
      width: 260,
      render: (v: string, record: CatNode) => (
        <Space size={4}>
          <Tag color={LEVEL_LABEL[record.levelNo]?.color ?? 'default'}>
            {LEVEL_LABEL[record.levelNo]?.text ?? `L${record.levelNo}`}
          </Tag>
          <span>{v}</span>
        </Space>
      ),
    },
    { title: '商品数量', dataIndex: 'productCount', width: 90, render: (v: number) => v || 0 },
    { title: '排序', dataIndex: 'sortNo', width: 70 },
    {
      title: '状态',
      dataIndex: 'status',
      width: 80,
      render: (s: string) => <Tag color={s === 'ENABLED' ? 'green' : 'red'}>{s === 'ENABLED' ? '启用' : '禁用'}</Tag>,
    },
    {
      title: '操作',
      key: 'action',
      width: 260,
      render: (_: any, record: CatNode) => (
        <Space size={0} wrap>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => openEdit(record)}>
            {'编辑'}
          </Button>
          {record.levelNo < 3 && (
            <Button type="link" size="small" icon={<PlusOutlined />} onClick={() => openCreate(record)}>
              {'新增子分类'}
            </Button>
          )}
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
          searchPlaceholder="搜索分类"
          keyword={keyword}
          onKeywordChange={setKeyword}
          onSearch={handleSearch}
          onReset={handleReset}
          advancedFilter={advancedFilter}
          resultCount={filtered.length}
          extraActions={
            <Button type="primary" size="small" icon={<PlusOutlined />} onClick={() => openCreate()}>
              新增一级分类
            </Button>
          }
        />
        <Table
          dataSource={paginatedData}
          columns={columns}
          rowKey="id"
          loading={loading}
          size="small"
          scroll={{ y: 'calc(100vh - 280px)' }}
          pagination={{
            ...pagination,
            total: filtered.length,
            showSizeChanger: true,
            pageSizeOptions: [10, 20, 50, 100],
            showTotal: (t) => `共 ${t} 条`,
            size: 'small',
            onChange: (page, pageSize) => setPagination((prev) => ({ ...prev, current: page, pageSize })),
          }}
          expandable={{ defaultExpandAllRows: true, childrenColumnName: 'children' }}
        />
      </Space>
      <Modal
        title={editingRecord ? '编辑分类' : '新增分类'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={handleSubmit}
        confirmLoading={submitting}
        destroyOnClose
        width={420}
      >
        <Form form={form} layout="vertical" size="small" style={{ marginTop: 16 }}>
          <Form.Item name="categoryName" label="分类名称" rules={[{ required: true, message: '请输入分类名称' }]}>
            <Input placeholder="请输入分类名称" maxLength={50} />
          </Form.Item>
          <Form.Item name="parentId" label="父级分类">
            <TreeSelect allowClear placeholder="无（作为一级分类）" treeData={treeSelectData} treeDefaultExpandAll />
          </Form.Item>
          <Form.Item name="sortNo" label="排序号">
            <InputNumber min={0} max={9999} style={{ width: '100%' }} placeholder="数值越小越靠前" />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  )
}

export default AdminCategoriesPage
