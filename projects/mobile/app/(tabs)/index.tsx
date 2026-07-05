import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useWindowDimensions,
  RefreshControl,
  Image,
} from 'react-native'
import { Text, Searchbar, ActivityIndicator } from 'react-native-paper'
import { useRouter } from 'expo-router'
import { fetchHomeData, fetchCategories, fetchProducts } from '../../src/api/mall'
import { ProductCard } from '../../src/components/commerce/ProductCard'
import { Card } from '../../src/components/ui/Card'
import { Chip } from '../../src/components/ui/Chip'
import { Icon } from '../../src/components/ui/Icon'
import { Tokens } from '../../src/theme'
import { getImageUrl } from '../../src/utils/image'
import type { Product } from '../../src/types/api'

function ShowcaseTile({ product, price, onPress }: { product: Product; price: number; onPress: () => void }) {
  const imageUrl = getImageUrl(product.mainImageId)

  return (
    <TouchableOpacity style={styles.showcaseTile} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.showcaseImageBox}>
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.showcaseImage} resizeMode="contain" />
        ) : (
          <Icon name="store" size={28} color={Tokens.muted} />
        )}
        <View style={styles.showcasePriceBadge}>
          <Text style={styles.showcasePriceText}>¥{price.toFixed(2)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  )
}

