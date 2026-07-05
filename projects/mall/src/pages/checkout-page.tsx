import { ArrowLeft, ArrowRight, PackageCheck, Plus, MapPin, Trash2, Upload, FileText } from 'lucide-react'
import { Button, Card, Input, Label, Spinner, TextArea, TextField } from '@heroui/react'
import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useSession } from '../auth/session'
import {
  checkoutMallCart,
  directBuyMallCart,
  fetchMallCart,
  fetchCustomerPoints,
  registerCustomerPayment,
} from '../api/mall'
import { uploadFile } from '../api/file'
import { resolveFileUrl } from '../api/http'
import { StatePanel } from '../components/common/state-panel'
import { getErrorMessage } from '../lib/errors'
import { formatCurrency } from '../lib/format'
import type { CreateOrderResult, MallCartItem, Product } from '../types/models'

interface CheckoutLocationState {
  directBuy?: { merchantGoodsId: number; skuId: number; quantity: number; snapshot?: Product }
}

interface CheckoutLine {
  merchantGoodsId: number
  skuId: number
  quantity: number
  title: string
  specText: string
  shopName: string
  unitPrice: number
  lineAmount: number
  freightAmount: number
  mainImageId?: number
}

interface SavedAddress {
  id: string
  name: string
  phone: string
  province: string
  city: string
  district: string
  address: string
  isDefault: boolean
}

function toLine(i: MallCartItem): CheckoutLine {
  return {
    merchantGoodsId: i.merchantGoodsId,
    skuId: i.skuId,
    quantity: i.quantity,
    title: i.productName,
    specText: i.skuName || i.specText || '标准规格',
    shopName: '购物车商品',
    unitPrice: i.finalUnitPrice,
    lineAmount: i.lineAmount,
    freightAmount: i.freightAmount ?? 0,
    mainImageId: i.mainImageId,
  }
}

function toDirectLine(p: Product, q: number): CheckoutLine {
  const u = p.memberPrice || p.price
  return {
    merchantGoodsId: p.merchantGoodsId,
    skuId: p.skuId,
    quantity: q,
    title: p.name,
    specText: p.specs || '标准规格',
    shopName: p.shopName,
    unitPrice: u,
    lineAmount: u * q,
    freightAmount: p.freightAmount ?? 0,
    mainImageId: p.mainImageId,
  }
}

