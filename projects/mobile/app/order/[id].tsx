import { useLocalSearchParams } from 'expo-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { View, StyleSheet, ScrollView, ActivityIndicator, Alert } from 'react-native'
import { Text, Divider, Chip } from 'react-native-paper'
import { fetchOrderDetail, fetchOrderTimeline, confirmReceive } from '../../src/api/customer'
import { Card } from '../../src/components/ui/Card'
import { Button } from '../../src/components/ui/Button'
import { Icon } from '../../src/components/ui/Icon'
import { Tokens } from '../../src/theme'
import type { OrderLineItem as OrderItem, TimelineEvent } from '../../src/types/api'

const STATUS_MAP: Record<string, { label: string; color: string; icon: any }> = {
  WAIT_PAY: { label: '待付款', color: Tokens.warning, icon: 'shieldCheck' },
  PENDING_AUDIT: { label: '待审核', color: Tokens.warningDark as string, icon: 'clock' },
  WAIT_SHIP: { label: '待发货', color: Tokens.accent, icon: 'package' },
  WAIT_RECEIVE: { label: '待收货', color: Tokens.accent, icon: 'truck' },
  FINISHED: { label: '已完成', color: Tokens.success, icon: 'shieldCheck' },
  CANCELLED: { label: '已取消', color: Tokens.muted, icon: 'x' },
}

