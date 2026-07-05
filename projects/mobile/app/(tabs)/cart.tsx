import { useState } from 'react'
import { Alert, View, StyleSheet, FlatList, TouchableOpacity, Image } from 'react-native'
import { Text, Checkbox, ActivityIndicator } from 'react-native-paper'
import { useRouter } from 'expo-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchCart, updateCartItem, removeCartItem } from '../../src/api/mall'
import { getImageUrl } from '../../src/utils/image'
import { useCartStore } from '../../src/store/cartStore'
import { useAuthStore } from '../../src/store/authStore'
import { Card } from '../../src/components/ui/Card'
import { Button } from '../../src/components/ui/Button'
import { Icon } from '../../src/components/ui/Icon'
import { Tokens } from '../../src/theme'
import type { MallCartItem } from '../../src/types/api'

function formatCurrency(value?: number) {
  return `¥${(value ?? 0).toFixed(2)}`
}

function CartItemRow({
  item,
  selected,
  onToggle,
  onUpdateQuantity,
  onRemove,
}: {
  item: MallCartItem
  selected: boolean
  onToggle: () => void
  onUpdateQuantity: (_qty: number) => void
  onRemove: () => void
}) {
  return (
    <View style={[styles.cartItem, selected && styles.cartItemSelected]}>
      <TouchableOpacity onPress={onToggle} style={styles.checkboxArea}>
        <Checkbox status={selected ? 'checked' : 'unchecked'} color={Tokens.accent} />
      </TouchableOpacity>

      <View style={styles.itemImage}>
        {item.mainImageId ? (
          <Image source={{ uri: getImageUrl(item.mainImageId)! }} style={styles.itemImageReal} resizeMode="cover" />
        ) : (
          <Icon name="package" size={28} color={Tokens.muted} />
        )}
      </View>

      <View style={styles.itemInfo}>
        <Text variant="bodyMedium" numberOfLines={2} style={styles.itemName}>
          {item.productName}
        </Text>
        <Text variant="bodySmall" style={styles.itemSku}>
          {item.skuName} {item.specText && `· ${item.specText}`}
        </Text>
        <View style={styles.priceRow}>
          <Text variant="titleSmall" style={styles.itemPrice}>
            {formatCurrency(item.finalUnitPrice)}
          </Text>
          {item.finalUnitPrice < item.unitPrice && (
            <Text variant="bodySmall" style={styles.originalPrice}>
              {formatCurrency(item.unitPrice)}
            </Text>
          )}
        </View>
      </View>

      <View style={styles.rightArea}>
        <TouchableOpacity onPress={onRemove} style={styles.removeBtn}>
          <Icon name="trash2" size={16} color={Tokens.muted} />
        </TouchableOpacity>
        <View style={styles.quantityArea}>
          <TouchableOpacity
            style={styles.qtyBtn}
            onPress={() => {
              if (item.quantity > 1) {
                onUpdateQuantity(item.quantity - 1)
              }
            }}
            disabled={item.quantity <= 1}
          >
            <Icon name="minus" size={14} color={item.quantity <= 1 ? Tokens.muted : Tokens.foreground} />
          </TouchableOpacity>
          <Text style={styles.qtyText}>{item.quantity}</Text>
          <TouchableOpacity
            style={styles.qtyBtn}
            onPress={() => onUpdateQuantity(item.quantity + 1)}
            disabled={item.quantity >= item.stockQty}
          >
            <Icon name="plus" size={14} color={item.quantity >= item.stockQty ? Tokens.muted : Tokens.foreground} />
          </TouchableOpacity>
        </View>
        <Text style={styles.lineAmount}>{formatCurrency(item.lineAmount)}</Text>
      </View>
    </View>
  )
}

