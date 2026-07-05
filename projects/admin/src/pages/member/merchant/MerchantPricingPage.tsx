import {
  Button,
  Card,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Space,
  Spin,
  Table,
  Tag,
  Typography,
  message,
} from 'antd'
import { useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import {
  fetchCustomerPriceRules,
  fetchGoodsAuthRules,
  fetchLevelDiscountRules,
  fetchPricingOptions,
  saveCustomerPriceRule,
  saveGoodsAuthRule,
  saveLevelDiscountRule,
  updatePricingRuleStatus,
} from '../../../services/ant-design-pro/merchant'
import type { SelectOption } from '../../../types/models'
import { ListSearchToolbar } from '../../../components/ListSearchToolbar'

type PricingMode = 'goodsAuth' | 'level' | 'customer'

interface PricingOptionsPayload {
  brands?: SelectOption[]
  categories?: SelectOption[]
  customers?: SelectOption[]
  skus?: SelectOption[]
  memberLevels?: Array<SelectOption & { upgradeThresholdAmount?: number }>
}

const currencyFormatter = new Intl.NumberFormat('zh-CN', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

function resolveMode(pathname: string): PricingMode {
  if (pathname.includes('/member/merchant/goods/auth')) {
    return 'goodsAuth'
  }
  if (pathname.includes('/member/merchant/pricing/customer')) {
    return 'customer'
  }
  return 'level'
}

function getModeMeta(mode: PricingMode) {
  switch (mode) {
    case 'goodsAuth':
      return {
        title: '商品授权',
        description: '按品牌、分类和商品维护授权范围。',
        modalTitle: '新增授权规则',
      }
    case 'customer':
      return {
        title: '客户专属价',
        description: '为指定客户设置指定商品的专属价格。',
        modalTitle: '新增客户专属价',
      }
    default:
      return {
        title: '会员等级折扣',
        description: '按会员等级和商品分类设置折扣规则。',
        modalTitle: '新增等级折扣',
      }
  }
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

function formatCurrency(value: unknown) {
  return `￥${currencyFormatter.format(Number(value ?? 0))}`
}

function getStatusTag(status?: string) {
  const statusTextMap: Record<string, { text: string; color: string }> = {
    ACTIVE: { text: '生效', color: 'green' },
    ENABLED: { text: '启用', color: 'green' },
    ON: { text: '上架', color: 'green' },
    PENDING: { text: '待审核', color: 'gold' },
    REVOKED: { text: '已撤销', color: 'default' },
    DISABLED: { text: '已禁用', color: 'default' },
    OFF: { text: '下架', color: 'default' },
    ENDED: { text: '已结束', color: 'default' },
    REJECTED: { text: '已拒绝', color: 'red' },
  }
  const item = statusTextMap[status || '']
  if (item) return <Tag color={item.color}>{item.text}</Tag>
  return <Tag>{status || '-'}</Tag>
}

function getAuthTypeLabel(value: unknown) {
  const text = String(value ?? '')
  if (text === 'BRAND') return '品牌'
  if (text === 'CATEGORY') return '分类'
  if (text === 'PRODUCT') return '商品'
  return text || '-'
}

function getMemberLevelLabel(value: unknown) {
  const level = String(value ?? '').toUpperCase()
  if (level === 'NORMAL') return '普通会员'
  if (level === 'GOLD') return '金牌会员'
  if (level === 'PROJECT') return '项目会员'
  return String(value ?? '-')
}

function buildMemberLevelOptions(options: Array<SelectOption & { upgradeThresholdAmount?: number }> | undefined) {
  return (options ?? []).map((option) => ({
    label:
      option.upgradeThresholdAmount === undefined
        ? option.label
        : `${option.label} / 满 ${Number(option.upgradeThresholdAmount).toFixed(2)} 元`,
    value: option.value,
  }))
}

export function MerchantPricingPage() {
  const location = useLocation()
  const mode = resolveMode(location.pathname)
  const meta = getModeMeta(mode)
  const [form] = Form.useForm()
  const [rows, setRows] = useState<Record<string, unknown>[]>([])
  const [options, setOptions] = useState<PricingOptionsPayload>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [open, setOpen] = useState(false)
  const [keyword, setKeyword] = useState('')
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ENABLED' | 'DISABLED' | 'ACTIVE' | 'PENDING' | 'REVOKED'>(
    'ALL',
  )
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 })
  const authType = Form.useWatch('authType', form)
  const levelTargetType = Form.useWatch('targetType', form)

  const brandOptions = options.brands ?? []
  const categoryOptions = options.categories ?? []
  const customerOptions = options.customers ?? []
  const skuOptions = options.skus ?? []
  const memberLevelOptions = useMemo(() => buildMemberLevelOptions(options.memberLevels), [options.memberLevels])

  const targetOptions = useMemo(() => {
    if (authType === 'BRAND') {
      return brandOptions
    }
    if (authType === 'CATEGORY') {
      return categoryOptions
    }
    return skuOptions
  }, [authType, brandOptions, categoryOptions, skuOptions])

  const filteredRows = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase()
    return rows.filter((row) => {
      const currentStatus = String(row.status ?? '')
      const matchesStatus = statusFilter === 'ALL' || currentStatus === statusFilter
      if (!matchesStatus) {
        return false
      }

      if (!normalizedKeyword) {
        return true
      }

      return Object.values(row)
        .map((value) => String(value ?? '').toLowerCase())
        .some((value) => value.includes(normalizedKeyword))
    })
  }, [keyword, rows, statusFilter])

  async function loadData(page = 1, pageSize = 10) {
    try {
      setLoading(true)
      const [optionPayload, rowPayload] = await Promise.all([
        fetchPricingOptions().catch(() => ({})),
        mode === 'goodsAuth'
          ? fetchGoodsAuthRules({ page, pageSize })
          : mode === 'customer'
          ? fetchCustomerPriceRules({ page, pageSize })
          : fetchLevelDiscountRules({ page, pageSize }),
      ])
      setOptions(optionPayload as PricingOptionsPayload)
      const list = rowPayload?.list ?? []
      setRows(Array.isArray(list) ? list : [])
      setPagination((prev) => ({ ...prev, current: page, pageSize, total: rowPayload?.total || 0 }))
    } catch (error) {
      setOptions({})
      setRows([])
      setPagination((prev) => ({ ...prev, current: page, pageSize, total: 0 }))
      message.error(getErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
  }, [mode])

  useEffect(() => {
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keyword, statusFilter])

  useEffect(() => {
    if (levelTargetType) {
      form.resetFields(['targetId'])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [levelTargetType])

  async function handleSubmit(values: Record<string, unknown>) {
    try {
      setSaving(true)
      if (mode === 'goodsAuth') {
        await saveGoodsAuthRule({
          authType: String(values.authType),
          targetId: Number(values.targetId),
          status: 'ENABLED',
          remark: values.remark ? String(values.remark) : undefined,
        })
      } else if (mode === 'customer') {
        await saveCustomerPriceRule({
          customerId: Number(values.customerId),
          skuId: Number(values.skuId),
          specialPrice: Number(values.specialPrice),
          status: 'ENABLED',
          remark: values.remark ? String(values.remark) : undefined,
        })
      } else {
        await saveLevelDiscountRule({
          memberLevel: String(values.memberLevel),
          targetType: String(values.targetType),
          targetId: Number(values.targetId),
          discountRate: Number(values.discountRate),
          status: 'ENABLED',
          remark: values.remark ? String(values.remark) : undefined,
        })
      }
      message.success('规则已保存')
      setOpen(false)
      form.resetFields()
      await loadData()
    } catch (error) {
      message.error(getErrorMessage(error))
    } finally {
      setSaving(false)
    }
  }

  async function handleToggleRuleStatus(record: Record<string, unknown>) {
    const currentStatus = String(record.status ?? '')
    const isEnabled = currentStatus === 'ENABLED' || currentStatus === 'ACTIVE'
    const nextStatus = isEnabled ? 'DISABLED' : 'ENABLED'
    const ruleType = mode === 'goodsAuth' ? 'goods-auth' : mode
    Modal.confirm({
      title: isEnabled ? '确认禁用' : '确认启用',
      content: `确定要${isEnabled ? '禁用' : '启用'}该规则吗？`,
      onOk: async () => {
        try {
          await updatePricingRuleStatus(ruleType as 'goods-auth' | 'level' | 'customer', String(record.id), nextStatus)
          message.success(`已${isEnabled ? '禁用' : '启用'}`)
          await loadData()
        } catch (error) {
          message.error('操作失败')
        }
      },
    })
  }

  const columns =
    mode === 'goodsAuth'
      ? [
          { title: '授权类型', dataIndex: 'authType', render: (value: unknown) => getAuthTypeLabel(value) },
          { title: '授权对象', dataIndex: 'targetName' },
          { title: '状态', dataIndex: 'status', render: (value: string) => getStatusTag(value) },
          { title: '备注', dataIndex: 'remark', render: (value: unknown) => String(value ?? '-') },
          {
            title: '操作',
            key: 'action',
            width: 100,
            render: (_: unknown, record: Record<string, unknown>) => {
              const s = String(record.status ?? '')
              const isActive = s === 'ENABLED' || s === 'ACTIVE'
              return isActive ? (
                <Button type="link" size="small" danger onClick={() => handleToggleRuleStatus(record)}>
                  {'禁用'}
                </Button>
              ) : (
                <Button
                  type="link"
                  size="small"
                  style={{ color: '#52c41a' }}
                  onClick={() => handleToggleRuleStatus(record)}
                >
                  {'启用'}
                </Button>
              )
            },
          },
        ]
      : mode === 'customer'
      ? [
          { title: '客户名称', dataIndex: 'customerName' },
          { title: '商品名称', dataIndex: 'spuName' },
          { title: '规格名称', dataIndex: 'skuName' },
          { title: '商城价', dataIndex: 'salePrice', render: (value: unknown) => formatCurrency(value) },
          { title: '专属价', dataIndex: 'specialPrice', render: (value: unknown) => formatCurrency(value) },
          { title: '状态', dataIndex: 'status', render: (value: string) => getStatusTag(value) },
          {
            title: '操作',
            key: 'action',
            width: 100,
            render: (_: unknown, record: Record<string, unknown>) => {
              const s = String(record.status ?? '')
              const isActive = s === 'ENABLED' || s === 'ACTIVE'
              return isActive ? (
                <Button type="link" size="small" danger onClick={() => handleToggleRuleStatus(record)}>
                  {'禁用'}
                </Button>
              ) : (
                <Button
                  type="link"
                  size="small"
                  style={{ color: '#52c41a' }}
                  onClick={() => handleToggleRuleStatus(record)}
                >
                  {'启用'}
                </Button>
              )
            },
          },
        ]
      : [
          { title: '会员等级', dataIndex: 'memberLevel', render: (value: unknown) => getMemberLevelLabel(value) },
          {
            title: '折扣对象',
            dataIndex: 'targetName',
            render: (value: unknown, record: Record<string, unknown>) => {
              const type = String(record.targetType ?? '')
              const label = type === 'BRAND' ? '品牌' : type === 'SKU' ? '商品' : type === 'CATEGORY' ? '分类' : ''
              return `${label ? `[${label}] ` : ''}${value || '-'}`
            },
          },
          { title: '折扣率', dataIndex: 'discountRate', render: (value: unknown) => `${value} 折` },
          { title: '状态', dataIndex: 'status', render: (value: string) => getStatusTag(value) },
          { title: '备注', dataIndex: 'remark', render: (value: unknown) => String(value ?? '-') },
          {
            title: '操作',
            key: 'action',
            width: 100,
            render: (_: unknown, record: Record<string, unknown>) => {
              const s = String(record.status ?? '')
              const isActive = s === 'ENABLED' || s === 'ACTIVE'
              return isActive ? (
                <Button type="link" size="small" danger onClick={() => handleToggleRuleStatus(record)}>
                  {'禁用'}
                </Button>
              ) : (
                <Button
                  type="link"
                  size="small"
                  style={{ color: '#52c41a' }}
                  onClick={() => handleToggleRuleStatus(record)}
                >
                  {'启用'}
                </Button>
              )
            },
          },
        ]

  if (loading) {
    return (
      <Card>
        <div style={{ padding: 24, textAlign: 'center' }}>
          <Spin size="large" />
        </div>
      </Card>
    )
  }

  const handleReset = () => {
    setKeyword('')
    setStatusFilter('ALL')
    loadData(1, pagination.pageSize)
  }

  const handleSearch = () => {
    loadData(1, pagination.pageSize)
  }

  const advancedFilter = (
    <Select
      value={statusFilter}
      onChange={setStatusFilter}
      style={{ width: 140 }}
      size="small"
      options={[
        { label: '全部状态', value: 'ALL' },
        { label: '启用', value: 'ENABLED' },
        { label: '停用', value: 'DISABLED' },
        { label: '生效', value: 'ACTIVE' },
        { label: '待处理', value: 'PENDING' },
        { label: '已撤销', value: 'REVOKED' },
      ]}
    />
  )

  return (
    <Card size="small" styles={{ body: { padding: '8px 12px' } }}>
      <Space direction="vertical" size={8} style={{ width: '100%' }}>
        <div>
          <Typography.Title level={5} style={{ margin: 0, fontSize: 14 }}>
            {meta.title}
          </Typography.Title>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            {meta.description}
          </Typography.Text>
        </div>

        <ListSearchToolbar
          searchPlaceholder="搜索客户、商品、分类或备注"
          keyword={keyword}
          onKeywordChange={setKeyword}
          onSearch={handleSearch}
          onReset={handleReset}
          advancedFilter={advancedFilter}
          resultCount={filteredRows.length}
          extraActions={
            <Button type="primary" size="small" onClick={() => setOpen(true)}>
              新增规则
            </Button>
          }
        />

        <Table<Record<string, unknown>>
          rowKey={(record) =>
            String(record.id ?? `${record.customerId ?? ''}-${record.skuId ?? ''}-${record.targetId ?? ''}`)
          }
          dataSource={filteredRows}
          columns={columns}
          size="small"
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: filteredRows.length,
            showSizeChanger: true,
            pageSizeOptions: [10, 20, 50, 100],
            showTotal: (t) => `共 ${t} 条`,
            size: 'small',
            onChange: (page, pageSize) => setPagination((prev) => ({ ...prev, current: page, pageSize })),
          }}
          scroll={{ x: 960, y: 'calc(100vh - 280px)' }}
        />
      </Space>

      <Modal
        open={open}
        title={meta.modalTitle}
        onCancel={() => {
          setOpen(false)
          form.resetFields()
        }}
        footer={null}
        destroyOnHidden
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{ authType: 'PRODUCT' }}
          onFinish={(values) => void handleSubmit(values)}
        >
          {mode === 'goodsAuth' ? (
            <>
              <Form.Item label="授权类型" name="authType" rules={[{ required: true, message: '请选择授权类型' }]}>
                <Select
                  options={[
                    { label: '品牌', value: 'BRAND' },
                    { label: '分类', value: 'CATEGORY' },
                    { label: '商品', value: 'PRODUCT' },
                  ]}
                />
              </Form.Item>
              <Form.Item label="授权对象" name="targetId" rules={[{ required: true, message: '请选择授权对象' }]}>
                <Select options={targetOptions} />
              </Form.Item>
            </>
          ) : null}

          {mode === 'level' ? (
            <>
              <Form.Item label="会员等级" name="memberLevel" rules={[{ required: true, message: '请选择会员等级' }]}>
                <Select
                  options={memberLevelOptions}
                  placeholder={memberLevelOptions.length > 0 ? '选择会员等级' : '暂无可用会员等级'}
                  disabled={memberLevelOptions.length === 0}
                />
              </Form.Item>
              <Form.Item label="折扣维度" name="targetType" rules={[{ required: true, message: '请选择折扣维度' }]}>
                <Select
                  options={[
                    { label: '品牌', value: 'BRAND' },
                    { label: '分类', value: 'CATEGORY' },
                    { label: '商品', value: 'SKU' },
                  ]}
                />
              </Form.Item>
              <Form.Item label="折扣对象" name="targetId" rules={[{ required: true, message: '请选择折扣对象' }]}>
                <Select
                  key={levelTargetType || 'empty'}
                  options={
                    levelTargetType === 'BRAND'
                      ? brandOptions
                      : levelTargetType === 'SKU'
                      ? skuOptions
                      : categoryOptions
                  }
                  disabled={!levelTargetType}
                />
              </Form.Item>
              <Form.Item label="折扣率" name="discountRate" rules={[{ required: true, message: '请输入折扣率' }]}>
                <InputNumber min={0.1} max={10} step={0.1} precision={2} style={{ width: '100%' }} addonAfter="折" />
              </Form.Item>
            </>
          ) : null}

          {mode === 'customer' ? (
            <>
              <Form.Item label="客户名称" name="customerId" rules={[{ required: true, message: '请选择客户' }]}>
                <Select options={customerOptions} />
              </Form.Item>
              <Form.Item label="商品规格" name="skuId" rules={[{ required: true, message: '请选择商品规格' }]}>
                <Select options={skuOptions} />
              </Form.Item>
              <Form.Item label="专属价" name="specialPrice" rules={[{ required: true, message: '请输入专属价' }]}>
                <InputNumber min={0.01} precision={2} style={{ width: '100%' }} addonBefore="￥" />
              </Form.Item>
            </>
          ) : null}

          <Form.Item label="备注" name="remark">
            <Input.TextArea rows={3} placeholder="填写备注" />
          </Form.Item>

          <Button
            htmlType="submit"
            type="primary"
            loading={saving}
            block
            disabled={mode === 'level' && memberLevelOptions.length === 0}
          >
            保存规则
          </Button>
        </Form>
      </Modal>
    </Card>
  )
}

export default MerchantPricingPage
