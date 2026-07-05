import { useEffect, useState } from 'react'
import { View, Text, ScrollView, Button } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { fetchCustomerOrders } from '../../api/customer'
import { formatCurrency } from '../../utils/format'
import { useSessionStore } from '../../stores/session'
import type { OrderSummary } from '../../api/customer'
import './list.scss'

const STATUS_TABS = [
  { key: 'ALL', label: '全部' },
  { key: 'PENDING_PAYMENT', label: '待付款' },
  { key: 'PENDING_SHIP', label: '待发货' },
  { key: 'SHIPPED', label: '待收货' },
  { key: 'COMPLETED', label: '已完成' },
]

const STATUS_MAP: Record<string, string> = {
  PENDING_PAYMENT: '待付款',
  PENDING_APPROVAL: '待审核',
  PENDING_SHIP: '待发货',
  SHIPPED: '待收货',
  COMPLETED: '已完成',
  CANCELLED: '已取消',
}

export default function OrderListPage() {
  const [activeTab, setActiveTab] = useState('ALL')
  const [orders, setOrders] = useState<OrderSummary[]>([])
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const profile = useSessionStore((s) => s.profile)

  useEffect(() => {
    if (profile) {
      setPage(1)
      loadOrders(1, true)
    }
  }, [profile, activeTab])

  async function loadOrders(nextPage: number, reset = false) {
    if (loading) return
    setLoading(true)
    try {
      const result = await fetchCustomerOrders({ page: nextPage, pageSize: 20 })
      let list = result?.list || []
      if (activeTab !== 'ALL') {
        list = list.filter((o) => o.orderStatus === activeTab)
      }
      setOrders((prev) => (reset ? list : [...prev, ...list]))
      setHasMore(list.length === 20 && (nextPage * 20) < (result?.total || 0))
      setPage(nextPage)
    } catch (err: any) {
      Taro.showToast({ title: err?.message || '加载失败', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  function handleScrollToLower() {
    if (hasMore && !loading) {
      loadOrders(page + 1)
    }
  }

  function goDetail(order: OrderSummary) {
    Taro.navigateTo({ url: `/pages/order/detail?id=${order.orderId}` })
  }

  if (!profile) {
    return (
      <View className='order-list-page empty'>
        <Text className='text-muted'>请先登录</Text>
        <Button className='btn-primary login-btn' onClick={() => Taro.navigateTo({ url: '/pages/login/index' })}>
          去登录
        </Button>
      </View>
    )
  }

  return (
    <View className='order-list-page'>
      <ScrollView className='tab-bar' scrollX>
        {STATUS_TABS.map((tab) => (
          <View
            key={tab.key}
            className={`tab-item ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            <Text>{tab.label}</Text>
          </View>
        ))}
      </ScrollView>

      <ScrollView className='order-list' scrollY onScrollToLower={handleScrollToLower}>
        {orders.length === 0 && !loading ? (
          <View className='empty-state'>
            <Text className='text-muted'>暂无订单</Text>
          </View>
        ) : (
          orders.map((order) => (
            <View key={order.orderId} className='order-card' onClick={() => goDetail(order)}>
              <View className='order-header'>
                <Text className='order-no'>订单 {order.orderNo}</Text>
                <Text className='order-status'>{STATUS_MAP[order.orderStatus] || order.orderStatus}</Text>
              </View>
              <View className='order-body'>
                <Text className='shop-name'>{order.merchantName}</Text>
                <Text className='order-meta'>
                  共 {order.productCount} 件商品 · 实付 {formatCurrency(order.payAmount)}
                </Text>
              </View>
              <View className='order-footer'>
                <Text className='create-time'>{order.createTime}</Text>
                <Text className='detail-link'>查看详情 ›</Text>
              </View>
            </View>
          ))
        )}
        {loading ? <Text className='load-more'>加载中...</Text> : null}
        {!hasMore && orders.length > 0 ? <Text className='load-more'>没有更多了</Text> : null}
      </ScrollView>
    </View>
  )
}
