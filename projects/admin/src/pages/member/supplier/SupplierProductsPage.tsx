import { DeleteOutlined, EditOutlined, EyeOutlined, PlusOutlined, UploadOutlined } from '@ant-design/icons'
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
  Typography,
  Upload,
  message,
} from 'antd'
import { useEffect, useMemo, useState, useCallback } from 'react'
import {
  createSupplierProduct,
  deleteSupplierProduct,
  fetchSupplierProductOptions,
  fetchSupplierProducts,
  updateSupplierProduct,
} from '../../../services/ant-design-pro/supplier'
import { uploadAttachment } from '../../../services/ant-design-pro/file'
import { ListSearchToolbar } from '../../../components/ListSearchToolbar'

interface SupplierProductRow {
  id: string
  spuId: number
  skuId: number
  brandId: number
  categoryId: number
  brandName: string
  categoryName: string
  spuName: string
  skuName: string
  specText: string
  mainImageId?: number
  imageIds?: string
  keywords?: string
  detailContent?: string
  description?: string
  basePrice: number
  stockQty: number
  safetyStock: number
  updatedAt: string
}

interface OptionItem {
  value: number
  label: string
  parentId?: number
  levelNo?: number
}

interface SupplierProductFormValues {
  brandId: number
  categoryId: number | number[]
  spuName: string
  skuName: string
  specText: string
  basePrice: number
  description?: string
  keywords?: string
  detailContent?: string
  stockQty: number
  safetyStock: number
}

const currencyFormatter = new Intl.NumberFormat('zh-CN', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
})

function formatCurrency(value: number) {
  return `¥${currencyFormatter.format(value ?? 0)}`
}