function loadSavedAddresses(): SavedAddress[] {
  try {
    const raw = localStorage.getItem('storefront_v2_addresses')
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function persistAddresses(addresses: SavedAddress[]) {
  localStorage.setItem('storefront_v2_addresses', JSON.stringify(addresses))
}

export function CheckoutPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const session = useSession()
  const directBuy = ((location.state as CheckoutLocationState | null) ?? null)?.directBuy
  const selectedMerchantGoodsIds = (location.state as any)?.selectedMerchantGoodsIds as number[] | undefined
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [lines, setLines] = useState<CheckoutLine[]>([])
  const [form, setForm] = useState({
    receiverName: session.profile?.name ?? '',
    receiverPhone: '',
    receiverProvince: '',
    receiverCity: '',
    receiverDistrict: '',
    receiverAddress: '',
    payMethod: 'BANK_TRANSFER',
    customerRemark: '',
    usePoints: false,
  })

  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([])
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null)
  const [showAddressForm, setShowAddressForm] = useState(false)
  const [editingAddress, setEditingAddress] = useState<SavedAddress | null>(null)
  const [addressForm, setAddressForm] = useState({
    name: '',
    phone: '',
    province: '',
    city: '',
    district: '',
    address: '',
  })

  const [voucherFileId, setVoucherFileId] = useState<number | undefined>(undefined)
  const [voucherFileName, setVoucherFileName] = useState<string>('')
  const [voucherUploading, setVoucherUploading] = useState(false)
  const [transactionNo, setTransactionNo] = useState('')
  const [pointSummary, setPointSummary] = useState<{
    currentPoints: number
    enabled: boolean
    deductionRatio: number
    maxDeductionRatio: number
  }>({ currentPoints: 0, enabled: false, deductionRatio: 0, maxDeductionRatio: 0 })
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!session.ready || !session.isCustomer) {
      setLoading(false)
      return
    }
    let m = true
    ;(async () => {
      setLoading(true)
      try {
        if (directBuy?.snapshot) {
          if (m) setLines([toDirectLine(directBuy.snapshot, directBuy.quantity)])
        } else {
          const c = await fetchMallCart({ pageSize: 1000 })
          if (m) setLines((c?.list ?? []).map(toLine))
        }
      } catch {
        if (m) setLines([])
      } finally {
        if (m) setLoading(false)
      }
    })()
    return () => {
      m = false
    }
  }, [session.ready, session.isCustomer, directBuy?.merchantGoodsId, directBuy?.quantity, directBuy?.snapshot])

  // 加载本地保存的地址
  useEffect(() => {
    const addresses = loadSavedAddresses()
    setSavedAddresses(addresses)
    if (addresses.length > 0) {
      const defaultAddr = addresses.find((a) => a.isDefault) || addresses[0]
      setSelectedAddressId(defaultAddr.id)
      setForm((prev) => ({
        ...prev,
        receiverName: defaultAddr.name,
        receiverPhone: defaultAddr.phone,
        receiverProvince: defaultAddr.province,
        receiverCity: defaultAddr.city,
        receiverDistrict: defaultAddr.district,
        receiverAddress: defaultAddr.address,
      }))
    }
  }, [])

  useEffect(() => {
    if (!session.isCustomer) return
    fetchCustomerPoints()
      .then((data) => {
        const summary = data?.summary || {}
        const rule = data?.deductionRule || {}
        setPointSummary({
          currentPoints: Number(summary.currentPoints ?? 0),
          enabled: Boolean(rule.enabled),
          deductionRatio: Number(rule.deductionRatio ?? 0),
          maxDeductionRatio: Number(rule.maxDeductionRatio ?? 0),
        })
      })
      .catch(() => {})
  }, [session.isCustomer])

  if (!session.ready || loading)
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" color="accent" />
      </div>
    )
  if (!session.isAuthenticated)
    return (
      <StatePanel
        eyebrow="请登录"
        title="请先登录"
        description="结算需要登录"
        primaryAction={{ label: '去登录', onPress: () => navigate('/login?redirect=%2Fcheckout') }}
      />
    )
  if (!session.isCustomer)
    return (
      <StatePanel
        eyebrow="身份限制"
        title="需要客户身份"
        description="仅客户可结算"
        primaryAction={{ label: '返回首页', onPress: () => navigate('/') }}
      />
    )
  if (lines.length === 0)
    return (
      <StatePanel
        eyebrow="无商品"
        title="没有可结算商品"
        description="请先添加商品"
        primaryAction={{ label: '去选品', onPress: () => navigate('/search') }}
      />
    )

  const goodsAmt = lines.reduce((s, l) => s + l.lineAmount, 0)
  const freightAmt = lines.reduce((s, l) => s + l.freightAmount, 0)
  const payable = goodsAmt + freightAmt

  function applyAddressToForm(addr: SavedAddress) {
    setSelectedAddressId(addr.id)
    setForm((prev) => ({
      ...prev,
      receiverName: addr.name,
      receiverPhone: addr.phone,
      receiverProvince: addr.province,
      receiverCity: addr.city,
      receiverDistrict: addr.district,
      receiverAddress: addr.address,
    }))
  }

  function openAddAddress() {
    setEditingAddress(null)
    setAddressForm({ name: '', phone: '', province: '', city: '', district: '', address: '' })
    setShowAddressForm(true)
  }

  function handleSaveAddressForm() {
    if (
      !addressForm.name ||
      !addressForm.phone ||
      !addressForm.province ||
      !addressForm.city ||
      !addressForm.district ||
      !addressForm.address
    ) {
      return
    }
    let addresses = [...savedAddresses]
    if (editingAddress) {
      addresses = addresses.map((a) =>
        a.id === editingAddress.id ? { ...addressForm, id: editingAddress.id, isDefault: a.isDefault } : a,
      )
    } else {
      const newAddress: SavedAddress = {
        ...addressForm,
        id: Date.now().toString(),
        isDefault: addresses.length === 0,
      }
      addresses.push(newAddress)
    }
    persistAddresses(addresses)
    setSavedAddresses(addresses)
    setShowAddressForm(false)

    const target = editingAddress ? addresses.find((a) => a.id === editingAddress.id)! : addresses[addresses.length - 1]
    applyAddressToForm(target)
  }

  function handleDeleteAddress(id: string, e: React.MouseEvent) {
    e.stopPropagation()
    const addresses = savedAddresses.filter((a) => a.id !== id)
    persistAddresses(addresses)
    setSavedAddresses(addresses)
    if (selectedAddressId === id) {
      setSelectedAddressId(null)
      setForm((prev) => ({
        ...prev,
        receiverName: session.profile?.name ?? '',
        receiverPhone: '',
        receiverProvince: '',
        receiverCity: '',
        receiverDistrict: '',
        receiverAddress: '',
      }))
      if (addresses.length > 0) {
        const next = addresses.find((a) => a.isDefault) || addresses[0]
        applyAddressToForm(next)
      }
    }
  }

  async function handleVoucherUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setVoucherUploading(true)
    try {
      const uploaded = await uploadFile(file, 'ORDER_PAYMENT')
      setVoucherFileId(uploaded.id)
      setVoucherFileName(uploaded.originalName)
    } catch (err) {
      console.error(getErrorMessage(err))
      alert('凭证上传失败，请重试')
    } finally {
      setVoucherUploading(false)
    }
  }

  function removeVoucher() {
    setVoucherFileId(undefined)
    setVoucherFileName('')
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (
      !form.receiverName ||
      !form.receiverPhone ||
      !form.receiverProvince ||
      !form.receiverCity ||
      !form.receiverDistrict ||
      !form.receiverAddress
    )
      return
    setSubmitting(true)
    try {
      const payload = {
        receiverName: form.receiverName,
        receiverPhone: form.receiverPhone,
        receiverProvince: form.receiverProvince,
        receiverCity: form.receiverCity,
        receiverDistrict: form.receiverDistrict,
        receiverAddress: form.receiverAddress,
        payMethod: form.payMethod,
        customerRemark: form.customerRemark || undefined,
        usePoints: form.usePoints,
      }
      let result: CreateOrderResult = directBuy
        ? await directBuyMallCart({
            ...payload,
            merchantGoodsId: directBuy.merchantGoodsId,
            skuId: directBuy.skuId,
            quantity: directBuy.quantity,
          })
        : await checkoutMallCart({
            ...payload,
            selectedMerchantGoodsIds:
              selectedMerchantGoodsIds && selectedMerchantGoodsIds.length > 0 ? selectedMerchantGoodsIds : undefined,
          })

      // 如果上传了支付凭证，自动登记支付
      if (voucherFileId) {
        try {
          const paymentResult = await registerCustomerPayment(result.orderNo, {
            payMethod: form.payMethod,
            transactionNo: transactionNo || result.orderNo,
            voucherFileId,
            remark: form.customerRemark || undefined,
          })
          if (paymentResult) {
            result = {
              ...result,
              orderStatus: String(paymentResult.orderStatus ?? result.orderStatus),
              payStatus: String(paymentResult.payStatus ?? result.payStatus),
            }
          }
        } catch (err) {
          console.error('支付登记失败:', getErrorMessage(err))
        }
      }

      await session.refreshCartCount()
      navigate(`/order/result?orderNo=${result.orderNo}`, { state: { result } })
    } catch (err) {
      console.error(getErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-3">
      <Button variant="ghost" size="sm" onPress={() => navigate(-1)}>
        <ArrowLeft size={16} /> 返回
      </Button>

      <div className="grid xl:grid-cols-[1fr_340px] gap-3">
        <Card>
          <Card.Content className="p-5">
            <form onSubmit={submit} className="space-y-5">
              <h1 className="text-lg font-bold border-b border-border pb-3">填写订单信息</h1>

              <div>
                <h3 className="text-sm font-bold mb-3">收货信息</h3>

                {/* 已保存地址卡片 */}
                {savedAddresses.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                    {savedAddresses.map((addr) => {
                      const isSelected = selectedAddressId === addr.id
                      return (
                        <div
                          key={addr.id}
                          onClick={() => applyAddressToForm(addr)}
                          className={`relative p-3 rounded-lg border cursor-pointer transition-colors ${
                            isSelected ? 'border-accent bg-accent/5' : 'border-border bg-card hover:border-accent/40'
                          }`}
                        >
                          <div className="flex items-start gap-2">
                            <MapPin
                              size={16}
                              className={`mt-0.5 shrink-0 ${isSelected ? 'text-accent' : 'text-muted'}`}
                            />
                            <div className="min-w-0 flex-1 pr-16">
                              <div className="font-medium text-sm truncate">
                                {addr.name} <span className="text-muted">{addr.phone}</span>
                              </div>
                              <div className="text-xs text-muted mt-1 line-clamp-2">
                                {addr.province}
                                {addr.city}
                                {addr.district}
                                {addr.address}
                              </div>
                            </div>
                          </div>
                          {addr.isDefault && (
                            <span className="absolute top-2 right-8 text-[10px] text-accent font-medium">默认</span>
                          )}
                          <button
                            type="button"
                            onClick={(e) => handleDeleteAddress(addr.id, e)}
                            className="absolute bottom-2 right-2 p-1 text-muted hover:text-destructive transition-colors"
                            title="删除"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* 添加/展开地址表单按钮 */}
                {!showAddressForm && (
                  <div className="mb-2">
                    <Button type="button" variant="ghost" size="sm" onPress={openAddAddress} className="text-accent">
                      <Plus size={16} /> {savedAddresses.length > 0 ? '添加新地址' : '添加收货地址'}
                    </Button>
                  </div>
                )}

                {/* 展开的新增/编辑地址表单 */}
                {showAddressForm && (
                  <div className="mt-3 p-4 rounded-lg border border-border bg-surface space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold">{editingAddress ? '编辑地址' : '新增地址'}</h4>
                      <button
                        type="button"
                        onClick={() => setShowAddressForm(false)}
                        className="text-xs text-muted hover:text-foreground"
                      >
                        收起
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <TextField isRequired>
                        <Label className="text-xs text-muted">收货人</Label>
                        <Input
                          value={addressForm.name}
                          onChange={(e) => setAddressForm((prev) => ({ ...prev, name: e.target.value }))}
                          placeholder="请输入收货人"
                        />
                      </TextField>
                      <TextField isRequired>
                        <Label className="text-xs text-muted">联系电话</Label>
                        <Input
                          value={addressForm.phone}
                          onChange={(e) => setAddressForm((prev) => ({ ...prev, phone: e.target.value }))}
                          placeholder="请输入联系电话"
                        />
                      </TextField>
                      <TextField isRequired>
                        <Label className="text-xs text-muted">省份</Label>
                        <Input
                          value={addressForm.province}
                          onChange={(e) => setAddressForm((prev) => ({ ...prev, province: e.target.value }))}
                          placeholder="请输入省份"
                        />
                      </TextField>
                      <TextField isRequired>
                        <Label className="text-xs text-muted">城市</Label>
                        <Input
                          value={addressForm.city}
                          onChange={(e) => setAddressForm((prev) => ({ ...prev, city: e.target.value }))}
                          placeholder="请输入城市"
                        />
                      </TextField>
                      <TextField isRequired>
                        <Label className="text-xs text-muted">区县</Label>
                        <Input
                          value={addressForm.district}
                          onChange={(e) => setAddressForm((prev) => ({ ...prev, district: e.target.value }))}
                          placeholder="请输入区县"
                        />
                      </TextField>
                    </div>
                    <TextField isRequired>
                      <Label className="text-xs text-muted">详细地址</Label>
                      <TextArea
                        value={addressForm.address}
                        onChange={(e) => setAddressForm((prev) => ({ ...prev, address: e.target.value }))}
                        placeholder="街道、楼栋、门牌号等"
                      />
                    </TextField>
                    <div className="flex gap-2">
                      <Button type="button" size="sm" onPress={handleSaveAddressForm}>
                        保存地址
                      </Button>
                      <Button type="button" variant="ghost" size="sm" onPress={() => setShowAddressForm(false)}>
                        取消
                      </Button>
                    </div>
                  </div>
                )}

                {/* 已选地址摘要（当没有选择时提示） */}
                {!selectedAddressId && savedAddresses.length > 0 && !showAddressForm && (
                  <div className="mt-3 p-3 rounded-lg bg-surface border border-dashed border-border text-center text-sm text-muted">
                    请选择收货地址或添加新地址
                  </div>
                )}

                {/* 支付方式 */}
                <div className="mt-4">
                  <label className="block text-xs text-muted mb-1">支付方式</label>
                  <select
                    value={form.payMethod}
                    onChange={(e) => setForm({ ...form, payMethod: e.target.value })}
                    className="input h-9 w-full"
                  >
                    <option value="BANK_TRANSFER">银行转账</option>
                    <option value="ONLINE">线上支付</option>
                    <option value="OFFLINE_CONFIRM">线下确认</option>
                  </select>
                </div>

                {/* 支付凭证上传 */}
                <div className="mt-4 p-4 rounded-lg border border-border bg-surface">
                  <h4 className="text-sm font-bold mb-2 flex items-center gap-2">
                    <FileText size={16} /> 支付凭证 <span className="text-xs font-normal text-muted">（选填）</span>
                  </h4>
                  <p className="text-xs text-muted mb-3">如已付款可上传转账截图或支付凭证，提交后将自动登记为已支付</p>

                  {!voucherFileId ? (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs text-muted mb-1">交易流水号</label>
                        <Input
                          value={transactionNo}
                          onChange={(e) => setTransactionNo(e.target.value)}
                          placeholder="请输入转账流水号或交易单号"
                        />
                      </div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*,.pdf"
                        className="hidden"
                        onChange={handleVoucherUpload}
                        disabled={voucherUploading}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        isDisabled={voucherUploading}
                        onPress={() => fileInputRef.current?.click()}
                      >
                        <Upload size={16} /> {voucherUploading ? '上传中...' : '上传凭证'}
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between p-2 bg-card rounded border border-border">
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText size={16} className="text-accent shrink-0" />
                        <span className="text-sm truncate">{voucherFileName}</span>
                      </div>
                      <button
                        type="button"
                        onClick={removeVoucher}
                        className="text-xs text-muted hover:text-destructive shrink-0 ml-2"
                      >
                        移除
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t border-border pt-4">
                <TextField>
                  <Label className="text-xs text-muted">订单备注</Label>
                  <TextArea
                    value={form.customerRemark}
                    onChange={(e) => setForm({ ...form, customerRemark: e.target.value })}
                    placeholder="送货时间、开票要求等（选填）"
                  />
                </TextField>
                <div className="mt-3 p-3 rounded-lg border border-border bg-surface">
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.usePoints}
                      onChange={(e) => setForm({ ...form, usePoints: e.target.checked })}
                      disabled={!pointSummary.enabled || pointSummary.currentPoints <= 0}
                    />
                    <span>使用积分抵扣</span>
                  </label>
                  {pointSummary.enabled ? (
                    <div className="mt-2 text-xs text-muted space-y-1">
                      <div className="flex justify-between">
                        <span>当前积分</span>
                        <span className="font-medium text-foreground">{pointSummary.currentPoints}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>抵扣规则</span>
                        <span>
                          1 积分抵 ¥{pointSummary.deductionRatio.toFixed(2)}，最高 {pointSummary.maxDeductionRatio}%
                        </span>
                      </div>
                      {form.usePoints && pointSummary.currentPoints > 0 && (
                        <div className="flex justify-between text-accent">
                          <span>预计抵扣</span>
                          <span>
                            ¥{' '}
                            {Math.min(
                              Math.floor(
                                Math.min((payable * pointSummary.maxDeductionRatio) / 100, payable) /
                                  pointSummary.deductionRatio,
                              ) * pointSummary.deductionRatio,
                              pointSummary.currentPoints * pointSummary.deductionRatio,
                            ).toFixed(2)}
                          </span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="mt-2 text-xs text-muted">平台当前未开启积分抵现。</p>
                  )}
                </div>
              </div>
              <Button type="submit" isPending={submitting} fullWidth size="lg">
                <PackageCheck size={18} /> {submitting ? '提交中...' : '确认下单'} <ArrowRight size={18} />
              </Button>
            </form>
          </Card.Content>
        </Card>

        <div className="space-y-3 xl:sticky xl:top-[140px] h-fit">
          <Card>
            <Card.Header>
              <Card.Title>订单清单 ({lines.length})</Card.Title>
            </Card.Header>
            <Card.Content className="p-4">
              <div className="space-y-3 max-h-[300px] overflow-auto">
                {lines.map((l) => (
                  <div
                    key={`${l.merchantGoodsId}-${l.skuId}`}
                    className="p-2 bg-surface rounded-lg text-sm flex items-center gap-3"
                  >
                    {l.mainImageId ? (
                      <img
                        src={resolveFileUrl(l.mainImageId)}
                        alt={l.title}
                        className="w-10 h-10 rounded object-cover shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded bg-muted shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium line-clamp-1">{l.title}</p>
                      <div className="flex justify-between text-[11px] text-muted mt-0.5">
                        <span>
                          {l.specText} · x{l.quantity}
                        </span>
                        <span className="text-accent font-bold">{formatCurrency(l.lineAmount)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card.Content>
          </Card>
          <Card>
            <Card.Content className="p-4 text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-muted">商品金额</span>
                <span>{formatCurrency(goodsAmt)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">运费</span>
                <span>{formatCurrency(freightAmt)}</span>
              </div>
              <div className="flex justify-between items-center pt-3 border-t border-border">
                <span className="font-bold">应付</span>
                <span className="text-accent text-[22px] font-bold">{formatCurrency(payable)}</span>
              </div>
            </Card.Content>
          </Card>
        </div>
      </div>
    </div>
  )
}
