import { EyeOutlined, ImportOutlined, PlusOutlined, ShopOutlined } from '@ant-design/icons'
import {
  Button,
  Card,
  Form,
  Image,
  Input,
  InputNumber,
  Modal,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from 'antd'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  applyMerchantAuthorization,
  fetchMerchantSupplyCatalog,
  importMerchantSupply,
} from '../../../services/ant-design-pro/merchant'
import { hasPermission } from '../../../utils/auth'
import { ListSearchToolbar } from '../../../components/ListSearchToolbar'

interface MerchantSupplyCatalogRow {
  id: string
  supplierId: number
  supplierName: string
  supplierCode: string
  supplierSkuId: number
  spuName: string
  skuName: string
  specText: string
  mainImageId?: number
  stockQty: number
  allocatedStockQty: number
  basePrice: number
  authorizedPrice: number
  relationStatus: string
  authStatus: string
  importedSaleStatus?: string
  merchantGoodsId?: string
  updatedAt: string
  remark?: string
}

interface ImportFormValues {
  salePrice: number
  rebateRate: number
  saleStatus: string
}

const currencyFormatter = new Intl.NumberFormat('zh-CN', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
})

function formatCurrency(value: number | string | undefined) {
  return `¥${currencyFormatter.format(Number(value ?? 0))}`
}

function getStatusTag(status?: string) {
  const statusTextMap: Record<string, { text: string; color: string }> = {
    ACTIVE: { text: '生效', color: 'green' },
    ON: { text: '上架', color: 'green' },
    ENABLED: { text: '启用', color: 'green' },
    PENDING: { text: '待审核', color: 'gold' },
    REVOKED: { text: '已撤销', color: 'default' },
    OFF: { text: '下架', color: 'default' },
    ENDED: { text: '已结束', color: 'default' },
    DISABLED: { text: '已禁用', color: 'default' },
    REJECTED: { text: '已拒绝', color: 'red' },
  }
  const item = statusTextMap[status || '']
  if (item) return <Tag color={item.color}>{item.text}</Tag>
  return <Tag>{status || '-'}</Tag>
}

function getErrorMessage(error: unknown) {
  if (
    typeof error === 'object' &&
    error !== null &&
    'response' in error &&
    typeof (error as { response?: { data?: { message?: string } } }).response?.data?.message === 'string'
  ) {
    return (error as { response?: { data?: { message?: string } } }).response?.data?.message ?? '操作失败'
  }
  return error instanceof Error ? error.message : '操作失败'
}