function matchesKeyword(row: SupplierProductRow, keyword: string) {
  const normalizedKeyword = keyword.trim().toLowerCase()
  if (!normalizedKeyword) {
    return true
  }

  return [
    row.spuName,
    row.skuName,
    row.brandName,
    row.categoryName,
    row.specText,
    row.description ?? '',
    row.keywords ?? '',
  ].some((field) => field.toLowerCase().includes(normalizedKeyword))
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

export function SupplierProductsPage() {
  const [form] = Form.useForm<SupplierProductFormValues>()
  const [products, setProducts] = useState<SupplierProductRow[]>([])
  const [brandOptions, setBrandOptions] = useState<OptionItem[]>([])
  const [categoryOptions, setCategoryOptions] = useState<OptionItem[]>([])
  const [loading, setLoading] = useState(false)
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 })
  const [saving, setSaving] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [keyword, setKeyword] = useState('')
  const [brandFilter, setBrandFilter] = useState<number | null>(null)
  const [categoryFilter, setCategoryFilter] = useState<number | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingRow, setEditingRow] = useState<SupplierProductRow | null>(null)
  const [viewingRow, setViewingRow] = useState<SupplierProductRow | null>(null)
  const [mainImageId, setMainImageId] = useState<number | null>(null)

  const filteredProducts = useMemo(() => {
    let list = products
    if (brandFilter !== null) list = list.filter((item) => Number(item.brandId) === brandFilter)
    if (categoryFilter !== null) list = list.filter((item) => Number(item.categoryId) === categoryFilter)
    const kw = keyword.trim().toLowerCase()
    if (kw) list = list.filter((item) => matchesKeyword(item, keyword))
    return list
  }, [products, brandFilter, categoryFilter, keyword])

  useEffect(() => {
    void loadData(1, pagination.pageSize)
  }, [])

  async function loadData(page = 1, pageSize = 10) {
    try {
      setLoading(true)
      const [productResult, optionResult] = await Promise.all([
        fetchSupplierProducts({ page, pageSize }),
        fetchSupplierProductOptions(),
      ])
      setProducts((productResult?.list ?? []) as SupplierProductRow[])
      setPagination((prev) => ({ ...prev, current: page, pageSize, total: productResult?.total || 0 }))
      setBrandOptions(
        ((optionResult?.brands as Array<{ value: string; label: string }> | undefined) ?? []).map((item) => ({
          value: Number(item.value),
          label: item.label,
        })),
      )
      setCategoryOptions(
        (
          (optionResult?.categories as
            | Array<{ value: string; label: string; parentId?: number; levelNo?: number }>
            | undefined) ?? []
        ).map((item) => ({
          value: Number(item.value),
          label: item.label,
          parentId: item.parentId,
          levelNo: item.levelNo,
        })),
      )
    } catch (error) {
      console.error('加载供应商商品失败:', error)
      setProducts([])
      setBrandOptions([])
      setCategoryOptions([])
      setPagination((prev) => ({ ...prev, current: page, pageSize, total: 0 }))
      message.error('加载商品档案失败')
    } finally {
      setLoading(false)
    }
  }

  const cascaderTree = useMemo(() => {
    const map = new Map<string, { value: number; label: string; children: any[] }>()
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
    (targetValue: number): number[] => {
      const map = new Map<number, OptionItem>()
      categoryOptions.forEach((item) => map.set(item.value, item))
      const path: number[] = []
      let cur = map.get(targetValue)
      while (cur) {
        path.unshift(cur.value)
        cur = cur.parentId ? map.get(cur.parentId) : undefined
      }
      return path
    },
    [categoryOptions],
  )

  function openCreateModal() {
    setEditingRow(null)
    setMainImageId(null)
    form.resetFields()
    form.setFieldsValue({ stockQty: 0, safetyStock: 0 })
    setModalOpen(true)
  }

  function openEditModal(row: SupplierProductRow) {
    setEditingRow(row)
    setMainImageId(row.mainImageId ?? null)
    form.setFieldsValue({
      brandId: Number(row.brandId),
      categoryId: findCascaderPath(Number(row.categoryId)),
      spuName: row.spuName,
      skuName: row.skuName,
      specText: row.specText,
      basePrice: Number(row.basePrice),
      stockQty: Number(row.stockQty ?? 0),
      safetyStock: Number(row.safetyStock ?? 0),
      description: row.description,
      keywords: row.keywords,
      detailContent: row.detailContent,
    })
    setModalOpen(true)
  }

  async function handleSubmit(values: SupplierProductFormValues) {
    setSaving(true)
    try {
      const catIdArr = values.categoryId
      const categoryId = Array.isArray(catIdArr) ? Number((catIdArr as any)[catIdArr.length - 1]) : Number(catIdArr)
      const payload = {
        ...values,
        categoryId,
        mainImageId: mainImageId ?? undefined,
      }

      if (editingRow) {
        await updateSupplierProduct(editingRow.skuId.toString(), payload)
        message.success('商品档案已更新')
      } else {
        await createSupplierProduct(payload)
        message.success('商品档案已创建')
      }

      setModalOpen(false)
      setEditingRow(null)
      setMainImageId(null)
      form.resetFields()
      await loadData(pagination.current, pagination.pageSize)
    } catch (error) {
      message.error(getErrorMessage(error))
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(row: SupplierProductRow) {
    try {
      await deleteSupplierProduct(row.skuId.toString())
      message.success('商品档案已删除')
      await loadData(pagination.current, pagination.pageSize)
    } catch (error) {
      message.error(getErrorMessage(error))
    }
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

  const handleReset = () => {
    setKeyword('')
    setBrandFilter(null)
    setCategoryFilter(null)
    loadData(1, pagination.pageSize)
  }

  const handleSearch = () => {
    setPagination((prev) => ({ ...prev, current: 1 }))
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
            width={40}
            height={40}
            style={{ borderRadius: 4, objectFit: 'cover' }}
            preview={false}
          />
        ) : (
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 4,
              background: '#f5f5f5',
              color: '#bfbfbf',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            无图
          </div>
        ),
    },
    { title: '商品名称', dataIndex: 'spuName', width: 180 },
    { title: '规格名称', dataIndex: 'skuName', width: 180 },
    { title: '品牌', dataIndex: 'brandName', width: 140 },
    { title: '分类', dataIndex: 'categoryName', width: 140 },
    { title: '规格描述', dataIndex: 'specText', width: 220 },
    {
      title: '基础价',
      dataIndex: 'basePrice',
      width: 120,
      render: (value: number) => formatCurrency(value),
    },
    { title: '库存', dataIndex: 'stockQty', width: 80 },
    { title: '安全库存', dataIndex: 'safetyStock', width: 90 },
    { title: '更新时间', dataIndex: 'updatedAt', width: 160 },
    {
      title: '操作',
      key: 'action',
      width: 220,
      render: (_: unknown, row: SupplierProductRow) => (
        <Space size={0} wrap>
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => setViewingRow(row)}>
            查看
          </Button>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => openEditModal(row)}>
            编辑
          </Button>
          <Popconfirm
            title="确认删除这个商品档案？"
            okText="删除"
            cancelText="取消"
            onConfirm={() => void handleDelete(row)}
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  const advancedFilter = (
    <>
      <Select
        size="small"
        placeholder="品牌"
        value={brandFilter}
        onChange={setBrandFilter}
        allowClear
        options={brandOptions.map((b) => ({ value: b.value, label: b.label }))}
        style={{ width: 140 }}
      />
      <Select
        size="small"
        placeholder="分类"
        value={categoryFilter}
        onChange={setCategoryFilter}
        allowClear
        options={categoryOptions.map((c) => ({ value: c.value, label: c.label }))}
        style={{ width: 140 }}
      />
    </>
  )

  return (
    <>
      <Card size="small" styles={{ body: { padding: '8px 12px' } }}>
        <Space direction="vertical" size={8} style={{ width: '100%' }}>
          <ListSearchToolbar
            searchPlaceholder="搜索商品、规格、品牌、分类"
            keyword={keyword}
            onKeywordChange={setKeyword}
            onSearch={handleSearch}
            onReset={handleReset}
            advancedFilter={advancedFilter}
            resultCount={filteredProducts.length}
            extraActions={
              <Button type="primary" size="small" icon={<PlusOutlined />} onClick={openCreateModal}>
                新增商品
              </Button>
            }
          />

          <Table
            dataSource={filteredProducts}
            columns={columns}
            rowKey="id"
            loading={loading}
            size="small"
            scroll={{ x: 1380, y: 'calc(100vh - 280px)' }}
            pagination={{
              ...pagination,
              showSizeChanger: true,
              pageSizeOptions: [10, 20, 50, 100],
              showTotal: (t) => `共 ${t} 条`,
              onChange: (page, pageSize) => loadData(page, pageSize),
              size: 'small',
            }}
            locale={{ emptyText: <Empty description="暂无商品档案" /> }}
          />
        </Space>
      </Card>

      <Modal
        open={modalOpen}
        title={editingRow ? '编辑商品档案' : '新增商品档案'}
        onCancel={() => {
          setModalOpen(false)
          setEditingRow(null)
          setMainImageId(null)
          form.resetFields()
        }}
        footer={null}
        destroyOnHidden
      >
        <Form<SupplierProductFormValues> form={form} layout="vertical" onFinish={(values) => void handleSubmit(values)}>
          <Form.Item label="商品主图">
            <Space align="start" wrap>
              {mainImageId ? (
                <div style={{ position: 'relative' }}>
                  <Image
                    src={`/api/files/${mainImageId}`}
                    width={96}
                    height={96}
                    style={{ objectFit: 'cover', borderRadius: 8 }}
                    preview={false}
                  />
                  <Button
                    type="text"
                    danger
                    size="small"
                    style={{ position: 'absolute', right: 0, top: 0 }}
                    onClick={() => setMainImageId(null)}
                  >
                    删除
                  </Button>
                </div>
              ) : null}
              <Upload accept="image/*" showUploadList={false} beforeUpload={handleMainImageUpload}>
                <Button icon={<UploadOutlined />} loading={uploadingImage}>
                  上传主图
                </Button>
              </Upload>
            </Space>
          </Form.Item>

          <Form.Item label="品牌" name="brandId" rules={[{ required: true, message: '请选择品牌' }]}>
            <Select options={brandOptions} />
          </Form.Item>
          <Form.Item label="分类" name="categoryId" rules={[{ required: true, message: '请选择分类' }]}>
            <Cascader
              options={cascaderTree}
              placeholder="选择分类"
              showSearch
              fieldNames={{ value: 'value', label: 'label', children: 'children' }}
            />
          </Form.Item>
          <Form.Item label="商品名称" name="spuName" rules={[{ required: true, message: '请输入商品名称' }]}>
            <Input />
          </Form.Item>
          <Form.Item label="规格名称" name="skuName" rules={[{ required: true, message: '请输入规格名称' }]}>
            <Input />
          </Form.Item>
          <Form.Item label="规格描述" name="specText" rules={[{ required: true, message: '请输入规格描述' }]}>
            <Input />
          </Form.Item>
          <Form.Item label="基础价" name="basePrice" rules={[{ required: true, message: '请输入基础价' }]}>
            <InputNumber min={0} precision={2} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="库存数量" name="stockQty" rules={[{ required: true, message: '请输入库存数量' }]}>
            <InputNumber min={0} precision={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="安全库存" name="safetyStock" rules={[{ required: true, message: '请输入安全库存' }]}>
            <InputNumber min={0} precision={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="关键词" name="keywords">
            <Input placeholder="多个关键词可用逗号分隔" />
          </Form.Item>
          <Form.Item label="详细描述" name="detailContent">
            <Input.TextArea rows={4} />
          </Form.Item>
          <Form.Item label="商品说明" name="description">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Button htmlType="submit" type="primary" block loading={saving}>
            {editingRow ? '保存修改' : '创建商品'}
          </Button>
        </Form>
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
            <Typography.Text>规格名称：{viewingRow.skuName}</Typography.Text>
            <Typography.Text>品牌：{viewingRow.brandName}</Typography.Text>
            <Typography.Text>分类：{viewingRow.categoryName}</Typography.Text>
            <Typography.Text>规格描述：{viewingRow.specText}</Typography.Text>
            <Typography.Text>基础价：{formatCurrency(viewingRow.basePrice)}</Typography.Text>
            <Typography.Text>库存：{viewingRow.stockQty ?? 0}</Typography.Text>
            <Typography.Text>安全库存：{viewingRow.safetyStock ?? 0}</Typography.Text>
            <Typography.Text>更新时间：{viewingRow.updatedAt}</Typography.Text>
            {viewingRow.keywords ? <Typography.Text>关键词：{viewingRow.keywords}</Typography.Text> : null}
            {viewingRow.detailContent ? <Typography.Text>详细描述：{viewingRow.detailContent}</Typography.Text> : null}
            {viewingRow.description ? <Typography.Text>商品说明：{viewingRow.description}</Typography.Text> : null}
          </Space>
        ) : null}
      </Modal>
    </>
  )
}

export default SupplierProductsPage
