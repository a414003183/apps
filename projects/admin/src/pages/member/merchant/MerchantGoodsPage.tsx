import {
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  InboxOutlined,
  PlusOutlined,
  ReloadOutlined,
  ShopOutlined,
  UploadOutlined,
} from '@ant-design/icons'
import {
  Button,
  Card,
  Cascader,
  Empty,
  Form,
  Image,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  Upload,
  message,
} from 'antd'
import { useEffect, useMemo, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  createMerchantProduct,
  deleteMerchantGoods,
  fetchMerchantGoods,
  updateMerchantGoods,
} from '../../../services/ant-design-pro/merchant'
import { uploadAttachment } from '../../../services/ant-design-pro/file'
import { hasPermission } from '../../../utils/auth'
import { request } from '@umijs/max'

interface MerchantGoodsRow {
  id: string
  merchantGoodsId: number
  skuId: number
  supplierId?: number
  supplierName?: string
  sourceType: string
  cooperationStatus: string
  authorizationStatus: string
  spuName: string
  skuName: string
  brandName: string
  categoryName: string
  specText: string
  mainImageId?: number
  salePrice: number
  costPrice?: number | null
  rebateRate?: number
  saleStatus: string
  saleCount?: number
  stockQty?: number
  safetyStock?: number
  supplierStockQty?: number
  updatedAt: string
  keywords?: string
  detailContent?: string
  description?: string
  deliveryMode?: string
}

const currencyFormatter = new Intl.NumberFormat('zh-CN', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
})

function formatCurrency(value: number | string | null | undefined) {
  return `¥${currencyFormatter.format(Number(value ?? 0))}`
}

function getSourceTag(sourceType?: string) {
  if (sourceType === 'SUPPLIER_AUTH') return <Tag color="blue">供应商授权</Tag>
  if (sourceType === 'DIRECT') return <Tag color="orange">自建商品</Tag>
  return <Tag>{sourceType || '-'}</Tag>
}

function getSaleStatusTag(status?: string) {
  if (status === 'ON') return <Tag color="green">上架</Tag>
  if (status === 'OFF') return <Tag color="default">下架</Tag>
  return <Tag>{status || '-'}</Tag>
}

function getDeliveryModeTag(mode?: string) {
  if (mode === 'SPOT') return <Tag color="green">现货</Tag>
  if (mode === 'PROJECT') return <Tag color="orange">项目交付</Tag>
  return <Tag>{mode || '现货'}</Tag>
}

function matchesKeyword(row: MerchantGoodsRow, keyword: string) {
  const k = keyword.trim().toLowerCase()
  if (!k) return true
  return [
    row.spuName,
    row.skuName,
    row.brandName,
    row.categoryName,
    row.specText,
    row.supplierName ?? '',
    row.keywords ?? '',
  ].some((f) => f.toLowerCase().includes(k))
}

function getErrorMessage(error: unknown) {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const msg = (error as any).response?.data?.message
    if (typeof msg === 'string') return msg
  }
  return error instanceof Error ? error.message : '操作失败'
}

