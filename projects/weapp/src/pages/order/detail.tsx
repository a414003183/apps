import { useEffect, useState } from 'react'
import { View, Text, ScrollView, Button, Image } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { fetchCustomerOrderDetail, fetchCustomerOrderTimeline, confirmReceive } from '../../api/customer'
import { resolveFileUrl } from '../../api/file'
import { formatCurrency } from '../../utils/format'
import { useSessionStore } from '../../stores/session'
import type { OrderDetailResponse, OrderTimelineEvent } from '../../api/customer'
import './detail.scss'

const STATUS_MAP: Record<string, string> = {
  PENDING_PAYMENT: '待付款',
  PENDING_APPROVAL: '待审核',
  PENDING_SHIP: '待发货',
  SHIPPED: '待收货',
  COMPLETED: '已完成',
  CANCELLED: '已取消',
}

export default function OrderDetailPage() {
  const [order, setOrder] = useState<OrderDetailResponse | null>(null)
  const [timeline, setTimeline] = useState<OrderTimelineEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [confirming, setConfirming] = useState(false)
  const profile = useSessionStore((s) => s.profile)

  useEffect(() => {
    const id = Taro.getCurrentInstance().router?.params?.id
    if (id && profile) {
      loadDetail(id)
      loadTimeline(id)
    }
  }, [profile])

  async function loadDetail(id: string) {
    try {
      const data = await fetchCustomerOrderDetail(id)
      setOrder(data)
    } catch (err: any) {
      Taro.showToast({ title: err?.message || '加载失败', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  async function loadTimeline(id: string) {
    try {
      const data = await fetchCustomerOrderTimeline(id)
      setTimeline(data || [])
    } catch {
      setTimeline([])
    }
  }

  async function handleConfirmReceive() {
    const id = Taro.getCurrentInstance().router?.params?.id
    if (!id) return
    Taro.showModal({
      title: '确认收货',
      content: '确认已收到商品？',
      success: async (res) => {
        if (!res.confirm) return
        setConfirming(true)
        try {
          await confirmReceive(id)
          Taro.showToast({ title: '确认收货成功', icon: 'success' })
          loadDetail(id)
          loadTimeline(id)
        } catch (err: any) {
          Taro.showToast({ title: err?.message || '操作失败', icon: 'none' })
        } finally {
          setConfirming(false)
        }
      },
    })
  }

  if (loading) {
    return (
      <View className='order-detail-page empty'>
        <Text className='text-muted'>加载中...</Text>
      </View>
    )
  }

  if (!order) {
    return (
      <View className='order-detail-page empty'>
        <Text className='text-muted'>订单不存在</Text>
      </View>
    )
  }

  return (
    <View className='order-detail-page'>
      <ScrollView className='content' scrollY>
        <View className='card status-card'>
          <Text className='status-text'>{STATUS_MAP[order.orderStatus] || order.orderStatus}</Text>
          <Text className='pay-status'>支付状态：{order.payStatus}</Text>
        </View>

        <View className='card address-card'>
          <Text className='section-title'>收货信息</Text>
          <Text className='address-name'>
            {order.receiverName} {order.receiverPhone}
          </Text>
          <Text className='address-detail'>{order.receiverAddress}</Text>
        </View>

        <View className='card items-card'>
          <Text className='section-title'>商品清单</Text>
          {order.items.map((item) => (
            <View key={item.itemId} className='item-row'>
              {item.mainImageId ? (
                <Image className='item-image' src={resolveFileUrl(item.mainImageId)} mode='aspectFill' />
              ) : (
                <View className='item-image placeholder' />
              )}
              <View className='item-info'>
                <Text className='item-name line-clamp-2'>{item.productName}</Text>
                <Text className='item-sku'>{item.skuName}</Text>
                <View className='item-bottom'>
                  <Text className='item-price'>{formatCurrency(item.unitPrice)}</Text>
                  <Text className='item-quantity'>x{item.quantity}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        <View className='card amount-card'>
          <View className='amount-row'>
            <Text className='label'>商品总额</Text>
            <Text className='value'>{formatCurrency(order.totalAmount)}</Text>
          </View>
          <View className='amount-row'>
            <Text className='label'>运费</Text>
            <Text className='value'>{formatCurrency(order.freightAmount)}</Text>
          </View>
          <View className='amount-row total'>
            <Text className='label'>实付金额</Text>
            <Text className='value'>{formatCurrency(order.payAmount)}</Text>
          </View>
        </View>

        {timeline.length > 0 ? (
          <View className='card timeline-card'>
            <Text className='section-title'>订单时间线</Text>
            {timeline.map((event, idx) => (
              <View key={idx} className='timeline-item'>
                <View className='dot' />
                <View className='timeline-info'>
                  <Text className='timeline-title'>{event.title}</Text>
                  <Text className='timeline-content'>{event.content}</Text>
                  <Text className='timeline-time'>{event.time}</Text>
                </View>
              </View>
            ))}
          </View>
        ) : null}

        <View className='safe-bottom' />
      </ScrollView>

      {order.orderStatus === 'SHIPPED' ? (
        <View className='bottom-bar'>
          <Button className='confirm-btn' disabled={confirming} onClick={handleConfirmReceive}>
            {confirming ? '处理中...' : '确认收货'}
          </Button>
        </View>
      ) : null}
    </View>
  )
}