export default function CartTab() {
  const router = useRouter()
  const { user } = useAuthStore()
  const { items, selectedIds, toggleSelect, selectAll, deselectAll } = useCartStore()
  const [removingId, setRemovingId] = useState<number | null>(null)

  const queryClient = useQueryClient()
  const setItems = useCartStore(s => s.setItems)

  const { isLoading } = useQuery({
    queryKey: ['cart'],
    queryFn: async () => {
      const result = await fetchCart()
      setItems(result)
      return result
    },
    enabled: !!user,
  })

  const updateMutation = useMutation({
    mutationFn: ({ merchantGoodsId, quantity }: { merchantGoodsId: number; quantity: number }) =>
      updateCartItem(merchantGoodsId, quantity),
    onSuccess: newItems => {
      setItems(newItems)
      queryClient.invalidateQueries({ queryKey: ['cart'] })
    },
  })

  const removeMutation = useMutation({
    mutationFn: (merchantGoodsId: number) => removeCartItem(merchantGoodsId),
    onSuccess: newItems => {
      setItems(newItems)
      queryClient.invalidateQueries({ queryKey: ['cart'] })
    },
  })

  if (!user) {
    return (
      <View style={styles.emptyContainer}>
        <Icon name="shoppingCart" size={48} color={Tokens.muted} />
        <Text style={styles.emptyText}>登录后查看购物车</Text>
        <Button onPress={() => router.push('/login')}>去登录</Button>
      </View>
    )
  }

  const toggleAll = () => {
    if (selectedIds.size === items.length) {
      deselectAll()
    } else {
      selectAll()
    }
  }

  const selectedItems = items.filter(item => selectedIds.has(item.merchantGoodsId))
  const goodsTotal = selectedItems.reduce((sum, item) => sum + item.lineAmount, 0)
  const freightTotal = selectedItems.reduce((sum, item) => sum + (item.freightAmount ?? 0), 0)
  const payTotal = goodsTotal + freightTotal
  const selectedCount = selectedItems.reduce((sum, item) => sum + item.quantity, 0)

  const handleCheckout = () => {
    if (selectedItems.length === 0) {
      Alert.alert('提示', '请先选择商品')
      return
    }
    router.push('/checkout')
  }

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Tokens.accent} />
      </View>
    )
  }

  if (items.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Icon name="shoppingCart" size={56} color={Tokens.muted} />
        <Text style={styles.emptyText}>购物车还是空的</Text>
        <Button onPress={() => router.push('/(tabs)/categories')} icon="arrowRight" iconRight>
          去逛逛
        </Button>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <Card style={styles.headerCard} padding="md">
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>我的购物车</Text>
          <Text style={styles.headerMeta}>共 {items.length} 件商品</Text>
        </View>
      </Card>

      <FlatList
        data={items}
        renderItem={({ item }: { item: MallCartItem }) => (
          <CartItemRow
            item={item}
            selected={selectedIds.has(item.merchantGoodsId)}
            onToggle={() => toggleSelect(item.merchantGoodsId)}
            onUpdateQuantity={_qty => {
              updateMutation.mutate({ merchantGoodsId: item.merchantGoodsId, quantity: _qty })
            }}
            onRemove={() => {
              if (removingId === item.merchantGoodsId) return
              setRemovingId(item.merchantGoodsId)
              Alert.alert('确认', '确定要删除这个商品吗?', [
                { text: '取消', style: 'cancel', onPress: () => setRemovingId(null) },
                {
                  text: '删除',
                  style: 'destructive',
                  onPress: () => {
                    removeMutation.mutate(item.merchantGoodsId, {
                      onSettled: () => setRemovingId(null),
                    })
                  },
                },
              ])
            }}
          />
        )}
        keyExtractor={(item: MallCartItem) => `cart-${item.merchantGoodsId}`}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        ListHeaderComponent={
          <TouchableOpacity style={styles.selectAllRow} onPress={toggleAll}>
            <Checkbox
              status={
                selectedIds.size === items.length ? 'checked' : selectedIds.size > 0 ? 'indeterminate' : 'unchecked'
              }
              color={Tokens.accent}
            />
            <Text variant="bodyMedium" style={{ color: Tokens.foreground }}>
              全选
            </Text>
            <Text variant="bodySmall" style={styles.totalCount}>
              已选 {selectedIds.size} 件
            </Text>
          </TouchableOpacity>
        }
      />

      <View style={styles.bottomBar}>
        <View style={styles.summary}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>已选商品</Text>
            <Text style={styles.summaryValue}>{selectedItems.length} 件</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>商品金额</Text>
            <Text style={styles.summaryValue}>{formatCurrency(goodsTotal)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>应付总额</Text>
            <Text style={styles.totalAmount}>{formatCurrency(payTotal)}</Text>
          </View>
        </View>
        <Button
          variant="primary"
          size="lg"
          onPress={handleCheckout}
          disabled={selectedItems.length === 0}
          icon="arrowRight"
          iconRight
        >
          去结算({selectedCount})
        </Button>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Tokens.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16 },
  emptyText: { color: Tokens.muted, fontSize: 16 },
  headerCard: {
    margin: 12,
    marginBottom: 0,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: { fontSize: 16, fontWeight: '700', color: Tokens.foreground },
  headerMeta: { fontSize: 13, color: Tokens.muted },
  list: { padding: 12 },
  selectAllRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: Tokens.surface,
    borderRadius: Tokens.radiusLg,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Tokens.separator,
    gap: 8,
  },
  totalCount: { marginLeft: 'auto', color: Tokens.muted },
  cartItem: {
    flexDirection: 'row',
    backgroundColor: Tokens.surface,
    borderRadius: Tokens.radiusLg,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Tokens.separator,
    ...Tokens.shadowSurface,
  },
  cartItemSelected: {
    borderColor: Tokens.accent,
  },
  checkboxArea: { marginRight: 8 },
  itemImage: {
    width: 70,
    height: 70,
    backgroundColor: Tokens.surfaceSecondary,
    borderRadius: Tokens.radius,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    overflow: 'hidden',
  },
  itemImageReal: { width: '100%', height: '100%' },
  itemInfo: { flex: 1 },
  itemName: { marginBottom: 2, color: Tokens.foreground, fontWeight: '500' },
  itemSku: { color: Tokens.muted, marginBottom: 4, fontSize: 12 },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  itemPrice: { color: Tokens.price, fontWeight: '700', fontSize: 15 },
  originalPrice: { color: Tokens.muted, textDecorationLine: 'line-through', fontSize: 11 },
  rightArea: {
    alignItems: 'flex-end',
    marginLeft: 8,
  },
  removeBtn: {
    padding: 4,
    marginBottom: 6,
  },
  quantityArea: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Tokens.separator,
    borderRadius: Tokens.radius,
    marginBottom: 6,
    backgroundColor: Tokens.surfaceSecondary,
  },
  qtyBtn: { width: 28, height: 28, justifyContent: 'center', alignItems: 'center' },
  qtyText: { width: 28, textAlign: 'center', fontSize: 13, color: Tokens.foreground, fontWeight: '600' },
  lineAmount: {
    color: Tokens.price,
    fontWeight: '700',
    fontSize: 13,
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    paddingBottom: 28,
    backgroundColor: Tokens.surface,
    borderTopWidth: 1,
    borderTopColor: Tokens.separator,
    gap: 12,
  },
  summary: {
    flex: 1,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  summaryLabel: { fontSize: 12, color: Tokens.muted },
  summaryValue: { fontSize: 12, color: Tokens.foreground },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: Tokens.separator,
  },
  totalLabel: { fontSize: 13, fontWeight: '600', color: Tokens.foreground },
  totalAmount: {
    fontSize: 20,
    fontWeight: '800',
    color: Tokens.price,
    letterSpacing: -0.5,
  },
})