export function MerchantSupplyCatalogPage() {
  const [form] = Form.useForm<ImportFormValues>()
  const [catalog, setCatalog] = useState<MerchantSupplyCatalogRow[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [applyLoading, setApplyLoading] = useState(false)
  const [keyword, setKeyword] = useState('')
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'PENDING' | 'REVOKED'>('ALL')
  const [importingRow, setImportingRow] = useState<MerchantSupplyCatalogRow | null>(null)
  const [applyRow, setApplyRow] = useState<MerchantSupplyCatalogRow | null>(null)
  const [viewingRow, setViewingRow] = useState<MerchantSupplyCatalogRow | null>(null)
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 })
  const canImport = hasPermission('merchant:supply:import')

  const filteredCatalog = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase()
    return catalog.filter((row) => {
      const matchesStatus = statusFilter === 'ALL' || row.authStatus === statusFilter
      if (!matchesStatus) {
        return false
      }
      if (!normalizedKeyword) {
        return true
      }

      return [row.supplierName, row.supplierCode, row.spuName, row.skuName, row.specText, row.remark ?? ''].some(
        (field) => field.toLowerCase().includes(normalizedKeyword),
      )
    })
  }, [catalog, keyword, statusFilter])

  useEffect(() => {
    void loadData(1, pagination.pageSize)
  }, [])

  async function loadData(page = 1, pageSize = 10) {
    try {
      setLoading(true)
      const result = await fetchMerchantSupplyCatalog({ page, pageSize })
      setCatalog((result?.list ?? []) as MerchantSupplyCatalogRow[])
      setPagination((prev) => ({ ...prev, current: page, pageSize, total: result?.total || 0 }))
    } catch (error) {
      console.error('加载授权目录失败:', error)
      setCatalog([])
      message.error('加载授权目录失败')
    } finally {
      setLoading(false)
    }
  }

  function openImportModal(row: MerchantSupplyCatalogRow) {
    setImportingRow(row)
    form.setFieldsValue({
      salePrice: Number(row.authorizedPrice ?? row.basePrice),
      rebateRate: 0,
      saleStatus: 'OFF',
    })
  }

  async function handleImport(values: ImportFormValues) {
    if (!importingRow) {
      return
    }

    setSaving(true)
    try {
      await importMerchantSupply({
        supplierSkuId: importingRow.supplierSkuId,
        salePrice: values.salePrice,
        rebateRate: values.rebateRate,
        saleStatus: values.saleStatus,
      })
      message.success('供应商商品已导入到商家商品库')
      setImportingRow(null)
      form.resetFields()
      await loadData(pagination.current, pagination.pageSize)
    } catch (error) {
      message.error(getErrorMessage(error))
    } finally {
      setSaving(false)
    }
  }

  async function handleApplyAuthorization() {
    if (!applyRow) {
      return
    }

    setApplyLoading(true)
    try {
      await applyMerchantAuthorization({
        supplierId: applyRow.supplierId,
        supplierSkuId: applyRow.supplierSkuId,
      })
      message.success('已提交授权申请，等待供应商确认')
      setApplyRow(null)
      await loadData(pagination.current, pagination.pageSize)
    } catch (error) {
      message.error(getErrorMessage(error))
    } finally {
      setApplyLoading(false)
    }
  }

  const handleReset = () => {
    setKeyword('')
    setStatusFilter('ALL')
    loadData(1, pagination.pageSize)
  }

  const handleSearch = () => {
    setPagination((prev) => ({ ...prev, current: 1 }))
  }

  const columns = [
    {
      title: '图片',
      dataIndex: 'mainImageId',
      width: 80,
      render: (mainImageId?: number) =>
        mainImageId ? (
          <Image
            src={`/api/files/${mainImageId}`}
            width={48}
            height={48}
            style={{ objectFit: 'cover', borderRadius: 6 }}
            preview={false}
          />
        ) : (
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 6,
              background: '#f5f5f5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#bfbfbf',
            }}
          >
            无图
          </div>
        ),
    },
    { title: '供应商', dataIndex: 'supplierName', width: 140 },
    { title: '商品名称', dataIndex: 'spuName', width: 180 },
    { title: '规格名称', dataIndex: 'skuName', width: 180 },
    { title: '规格', dataIndex: 'specText', width: 180 },
    { title: '供应商库存', dataIndex: 'stockQty', width: 110 },
    { title: '分配库存', dataIndex: 'allocatedStockQty', width: 100 },
    {
      title: '基础价',
      dataIndex: 'basePrice',
      width: 120,
      render: (value: number) => formatCurrency(value),
    },
    {
      title: '授权供货价',
      dataIndex: 'authorizedPrice',
      width: 120,
      render: (value: number) => formatCurrency(value),
    },
    {
      title: '合作状态',
      dataIndex: 'relationStatus',
      width: 110,
      render: (value: string) => getStatusTag(value),
    },
    {
      title: '授权状态',
      dataIndex: 'authStatus',
      width: 110,
      render: (value: string) => getStatusTag(value),
    },
    {
      title: '导入状态',
      width: 110,
      render: (_: unknown, row: MerchantSupplyCatalogRow) =>
        row.merchantGoodsId ? getStatusTag(row.importedSaleStatus ?? 'OFF') : <span>未导入</span>,
    },
    { title: '更新时间', dataIndex: 'updatedAt', width: 160 },
    {
      title: '操作',
      key: 'action',
      width: 260,
      render: (_: unknown, row: MerchantSupplyCatalogRow) => {
        const canImportCurrentRow =
          canImport && row.relationStatus === 'ACTIVE' && row.authStatus === 'ACTIVE' && !row.merchantGoodsId

        const canApplyCurrentRow = row.relationStatus === 'ACTIVE' && (!row.authStatus || row.authStatus === 'REVOKED')

        return (
          <Space size={0} wrap>
            <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => setViewingRow(row)}>
              查看
            </Button>
            {row.merchantGoodsId ? <Link to="/member/merchant/goods">前往商品库</Link> : null}
            {canImportCurrentRow ? (
              <Button type="link" size="small" icon={<ImportOutlined />} onClick={() => openImportModal(row)}>
                导入商品
              </Button>
            ) : null}
            {canApplyCurrentRow ? (
              <Button type="link" size="small" icon={<PlusOutlined />} onClick={() => setApplyRow(row)}>
                申请授权
              </Button>
            ) : null}
          </Space>
        )
      },
    },
  ]

  const advancedFilter = (
    <Select
      value={statusFilter}
      onChange={(value) => setStatusFilter(value)}
      options={[
        { label: '全部授权', value: 'ALL' },
        { label: '已生效', value: 'ACTIVE' },
        { label: '待处理', value: 'PENDING' },
        { label: '已撤销', value: 'REVOKED' },
      ]}
      style={{ width: 140 }}
      size="small"
    />
  )

  return (
    <>
      <Card size="small" styles={{ body: { padding: '8px 12px' } }}>
        <Space direction="vertical" size={8} style={{ width: '100%' }}>
          <ListSearchToolbar
            searchPlaceholder="搜索供应商、商品、规格"
            keyword={keyword}
            onKeywordChange={setKeyword}
            onSearch={handleSearch}
            onReset={handleReset}
            advancedFilter={advancedFilter}
            resultCount={filteredCatalog.length}
            extraActions={
              <Link to="/member/merchant/goods">
                <Button icon={<ShopOutlined />} size="small">
                  商家商品库
                </Button>
              </Link>
            }
          />

          <Table
            rowKey="id"
            dataSource={filteredCatalog}
            columns={columns}
            loading={loading}
            size="small"
            scroll={{ x: 1700, y: 'calc(100vh - 280px)' }}
            pagination={{
              ...pagination,
              showSizeChanger: true,
              pageSizeOptions: [10, 20, 50, 100],
              onChange: (page, pageSize) => loadData(page, pageSize),
              size: 'small',
            }}
          />
        </Space>
      </Card>

      <Modal
        open={Boolean(importingRow)}
        title="导入供应商商品"
        onCancel={() => {
          setImportingRow(null)
          form.resetFields()
        }}
        footer={null}
        destroyOnHidden
      >
        <Form<ImportFormValues> form={form} layout="vertical" onFinish={(values) => void handleImport(values)}>
          <Typography.Paragraph type="secondary">
            {importingRow?.supplierName} / {importingRow?.spuName} / {importingRow?.skuName}
          </Typography.Paragraph>
          <Typography.Paragraph>
            授权供货价：{formatCurrency(importingRow?.authorizedPrice || 0)}，分配库存：
            {importingRow?.allocatedStockQty ?? 0}
          </Typography.Paragraph>
          <Form.Item label="销售价" name="salePrice" rules={[{ required: true, message: '请输入销售价' }]}>
            <InputNumber min={0} precision={2} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="返利比例 (%)" name="rebateRate" rules={[{ required: true, message: '请输入返利比例' }]}>
            <InputNumber min={0} precision={2} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="初始销售状态" name="saleStatus" rules={[{ required: true, message: '请选择销售状态' }]}>
            <Select
              options={[
                { label: '先下架整理', value: 'OFF' },
                { label: '直接上架', value: 'ON' },
              ]}
            />
          </Form.Item>
          <Button htmlType="submit" type="primary" block loading={saving}>
            导入到商家商品库
          </Button>
        </Form>
      </Modal>

      <Modal
        open={Boolean(applyRow)}
        title="申请商品授权"
        onCancel={() => setApplyRow(null)}
        footer={null}
        destroyOnHidden
      >
        <Typography.Paragraph>
          确认申请授权商品“{applyRow?.spuName} / {applyRow?.skuName}”？
        </Typography.Paragraph>
        <Button type="primary" block loading={applyLoading} onClick={() => void handleApplyAuthorization()}>
          提交授权申请
        </Button>
      </Modal>

      <Modal
        open={Boolean(viewingRow)}
        title="商品详情"
        onCancel={() => setViewingRow(null)}
        footer={null}
        destroyOnHidden
      >
        {viewingRow ? (
          <Space direction="vertical" size={12} style={{ width: '100%' }}>
            {viewingRow.mainImageId ? (
              <Image
                src={`/api/files/${viewingRow.mainImageId}`}
                width={128}
                height={128}
                style={{ objectFit: 'cover', borderRadius: 8 }}
              />
            ) : null}
            <Typography.Text strong>{viewingRow.spuName}</Typography.Text>
            <Typography.Text>供应商：{viewingRow.supplierName}</Typography.Text>
            <Typography.Text>规格名称：{viewingRow.skuName}</Typography.Text>
            <Typography.Text>规格：{viewingRow.specText}</Typography.Text>
            <Typography.Text>供应商库存：{viewingRow.stockQty}</Typography.Text>
            <Typography.Text>分配库存：{viewingRow.allocatedStockQty ?? 0}</Typography.Text>
            <Typography.Text>基础价：{formatCurrency(viewingRow.basePrice)}</Typography.Text>
            <Typography.Text>授权供货价：{formatCurrency(viewingRow.authorizedPrice)}</Typography.Text>
            <Typography.Text>合作状态：{viewingRow.relationStatus}</Typography.Text>
            <Typography.Text>授权状态：{viewingRow.authStatus}</Typography.Text>
            <Typography.Text>更新时间：{viewingRow.updatedAt}</Typography.Text>
            {viewingRow.remark ? <Typography.Text>备注：{viewingRow.remark}</Typography.Text> : null}
          </Space>
        ) : null}
      </Modal>
    </>
  )
}

export default MerchantSupplyCatalogPage
