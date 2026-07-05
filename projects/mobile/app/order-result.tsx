import { useLocalSearchParams, useRouter } from 'expo-router'
import { View, StyleSheet } from 'react-native'
import { Text } from 'react-native-paper'
import { Card } from '../src/components/ui/Card'
import { Button } from '../src/components/ui/Button'
import { Icon } from '../src/components/ui/Icon'
import { Tokens } from '../src/theme'

const STATUS_MAP: Record<string, { label: string; color: string; icon: any }> = {
  WAIT_PAY: { label: '待付款', color: Tokens.warning, icon: 'clock' },
  PENDING_AUDIT: { label: '待审核', color: Tokens.warningDark as string, icon: 'package' },
  WAIT_SHIP: { label: '待发货', color: Tokens.accent, icon: 'package' },
  WAIT_RECEIVE: { label: '待收货', color: Tokens.accent, icon: 'truck' },
  FINISHED: { label: '已完成', color: Tokens.success, icon: 'shieldCheck' },
  CANCELLED: { label: '已取消', color: Tokens.muted, icon: 'x' },
}

export default function OrderResultPage() {
  const router = useRouter()
  const params = useLocalSearchParams<{
    orderId?: string
    orderNo?: string
    payAmount?: string
    orderStatus?: string
    payStatus?: string
  }>()

  const status = STATUS_MAP[params.orderStatus || ''] || STATUS_MAP.WAIT_PAY

  return (
    <View style={styles.container}>
      <Card style={styles.card} padding="lg">
        <View style={[styles.iconWrap, { backgroundColor: status.color + '18' }]}>
          <Icon name={status.icon} size={36} color={status.color} />
        </View>
        <Text variant="headlineMedium" style={[styles.statusText, { color: status.color }]}>
          {status.label}
        </Text>

        {params.orderNo && (
          <Text variant="bodyMedium" style={styles.orderNo}>
            订单号: {params.orderNo}
          </Text>
        )}

        {params.payAmount && (
          <Text variant="titleLarge" style={styles.amount}>
            ¥{parseFloat(params.payAmount).toFixed(2)}
          </Text>
        )}

        <View style={styles.infoSection}>
          {params.payStatus === 'UNPAID' ? (
            <Text variant="bodyMedium" style={styles.infoText}>
              请按照约定的支付方式进行付款，付款后请上传凭证
            </Text>
          ) : (
            <Text variant="bodyMedium" style={styles.infoText}>
              感谢您的订购！
            </Text>
          )}
        </View>

        <View style={styles.buttons}>
          <Button variant="outline" size="md" fullWidth style={styles.btn} onPress={() => router.replace('/(tabs)')}>
            继续购物
          </Button>
          {params.orderId && (
            <Button variant="primary" size="md" fullWidth style={styles.btn} onPress={() => router.replace(`/order/${params.orderId}`)}>
              查看订单
            </Button>
          )}
        </View>
      </Card>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Tokens.background,
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 24,
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusText: { fontWeight: '700', marginBottom: 8 },
  orderNo: { color: Tokens.muted, marginBottom: 8 },
  amount: { color: Tokens.price, fontWeight: '700', marginBottom: 16, fontSize: 28 },
  infoSection: { marginBottom: 24 },
  infoText: { color: Tokens.muted, textAlign: 'center', lineHeight: 22 },
  buttons: { flexDirection: 'row', gap: 12, width: '100%' },
  btn: { flex: 1 },
})