export function MerchantGoodsPage() {
  const [goods, setGoods] = useState<MerchantGoodsRow[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [keyword, setKeyword] = useState('')
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ON' | 'OFF'>('ALL')
  const [sourceFilter, setSourceFilter] = useState<'ALL' | 'SUPPLIER_AUTH' | 'DIRECT'>('ALL')
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const [batchLoading, setBatchLoading] = useState(false)
  const [pagination, setPagination] = useState({ current: 1, pageSize: 15, total: 0 })

  // Modal states
  const [editingRow, setEditingRow] = useState<MerchantGoodsRow | null>(null)
  const [viewingRow, setViewingRow] = useState<MerchantGoodsRow | null>(null)
  const [stockRow, setStockRow] = useState<MerchantGoodsRow | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [mainImageId, setMainImageId] = useState<number | null>(null)
  const [uploadingImage, setUploadingImage] = useState(false)

  const [editForm] = Form.useForm()
  const [stockForm] = Form.useForm()
  const [createForm] = Form.useForm()

  // Options for create form
  const [brandOptions, setBrandOptions] = useState<{ value: string; label: string }[]>([])
  const [categoryOptions, setCategoryOptions] = useState<
    { value: string; label: string; parentId?: number; levelNo?: number }[]
  >([])

  const cascaderTree = useMemo(() => {
    const map = new Map<string, { value: string; label: string; children: any[] }>()
    categoryOptions.forEach((item) => {
      map.set(String(item.value), { value: item.value, label: item.label, children: [] })
    })
    const roots: any[] = []
    categoryOptions.forEach((item) => {
      const node = map.get(String(item.value))!
      if (item.parentId && map.has(String(item.parentId))) {
        map.get(String(item.parentId))!.children.push(node)
      } else {
        roots.push(node)
      }
    })
    const cleanup = (nodes: any[]) =>
      nodes.forEach((n) => {
        if (n.children.length === 0) delete n.children
        else cleanup(n.children)
      })
    cleanup(roots)
    return roots
  }, [categoryOptions])

  const findCascaderPath = useCallback(
    (targetValue: string | number): string[] => {
      const map = new Map<string, { value: string; parentId?: number }>()
      categoryOptions.forEach((item) => map.set(String(item.value), { value: item.value, parentId: item.parentId }))
      const path: string[] = []
      let cur = map.get(String(targetValue))
      while (cur) {
        path.unshift(cur.value)
        cur = cur.parentId ? map.get(String(cur.parentId)) : undefined
      }
      return path
    },
    [categoryOptions],
  )

  const canEdit = hasPermission('merchant:goods:edit')

  const filteredGoods = useMemo(() => {
    return goods.filter((row) => {
      const matchSource = sourceFilter === 'ALL' || row.sourceType === sourceFilter
      return matchSource && matchesKeyword(row, keyword)
    })
  }, [goods, keyword, sourceFilter])

  const onSaleCount = goods.filter((r) => r.saleStatus === 'ON').length
  const offSaleCount = goods.filter((r) => r.saleStatus === 'OFF').length
  const directCount = goods.filter((r) => r.sourceType === 'DIRECT').length

  useEffect(() => {
    void loadData(1, pagination.pageSize)
  }, [])

  async function loadData(page = 1, pageSize = 15) {
    try {
      setLoading(true)
      const result = await fetchMerchantGoods({ page, pageSize })
      setGoods((result?.list ?? []) as MerchantGoodsRow[])
      setPagination((prev) => ({ ...prev, current: page, pageSize, total: result?.total || 0 }))
    } catch {
      setGoods([])
      message.error('加载商品失败')
    } finally {
      setLoading(false)
    }
  }

  async function loadOptions() {
    try {
      const res = await request<any>('/api/member/merchant/goods/options', { method: 'GET' })
      setBrandOptions(res?.data?.brands ?? [])
      setCategoryOptions(res?.data?.categories ?? [])
    } catch {
      /* ignore */
    }
  }

  // === Edit Modal (different fields by sourceType) ===
  function openEditModal(row: MerchantGoodsRow) {
    if (!canEdit) return
    setEditingRow(row)
    setMainImageId(row.mainImageId ?? null)
    if (row.sourceType === 'DIRECT') {
      editForm.setFieldsValue({
        salePrice: Number(row.salePrice ?? 0),
        saleStatus: row.saleStatus || 'OFF',
        deliveryMode: row.deliveryMode || 'SPOT',
        keywords: row.keywords || '',
        detailContent: row.detailContent || '',
        description: row.description || '',
      })
    } else {
      editForm.setFieldsValue({
        salePrice: Number(row.salePrice ?? 0),
        saleStatus: row.saleStatus || 'OFF',
        deliveryMode: row.deliveryMode || 'SPOT',
      })
    }
  }

  async function handleUpdate(values: any) {
    if (!editingRow) return
    setSaving(true)
    try {
      const payload: any = {
        salePrice: values.salePrice,
        rebateRate: Number(editingRow.rebateRate ?? 0),
        saleStatus: values.saleStatus,
        deliveryMode: values.deliveryMode,
      }
      if (editingRow.sourceType === 'DIRECT') {
        payload.keywords = values.keywords
        payload.detailContent = values.detailContent
        payload.description = values.description
        payload.mainImageId = mainImageId ?? undefined
      }
      await updateMerchantGoods(editingRow.id, payload)
      message.success('商品已更新')
      setEditingRow(null)
      editForm.resetFields()
      await loadData(pagination.current, pagination.pageSize)
    } catch (error) {
      message.error(getErrorMessage(error))
    } finally {
      setSaving(false)
    }
  }

  // === Stock Modal (with confirmation) ===
  function openStockModal(row: MerchantGoodsRow) {
    if (!canEdit) return
    setStockRow(row)
    stockForm.setFieldsValue({
      stockQty: Number(row.stockQty ?? 0),
      safetyStock: Number(row.safetyStock ?? 0),
    })
  }

  async function handleStockUpdate() {
    if (!stockRow) return
    const values = await stockForm.validateFields()
    Modal.confirm({
      title: '确认修改库存',
      content: (
        <div>
          <p>
            商品：<strong>{stockRow.spuName}</strong>
          </p>
          <p>
            当前库存：{Number(stockRow.stockQty ?? 0)} → 新库存：<strong>{values.stockQty}</strong>
          </p>
          <p>
            安全库存：{Number(stockRow.safetyStock ?? 0)} → 新安全库存：<strong>{values.safetyStock}</strong>
          </p>
          <p style={{ color: '#ff4d4f', marginTop: 8 }}>请确认以上修改，提交后将立即生效。</p>
        </div>
      ),
      okText: '确认修改',
      cancelText: '取消',
      onOk: async () => {
        setSaving(true)
        try {
          await updateMerchantGoods(stockRow.id, {
            salePrice: Number(stockRow.salePrice ?? 0),
            rebateRate: Number(stockRow.rebateRate ?? 0),
            saleStatus: stockRow.saleStatus,
            stockQty: values.stockQty,
            safetyStock: values.safetyStock,
          })
          message.success('库存已更新')
          setStockRow(null)
          stockForm.resetFields()
          await loadData(pagination.current, pagination.pageSize)
        } catch (error) {
          message.error(getErrorMessage(error))
        } finally {
          setSaving(false)
        }
      },
    })
  }

  // === Toggle sale status ===
  async function handleToggleSaleStatus(row: MerchantGoodsRow) {
    const nextStatus = row.saleStatus === 'ON' ? 'OFF' : 'ON'
    try {
      await updateMerchantGoods(row.id, {
        salePrice: Number(row.salePrice ?? 0),
        rebateRate: Number(row.rebateRate ?? 0),
        saleStatus: nextStatus,
      })
      message.success(nextStatus === 'ON' ? '商品已上架' : '商品已下架')
      await loadData(pagination.current, pagination.pageSize)
    } catch (error) {
      message.error(getErrorMessage(error))
    }
  }

  // === Delete ===
  async function handleDelete(row: MerchantGoodsRow) {
    try {
      await deleteMerchantGoods(row.id)
      message.success('商品已删除')
      await loadData(pagination.current, pagination.pageSize)
    } catch (error) {
      message.error(getErrorMessage(error))
    }
  }

  // === Batch operations ===
  const selectedRows = useMemo(() => goods.filter((r) => selectedRowKeys.includes(r.id)), [goods, selectedRowKeys])

  async function handleBatchSaleStatus(targetStatus: 'ON' | 'OFF') {
    const label = targetStatus === 'ON' ? '上架' : '下架'
    const targets = selectedRows.filter((r) => r.saleStatus !== targetStatus)
    if (targets.length === 0) {
      message.info(`选中的商品已全部是${label}状态`)
      return
    }
    Modal.confirm({
      title: `批量${label}`,
      content: `确认将选中的 ${targets.length} 件商品${label}？`,
      okText: '确认',
      cancelText: '取消',
      onOk: async () => {
        setBatchLoading(true)
        let successCount = 0
        let failCount = 0
        for (const row of targets) {
          try {
            await updateMerchantGoods(row.id, {
              salePrice: Number(row.salePrice ?? 0),
              rebateRate: Number(row.rebateRate ?? 0),
              saleStatus: targetStatus,
            })
            successCount++
          } catch {
            failCount++
          }
        }
        setBatchLoading(false)
        setSelectedRowKeys([])
        message.success(`批量${label}完成：成功 ${successCount} 件${failCount > 0 ? `，失败 ${failCount} 件` : ''}`)
        await loadData(pagination.current, pagination.pageSize)
      },
    })
  }

  async function handleBatchDeliveryMode(targetMode: 'SPOT' | 'PROJECT') {
    const label = targetMode === 'SPOT' ? '现货' : '项目交付'
    const targets = selectedRows.filter((r) => r.deliveryMode !== targetMode)
    if (targets.length === 0) {
      message.info(`选中的商品已全部是「${label}」模式`)
      return
    }
    Modal.confirm({
      title: '批量设置交付方式',
      content: `确认将选中的 ${targets.length} 件商品交付方式设为「${label}」？`,
      okText: '确认',
      cancelText: '取消',
      onOk: async () => {
        setBatchLoading(true)
        let successCount = 0
        let failCount = 0
        for (const row of targets) {
          try {
            await updateMerchantGoods(row.id, {
              salePrice: Number(row.salePrice ?? 0),
              rebateRate: Number(row.rebateRate ?? 0),
              saleStatus: row.saleStatus,
              deliveryMode: targetMode,
            })
            successCount++
          } catch {
            failCount++
          }
        }
        setBatchLoading(false)
        setSelectedRowKeys([])
        message.success(`批量设置完成：成功 ${successCount} 件${failCount > 0 ? `，失败 ${failCount} 件` : ''}`)
        await loadData(pagination.current, pagination.pageSize)
      },
    })
  }

  async function handleBatchDelete() {
    if (selectedRows.length === 0) return
    Modal.confirm({
      title: '批量删除',
      content: (
        <div>
          <p>
            确认删除选中的 <strong>{selectedRows.length}</strong> 件商品？
          </p>
          <p style={{ color: '#ff4d4f' }}>删除后不可恢复，请谨慎操作。</p>
        </div>
      ),
      okText: '确认删除',
      okButtonProps: { danger: true },
      cancelText: '取消',
      onOk: async () => {
        setBatchLoading(true)
        let successCount = 0
        let failCount = 0
        for (const row of selectedRows) {
          try {
            await deleteMerchantGoods(row.id)
            successCount++
          } catch {
            failCount++
          }
        }
        setBatchLoading(false)
        setSelectedRowKeys([])
        message.success(`批量删除完成：成功 ${successCount} 件${failCount > 0 ? `，失败 ${failCount} 件` : ''}`)
        await loadData(pagination.current, pagination.pageSize)
      },
    })
  }

  // === Create product ===
  function openCreateModal() {
    setShowCreateModal(true)
    void loadOptions()
    createForm.resetFields()
    createForm.setFieldsValue({ saleStatus: 'OFF', stockQty: 0, safetyStock: 0, deliveryMode: 'SPOT' })
    setMainImageId(null)
  }

  async function handleMainImageUpload(file: File) {
    setUploadingImage(true)
    try {
      const uploaded = await uploadAttachment(file, 'PRODUCT_IMAGE')
      setMainImageId(Number(uploaded.id))
      message.success('主图上传成功')
    } catch (error) {
      message.error(getErrorMessage(error))
    } finally {
      setUploadingImage(false)
    }
    return false
  }

  async function handleCreate(values: any) {
    setSaving(true)
    try {
      const catIdArr = values.categoryId
      const categoryId = Array.isArray(catIdArr) ? Number(catIdArr[catIdArr.length - 1]) : Number(catIdArr)
      await createMerchantProduct({
        brandId: Number(values.brandId),
        categoryId,
        spuName: values.spuName,
        skuName: values.skuName,
        specText: values.specText,
        salePrice: values.salePrice,
        stockQty: values.stockQty,
        safetyStock: values.safetyStock,
        freightAmount: values.freightAmount,
        description: values.description,
        keywords: values.keywords,
        saleStatus: values.saleStatus,
        deliveryMode: values.deliveryMode,
        mainImageId: mainImageId ?? undefined,
      })
      message.success('商品创建成功')
      setShowCreateModal(false)
      createForm.resetFields()
      await loadData(pagination.current, pagination.pageSize)
    } catch (error) {
      message.error(getErrorMessage(error))
    } finally {
      setSaving(false)
    }
  }

  const columns = [
    {
      title: '主图',
      dataIndex: 'mainImageId',
      width: 72,
      render: (imageId?: number) =>
        imageId ? (
          <Image
            src={`/api/files/${imageId}`}
            width={44}
            height={44}
            style={{ borderRadius: 4, objectFit: 'cover' }}
            preview={false}
          />
        ) : (
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 4,
              background: '#f5f5f5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#bfbfbf',
            }}
          >
            <ShopOutlined />
          </div>
        ),
    },
    {
      title: '商品',
      key: 'product',
      width: 200,
      render: (_: unknown, row: MerchantGoodsRow) => (
        <div>
          <Typography.Text strong style={{ fontSize: 13 }}>
            {row.spuName || '-'}
          </Typography.Text>
          <br />
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            {row.skuName || '-'}
          </Typography.Text>
        </div>
      ),
    },
    { title: '品牌', dataIndex: 'brandName', width: 100, ellipsis: true },
    { title: '分类', dataIndex: 'categoryName', width: 100, ellipsis: true },
    { title: '规格', dataIndex: 'specText', width: 120, ellipsis: true },
    {
      title: '来源',
      dataIndex: 'sourceType',
      width: 100,
      render: (v: string) => getSourceTag(v),
    },
    {
      title: '库存',
      key: 'stock',
      width: 80,
      render: (_: unknown, row: MerchantGoodsRow) => {
        const qty = Number(row.stockQty ?? 0)
        const safety = Number(row.safetyStock ?? 0)
        return (
          <span style={{ color: qty > 0 && qty <= safety ? '#faad14' : qty === 0 ? '#ff4d4f' : undefined }}>{qty}</span>
        )
      },
    },
    {
      title: '销售价',
      dataIndex: 'salePrice',
      width: 90,
      render: (v: number) => formatCurrency(v),
    },
    {
      title: '交付方式',
      dataIndex: 'deliveryMode',
      width: 90,
      render: (v: string) => getDeliveryModeTag(v),
    },
    {
      title: '状态',
      dataIndex: 'saleStatus',
      width: 70,
      render: (v: string) => getSaleStatusTag(v),
    },
    { title: '更新', dataIndex: 'updatedAt', width: 120, ellipsis: true },
    {
      title: '操作',
      key: 'action',
      width: 220,
      fixed: 'right' as const,
      render: (_: unknown, row: MerchantGoodsRow) => (
        <Space size={0} wrap>
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => setViewingRow(row)}>
            查看
          </Button>
          {canEdit && (
            <Button type="link" size="small" icon={<EditOutlined />} onClick={() => openEditModal(row)}>
              {row.sourceType === 'DIRECT' ? '编辑' : '调价'}
            </Button>
          )}
          {canEdit && row.sourceType === 'DIRECT' && (
            <Button type="link" size="small" icon={<InboxOutlined />} onClick={() => openStockModal(row)}>
              库存
            </Button>
          )}
          {canEdit && row.sourceType === 'SUPPLIER_AUTH' && (
            <Button type="link" size="small" icon={<InboxOutlined />} disabled title="供应商授权商品，库存由供应商管理">
              库存
            </Button>
          )}
          {canEdit && (
            <Button type="link" size="small" onClick={() => void handleToggleSaleStatus(row)}>
              {row.saleStatus === 'ON' ? '下架' : '上架'}
            </Button>
          )}
          {canEdit && (
            <Popconfirm
              title="确认删除该商品？"
              description="删除后不可恢复。"
              okText="删除"
              cancelText="取消"
              onConfirm={() => void handleDelete(row)}
            >
              <Button type="link" size="small" danger icon={<DeleteOutlined />}>
                删除
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ]

  return (
    <>
      <Card styles={{ body: { padding: '8px 12px' } }} size="small">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <div>
            <Typography.Title level={5} style={{ margin: 0, fontSize: 14 }}>
              商家商品库
            </Typography.Title>
            <Space size={4} style={{ marginTop: 2 }}>
              <Tag color="green">上架 {onSaleCount}</Tag>
              <Tag>下架 {offSaleCount}</Tag>
              <Tag color="orange">自建 {directCount}</Tag>
              <Tag color="blue">总计 {pagination.total}</Tag>
            </Space>
          </div>
          <Space>
            <Button icon={<ReloadOutlined />} onClick={() => void loadData(pagination.current, pagination.pageSize)}>
              刷新
            </Button>
            <Link to="/member/merchant/supply/catalog">
              <Button>导入供应商商品</Button>
            </Link>
            {canEdit && (
              <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
                新增商品
              </Button>
            )}
          </Space>
        </div>

        <Space style={{ marginBottom: 8 }} size="small">
          <Input.Search
            allowClear
            placeholder="搜索商品名称、规格、品牌"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            style={{ width: 220 }}
            size="small"
          />
          <Select
            value={statusFilter}
            onChange={setStatusFilter}
            style={{ width: 90 }}
            size="small"
            options={[
              { label: '全部状态', value: 'ALL' },
              { label: '上架', value: 'ON' },
              { label: '下架', value: 'OFF' },
            ]}
          />
          <Select
            value={sourceFilter}
            onChange={setSourceFilter}
            style={{ width: 100 }}
            size="small"
            options={[
              { label: '全部来源', value: 'ALL' },
              { label: '供应商授权', value: 'SUPPLIER_AUTH' },
              { label: '自建商品', value: 'DIRECT' },
            ]}
          />
        </Space>

        {/* === Batch Action Bar === */}
        {canEdit && selectedRowKeys.length > 0 && (
          <div
            style={{
              background: '#e6f4ff',
              border: '1px solid #91caff',
              borderRadius: 6,
              padding: '6px 12px',
              marginBottom: 8,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              flexWrap: 'wrap',
            }}
          >
            <Typography.Text strong style={{ fontSize: 13 }}>
              已选 {selectedRowKeys.length} 件
            </Typography.Text>
            <Button size="small" type="primary" loading={batchLoading} onClick={() => void handleBatchSaleStatus('ON')}>
              批量上架
            </Button>
            <Button size="small" loading={batchLoading} onClick={() => void handleBatchSaleStatus('OFF')}>
              批量下架
            </Button>
            <Button size="small" loading={batchLoading} onClick={() => void handleBatchDeliveryMode('SPOT')}>
              设为现货
            </Button>
            <Button size="small" loading={batchLoading} onClick={() => void handleBatchDeliveryMode('PROJECT')}>
              设为项目交付
            </Button>
            <Button size="small" danger loading={batchLoading} onClick={() => void handleBatchDelete()}>
              批量删除
            </Button>
            <Button size="small" type="link" onClick={() => setSelectedRowKeys([])}>
              取消选择
            </Button>
          </div>
        )}

        <Table
          rowKey="id"
          dataSource={filteredGoods}
          columns={columns}
          loading={loading || batchLoading}
          size="small"
          scroll={{ x: 1300, y: 'calc(100vh - 280px)' }}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            pageSizeOptions: [10, 15, 20, 50],
            onChange: (page, pageSize) => loadData(page, pageSize),
            size: 'small',
          }}
          locale={{ emptyText: <Empty description="商品库暂无数据" /> }}
          rowSelection={
            canEdit
              ? {
                  selectedRowKeys,
                  onChange: (keys) => setSelectedRowKeys(keys),
                  preserveSelectedRowKeys: true,
                }
              : undefined
          }
        />
      </Card>

      {/* === Edit Modal === */}
      <Modal
        open={Boolean(editingRow)}
        title={editingRow?.sourceType === 'DIRECT' ? '编辑商品' : '调整价格与状态'}
        onCancel={() => {
          setEditingRow(null)
          editForm.resetFields()
          setMainImageId(null)
        }}
        footer={null}
        destroyOnHidden
        width={520}
      >
        <Form form={editForm} layout="vertical" onFinish={(v) => void handleUpdate(v)}>
          <div style={{ background: '#fafafa', borderRadius: 6, padding: '8px 12px', marginBottom: 12 }}>
            <Typography.Text strong>{editingRow?.spuName}</Typography.Text>
            <Typography.Text type="secondary" style={{ marginLeft: 8 }}>
              {editingRow?.skuName}
            </Typography.Text>
            {editingRow && <div style={{ marginTop: 2 }}>{getSourceTag(editingRow.sourceType)}</div>}
          </div>
          <Form.Item label="销售价" name="salePrice" rules={[{ required: true, message: '请输入销售价' }]}>
            <InputNumber min={0} precision={2} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="交付方式" name="deliveryMode" rules={[{ required: true }]}>
            <Select
              options={[
                { label: '现货', value: 'SPOT' },
                { label: '项目交付', value: 'PROJECT' },
              ]}
            />
          </Form.Item>
          <Form.Item label="销售状态" name="saleStatus" rules={[{ required: true }]}>
            <Select
              options={[
                { label: '上架', value: 'ON' },
                { label: '下架', value: 'OFF' },
              ]}
            />
          </Form.Item>
          {editingRow?.sourceType === 'DIRECT' && (
            <>
              <Form.Item label="主图">
                <Space direction="vertical" size="small">
                  {mainImageId ? (
                    <Image
                      src={`/api/files/${mainImageId}`}
                      width={100}
                      height={100}
                      style={{ objectFit: 'cover', borderRadius: 6 }}
                      preview={false}
                    />
                  ) : (
                    <div
                      style={{
                        width: 100,
                        height: 100,
                        borderRadius: 6,
                        background: '#f5f5f5',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#bfbfbf',
                      }}
                    >
                      <ShopOutlined />
                    </div>
                  )}
                  <Upload accept="image/*" showUploadList={false} beforeUpload={handleMainImageUpload}>
                    <Button icon={<UploadOutlined />} loading={uploadingImage} size="small">
                      {mainImageId ? '更换主图' : '上传主图'}
                    </Button>
                  </Upload>
                </Space>
              </Form.Item>
              <Form.Item label="关键词" name="keywords">
                <Input placeholder="多个关键词用逗号分隔" />
              </Form.Item>
              <Form.Item label="商品说明" name="description">
                <Input.TextArea rows={2} />
              </Form.Item>
              <Form.Item label="详细描述" name="detailContent">
                <Input.TextArea rows={3} />
              </Form.Item>
            </>
          )}
          <Button htmlType="submit" type="primary" block loading={saving}>
            保存
          </Button>
        </Form>
      </Modal>

      {/* === Stock Modal === */}
      <Modal
        open={Boolean(stockRow)}
        title="修改库存"
        onCancel={() => {
          setStockRow(null)
          stockForm.resetFields()
        }}
        footer={null}
        destroyOnHidden
        width={440}
      >
        <Form form={stockForm} layout="vertical">
          <div style={{ background: '#fafafa', borderRadius: 6, padding: '8px 12px', marginBottom: 12 }}>
            <Typography.Text strong>{stockRow?.spuName}</Typography.Text>
            <Typography.Text type="secondary" style={{ marginLeft: 8 }}>
              {stockRow?.skuName}
            </Typography.Text>
          </div>
          <Form.Item label="库存数量" name="stockQty" rules={[{ required: true, message: '请输入库存数量' }]}>
            <InputNumber min={0} precision={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="安全库存" name="safetyStock" rules={[{ required: true, message: '请输入安全库存' }]}>
            <InputNumber min={0} precision={0} style={{ width: '100%' }} />
          </Form.Item>
          <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 12, fontSize: 12 }}>
            * 修改库存需要二次确认，请仔细核对数量后提交
          </Typography.Text>
          <Button type="primary" block loading={saving} onClick={() => void handleStockUpdate()}>
            提交修改
          </Button>
        </Form>
      </Modal>

      {/* === Create Modal === */}
      <Modal
        open={showCreateModal}
        title="新增自建商品"
        onCancel={() => {
          setShowCreateModal(false)
          createForm.resetFields()
          setMainImageId(null)
        }}
        footer={null}
        destroyOnHidden
        width={600}
      >
        <Form form={createForm} layout="vertical" onFinish={(v) => void handleCreate(v)}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
            <Form.Item label="商品名称" name="spuName" rules={[{ required: true, message: '请输入商品名称' }]}>
              <Input placeholder="如: 戴尔显示器P2422H" />
            </Form.Item>
            <Form.Item label="规格名称" name="skuName" rules={[{ required: true, message: '请输入规格' }]}>
              <Input placeholder="如: 24英寸/IPS/FHD" />
            </Form.Item>
            <Form.Item label="品牌" name="brandId" rules={[{ required: true, message: '请选择品牌' }]}>
              <Select placeholder="选择品牌" options={brandOptions} showSearch optionFilterProp="label" />
            </Form.Item>
            <Form.Item label="分类" name="categoryId" rules={[{ required: true, message: '请选择分类' }]}>
              <Cascader
                options={cascaderTree}
                placeholder="选择分类"
                showSearch
                fieldNames={{ value: 'value', label: 'label', children: 'children' }}
              />
            </Form.Item>
            <Form.Item label="规格描述" name="specText" rules={[{ required: true, message: '请输入规格描述' }]}>
              <Input placeholder="如: 24英寸 IPS 1920×1080" />
            </Form.Item>
            <Form.Item label="销售价 (元)" name="salePrice" rules={[{ required: true, message: '请输入销售价' }]}>
              <InputNumber min={0} precision={2} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item label="库存数量" name="stockQty" rules={[{ required: true }]}>
              <InputNumber min={0} precision={0} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item label="安全库存" name="safetyStock" rules={[{ required: true }]}>
              <InputNumber min={0} precision={0} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item label="运费 (元)" name="freightAmount">
              <InputNumber min={0} precision={2} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item label="交付方式" name="deliveryMode">
              <Select
                options={[
                  { label: '现货', value: 'SPOT' },
                  { label: '项目交付', value: 'PROJECT' },
                ]}
              />
            </Form.Item>
            <Form.Item label="销售状态" name="saleStatus">
              <Select
                options={[
                  { label: '上架', value: 'ON' },
                  { label: '下架', value: 'OFF' },
                ]}
              />
            </Form.Item>
          </div>
          <Form.Item label="主图">
            <Space direction="vertical" size="small">
              {mainImageId ? (
                <Image
                  src={`/api/files/${mainImageId}`}
                  width={100}
                  height={100}
                  style={{ objectFit: 'cover', borderRadius: 6 }}
                  preview={false}
                />
              ) : (
                <div
                  style={{
                    width: 100,
                    height: 100,
                    borderRadius: 6,
                    background: '#f5f5f5',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#bfbfbf',
                  }}
                >
                  <ShopOutlined />
                </div>
              )}
              <Upload accept="image/*" showUploadList={false} beforeUpload={handleMainImageUpload}>
                <Button icon={<UploadOutlined />} loading={uploadingImage} size="small">
                  {mainImageId ? '更换主图' : '上传主图'}
                </Button>
              </Upload>
            </Space>
          </Form.Item>
          <Form.Item label="关键词" name="keywords">
            <Input placeholder="多个关键词用逗号分隔" />
          </Form.Item>
          <Form.Item label="商品说明" name="description">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Button htmlType="submit" type="primary" block loading={saving}>
            创建商品
          </Button>
        </Form>
      </Modal>

      {/* === View Modal === */}
      <Modal
        open={Boolean(viewingRow)}
        title="商品详情"
        onCancel={() => setViewingRow(null)}
        footer={null}
        destroyOnHidden
        width={520}
      >
        {viewingRow && (
          <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: '6px 12px', fontSize: 13 }}>
            {viewingRow.mainImageId && (
              <div style={{ gridColumn: '1 / -1', marginBottom: 8 }}>
                <Image
                  src={`/api/files/${viewingRow.mainImageId}`}
                  width={100}
                  height={100}
                  style={{ objectFit: 'cover', borderRadius: 6 }}
                />
              </div>
            )}
            <span style={{ color: '#888' }}>商品名称</span>
            <span>
              <strong>{viewingRow.spuName}</strong>
            </span>
            <span style={{ color: '#888' }}>规格</span>
            <span>{viewingRow.skuName}</span>
            <span style={{ color: '#888' }}>品牌</span>
            <span>{viewingRow.brandName || '-'}</span>
            <span style={{ color: '#888' }}>分类</span>
            <span>{viewingRow.categoryName || '-'}</span>
            <span style={{ color: '#888' }}>规格描述</span>
            <span>{viewingRow.specText || '-'}</span>
            <span style={{ color: '#888' }}>来源</span>
            <span>{getSourceTag(viewingRow.sourceType)}</span>
            <span style={{ color: '#888' }}>供应商</span>
            <span>{viewingRow.supplierName || '-'}</span>
            <span style={{ color: '#888' }}>库存</span>
            <span>{Number(viewingRow.stockQty ?? 0)}</span>
            <span style={{ color: '#888' }}>安全库存</span>
            <span>{Number(viewingRow.safetyStock ?? 0)}</span>
            {viewingRow.sourceType === 'SUPPLIER_AUTH' && (
              <>
                <span style={{ color: '#888' }}>供应库存</span>
                <span>{Number(viewingRow.supplierStockQty ?? 0)}</span>
              </>
            )}
            <span style={{ color: '#888' }}>销售价</span>
            <span>{formatCurrency(viewingRow.salePrice)}</span>
            <span style={{ color: '#888' }}>销量</span>
            <span>{Number(viewingRow.saleCount ?? 0)}</span>
            <span style={{ color: '#888' }}>交付方式</span>
            <span>{getDeliveryModeTag(viewingRow.deliveryMode)}</span>
            <span style={{ color: '#888' }}>销售状态</span>
            <span>{getSaleStatusTag(viewingRow.saleStatus)}</span>
            <span style={{ color: '#888' }}>更新时间</span>
            <span>{viewingRow.updatedAt}</span>
            {viewingRow.keywords && (
              <>
                <span style={{ color: '#888' }}>关键词</span>
                <span>{viewingRow.keywords}</span>
              </>
            )}
            {viewingRow.description && (
              <>
                <span style={{ color: '#888' }}>商品说明</span>
                <span>{viewingRow.description}</span>
              </>
            )}
          </div>
        )}
      </Modal>
    </>
  )
}

export default MerchantGoodsPage
