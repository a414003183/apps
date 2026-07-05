import { useEffect, useState } from 'react'
import { View, Text, ScrollView, Image, Button, Input, Radio, RadioGroup, Label } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { fetchCart, checkoutCart, directBuy } from '../../api/cart'
import { fetchCustomerProfile } from '../../api/customer'
import { uploadImage, resolveFileUrl } from '../../api/file'
import { formatCurrency } from '../../utils/format'
import { useSessionStore } from '../../stores/session'
import type { MallCartItem } from '../../types/models'
import './index.scss'

interface CheckoutLine {
  merchantGoodsId: number
  skuId: number
  quantity: number
  title: string
  specText: string
  unitPrice: number
  lineAmount: number
  freightAmount: number
  mainImageId?: number
}

function toLine(i: MallCartItem): CheckoutLine {
  return {
    merchantGoodsId: i.merchantGoodsId,
    skuId: i.skuId,
    quantity: i.quantity,
    title: i.productName,
    specText: i.specText || i.skuName || '标准规格',
    unitPrice: i.finalUnitPrice,
    lineAmount: i.lineAmount,
    freightAmount: i.freightAmount || 0,
    mainImageId: i.mainImageId,
  }
}

const PAY_METHODS = [
  { value: 'BANK_TRANSFER', label: '银行转账' },
  { value: 'ALIPAY', label: '支付宝' },
  { value: 'WECHAT_PAY', label: '微信支付' },
  { value: 'OFFLINE', label: '线下支付' },
]

