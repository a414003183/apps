import { useState, useMemo } from 'react'
import { useRouter } from 'expo-router'
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { useQuery } from '@tanstack/react-query'
import { ActivityIndicator } from 'react-native-paper'
import { fetchCustomerOrders } from '../../src/api/customer'
import { Card } from '../../src/components/ui/Card'
import { Chip } from '../../src/components/ui/Chip'
import { Icon } from '../../src/components/ui/Icon'
import { Tokens } from '../../src/theme'
import type { OrderSummary } from '../../src/types/api'

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  WAIT_PAY: { label: '待付款', color: Tokens.warning, bg: Tokens.warningSoft },
  PENDING_AUDIT: { label: '待审核', color: Tokens.warningDark as string, bg: Tokens.warningSoft },
  WAIT_SHIP: { label: '待发货', color: Tokens.accent, bg: Tokens.accentSoft },
  WAIT_RECEIVE: { label: '待收货', color: Tokens.accent, bg: Tokens.accentSoft },
  FINISHED: { label: '已完成', color: Tokens.success, bg: Tokens.successSoft },
  CANCELLED: { label: '已取消', color: Tokens.muted, bg: Tokens.surfaceSecondary },
}

const STATUS_FILTERS = [
  { key: 'ALL', label: '全部' },
  { key: 'WAIT_PAY', label: '待付款' },
  { key: 'WAIT_SHIP', label: '待发货' },
  { key: 'WAIT_RECEIVE', label: '待收货' },
  { key: 'FINISHED', label: '已完成' },
]

function OrderCard({ order, onPress }: { order: OrderSummary; onPress: () => void }) {
  const status = STATUS_MAP[order.status] || { label: order.status, color: Tokens.muted, bg: Tokens.surfaceSecondary }

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85}>
      <Card padding="md">
        <View style={styles.orderHeader}>
          <Text style={styles.orderNo}>订单号: {order.orderNo}</Text>
          <Chip variant="default" compact style={{ backgroundColor: status.bg }}>
            <Text style={{ color: status.color, fontSize: 11, fontWeight: '700' }}>{status.label}</Text>
          </Chip>
        </View>

        <View style={styles.orderBody}>
          <Text numberOfLines={1} style={styles.merchantName}>
            商家: {order.merchantName}
          </Text>
          <Text style={styles.orderTime}>{order.createdAt}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.orderFooter}>
          <Text style={styles.orderAmount}>¥{(order.amount ?? 0).toFixed(2)}</Text>
          <Chip
            compact
            style={{
              backgroundColor: order.orderSource === 'ANDROID_APP' ? Tokens.accentSoft : Tokens.successSoft,
            }}
          >
            <Text
              style={{
                color: order.orderSource === 'ANDROID_APP' ? Tokens.accent : Tokens.success,
                fontSize: 11,
                fontWeight: '600',
              }}
            >
              {order.orderSource === 'ANDROID_APP' ? 'Android App' : '网页商城'}
            </Text>
          </Chip>
        </View>
      </Card>
    </TouchableOpacity>
  )
}

export default function OrdersPage() {
  const router = useRouter()
  const [statusFilter, setStatusFilter] = useState('ALL')

  const { data: orders, isLoading } = useQuery({
    queryKey: ['customer-orders'],
    queryFn: fetchCustomerOrders,
  })

  const filteredOrders = useMemo(() => {
    if (!orders) return []
    if (statusFilter === 'ALL') return orders
    return orders.filter(o => o.status === statusFilter)
  }, [orders, statusFilter])

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Tokens.accent} />
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.filterBar}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={STATUS_FILTERS}
          keyExtractor={item => item.key}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.filterItem, statusFilter === item.key && styles.filterItemActive]}
              onPress={() => setStatusFilter(item.key)}
            >
              <Text style={[styles.filterText, statusFilter === item.key && styles.filterTextActive]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.filterList}
        />
      </View>

      {filteredOrders.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon name="package" size={56} color={Tokens.muted} />
          <Text style={styles.emptyText}>暂无订单</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/categories')}>
            <Text style={styles.goShopping}>去购物 ›</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredOrders}
          renderItem={({ item }: { item: OrderSummary }) => (
            <OrderCard order={item} onPress={() => router.push(`/order/${item.id}` as const)} />
          )}
          keyExtractor={(item: OrderSummary) => `order-${item.id}`}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Tokens.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  filterBar: {
    backgroundColor: Tokens.surface,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Tokens.separator,
  },
  filterList: { paddingHorizontal: 12, gap: 8 },
  filterItem: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: Tokens.radiusFull,
    backgroundColor: Tokens.surfaceSecondary,
    marginRight: 8,
    borderWidth: 1,
    borderColor: Tokens.separator,
  },
  filterItemActive: {
    backgroundColor: Tokens.accent,
    borderColor: Tokens.accent,
  },
  filterText: { fontSize: 13, color: Tokens.muted, fontWeight: '500' },
  filterTextActive: { color: '#fff', fontWeight: '600' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  emptyText: { color: Tokens.muted, fontSize: 16 },
  goShopping: { color: Tokens.accent, fontSize: 16, fontWeight: '600' },
  list: { padding: 12 },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  orderNo: { color: Tokens.muted, fontSize: 12, fontWeight: '500' },
  orderBody: { marginBottom: 10 },
  merchantName: { color: Tokens.foreground, fontSize: 14, fontWeight: '500' },
  orderTime: { color: Tokens.muted, marginTop: 4, fontSize: 12 },
  divider: { height: 1, backgroundColor: Tokens.separator, marginBottom: 10 },
  orderFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderAmount: { color: Tokens.price, fontWeight: '700', fontSize: 16 },
})
