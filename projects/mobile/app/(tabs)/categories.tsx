import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { View, StyleSheet, FlatList, TouchableOpacity, useWindowDimensions, Image } from 'react-native'
import { Text, Searchbar, Chip, ActivityIndicator } from 'react-native-paper'
import { useLocalSearchParams } from 'expo-router'
import { fetchProducts, fetchCategories } from '../../src/api/mall'
import { getImageUrl } from '../../src/utils/image'
import { Tokens } from '../../src/theme'
import type { Product } from '../../src/types/api'

const SORT_OPTIONS = [
  { label: '默认', value: '' },
  { label: '价格↑', value: 'price_asc' },
  { label: '价格↓', value: 'price_desc' },
  { label: '销量', value: 'sales' },
]

function ProductGridItem({ product }: { product: Product }) {
  const router = useRouter()
  const { width } = useWindowDimensions()
  const itemWidth = (width - 32 - 12) / 2

  return (
    <TouchableOpacity
      style={[styles.gridItem, { width: itemWidth }]}
      onPress={() => router.push(`/product/${product.merchantGoodsId}`)}
      activeOpacity={0.85}
    >
      <View style={styles.gridImage}>
        {product.mainImageId ? (
          <Image source={{ uri: getImageUrl(product.mainImageId)! }} style={styles.gridImageReal} resizeMode="cover" />
        ) : (
          <Text style={styles.placeholderImage}>暂无图片</Text>
        )}
        {product.stock <= 0 ? (
          <View style={styles.soldOut}>
            <Text style={styles.soldOutText}>售罄</Text>
          </View>
        ) : null}
      </View>
      <View style={styles.gridItemContent}>
        <Text variant="bodySmall" numberOfLines={2} style={styles.gridName}>
          {product.name}
        </Text>
        <Text variant="bodySmall" style={styles.gridShop}>
          {product.shopName}
        </Text>
        <View style={styles.gridPriceRow}>
          <Text variant="titleSmall" style={styles.gridPrice}>
            ¥{(product.price ?? 0).toFixed(2)}
          </Text>
          {product.stock > 0 && product.stock <= 5 && <Text style={styles.lowStock}>仅剩{product.stock}</Text>}
        </View>
      </View>
    </TouchableOpacity>
  )
}