export default function HomeTab() {
  const router = useRouter()
  const { width } = useWindowDimensions()
  const [refreshing, setRefreshing] = useState(false)
  const [searchKeyword, setSearchKeyword] = useState('')
  const [activeTab, setActiveTab] = useState('猜你喜欢')

  const {
    data: homeData,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['home-data'],
    queryFn: fetchHomeData,
  })

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
  })

  const categoryNames = useMemo(() => categories?.map(c => c.name) ?? [], [categories])
  const allTabs = useMemo(() => ['猜你喜欢', ...categoryNames.slice(0, 8)], [categoryNames])

  const { data: tabProducts, isLoading: tabLoading } = useQuery({
    queryKey: ['home-products', activeTab, categoryNames],
    queryFn: async () => {
      if (activeTab === '猜你喜欢') {
        return homeData?.featuredProducts ?? []
      }
      const cat = categories?.find(c => c.name === activeTab)
      if (!cat) return []
      const result = await fetchProducts({ categoryId: cat.id, page: 1, pageSize: 10 })
      return result.list
    },
    enabled: !!categories,
  })

  const onRefresh = async () => {
    setRefreshing(true)
    await refetch()
    setRefreshing(false)
  }

  const handleSearch = () => {
    if (searchKeyword.trim()) {
      router.push({ pathname: '/search', params: { q: searchKeyword.trim() } } as any)
    }
  }

  const handleCategoryPress = (categoryId: number) => {
    router.push({ pathname: '/(tabs)/categories', params: { categoryId: String(categoryId) } })
  }

  const cardWidth = (width - 32 - 12) / 2
  const displayCategories = categories?.slice(0, 8) ?? []

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Tokens.accent} />
        <Text style={styles.loadingText}>首页加载中...</Text>
      </View>
    )
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Search Bar */}
      <View style={styles.searchBar}>
        <Searchbar
          placeholder="搜索商品"
          value={searchKeyword}
          onChangeText={setSearchKeyword}
          onSubmitEditing={handleSearch}
          style={styles.searchInput}
          inputStyle={styles.searchInputStyle}
          iconColor={Tokens.accent}
          placeholderTextColor={Tokens.muted}
        />
      </View>

      {/* Categories */}
      {displayCategories.length > 0 && (
        <Card style={styles.categoryCard} padding="md">
          <View style={styles.categoryGrid}>
            {displayCategories.map(cat => (
              <TouchableOpacity
                key={cat.id}
                style={styles.categoryItem}
                onPress={() => handleCategoryPress(cat.id)}
                activeOpacity={0.8}
              >
                <View style={styles.categoryIcon}>
                  <Text style={styles.categoryInitial}>{cat.name.charAt(0)}</Text>
                </View>
                <Text style={styles.categoryName} numberOfLines={1}>
                  {cat.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card>
      )}

      {/* Hot Recommendations */}
      {homeData?.featuredProducts && homeData.featuredProducts.length > 0 && (
        <Card style={styles.sectionCard} header="热门推荐" padding="sm">
          <View style={styles.showcaseGrid}>
            {homeData.featuredProducts.slice(0, 4).map(product => (
              <ShowcaseTile
                key={product.merchantGoodsId}
                product={product}
                price={product.memberPrice || product.price}
                onPress={() => router.push(`/product/${product.merchantGoodsId}`)}
              />
            ))}
          </View>
        </Card>
      )}

      {/* Member Deals */}
      {homeData?.memberDeals && homeData.memberDeals.length > 0 && (
        <Card style={styles.sectionCard} header="会员特惠" padding="sm">
          <View style={styles.showcaseGrid}>
            {homeData.memberDeals.slice(0, 2).map(product => (
              <ShowcaseTile
                key={product.merchantGoodsId}
                product={product}
                price={product.memberPrice || product.price}
                onPress={() => router.push(`/product/${product.merchantGoodsId}`)}
              />
            ))}
          </View>
        </Card>
      )}

      {/* New Arrivals */}
      {homeData?.newArrivals && homeData.newArrivals.length > 0 && (
        <Card style={styles.sectionCard} header="新品上新" padding="sm">
          <View style={styles.showcaseGrid}>
            {homeData.newArrivals.slice(0, 2).map(product => (
              <ShowcaseTile
                key={product.merchantGoodsId}
                product={product}
                price={product.memberPrice || product.price}
                onPress={() => router.push(`/product/${product.merchantGoodsId}`)}
              />
            ))}
          </View>
        </Card>
      )}

      {/* Product Tabs */}
      <Card style={styles.sectionCard} header="首页商品流" padding="sm">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabList}>
          {allTabs.map(tab => {
            const active = tab === activeTab
            return (
              <TouchableOpacity key={tab} onPress={() => setActiveTab(tab)} activeOpacity={0.8}>
                <Chip variant={active ? 'accent' : 'default'} compact style={styles.tabChip}>
                  {tab === '猜你喜欢' && <Icon name="heart" size={12} color={active ? Tokens.accent : Tokens.muted} />}
                  {tab}
                </Chip>
              </TouchableOpacity>
            )
          })}
        </ScrollView>

        {tabLoading ? (
          <View style={styles.tabLoading}>
            <ActivityIndicator color={Tokens.accent} />
          </View>
        ) : (tabProducts ?? []).length === 0 ? (
          <View style={styles.emptyTab}>
            <Text style={styles.emptyTabText}>该分类下暂时没有商品</Text>
          </View>
        ) : (
          <View style={styles.productGrid}>
            {(tabProducts ?? []).map(product => (
              <ProductCard key={product.merchantGoodsId} product={product} width={cardWidth} />
            ))}
          </View>
        )}
      </Card>

      <View style={{ height: 24 }} />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Tokens.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 16, color: Tokens.muted },
  searchBar: {
    padding: 12,
    backgroundColor: Tokens.surface,
    borderBottomWidth: 1,
    borderBottomColor: Tokens.separator,
  },
  searchInput: {
    backgroundColor: Tokens.surfaceSecondary,
    borderRadius: Tokens.radiusFull,
    height: 44,
  },
  searchInputStyle: { fontSize: 14, color: Tokens.foreground },
  categoryCard: {
    margin: 12,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  categoryItem: {
    width: '25%',
    alignItems: 'center',
    paddingVertical: 8,
  },
  categoryIcon: {
    width: 44,
    height: 44,
    borderRadius: Tokens.radiusLg,
    backgroundColor: Tokens.accentSoft,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  categoryInitial: {
    fontSize: 16,
    fontWeight: '700',
    color: Tokens.accent,
  },
  categoryName: { fontSize: 12, color: Tokens.muted, textAlign: 'center', fontWeight: '500' },
  sectionCard: {
    marginHorizontal: 12,
    marginBottom: 12,
  },
  showcaseGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  showcaseTile: {
    width: '49%',
    marginBottom: 8,
    borderRadius: Tokens.radius,
    overflow: 'hidden',
    backgroundColor: Tokens.surfaceSecondary,
  },
  showcaseImageBox: {
    aspectRatio: 5 / 2,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  showcaseImage: {
    width: '100%',
    height: '100%',
  },
  showcasePriceBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: Tokens.accent,
    borderRadius: Tokens.radius,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  showcasePriceText: {
    color: Tokens.accentForeground,
    fontSize: 10,
    fontWeight: '800',
  },
  tabList: { flexDirection: 'row', gap: 8, paddingBottom: 12 },
  tabChip: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  tabLoading: { paddingVertical: 40 },
  emptyTab: {
    paddingVertical: 40,
    alignItems: 'center',
    backgroundColor: Tokens.surfaceSecondary,
    borderRadius: Tokens.radius,
  },
  emptyTabText: { color: Tokens.muted, fontSize: 13 },
  productGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
})
