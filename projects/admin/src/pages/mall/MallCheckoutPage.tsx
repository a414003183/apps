import { Button, Card, Checkbox, Descriptions, Input, message, Radio, Space, Spin, Empty } from 'antd'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { MallCartItem } from '../../types/models'
import { fetchCartItems, checkoutCart } from '../../services/ant-design-pro/cart'
import { fetchCustomerAddresses } from '../../services/ant-design-pro/customer'
import { getAuthProfile } from '../../utils/auth'

export function MallCheckoutPage() {
  const [cartItems, setCartItems] = useState<MallCartItem[]>([])
  const [addresses, setAddresses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null)
  const [paymentMethod, setPaymentMethod] = useState('alipay')
  const [remark, setRemark] = useState('')
  const navigate = useNavigate()
  const profile = getAuthProfile()

  useEffect(() => {
    loadData()
  }, [profile])

  async function loadData() {
    if (!profile) {
      setLoading(false)
      return
    }
    try {
      setLoading(true)
      const [cartData, addressData] = await Promise.all([fetchCartItems(), fetchCustomerAddresses()])
      setCartItems(cartData || [])
      setAddresses(addressData || [])
      if (addressData?.length > 0) {
        const defaultAddr = addressData.find((a: any) => a.isDefault) || addressData[0]
        setSelectedAddressId(defaultAddr.id)
      }
    } catch (error: any) {
      console.error('加载数据失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const totalAmount = cartItems.reduce((sum, item) => sum + item.lineAmount, 0)
  const freightAmount = 36
  const finalAmount = totalAmount + freightAmount

  const handleSubmit = async () => {
    if (!selectedAddressId) {
      message.warning('请选择收货地址')
      return
    }
    if (cartItems.length === 0) {
      message.warning('购物车为空')
      return
    }

    try {
      setSubmitting(true)
      const selectedAddress = addresses.find((a: any) => String(a.id) === String(selectedAddressId))
      if (!selectedAddress) {
        message.warning('收货地址无效，请重新选择')
        setSubmitting(false)
        return
      }
      const response = await checkoutCart({
        receiverName: selectedAddress.receiverName,
        receiverPhone: selectedAddress.phone,
        receiverProvince: selectedAddress.province,
        receiverCity: selectedAddress.city,
        receiverDistrict: selectedAddress.district,
        receiverAddress: selectedAddress.detailAddress,
        payMethod: paymentMethod,
        customerRemark: remark || undefined,
        selectedMerchantGoodsIds: cartItems.map((item) => item.merchantGoodsId),
      })
      message.success('订单提交成功！')
      navigate(`/mall/order/result?orderNo=${response?.orderNo || ''}`)
    } catch (error: any) {
      message.error(error?.response?.data?.message || '提交订单失败')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 40 }}>
        <Spin size="large" />
      </div>
    )
  }

  if (!profile) {
    return (
      <Empty description="请先登录">
        <Button type="primary" onClick={() => navigate('/login')}>
          去登录
        </Button>
      </Empty>
    )
  }

  if (cartItems.length === 0) {
    return (
      <Empty description="购物车为空">
        <Button type="primary" onClick={() => navigate('/mall/home')}>
          去购物
        </Button>
      </Empty>
    )
  }

  const selectedAddress = addresses.find((a: any) => a.id === selectedAddressId)

  return (
    <div>
      <h2>确认订单</h2>

      <Card title="商品信息" style={{ marginBottom: 16 }}>
        {cartItems.map((item) => (
          <div
            key={item.id}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '8px 0',
              borderBottom: '1px solid #f0f0f0',
            }}
          >
            <div>
              <div>{item.productName}</div>
              <div style={{ color: '#999', fontSize: 12 }}>
                {item.specText} x {item.quantity}
              </div>
            </div>
            <div style={{ color: '#ff4d4f' }}>￥{item.lineAmount}</div>
          </div>
        ))}
      </Card>

      <Card title="收货地址" style={{ marginBottom: 16 }}>
        {addresses.length === 0 ? (
          <Empty description="暂无收货地址">
            <Button type="primary" onClick={() => navigate('/member/customer/profile')}>
              添加地址
            </Button>
          </Empty>
        ) : (
          <Radio.Group value={selectedAddressId} onChange={(e) => setSelectedAddressId(e.target.value)}>
            <Space direction="vertical" style={{ width: '100%' }}>
              {addresses.map((addr: any) => (
                <Radio key={addr.id} value={addr.id} style={{ width: '100%' }}>
                  <Descriptions column={1} size="small" style={{ marginLeft: 8 }}>
                    <Descriptions.Item label="收货人">{addr.receiverName}</Descriptions.Item>
                    <Descriptions.Item label="联系电话">{addr.phone}</Descriptions.Item>
                    <Descriptions.Item label="收货地址">
                      {addr.province}
                      {addr.city}
                      {addr.district}
                      {addr.detailAddress}
                    </Descriptions.Item>
                  </Descriptions>
                </Radio>
              ))}
            </Space>
          </Radio.Group>
        )}
      </Card>

      <Card title="支付方式" style={{ marginBottom: 16 }}>
        <Radio.Group value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
          <Space direction="vertical">
            <Radio value="alipay">支付宝</Radio>
            <Radio value="wechat">微信支付</Radio>
            <Radio value="bank">银行转账</Radio>
          </Space>
        </Radio.Group>
      </Card>

      <Card title="备注">
        <Input.TextArea
          rows={3}
          placeholder="请输入备注信息"
          value={remark}
          onChange={(e) => setRemark(e.target.value)}
        />
      </Card>

      <Card style={{ marginTop: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 24 }}>
          <div>
            <div>
              商品金额: <span style={{ color: '#ff4d4f' }}>￥{totalAmount}</span>
            </div>
            <div>
              运费: <span style={{ color: '#ff4d4f' }}>￥{freightAmount}</span>
            </div>
            <div style={{ fontSize: 18 }}>
              实付金额: <span style={{ color: '#ff4d4f', fontWeight: 'bold' }}>￥{finalAmount}</span>
            </div>
          </div>
          <Button type="primary" size="large" onClick={handleSubmit} loading={submitting}>
            提交订单
          </Button>
        </div>
      </Card>
    </div>
  )
}

export default MallCheckoutPage
