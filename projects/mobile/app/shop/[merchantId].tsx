import { useEffect, useState } from 'react'
import {
  View,
  StyleSheet,
  ScrollView,
  FlatList,
  useWindowDimensions,
} from 'react-native'
import { Text, Button, ActivityIndicator, Avatar } from 'react-native-paper'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { fetchShop, fetchShopProducts } from '../../src/api/mall'
import { ProductCard } from '../../src/components/commerce/ProductCard'
import { StatePanel } from '../../src/components/ui/StatePanel'
import { Card } from '../../src/components/ui/Card'
import { Chip } from '../../src/components/ui/Chip'
import { Tokens } from '../../src/theme'
import type { Product, ShopInfo } from '../../src/types/api'

function formatCompactNumber(value?: number) {
  if (value === undefined || value === null) return '0'
  if (value >= 10000) return `${(value / 10000).toFixed(1)}万`
  return String(value)
}

export default function ShopPage() {
  const router = useRouter()
  const { merchantId } = useLocalSearchParams<{ merchantId: string }>()
  const { width } = useWindowDimensions()

  const [shop, setShop] = useState<ShopInfo | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(15)
  const [loading, setLoading] = useState(true)

  const id = Number(merchantId)

  useEffect(() => {
    if (!id) {
      setLoading(false)
      return
    }
    let mounted = true
    setLoading(true)
    Promise.all([
      fetchShop(id),
      fetchShopProducts(id, { page, pageSize }),
    ])
      .then(([s, p]) => {
        if (!mounted) return
        setShop(s)
        setProducts(p.list)
        setTotal(p.total)
      })
      .catch(() => {
        if (!mounted) return
        setShop(null)
        setProducts([])
        setTotal(0)
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })
    return () => {
      mounted = false
    }
  }, [id, page, pageSize])

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Tokens.accent} />
      </View>
    )
  }

  if (!shop) {
    return (
      <StatePanel
        title="未找到店铺"
        description="该商家店铺不存在或已下架"
        primaryAction={{ label: '去搜索', onPress: () => router.replace('/search' as any) }}
        secondaryAction={{ label: '返回', onPress: () => router.back() }}
      />
    )
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  const cardWidth = (width - 32 - 12) / 2

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.shopCard}>
        <View style={styles.shopHeader}>
          <Avatar.Text
            size={56}
            label={shop.shopName.charAt(0)}
            style={{ backgroundColor: Tokens.accent }}
            color={Tokens.accentForeground}
          />
          <View style={styles.shopInfo}>
            <Text variant="titleLarge" style={styles.shopName}>
              {shop.shopName}
            </Text>
            {shop.shopDesc ? (
              <Text variant="bodySmall" style={styles.shopDesc}>
                {shop.shopDesc}
              </Text>
            ) : null}
            <View style={styles.shopMeta}>
              {shop.contactName ? (
                <Text style={styles.metaItem}>联系人: {shop.contactName}</Text>
              ) : null}
              {shop.contactPhone ? (
                <Text style={styles.metaItem}>电话: {shop.contactPhone}</Text>
              ) : null}
              <Chip variant={shop.status === '营业中' ? 'success' : 'default'} compact>
                {shop.status || '营业中'}
              </Chip>
            </View>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{formatCompactNumber(shop.productCount)}</Text>
            <Text style={styles.statLabel}>商品</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statValue}>{formatCompactNumber(shop.totalSales)}</Text>
            <Text style={styles.statLabel}>销量</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statValue}>{shop.status || '营业中'}</Text>
            <Text style={styles.statLabel}>状态</Text>
          </View>
        </View>
      </Card>

      <Card header={`全部商品 (${total})`} style={styles.productsCard}>
        {products.length === 0 ? (
          <Text style={styles.emptyText}>该店铺暂无商品</Text>
        ) : (
          <>
            <FlatList
              data={products}
              numColumns={2}
              scrollEnabled={false}
              keyExtractor={item => `shop-product-${item.merchantGoodsId}`}
              columnWrapperStyle={styles.gridRow}
              renderItem={({ item }) => <ProductCard product={item} width={cardWidth} />}
            />
            <View style={styles.pagination}>
              <Button
                mode="outlined"
                onPress={() => setPage(Math.max(1, page - 1))}
                disabled={page <= 1}
                style={styles.pageBtn}
                textColor={Tokens.accent}
              >
                上一页
              </Button>
              <Text style={styles.pageText}>
                第 {page} / {totalPages} 页
              </Text>
              <Button
                mode="outlined"
                onPress={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page >= totalPages}
                style={styles.pageBtn}
                textColor={Tokens.accent}
              >
                下一页
              </Button>
            </View>
          </>
        )}
      </Card>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Tokens.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Tokens.background,
  },
  shopCard: {
    margin: 12,
    marginBottom: 0,
  },
  shopHeader: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  shopInfo: {
    flex: 1,
  },
  shopName: {
    fontWeight: '700',
    color: Tokens.foreground,
  },
  shopDesc: {
    color: Tokens.muted,
    marginTop: 2,
  },
  shopMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
    alignItems: 'center',
  },
  metaItem: {
    fontSize: 12,
    color: Tokens.muted,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 12,
    backgroundColor: Tokens.surfaceSecondary,
    borderRadius: Tokens.radius,
  },
  stat: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: Tokens.foreground,
  },
  statLabel: {
    fontSize: 11,
    color: Tokens.muted,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: Tokens.separator,
  },
  productsCard: {
    margin: 12,
    marginBottom: 24,
  },
  gridRow: {
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  emptyText: {
    textAlign: 'center',
    color: Tokens.muted,
    paddingVertical: 24,
  },
  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginTop: 16,
  },
  pageBtn: {
    borderColor: Tokens.border,
  },
  pageText: {
    fontSize: 13,
    color: Tokens.muted,
  },
})
