import { Card, Table, Tag, Spin, Input, Select, Space, Typography, Button, Modal, Form, message } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { useState, useEffect, useMemo } from 'react'
import {
  fetchMerchantSupplyRelations,
  fetchPlatformSuppliers,
  applyMerchantRelation,
} from '../../../services/ant-design-pro/merchant'
import { ListSearchToolbar } from '../../../components/ListSearchToolbar'

interface SupplyRelation {
  id: string
  supplierId: number
  supplierName: string
  supplierCode: string
  status: string
  authorizedSkuCount: number
  importedSkuCount: number
  cooperationStartAt: string
  remark: string
}

interface PlatformSupplier {
  id: number
  supplierName: string
  contactName: string
  contactPhone: string
  supplyDesc: string
}

const STATUS_OPTIONS = [
  { value: 'ALL', label: '全部状态' },
  { value: 'ACTIVE', label: '合作中' },
  { value: 'INACTIVE', label: '已停用' },
  { value: 'PENDING', label: '待审核' },
  { value: 'REJECTED', label: '已拒绝' },
  { value: 'ENDED', label: '已结束' },
]

export function MerchantSupplyRelationsPage() {
  const [data, setData] = useState<SupplyRelation[]>([])
  const [loading, setLoading] = useState(true)
  const [keyword, setKeyword] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 })

  // 弹窗相关状态
  const [modalVisible, setModalVisible] = useState(false)
  const [supplierKeyword, setSupplierKeyword] = useState('')
  const [supplierList, setSupplierList] = useState<PlatformSupplier[]>([])
  const [supplierLoading, setSupplierLoading] = useState(false)
  const [supplierPagination, setSupplierPagination] = useState({ current: 1, pageSize: 10, total: 0 })
  const [selectedSupplier, setSelectedSupplier] = useState<PlatformSupplier | null>(null)
  const [applyForm] = Form.useForm()
  const [applyLoading, setApplyLoading] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      setLoading(true)
      const result = await fetchMerchantSupplyRelations({ page: 1, pageSize: 100 })
      setData(result?.list || [])
    } catch (error) {
      console.error('加载供货关系失败:', error)
      setData([])
    } finally {
      setLoading(false)
    }
  }

  const filteredData = useMemo(() => {
    let list = data
    if (statusFilter !== 'ALL') {
      list = list.filter((r) => r.status === statusFilter)
    }
    const kw = keyword.trim().toLowerCase()
    if (kw) {
      list = list.filter((r) => [r.supplierName, r.supplierCode].some((f) => (f || '').toLowerCase().includes(kw)))
    }
    return list
  }, [data, keyword, statusFilter])

  const handleReset = () => {
    setKeyword('')
    setStatusFilter('ALL')
    setPagination((prev) => ({ ...prev, current: 1 }))
  }

  const handleSearch = () => {
    setPagination((prev) => ({ ...prev, current: 1 }))
  }

  // 打开弹窗并加载供应商列表
  const handleOpenModal = () => {
    setModalVisible(true)
    setSelectedSupplier(null)
    applyForm.resetFields()
    loadSuppliers(1, supplierPagination.pageSize, '')
  }

  const loadSuppliers = async (page: number, pageSize: number, kw: string) => {
    try {
      setSupplierLoading(true)
      const result = await fetchPlatformSuppliers({ page, pageSize, keyword: kw || undefined })
      setSupplierList(result?.list || [])
      setSupplierPagination({
        current: result?.page || page,
        pageSize: result?.pageSize || pageSize,
        total: result?.total || 0,
      })
    } catch (error) {
      console.error('加载供应商列表失败:', error)
      message.error('加载供应商列表失败')
    } finally {
      setSupplierLoading(false)
    }
  }

  const handleSupplierSearch = () => {
    loadSuppliers(1, supplierPagination.pageSize, supplierKeyword)
  }

  const handleSupplierReset = () => {
    setSupplierKeyword('')
    loadSuppliers(1, supplierPagination.pageSize, '')
  }

  const handleSupplierTableChange = (pg: any) => {
    loadSuppliers(pg.current, pg.pageSize, supplierKeyword)
  }

  const handleSelectSupplier = (record: PlatformSupplier) => {
    setSelectedSupplier(record)
  }

  const handleApplySubmit = async () => {
    if (!selectedSupplier) {
      message.warning('请先选择一个供应商')
      return
    }
    try {
      setApplyLoading(true)
      const values = await applyForm.validateFields()
      await applyMerchantRelation({
        supplierId: selectedSupplier.id,
        remark: values.remark,
      })
      message.success('合作申请已提交，等待供应商审核')
      setModalVisible(false)
      setSelectedSupplier(null)
      applyForm.resetFields()
      loadData()
    } catch (error: any) {
      console.error('提交合作申请失败:', error)
      message.error(error?.response?.data?.message || '提交失败，请重试')
    } finally {
      setApplyLoading(false)
    }
  }

  const columns = [
    { title: '供应商', dataIndex: 'supplierName', width: 180 },
    { title: '供应商编码', dataIndex: 'supplierCode', width: 130 },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (s: string) => {
        const colorMap: Record<string, string> = {
          ACTIVE: 'green',
          PENDING: 'orange',
          INACTIVE: 'orange',
          REJECTED: 'red',
          ENDED: 'default',
        }
        const labelMap: Record<string, string> = {
          ACTIVE: '合作中',
          PENDING: '待审核',
          INACTIVE: '已停用',
          REJECTED: '已拒绝',
          ENDED: '已结束',
        }
        return <Tag color={colorMap[s] || 'default'}>{labelMap[s] || s}</Tag>
      },
    },
    {
      title: '授权商品',
      dataIndex: 'authorizedSkuCount',
      width: 100,
      align: 'center' as const,
    },
    {
      title: '已导入',
      dataIndex: 'importedSkuCount',
      width: 100,
      align: 'center' as const,
    },
    {
      title: '合作开始时间',
      dataIndex: 'cooperationStartAt',
      width: 160,
    },
    {
      title: '备注',
      dataIndex: 'remark',
      ellipsis: true,
    },
  ]

  const supplierColumns = [
    { title: '供应商名称', dataIndex: 'supplierName', width: 180 },
    { title: '联系人', dataIndex: 'contactName', width: 120 },
    { title: '电话', dataIndex: 'contactPhone', width: 140 },
    {
      title: '操作',
      width: 100,
      fixed: 'right' as const,
      render: (_: any, record: PlatformSupplier) => (
        <Button
          type={selectedSupplier?.id === record.id ? 'primary' : 'default'}
          size="small"
          onClick={() => handleSelectSupplier(record)}
        >
          {selectedSupplier?.id === record.id ? '已选择' : '选择'}
        </Button>
      ),
    },
  ]

  const advancedFilter = (
    <Select
      size="small"
      value={statusFilter}
      onChange={setStatusFilter}
      options={STATUS_OPTIONS}
      style={{ width: 120 }}
    />
  )

  return (
    <Card size="small" styles={{ body: { padding: '8px 12px' } }}>
      <Space direction="vertical" size={8} style={{ width: '100%' }}>
        <ListSearchToolbar
          searchPlaceholder="搜索供应商名称/编码"
          keyword={keyword}
          onKeywordChange={setKeyword}
          onSearch={handleSearch}
          onReset={handleReset}
          advancedFilter={advancedFilter}
          resultCount={filteredData.length}
          extraActions={
            <Button type="primary" icon={<PlusOutlined />} size="small" onClick={handleOpenModal}>
              添加合作关系
            </Button>
          }
        />
        <Table
          dataSource={filteredData}
          columns={columns}
          rowKey="id"
          loading={loading}
          size="small"
          scroll={{ y: 'calc(100vh - 280px)' }}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: filteredData.length,
            showSizeChanger: true,
            pageSizeOptions: [10, 20, 50, 100],
            showTotal: (t) => `共 ${t} 条`,
            size: 'small',
            onChange: (page, pageSize) => setPagination((prev) => ({ ...prev, current: page, pageSize })),
          }}
        />
      </Space>

      <Modal
        title="添加合作关系"
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false)
          setSelectedSupplier(null)
          applyForm.resetFields()
        }}
        width={800}
        footer={null}
        destroyOnClose
      >
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          {/* 供应商列表 */}
          <div>
            <Typography.Text strong>第一步：选择平台供应商</Typography.Text>
            <div style={{ marginTop: 8, marginBottom: 8 }}>
              <Space>
                <Input
                  placeholder="搜索供应商名称/编码"
                  value={supplierKeyword}
                  onChange={(e) => setSupplierKeyword(e.target.value)}
                  onPressEnter={handleSupplierSearch}
                  style={{ width: 260 }}
                  size="small"
                />
                <Button size="small" onClick={handleSupplierSearch}>
                  搜索
                </Button>
                <Button size="small" onClick={handleSupplierReset}>
                  重置
                </Button>
              </Space>
            </div>
            <Table
              dataSource={supplierList}
              columns={supplierColumns}
              rowKey="id"
              loading={supplierLoading}
              size="small"
              pagination={{
                current: supplierPagination.current,
                pageSize: supplierPagination.pageSize,
                total: supplierPagination.total,
                showSizeChanger: true,
                pageSizeOptions: [5, 10, 20],
                size: 'small',
              }}
              onChange={handleSupplierTableChange}
              scroll={{ y: 240 }}
            />
          </div>

          {/* 申请表单 */}
          {selectedSupplier && (
            <div
              style={{
                padding: 12,
                background: '#f6ffed',
                border: '1px solid #b7eb8f',
                borderRadius: 4,
              }}
            >
              <Typography.Text strong type="success">
                已选择供应商：{selectedSupplier.supplierName}（{selectedSupplier.contactName} /{' '}
                {selectedSupplier.contactPhone}）
              </Typography.Text>
            </div>
          )}

          <Form form={applyForm} layout="vertical">
            <Form.Item name="remark" label="申请备注（可选）" rules={[{ max: 200, message: '备注最多200字' }]}>
              <Input.TextArea placeholder="请填写合作申请备注..." rows={3} maxLength={200} showCount />
            </Form.Item>
          </Form>

          <div style={{ textAlign: 'right' }}>
            <Button type="primary" loading={applyLoading} onClick={handleApplySubmit} disabled={!selectedSupplier}>
              提交申请
            </Button>
          </div>
        </Space>
      </Modal>
    </Card>
  )
}

export default MerchantSupplyRelationsPage
