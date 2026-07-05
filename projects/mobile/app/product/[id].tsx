import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { View, StyleSheet, ScrollView, TouchableOpacity, Image, Alert } from 'react-native'
import { Text, ActivityIndicator, Snackbar } from 'react-native-paper'
import { fetchProductDetail, addCartItem } from '../../src/api/mall'
import { getImageUrl } from '../../src/utils/image'
import { useCartStore } from '../../src/store/cartStore'
import { useAuthStore } from '../../src/store/authStore'
import { Card } from '../../src/components/ui/Card'
import { Chip } from '../../src/components/ui/Chip'
import { Button } from '../../src/components/ui/Button'
import { Icon } from '../../src/components/ui/Icon'
import { Tokens } from '../../src/theme'

export default function ProductDetailPage() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const queryClient = useQueryClient()
  const { user } = useAuthStore()
  const setCartItems = useCartStore(s => s.setItems)

  const [snackbar, setSnackbar] = useState('')
  const [quantity, setQuantity] = useState(1)

  const {
    data: product,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['product', id],
    queryFn: () => fetchProductDetail(Number(id)),
    enabled: !!id,
  })

  const addToCartMutation = useMutation({
    mutationFn: () => addCartItem({ merchantGoodsId: Number(id), quantity }),
    onSuccess: items => {
      setCartItems(items)
      setSnackbar('已加入购物车')
      queryClient.invalidateQueries({ queryKey: ['cart'] })
    },
    onError: (err: any) => {
      setSnackbar(err.message || '加入购物车失败')
    },
  })

  const handleBuyNow = () => {
    if (!user) {
      Alert.alert('提示', '请先登录', [
        { text: '取消', style: 'cancel' },
        { text: '去登录', onPress: () => router.push('/login') },
      ])
      return
    }
    router.push({
      pathname: '/checkout',
      params: {
        merchantGoodsId: id,
        skuId: product?.skuId?.toString() || '',
        quantity: quantity.toString(),
        isDirectBuy: 'true',
      },
    })
  }

  const handleAddToCart = () => {
    if (!user) {
      Alert.alert('提示', '请先登录', [
        { text: '取消', style: 'cancel' },
        { text: '去登录', onPress: () => router.push('/login') },
      ])
      return
    }
    addToCartMutation.mutate()
  }

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Tokens.accent} />
      </View>
    )
  }

  if (error || !product) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>商品不存在或已下架</Text>
      </View>
    )
  }

  const mp = product.memberPrice || product.price
  const hasDiscount = product.price > mp

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Image */}
        <View style={styles.imageContainer}>
          {product.mainImageId ? (
            <Image source={{ uri: getImageUrl(product.mainImageId)! }} style={styles.productImage} resizeMode="cover" />
          ) : (
            <Icon name="store" size={48} color={Tokens.muted} />
          )}
          {product.badge && (
            <View style={styles.badge}>
              <Chip variant="accent" compact>
                {product.badge}
              </Chip>
            </View>
          )}
        </View>

        {/* Main Info */}
        <Card style={styles.infoCard} padding="md">
          <Text style={styles.name}>{product.name}</Text>
          {product.summary ? <Text style={styles.summary}>{product.summary}</Text> : null}

          <View style={styles.priceBox}>
            <View style={styles.priceRow}>
              <View>
                <Text style={styles.priceLabel}>会员价</Text>
                <Text style={styles.price}>¥{mp.toFixed(mp % 1 === 0 ? 0 : 2)}</Text>
              </View>
              {hasDiscount && (
                <View>
                  <Text style={styles.priceLabel}>市场价</Text>
                  <Text style={styles.originalPrice}>¥{product.price.toFixed(2)}</Text>
                </View>
              )}
            </View>

            {product.levelPrices && product.levelPrices.length > 0 && (
              <View style={styles.levelPrices}>
                {product.levelPrices.map((lp: { levelCode: string; levelName: string; price: number }) => (
                  <Chip
                    key={lp.levelCode}
                    variant={lp.levelCode === product.currentLevel ? 'accent' : 'tertiary'}
                    compact
                  >
                    {lp.levelName}: ¥{lp.price.toFixed(2)}
                  </Chip>
                ))}
              </View>
            )}
          </View>

          {/* Service guarantees */}
          <View style={styles.serviceRow}>
            <View style={styles.serviceItem}>
              <Icon name="truck" size={14} color={Tokens.accent} />
              <Text style={styles.serviceText}>配送: {product.leadTime || '待确认'}</Text>
            </View>
            <View style={styles.serviceItem}>
              <Icon name="shieldCheck" size={14} color={Tokens.success} />
              <Text style={styles.serviceText}>库存: {product.stock}</Text>
            </View>
            <View style={styles.serviceItem}>
              <Icon name="package" size={14} color={Tokens.warning} />
              <Text style={styles.serviceText}>运费: ¥{product.freightAmount ?? 0}</Text>
            </View>
          </View>

          {/* Specs */}
          <View style={styles.specsBox}>
            <SpecRow label="品牌" value={product.brand} />
            <SpecRow label="分类" value={product.category} />
            <SpecRow label="规格" value={product.specs || '标准规格'} />
            <TouchableOpacity
              style={styles.shopRow}
              onPress={() => router.push(`/shop/${product.merchantId}` as any)}
              activeOpacity={0.7}
            >
              <Text style={styles.specLabel}>店铺</Text>
              <View style={styles.shopLink}>
                <Icon name="store" size={13} color={Tokens.accent} />
                <Text style={styles.shopName}>{product.shopName}</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Quantity */}
          <View style={styles.quantityRow}>
            <Text style={styles.quantityLabel}>数量</Text>
            <View style={styles.quantityControl}>
              <TouchableOpacity
                style={styles.qtyBtn}
                onPress={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
              >
                <Icon name="minus" size={14} color={quantity <= 1 ? Tokens.muted : Tokens.foreground} />
              </TouchableOpacity>
              <Text style={styles.qtyText}>{quantity}</Text>
              <TouchableOpacity
                style={styles.qtyBtn}
                onPress={() => setQuantity(Math.min(product.stock, quantity + 1))}
                disabled={quantity >= product.stock}
              >
                <Icon name="plus" size={14} color={quantity >= product.stock ? Tokens.muted : Tokens.foreground} />
              </TouchableOpacity>
            </View>
            <Text style={styles.stockText}>库存 {product.stock} 件</Text>
          </View>

          {/* Actions */}
          <View style={styles.actionRow}>
            <Button variant="primary" size="lg" style={styles.actionBtn} icon="arrowRight" onPress={handleBuyNow}>
              立即购买
            </Button>
            <Button
              variant="secondary"
              size="lg"
              style={styles.actionBtn}
              icon="shoppingCart"
              loading={addToCartMutation.isPending}
              onPress={handleAddToCart}
            >
              加入购物车
            </Button>
          </View>
        </Card>

        {/* Details */}
        {(product.detailContent || product.description) && (
          <Card style={styles.detailCard} header="商品详情" padding="md">
            {product.detailContent ? (
              <View style={styles.detailBlock}>
                <Text style={styles.detailTitle}>详细描述</Text>
                <Text style={styles.detailText}>{product.detailContent}</Text>
              </View>
            ) : null}
            {product.description ? (
              <View style={styles.detailBlock}>
                <Text style={styles.detailTitle}>商品说明</Text>
                <Text style={styles.detailText}>{product.description}</Text>
              </View>
            ) : null}
          </Card>
        )}

        {/* Purchase Info */}
        <Card style={styles.detailCard} header="采购信息" padding="md">
          <InfoRow label="所属分类" value={product.category} />
          <InfoRow label="商品规格" value={product.specs || '标准'} />
          <InfoRow label="累计销量" value={`${product.saleCount ?? 0} 件`} />
          <InfoRow label="最小起订" value="1 件" />
        </Card>

        <View style={{ height: 100 }} />
      </ScrollView>

      <Snackbar
        visible={!!snackbar}
        onDismiss={() => setSnackbar('')}
        duration={2000}
        style={{ backgroundColor: Tokens.foreground }}
      >
        {snackbar}
      </Snackbar>
    </View>
  )
}

function SpecRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.specRow}>
      <Text style={styles.specLabel}>{label}</Text>
      <Text style={styles.specValue} numberOfLines={1}>
        {value}
      </Text>
    </View>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Tokens.background },
  scrollView: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { color: Tokens.muted },
  imageContainer: {
    height: 320,
    backgroundColor: Tokens.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  productImage: { width: '100%', height: '100%' },
  badge: { position: 'absolute', top: 12, right: 12 },
  infoCard: {
    margin: 12,
  },
  name: {
    fontSize: 18,
    fontWeight: '700',
    color: Tokens.foreground,
    lineHeight: 26,
    marginBottom: 4,
  },
  summary: {
    fontSize: 13,
    color: Tokens.muted,
    marginBottom: 14,
    lineHeight: 20,
  },
  priceBox: {
    backgroundColor: Tokens.accentSoft,
    borderRadius: Tokens.radiusLg,
    padding: 14,
    marginBottom: 14,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 16,
  },
  priceLabel: {
    fontSize: 12,
    color: Tokens.muted,
  },
  price: {
    fontSize: 30,
    fontWeight: '800',
    color: Tokens.accent,
    letterSpacing: -0.5,
  },
  originalPrice: {
    fontSize: 14,
    color: Tokens.muted,
    textDecorationLine: 'line-through',
  },
  levelPrices: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  serviceRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: Tokens.separator,
    marginBottom: 14,
  },
  serviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  serviceText: {
    fontSize: 12,
    color: Tokens.foreground,
  },
  specsBox: {
    gap: 10,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: Tokens.separator,
    marginBottom: 14,
  },
  specRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  specLabel: {
    width: 50,
    fontSize: 13,
    color: Tokens.muted,
  },
  specValue: {
    flex: 1,
    fontSize: 13,
    color: Tokens.foreground,
  },
  shopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  shopLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  shopName: {
    fontSize: 13,
    color: Tokens.accent,
    fontWeight: '500',
  },
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  quantityLabel: {
    fontSize: 13,
    color: Tokens.muted,
  },
  quantityControl: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Tokens.separator,
    borderRadius: Tokens.radius,
    overflow: 'hidden',
  },
  qtyBtn: {
    width: 34,
    height: 34,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Tokens.surfaceSecondary,
  },
  qtyText: {
    width: 44,
    textAlign: 'center',
    fontSize: 14,
    color: Tokens.foreground,
    fontWeight: '600',
  },
  stockText: {
    fontSize: 11,
    color: Tokens.muted,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  actionBtn: {
    flex: 1,
  },
  detailCard: {
    marginHorizontal: 12,
    marginBottom: 12,
  },
  detailBlock: {
    marginBottom: 14,
  },
  detailTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Tokens.foreground,
    marginBottom: 6,
  },
  detailText: {
    fontSize: 13,
    color: Tokens.foreground,
    lineHeight: 22,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Tokens.separator,
  },
  infoLabel: {
    fontSize: 13,
    color: Tokens.muted,
  },
  infoValue: {
    fontSize: 13,
    color: Tokens.foreground,
  },
})
