import { Button, Card, Input, Select, Space, Table, Tag, Typography, message, Modal, Form } from 'antd'
import { useEffect, useState } from 'react'
import { PlusOutlined, EditOutlined, DeleteOutlined, CheckCircleOutlined, StopOutlined } from '@ant-design/icons'
import type { UserRow } from '../../types/models'
import {
  fetchAdminUsers,
  deleteAdminUser,
  updateUserStatus,
  updateAdminUser,
} from '../../services/ant-design-pro/admin'
import { ListSearchToolbar } from '../../components/ListSearchToolbar'

export function AdminUsersPage() {
  const [users, setUsers] = useState<UserRow[]>([])
  const [loading, setLoading] = useState(false)
  const [keyword, setKeyword] = useState('')
  const [roleFilter, setRoleFilter] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 })
  const [editModalVisible, setEditModalVisible] = useState(false)
  const [editLoading, setEditLoading] = useState(false)
  const [editForm] = Form.useForm()
  const [editingRecord, setEditingRecord] = useState<UserRow | null>(null)

  useEffect(() => {
    loadData(1, pagination.pageSize)
  }, [])

  useEffect(() => {
    loadData(1, pagination.pageSize)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keyword, roleFilter, statusFilter])

  async function loadData(page = 1, pageSize = 10) {
    try {
      setLoading(true)
      const params: any = { page, pageSize }
      if (keyword.trim()) params.keyword = keyword.trim()
      if (roleFilter !== 'ALL') params.role = roleFilter
      if (statusFilter !== 'ALL') params.status = statusFilter
      const result = await fetchAdminUsers(params)
      setUsers(result?.list || [])
      setPagination((prev) => ({ ...prev, current: page, pageSize, total: result?.total || 0 }))
    } catch (error) {
      console.error('加载用户失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = () => {
    message.success('添加用户功能')
  }

  const handleEdit = (record: UserRow) => {
    setEditingRecord(record)
    editForm.setFieldsValue({
      displayName: record.displayName,
      phone: record.phone,
      email: record.email,
    })
    setEditModalVisible(true)
  }

  const handleEditSubmit = async () => {
    try {
      const values = await editForm.validateFields()
      if (!editingRecord) return
      setEditLoading(true)
      await updateAdminUser(editingRecord.id, values)
      message.success('编辑成功')
      setEditModalVisible(false)
      loadData(pagination.current, pagination.pageSize)
    } catch (error: any) {
      if (error?.errorFields) return
      message.error('编辑失败')
    } finally {
      setEditLoading(false)
    }
  }

  const handleDelete = async (record: UserRow) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除用户 ${record.displayName} 吗？`,
      onOk: async () => {
        try {
          await deleteAdminUser(record.id)
          message.success('删除成功')
          loadData(pagination.current, pagination.pageSize)
        } catch (error) {
          message.error('删除失败')
        }
      },
    })
  }

  const handleToggleStatus = (record: UserRow) => {
    const isEnabled = record.status === 'ENABLED'
    const nextStatus = isEnabled ? 'DISABLED' : 'ENABLED'
    Modal.confirm({
      title: isEnabled ? '确认禁用' : '确认启用',
      content: `确定要${isEnabled ? '禁用' : '启用'}用户 ${record.displayName || record.username} 吗？`,
      onOk: async () => {
        try {
          await updateUserStatus(record.id, nextStatus)
          message.success(`${isEnabled ? '已禁用' : '已启用'}`)
          loadData(pagination.current, pagination.pageSize)
        } catch (error) {
          message.error('操作失败')
        }
      },
    })
  }

  const handleReset = () => {
    setKeyword('')
    setRoleFilter('ALL')
    setStatusFilter('ALL')
    loadData(1, pagination.pageSize)
  }

  const handleSearch = () => {
    loadData(1, pagination.pageSize)
  }

  const columns = [
    { title: '登录账号', dataIndex: 'username', width: 120 },
    { title: '显示名称', dataIndex: 'displayName', width: 120 },
    { title: '角色', dataIndex: 'role', width: 100 },
    { title: '手机号', dataIndex: 'phone', width: 130 },
    { title: '邮箱', dataIndex: 'email', width: 180 },
    {
      title: '状态',
      dataIndex: 'status',
      width: 80,
      render: (text: string) => (
        <Tag color={text === 'ENABLED' ? 'green' : 'red'}>{text === 'ENABLED' ? '启用' : '禁用'}</Tag>
      ),
    },
    { title: '创建时间', dataIndex: 'createdAt', width: 120 },
    {
      title: '操作',
      key: 'action',
      width: 140,
      render: (_: any, record: UserRow) => (
        <Space size={0} wrap>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
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

  const advancedFilter = (
    <>
      <Select value={roleFilter} onChange={setRoleFilter} style={{ width: 120 }} size="small">
        <Select.Option value="ALL">{'全部角色'}</Select.Option>
        <Select.Option value="ADMIN">{'管理员'}</Select.Option>
        <Select.Option value="MERCHANT">{'商家'}</Select.Option>
        <Select.Option value="SUPPLIER">{'供应商'}</Select.Option>
        <Select.Option value="CUSTOMER">{'客户'}</Select.Option>
      </Select>
      <Select value={statusFilter} onChange={setStatusFilter} style={{ width: 100 }} size="small">
        <Select.Option value="ALL">{'全部状态'}</Select.Option>
        <Select.Option value="ENABLED">{'启用'}</Select.Option>
        <Select.Option value="DISABLED">{'禁用'}</Select.Option>
      </Select>
    </>
  )

  return (
    <Card size="small" styles={{ body: { padding: '8px 12px' } }}>
      <Space direction="vertical" size={8} style={{ width: '100%' }}>
        <ListSearchToolbar
          searchPlaceholder="搜索账号/名称/手机"
          keyword={keyword}
          onKeywordChange={setKeyword}
          onSearch={handleSearch}
          onReset={handleReset}
          advancedFilter={advancedFilter}
          resultCount={pagination.total}
          extraActions={
            <Button type="primary" size="small" icon={<PlusOutlined />} onClick={handleAdd}>
              新增用户
            </Button>
          }
        />
        <Table
          dataSource={users}
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
        title="编辑用户"
        open={editModalVisible}
        onOk={handleEditSubmit}
        onCancel={() => setEditModalVisible(false)}
        confirmLoading={editLoading}
        destroyOnClose
      >
        <Form form={editForm} layout="vertical" preserve={false}>
          <Form.Item name="displayName" label="显示名称" rules={[{ required: true, message: '请输入显示名称' }]}>
            <Input placeholder="请输入显示名称" />
          </Form.Item>
          <Form.Item name="phone" label="手机号" rules={[{ required: true, message: '请输入手机号' }]}>
            <Input placeholder="请输入手机号" />
          </Form.Item>
          <Form.Item name="email" label="邮箱" rules={[{ type: 'email', message: '请输入有效的邮箱地址' }]}>
            <Input placeholder="请输入邮箱" />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  )
}

export default AdminUsersPage