export default function CheckoutPage() {
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [lines, setLines] = useState<CheckoutLine[]>([])
  const [directBuyInfo, setDirectBuyInfo] = useState<{ merchantGoodsId: number; skuId: number; quantity: number } | null>(null)
  const [form, setForm] = useState({
    receiverName: '',
    receiverPhone: '',
    receiverProvince: '',
    receiverCity: '',
    receiverDistrict: '',
    receiverAddress: '',
    payMethod: 'BANK_TRANSFER',
    customerRemark: '',
    usePoints: false,
  })
  const [voucherFileId, setVoucherFileId] = useState<number | undefined>()
  const [voucherUploading, setVoucherUploading] = useState(false)
  const [transactionNo, setTransactionNo] = useState('')
  const profile = useSessionStore((s) => s.profile)
  const refreshCartCount = useSessionStore((s) => s.refreshCartCount)

  useEffect(() => {
    if (!profile) {
      setLoading(false)
      return
    }
    init()
  }, [profile])

  async function init() {
    try {
      const customer = await fetchCustomerProfile()
      if (customer.defaultAddress) {
        const addr = customer.defaultAddress
        setForm((prev) => ({
          ...prev,
          receiverName: addr.receiverName,
          receiverPhone: addr.receiverPhone,
          receiverProvince: addr.province,
          receiverCity: addr.city,
          receiverDistrict: addr.district,
          receiverAddress: addr.detailAddress,
        }))
      }

      const params = Taro.getCurrentInstance().router?.params
      const directBuyParam = params?.directBuy
      const selectedIdsParam = params?.selectedIds

      if (directBuyParam) {
        const info = JSON.parse(decodeURIComponent(directBuyParam))
        setDirectBuyInfo(info)
        // 直接购买时不展示商品详情，只展示基础信息；实际价格以结算接口为准
        setLines([
          {
            merchantGoodsId: info.merchantGoodsId,
            skuId: info.skuId,
            quantity: info.quantity,
            title: '直接购买商品',
            specText: '',
            unitPrice: 0,
            lineAmount: 0,
            freightAmount: 0,
          },
        ])
      } else if (selectedIdsParam) {
        const selectedIds: number[] = JSON.parse(selectedIdsParam)
        const cart = await fetchCart({ page: 1, pageSize: 999 })
        const selectedLines = (cart?.list || [])
          .filter((i) => selectedIds.includes(i.merchantGoodsId))
          .map(toLine)
        setLines(selectedLines)
      }
    } catch (err: any) {
      Taro.showToast({ title: err?.message || '加载失败', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  async function handleUploadVoucher() {
    try {
      const res = await Taro.chooseImage({ count: 1, sizeType: ['compressed'], sourceType: ['album', 'camera'] })
      const filePath = res.tempFilePaths[0]
      setVoucherUploading(true)
      const result = await uploadImage(filePath)
      setVoucherFileId(result.id)
      Taro.showToast({ title: '上传成功', icon: 'success' })
    } catch (err: any) {
      Taro.showToast({ title: err?.message || '上传失败', icon: 'none' })
    } finally {
      setVoucherUploading(false)
    }
  }

  function validate() {
    if (!form.receiverName || !form.receiverPhone || !form.receiverAddress) {
      Taro.showToast({ title: '请填写完整收货地址', icon: 'none' })
      return false
    }
    return true
  }

  async function handleSubmit() {
    if (!validate() || submitting) return
    setSubmitting(true)
    try {
      let result
      if (directBuyInfo) {
        result = await directBuy({
          ...directBuyInfo,
          receiverName: form.receiverName,
          receiverPhone: form.receiverPhone,
          receiverProvince: form.receiverProvince,
          receiverCity: form.receiverCity,
          receiverDistrict: form.receiverDistrict,
          receiverAddress: form.receiverAddress,
          payMethod: form.payMethod,
          customerRemark: form.customerRemark,
          contractFileId: voucherFileId,
          usePoints: form.usePoints,
        })
      } else {
        result = await checkoutCart({
          receiverName: form.receiverName,
          receiverPhone: form.receiverPhone,
          receiverProvince: form.receiverProvince,
          receiverCity: form.receiverCity,
          receiverDistrict: form.receiverDistrict,
          receiverAddress: form.receiverAddress,
          payMethod: form.payMethod,
          customerRemark: form.customerRemark,
          contractFileId: voucherFileId,
          usePoints: form.usePoints,
          selectedMerchantGoodsIds: lines.map((l) => l.merchantGoodsId),
        })
      }
      refreshCartCount()
      Taro.redirectTo({
        url: `/pages/order/result?orderNo=${result.orderNo}&orderId=${result.id}&payAmount=${result.payAmount}`,
      })
    } catch (err: any) {
      Taro.showToast({ title: err?.message || '下单失败', icon: 'none' })
    } finally {
      setSubmitting(false)
    }
  }

  const totalAmount = lines.reduce((sum, l) => sum + l.lineAmount, 0)
  const totalFreight = lines.reduce((sum, l) => sum + l.freightAmount, 0)

  if (!profile) {
    return (
      <View className='checkout-page empty'>
        <Text className='text-muted'>请先登录</Text>
        <Button className='btn-primary login-btn' onClick={() => Taro.navigateTo({ url: '/pages/login/index' })}>
          去登录
        </Button>
      </View>
    )
  }

  if (loading) {
    return (
      <View className='checkout-page empty'>
        <Text className='text-muted'>加载中...</Text>
      </View>
    )
  }

  return (
    <View className='checkout-page'>
      <ScrollView className='content' scrollY>
        <View className='card address-card'>
          <Text className='section-title'>收货地址</Text>
          <View className='form-item'>
            <Text className='label'>收货人</Text>
            <Input
              className='input'
              placeholder='收货人姓名'
              value={form.receiverName}
              onInput={(e) => setForm((prev) => ({ ...prev, receiverName: e.detail.value }))}
            />
          </View>
          <View className='form-item'>
            <Text className='label'>手机号</Text>
            <Input
              className='input'
              type='number'
              placeholder='收货人手机号'
              value={form.receiverPhone}
              onInput={(e) => setForm((prev) => ({ ...prev, receiverPhone: e.detail.value }))}
            />
          </View>
          <View className='form-item'>
            <Text className='label'>省/市/区</Text>
            <View className='region-row'>
              <Input
                className='input region-input'
                placeholder='省'
                value={form.receiverProvince}
                onInput={(e) => setForm((prev) => ({ ...prev, receiverProvince: e.detail.value }))}
              />
              <Input
                className='input region-input'
                placeholder='市'
                value={form.receiverCity}
                onInput={(e) => setForm((prev) => ({ ...prev, receiverCity: e.detail.value }))}
              />
              <Input
                className='input region-input'
                placeholder='区'
                value={form.receiverDistrict}
                onInput={(e) => setForm((prev) => ({ ...prev, receiverDistrict: e.detail.value }))}
              />
            </View>
          </View>
          <View className='form-item'>
            <Text className='label'>详细地址</Text>
            <Input
              className='input'
              placeholder='街道、门牌号等'
              value={form.receiverAddress}
              onInput={(e) => setForm((prev) => ({ ...prev, receiverAddress: e.detail.value }))}
            />
          </View>
        </View>

        <View className='card lines-card'>
          <Text className='section-title'>商品清单</Text>
          {lines.map((line, idx) => (
            <View key={`${line.merchantGoodsId}-${idx}`} className='line-item'>
              {line.mainImageId ? (
                <Image className='line-image' src={resolveFileUrl(line.mainImageId)} mode='aspectFill' />
              ) : (
                <View className='line-image placeholder' />
              )}
              <View className='line-info'>
                <Text className='line-title line-clamp-2'>{line.title}</Text>
                <Text className='line-spec'>{line.specText}</Text>
                <View className='line-bottom'>
                  <Text className='line-price'>{formatCurrency(line.unitPrice)}</Text>
                  <Text className='line-quantity'>x{line.quantity}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        <View className='card pay-card'>
          <Text className='section-title'>支付方式</Text>
          <RadioGroup
            className='pay-methods'
            onChange={(e) => setForm((prev) => ({ ...prev, payMethod: e.detail.value }))}
          >
            {PAY_METHODS.map((m) => (
              <Label key={m.value} className='pay-method'>
                <Radio value={m.value} checked={form.payMethod === m.value} />
                <Text className='pay-label'>{m.label}</Text>
              </Label>
            ))}
          </RadioGroup>

          <View className='form-item mt-3'>
            <Text className='label'>交易流水号/备注</Text>
            <Input
              className='input'
              placeholder='转账单号或备注'
              value={transactionNo}
              onInput={(e) => setTransactionNo(e.detail.value)}
            />
          </View>

          <View className='form-item mt-2'>
            <Text className='label'>支付凭证</Text>
            <View className='voucher-wrap'>
              {voucherFileId ? (
                <Image className='voucher-image' src={resolveFileUrl(voucherFileId)} mode='aspectFill' />
              ) : null}
              <Button
                className='btn-outline upload-btn'
                disabled={voucherUploading}
                onClick={handleUploadVoucher}
              >
                {voucherUploading ? '上传中...' : voucherFileId ? '重新上传' : '上传凭证'}
              </Button>
            </View>
          </View>
        </View>

        <View className='card remark-card'>
          <Text className='section-title'>订单备注</Text>
          <Input
            className='input'
            placeholder='请输入备注（选填）'
            value={form.customerRemark}
            onInput={(e) => setForm((prev) => ({ ...prev, customerRemark: e.detail.value }))}
          />
        </View>

        <View className='safe-bottom' />
      </ScrollView>

      <View className='bottom-bar'>
        <View className='total-wrap'>
          <Text className='total-label'>应付:</Text>
          <Text className='total-price'>{formatCurrency(totalAmount + totalFreight)}</Text>
        </View>
        <Button className='submit-btn' disabled={submitting} onClick={handleSubmit}>
          {submitting ? '提交中...' : '提交订单'}
        </Button>
      </View>
    </View>
  )
}
