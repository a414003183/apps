import { useEffect } from 'react'
import { Alert, View, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native'
import { Text, RadioButton, ActivityIndicator } from 'react-native-paper'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { fetchCustomerProfile } from '../src/api/customer'
import { checkout, directBuy } from '../src/api/mall'
import { getImageUrl } from '../src/utils/image'
import { useCartStore } from '../src/store/cartStore'
import { useAuthStore } from '../src/store/authStore'
import { Card } from '../src/components/ui/Card'
import { Input } from '../src/components/ui/Input'
import { Button } from '../src/components/ui/Button'
import { Icon } from '../src/components/ui/Icon'
import { Tokens } from '../src/theme'
import type { MallCartItem, CustomerProfile } from '../src/types/api'

const checkoutSchema = z.object({
  receiverName: z.string().min(1, '请输入收货人'),
  receiverPhone: z.string().min(1, '请输入手机号').regex(/^1[3-9]\d{9}$/, '手机号格式不正确'),
  receiverAddress: z.string().min(1, '请输入详细地址'),
  payMethod: z.string().min(1, '请选择支付方式'),
  customerRemark: z.string().optional(),
})

type CheckoutForm = z.infer<typeof checkoutSchema>

const PAY_METHODS = [
  { value: 'BANK_TRANSFER', label: '银行转账', desc: '转账到公司账户' },
  { value: 'PUBLIC_ACCOUNT', label: '对公打款', desc: '企业公账汇款' },
]

export default function CheckoutPage() {
  const router = useRouter()
  const params = useLocalSearchParams<{
    merchantGoodsId?: string
    skuId?: string
    quantity?: string
    isDirectBuy?: string
  }>()
  const { items, selectedIds, clear } = useCartStore()
  const { user } = useAuthStore()

  const isDirectBuy = params.isDirectBuy === 'true'
  const merchantGoodsId = params.merchantGoodsId ? Number(params.merchantGoodsId) : undefined
  const skuId = params.skuId ? Number(params.skuId) : undefined
  const quantity = params.quantity ? Number(params.quantity) : 1

  const selectedItems = items.filter((item: MallCartItem) => selectedIds.has(item.merchantGoodsId))
  const selectedTotal = selectedItems.reduce((sum: number, item: MallCartItem) => sum + (item.lineAmount ?? 0), 0)

  const { data: profile, isLoading } = useQuery<CustomerProfile>({
    queryKey: ['customer-profile'],
    queryFn: fetchCustomerProfile,
    enabled: !!user,
  })

  const {
    control,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<CheckoutForm>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      payMethod: 'BANK_TRANSFER',
      customerRemark: '',
    },
  })

  useEffect(() => {
    if (profile?.defaultAddress) {
      const addr = profile.defaultAddress
      setValue('receiverName', addr.receiverName || '')
      setValue('receiverPhone', addr.receiverPhone || '')
      setValue('receiverAddress', addr.receiverAddress || '')
    }
  }, [profile, setValue])

  const checkoutMutation = useMutation({
    mutationFn: async (data: CheckoutForm) => {
      if (isDirectBuy && merchantGoodsId && skuId) {
        return directBuy({
          merchantGoodsId,
          skuId,
          quantity,
          receiverName: data.receiverName,
          receiverPhone: data.receiverPhone,
          receiverProvince: profile?.defaultAddress?.receiverProvince || '',
          receiverCity: profile?.defaultAddress?.receiverCity || '',
          receiverDistrict: profile?.defaultAddress?.receiverDistrict || '',
          receiverAddress: data.receiverAddress,
          payMethod: data.payMethod,
          customerRemark: data.customerRemark,
        })
      } else {
        return checkout({
          receiverName: data.receiverName,
          receiverPhone: data.receiverPhone,
          receiverProvince: profile?.defaultAddress?.receiverProvince || '',
          receiverCity: profile?.defaultAddress?.receiverCity || '',
          receiverDistrict: profile?.defaultAddress?.receiverDistrict || '',
          receiverAddress: data.receiverAddress,
          payMethod: data.payMethod,
          customerRemark: data.customerRemark,
        })
      }
    },
    onSuccess: result => {
      clear()
      router.replace({
        pathname: '/order-result',
        params: {
          orderId: result.id,
          orderNo: result.orderNo,
          payAmount: result.payAmount.toString(),
          orderStatus: result.orderStatus,
          payStatus: result.payStatus,
        },
      })
    },
    onError: (err: any) => {
      Alert.alert('提交订单失败', err.message || '')
    },
  })

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Tokens.accent} />
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <Card header="填写订单信息" padding="md">
          {/* Address */}
          <View style={styles.cardHeader}>
            <Icon name="mapPin" size={16} color={Tokens.accent} />
            <Text style={styles.cardHeaderTitle}>收货信息</Text>
          </View>

          <Controller
            control={control}
            name="receiverName"
            render={({ field: { onChange, value } }) => (
              <Input label="收货人" value={value} onChangeText={onChange} error={errors.receiverName?.message} containerStyle={styles.input} />
            )}
          />

          <Controller
            control={control}
            name="receiverPhone"
            render={({ field: { onChange, value } }) => (
              <Input label="手机号" value={value} onChangeText={onChange} keyboardType="phone-pad" error={errors.receiverPhone?.message} containerStyle={styles.input} />
            )}
          />

          <Controller
            control={control}
            name="receiverAddress"
            render={({ field: { onChange, value } }) => (
              <Input
                label="详细地址"
                value={value}
                onChangeText={onChange}
                multiline
                numberOfLines={2}
                error={errors.receiverAddress?.message}
                containerStyle={styles.input}
              />
            )}
          />
        </Card>

        {/* Payment */}
        <Card style={styles.card} header="支付方式" padding="md">
          <Controller
            control={control}
            name="payMethod"
            render={({ field: { onChange, value } }) => (
              <View>
                {PAY_METHODS.map(method => (
                  <TouchableOpacity
                    key={method.value}
                    style={[styles.payOption, value === method.value && styles.payOptionActive]}
                    onPress={() => onChange(method.value)}
                  >
                    <RadioButton
                      value={method.value}
                      status={value === method.value ? 'checked' : 'unchecked'}
                      onPress={() => onChange(method.value)}
                      color={Tokens.accent}
                    />
                    <View style={styles.payInfo}>
                      <Text variant="bodyMedium" style={{ color: Tokens.foreground, fontWeight: '500' }}>
                        {method.label}
                      </Text>
                      <Text variant="bodySmall" style={styles.payDesc}>
                        {method.desc}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          />
        </Card>

        {/* Items */}
        <Card style={styles.card} header="商品清单" padding="md">
          {(isDirectBuy ? [{ merchantGoodsId, skuId, quantity }] : selectedItems).map((item: any, idx: number) => (
            <View key={idx} style={styles.orderItem}>
              {item.mainImageId ? (
                <Image source={{ uri: getImageUrl(item.mainImageId)! }} style={styles.itemImage} resizeMode="cover" />
              ) : (
                <Icon name="package" size={28} color={Tokens.muted} />
              )}
              <View style={styles.orderItemInfo}>
                <Text variant="bodySmall" numberOfLines={1} style={{ color: Tokens.foreground, fontWeight: '500' }}>
                  {isDirectBuy ? '商品' : (item as MallCartItem).productName}
                </Text>
                <Text variant="bodySmall" style={styles.orderItemQty}>
                  x{isDirectBuy ? quantity : (item as MallCartItem).quantity}
                </Text>
              </View>
            </View>
          ))}
        </Card>

        {/* Remark */}
        <Card style={styles.card} header="备注" padding="md">
          <Controller
            control={control}
            name="customerRemark"
            render={({ field: { onChange, value } }) => (
              <Input placeholder="选填，可输入备注信息" value={value} onChangeText={onChange} multiline numberOfLines={2} />
            )}
          />
        </Card>

        <View style={{ height: 100 }} />
      </ScrollView>

      <View style={styles.bottomBar}>
        <View style={styles.amountInfo}>
          <Text variant="bodySmall" style={styles.amountLabel}>
            应付金额
          </Text>
          <Text variant="headlineSmall" style={styles.amount}>
            ¥{selectedTotal.toFixed(2)}
          </Text>
        </View>
        <Button
          variant="primary"
          size="lg"
          onPress={handleSubmit(data => checkoutMutation.mutate(data))}
          loading={checkoutMutation.isPending}
          disabled={checkoutMutation.isPending}
          style={styles.submitBtn}
        >
          提交订单
        </Button>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Tokens.background },
  scrollView: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card: {
    marginHorizontal: 12,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  cardHeaderTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Tokens.foreground,
  },
  input: { marginBottom: 10 },
  payOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: Tokens.radius,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: Tokens.separator,
  },
  payOptionActive: {
    borderColor: Tokens.accent,
    backgroundColor: Tokens.accentSoft,
  },
  payInfo: { flex: 1, marginLeft: 8 },
  payDesc: { color: Tokens.muted },
  orderItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, gap: 12 },
  itemImage: { width: 48, height: 48, borderRadius: Tokens.radius },
  orderItemInfo: { flex: 1 },
  orderItemQty: { color: Tokens.muted, marginTop: 2 },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    paddingBottom: 28,
    backgroundColor: Tokens.surface,
    borderTopWidth: 1,
    borderTopColor: Tokens.separator,
    gap: 16,
  },
  amountInfo: { flex: 1 },
  amountLabel: { color: Tokens.muted },
  amount: { color: Tokens.price, fontWeight: '700' },
  submitBtn: { borderRadius: Tokens.radius },
})