export default function CategoriesTab() {
  const params = useLocalSearchParams<{ categoryId?: string; keyword?: string }>()

  const [keyword, setKeyword] = useState(params.keyword || '')
  const [categoryId, setCategoryId] = useState<number | undefined>(
    params.categoryId ? Number(params.categoryId) : undefined
  )
  const [sortBy, setSortBy] = useState('')
  const [page, setPage] = useState(1)
  const [allProducts, setAllProducts] = useState<Product[]>([])
  const [hasMore, setHasMore] = useState(true)

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
  })

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['products', keyword, categoryId, sortBy, 1],
    queryFn: () =>
      fetchProducts({ keyword: keyword || undefined, categoryId, sortBy: sortBy || undefined, page: 1, pageSize: 20 }),
    enabled: true,
  })

  const loadMore = () => {
    if (isFetching || !hasMore || !data) return
    const nextPage = page + 1
    setPage(nextPage)
    fetchProducts({
      keyword: keyword || undefined,
      categoryId,
      sortBy: sortBy || undefined,
      page: nextPage,
      pageSize: 20,
    })
      .then(result => {
        if (result.list.length === 0) {
          setHasMore(false)
        } else {
          setAllProducts(prev => [...prev, ...result.list])
        }
      })
      .catch(() => setHasMore(false))
  }

  const handleSearch = () => {
    setPage(1)
    setHasMore(true)
    setAllProducts([])
  }

  const handleCategorySelect = (id: number | undefined) => {
    setCategoryId(id)
    setPage(1)
    setHasMore(true)
    setAllProducts([])
  }

  const displayProducts = data?.list || []
  const products = page === 1 ? displayProducts : allProducts

  return (
    <View style={styles.container}>
      <View style={styles.searchRow}>
        <Searchbar
          placeholder="搜索商品"
          value={keyword}
          onChangeText={setKeyword}
          onSubmitEditing={handleSearch}
          style={styles.searchInput}
          inputStyle={styles.searchInputStyle}
          iconColor={Tokens.accent}
          placeholderTextColor={Tokens.muted}
        />
      </View>

      <View style={styles.content}>
        <View style={styles.sidebar}>
          <TouchableOpacity
            style={[styles.sidebarItem, !categoryId && styles.sidebarItemActive]}
            onPress={() => handleCategorySelect(undefined)}
          >
            <Text style={[styles.sidebarText, !categoryId && styles.sidebarTextActive]}>全部</Text>
          </TouchableOpacity>
          {categories?.map(cat => (
            <TouchableOpacity
              key={cat.id}
              style={[styles.sidebarItem, categoryId === cat.id && styles.sidebarItemActive]}
              onPress={() => handleCategorySelect(cat.id)}
            >
              <Text style={[styles.sidebarText, categoryId === cat.id && styles.sidebarTextActive]} numberOfLines={1}>
                {cat.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.grid}>
          <View style={styles.sortRow}>
            {SORT_OPTIONS.map(opt => (
              <Chip
                key={opt.value}
                selected={sortBy === opt.value}
                onPress={() => {
                  setSortBy(opt.value)
                  setPage(1)
                  setHasMore(true)
                  setAllProducts([])
                }}
                style={[styles.sortChip, sortBy === opt.value && { backgroundColor: Tokens.accentSoft }]}
                textStyle={
                  sortBy === opt.value ? { color: Tokens.accent, fontWeight: '600' } : { color: Tokens.muted }
                }
                compact
              >
                {opt.label}
              </Chip>
            ))}
          </View>

          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Tokens.accent} />
            </View>
          ) : products.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>暂无商品</Text>
            </View>
          ) : (
            <FlatList
              data={products}
              renderItem={({ item }: { item: Product }) => <ProductGridItem product={item} />}
              keyExtractor={(item: Product) => `product-${item.merchantGoodsId}`}
              numColumns={2}
              columnWrapperStyle={styles.gridRow}
              contentContainerStyle={styles.gridListContent}
              onEndReached={loadMore}
              onEndReachedThreshold={0.3}
              ListFooterComponent={
                isFetching ? <ActivityIndicator style={{ marginVertical: 16 }} color={Tokens.accent} /> : null
              }
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text>没有找到商品</Text>
                </View>
              }
            />
          )}
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Tokens.background },
  searchRow: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: Tokens.surface,
    borderBottomWidth: 1,
    borderBottomColor: Tokens.separator,
  },
  searchInput: {
    flex: 1,
    backgroundColor: Tokens.surfaceSecondary,
    borderRadius: Tokens.radiusFull,
    height: 44,
  },
  searchInputStyle: { fontSize: 14, color: Tokens.foreground },
  content: { flex: 1, flexDirection: 'row' },
  sidebar: {
    width: 84,
    backgroundColor: Tokens.surfaceSecondary,
    borderRightWidth: 1,
    borderRightColor: Tokens.separator,
  },
  sidebarItem: {
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: Tokens.separator,
  },
  sidebarItemActive: {
    backgroundColor: Tokens.surface,
    borderLeftWidth: 3,
    borderLeftColor: Tokens.accent,
  },
  sidebarText: { fontSize: 12, color: Tokens.muted, textAlign: 'center', fontWeight: '500' },
  sidebarTextActive: { color: Tokens.accent, fontWeight: '700' },
  grid: { flex: 1 },
  sortRow: {
    flexDirection: 'row',
    padding: 10,
    gap: 8,
    backgroundColor: Tokens.surface,
    borderBottomWidth: 1,
    borderBottomColor: Tokens.separator,
  },
  sortChip: { height: 28, backgroundColor: Tokens.surfaceSecondary },
  gridListContent: { padding: 10 },
  gridRow: { justifyContent: 'space-between' },
  gridItem: {
    backgroundColor: Tokens.surface,
    borderRadius: Tokens.radiusLg,
    marginBottom: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Tokens.separator,
    ...Tokens.shadowSurface,
  },
  gridImage: {
    height: 140,
    backgroundColor: Tokens.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  gridImageReal: { width: '100%', height: '100%' },
  placeholderImage: { fontSize: 13, color: Tokens.muted },
  soldOut: {
    position: 'absolute',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  soldOutText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  gridItemContent: { padding: 10 },
  gridName: { fontSize: 13, color: Tokens.foreground, marginBottom: 2, height: 32, fontWeight: '500' },
  gridShop: { fontSize: 11, color: Tokens.muted, marginBottom: 4 },
  gridPriceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  gridPrice: { color: Tokens.price, fontWeight: '700', fontSize: 15 },
  lowStock: { fontSize: 10, color: Tokens.warning, fontWeight: '600' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 60 },
  emptyText: { color: Tokens.muted },
})