export default function OrderDetailPage() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const queryClient = useQueryClient()

  const { data: detail, isLoading } = useQuery({
    queryKey: ['order-detail', id],
    queryFn: () => fetchOrderDetail(id!) as Promise<any>,
    enabled: !!id,
  })

  const { data: timeline } = useQuery({
    queryKey: ['order-timeline', id],
    queryFn: () => fetchOrderTimeline(id!),
    enabled: !!id,
  })

  const confirmMutation = useMutation({
    mutationFn: () => confirmReceive(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order-detail', id] })
      queryClient.invalidateQueries({ queryKey: ['order-timeline', id] })
      queryClient.invalidateQueries({ queryKey: ['customer-orders'] })
      Alert.alert('成功', '已确认收货')
    },
    onError: (err: any) => {
      Alert.alert('失败', err.message || '操作失败')
    },
  })

  if (isLoading || !detail) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Tokens.accent} />
      </View>
    )
  }

  const status = STATUS_MAP[detail.status] || { label: detail.status, color: Tokens.muted, icon: 'package' }

  return (
    <ScrollView style={styles.container}>
      {/* Status Banner */}
      <View style={[styles.statusBanner, { backgroundColor: status.color }]}>
        <Icon name={status.icon} size={32} color="#fff" />
        <Text style={styles.statusLabel}>{status.label}</Text>
      </View>

      {/* Address Card */}
      <Card header="收货信息" padding="md">
        <Text variant="bodyMedium" style={styles.receiverName}>
          {detail.receiverName || (detail as any).receiverName || '-'} {(detail as any).receiverPhone || ''}
        </Text>
        <Text variant="bodySmall" style={styles.addressText}>
          {(detail as any).receiverAddress || '-'}
        </Text>
      </Card>

      {/* Items Card */}
      <Card style={styles.card} header="商品清单" padding="md">
        {detail.items?.map((item: OrderItem, idx: number) => (
          <View key={idx} style={styles.orderItem}>
            <Icon name="package" size={28} color={Tokens.accent} />
            <View style={styles.itemInfo}>
              <Text variant="bodySmall" numberOfLines={1} style={styles.itemName}>
                {item.spuName}
              </Text>
              <Text variant="bodySmall" style={styles.itemSku}>
                {item.skuName}
              </Text>
            </View>
            <View style={styles.itemRight}>
              <Text variant="bodySmall" style={styles.itemPrice}>
                ¥{(item.unitPrice ?? 0).toFixed(2)}
              </Text>
              <Text variant="bodySmall" style={styles.itemQty}>
                x{item.quantity}
              </Text>
            </View>
          </View>
        ))}

        <Divider style={styles.divider} />

        <View style={styles.amountRow}>
          <Text variant="bodySmall" style={styles.amountLabel}>
            商品总额
          </Text>
          <Text variant="bodySmall">¥{((detail as any).goodsAmount ?? 0).toFixed(2)}</Text>
        </View>
        <View style={styles.amountRow}>
          <Text variant="bodySmall" style={styles.amountLabel}>
            运费
          </Text>
          <Text variant="bodySmall">¥{((detail as any).freightAmount ?? 0).toFixed(2)}</Text>
        </View>
        <View style={styles.amountRow}>
          <Text variant="bodySmall" style={styles.amountLabel}>
            优惠
          </Text>
          <Text variant="bodySmall">-¥{((detail as any).discountAmount ?? 0).toFixed(2)}</Text>
        </View>
        <View style={[styles.amountRow, styles.totalRow]}>
          <Text variant="titleSmall" style={styles.totalLabel}>
            应付总额
          </Text>
          <Text variant="titleSmall" style={styles.totalAmount}>
            ¥{(detail.amount ?? 0).toFixed(2)}
          </Text>
        </View>
      </Card>

      {/* Order Info Card */}
      <Card style={styles.card} header="订单信息" padding="md">
        <View style={styles.infoRow}>
          <Text variant="bodySmall" style={styles.infoLabel}>
            订单号
          </Text>
          <Text variant="bodySmall" selectable style={styles.infoValue}>
            {detail.orderNo}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Text variant="bodySmall" style={styles.infoLabel}>
            下单时间
          </Text>
          <Text variant="bodySmall" style={styles.infoValue}>
            {detail.createdAt}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Text variant="bodySmall" style={styles.infoLabel}>
            订单来源
          </Text>
          <Chip
            compact
            style={[
              styles.sourceChip,
              {
                backgroundColor: detail.orderSource === 'ANDROID_APP' ? Tokens.accentSoft : Tokens.successSoft,
              },
            ]}
            textStyle={{
              color: detail.orderSource === 'ANDROID_APP' ? Tokens.accent : Tokens.success,
              fontSize: 11,
              fontWeight: '600',
            }}
          >
            {detail.orderSource === 'ANDROID_APP' ? '安卓App下单' : '网页商城'}
          </Chip>
        </View>
        {(detail as any).customerRemark && (
          <View style={styles.infoRow}>
            <Text variant="bodySmall" style={styles.infoLabel}>
              备注
            </Text>
            <Text variant="bodySmall" style={styles.remark}>
              {(detail as any).customerRemark}
            </Text>
          </View>
        )}
      </Card>

      {/* Timeline */}
      {timeline && timeline.length > 0 && (
        <Card style={styles.card} header="订单轨迹" padding="md">
          {timeline.map((event: TimelineEvent, idx: number) => (
            <View key={event.id || idx} style={styles.timelineItem}>
              <View style={styles.timelineDot} />
              <View style={styles.timelineContent}>
                <Text variant="bodySmall" style={styles.timelineTitle}>
                  {event.title}
                </Text>
                <Text variant="bodySmall" style={styles.timelineTime}>
                  {event.eventTime}
                </Text>
                {event.description && (
                  <Text variant="bodySmall" style={styles.timelineDesc}>
                    {event.description}
                  </Text>
                )}
              </View>
            </View>
          ))}
        </Card>
      )}

      {/* Actions */}
      {detail.status === 'WAIT_RECEIVE' && (
        <View style={styles.actionArea}>
          <Button
            variant="primary"
            size="lg"
            fullWidth
            onPress={() => confirmMutation.mutate()}
            loading={confirmMutation.isPending}
          >
            确认收货
          </Button>
        </View>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Tokens.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  statusBanner: {
    paddingVertical: 28,
    paddingHorizontal: 20,
    alignItems: 'center',
    gap: 8,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  statusLabel: { color: '#fff', fontSize: 18, fontWeight: '700' },
  card: {
    marginHorizontal: 12,
    marginBottom: 12,
  },
  receiverName: { fontWeight: '600', color: Tokens.foreground },
  addressText: { color: Tokens.muted, marginTop: 4, lineHeight: 20 },
  orderItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, gap: 10 },
  itemInfo: { flex: 1 },
  itemName: { color: Tokens.foreground, fontWeight: '500' },
  itemSku: { color: Tokens.muted, fontSize: 12, marginTop: 2 },
  itemRight: { alignItems: 'flex-end' },
  itemPrice: { color: Tokens.foreground, fontWeight: '600' },
  itemQty: { color: Tokens.muted, fontSize: 12, marginTop: 2 },
  divider: { marginVertical: 10, backgroundColor: Tokens.separator },
  amountRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5 },
  amountLabel: { color: Tokens.muted },
  totalRow: { marginTop: 6, paddingTop: 6, borderTopWidth: 1, borderTopColor: Tokens.separator },
  totalLabel: { fontWeight: '700', color: Tokens.foreground },
  totalAmount: { color: Tokens.price, fontWeight: '700', fontSize: 16 },
  infoRow: { flexDirection: 'row', paddingVertical: 6, gap: 12, alignItems: 'center' },
  infoLabel: { color: Tokens.muted, minWidth: 60, fontWeight: '500' },
  infoValue: { flex: 1, color: Tokens.muted },
  sourceChip: { height: 24 },
  remark: { flex: 1, color: Tokens.muted },
  timelineItem: { flexDirection: 'row', paddingVertical: 8 },
  timelineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Tokens.accent,
    marginTop: 5,
    marginRight: 12,
  },
  timelineContent: { flex: 1 },
  timelineTitle: { fontWeight: '600', color: Tokens.foreground },
  timelineTime: { color: Tokens.muted, fontSize: 11, marginTop: 2 },
  timelineDesc: { color: Tokens.muted, marginTop: 4, fontSize: 12 },
  actionArea: { padding: 12 },
})
