import { useCallback, useEffect, useMemo, useState } from 'react'
import { View, StyleSheet, FlatList, TouchableOpacity } from 'react-native'
import { Text, Searchbar, ActivityIndicator } from 'react-native-paper'
import { useLocalSearchParams } from 'expo-router'
import { fetchProducts } from '../src/api/mall'
import { ProductCard } from '../src/components/commerce/ProductCard'
import { StatePanel } from '../src/components/ui/StatePanel'
import { Chip } from '../src/components/ui/Chip'
import { Button } from '../src/components/ui/Button'
import { Icon } from '../src/components/ui/Icon'
import { Card } from '../src/components/ui/Card'
import { Tokens } from '../src/theme'
import type { Product } from '../src/types/api'

type SortKey = 'default' | 'price-asc' | 'price-desc' | 'sales' | 'newest'

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'default', label: '综合' },
  { key: 'sales', label: '销量' },
  { key: 'price-asc', label: '价格从低到高' },
  { key: 'price-desc', label: '价格从高到低' },
  { key: 'newest', label: '最新上架' },
]

function matchQ(product: Product, query: string) {
  if (!query) return true
  const keyword = query.toLowerCase()
  return (
    product.name.toLowerCase().includes(keyword) ||
    product.brand.toLowerCase().includes(keyword) ||
    product.category.toLowerCase().includes(keyword) ||
    (product.keywords ?? '').toLowerCase().includes(keyword)
  )
}

function doSort(products: Product[], sort: SortKey) {
  const copied = [...products]
  if (sort === 'price-asc') {
    return copied.sort((a, b) => (a.memberPrice || a.price) - (b.memberPrice || b.price))
  }
  if (sort === 'price-desc') {
    return copied.sort((a, b) => (b.memberPrice || b.price) - (a.memberPrice || a.price))
  }
  if (sort === 'sales') {
    return copied.sort((a, b) => (b.saleCount ?? 0) - (a.saleCount ?? 0))
  }
  if (sort === 'newest') {
    return copied.sort((a, b) => b.id - a.id)
  }
  return copied
}

export default function SearchPage() {
  const params = useLocalSearchParams<{ q?: string; category?: string; sort?: SortKey }>()

  const [query, setQuery] = useState(params.q ?? '')
  const [category, setCategory] = useState(params.category ?? '')
  const [sort, setSort] = useState<SortKey>(normalizeSort(params.sort))
  const [draft, setDraft] = useState(params.q ?? '')

  const [products, setProducts] = useState<Product[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(15)
  const [loading, setLoading] = useState(false)

  const load = useCallback(
    async (p: number) => {
      const sortMap: Record<SortKey, { sortBy?: string; sortOrder?: string }> = {
        default: {},
        'price-asc': { sortBy: 'price', sortOrder: 'asc' },
        'price-desc': { sortBy: 'price', sortOrder: 'desc' },
        sales: { sortBy: 'saleCount', sortOrder: 'desc' },
        newest: { sortBy: 'id', sortOrder: 'desc' },
      }
      setLoading(true)
      try {
        const { sortBy, sortOrder } = sortMap[sort]
        const data = await fetchProducts({
          keyword: query || undefined,
          categoryId: category || undefined,
          sortBy,
          sortOrder,
          page: p,
          pageSize,
        })
        setProducts(data.list)
        setTotal(data.total)
        setPage(data.page)
      } catch {
        setProducts([])
        setTotal(0)
      } finally {
        setLoading(false)
      }
    },
    [query, category, sort, pageSize]
  )

  useEffect(() => {
    load(1)
  }, [load])

  const categories = useMemo(
    () => Array.from(new Set(products.map(p => p.category))).filter(Boolean),
    [products]
  )

  const filteredProducts = useMemo(
    () => doSort(products.filter(p => (category ? p.category === category : true) && matchQ(p, query)), sort),
    [category, products, query, sort]
  )

  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  const clearFilters = () => {
    setDraft('')
    setQuery('')
    setCategory('')
    setSort('default')
  }

  const handleSearchSubmit = () => {
    setQuery(draft.trim())
  }

  const renderHeader = () => (
    <View>
      <Card style={styles.searchCard} padding="md">
        <View style={styles.searchRow}>
          <View style={styles.searchWrap}>
            <Icon name="search" size={16} color={Tokens.accent} />
            <Searchbar
              placeholder="搜索商品、品牌、分类"
              value={draft}
              onChangeText={setDraft}
              onSubmitEditing={handleSearchSubmit}
              style={styles.searchInput}
              inputStyle={styles.searchInputStyle}
              iconColor={Tokens.accent}
              placeholderTextColor={Tokens.muted}
            />
          </View>
          {draft ? (
            <TouchableOpacity onPress={() => setDraft('')} style={styles.clearBtn}>
              <Icon name="x" size={18} color={Tokens.muted} />
            </TouchableOpacity>
          ) : null}
          <Button variant="primary" size="sm" onPress={handleSearchSubmit}>
            搜索
          </Button>
        </View>

        <View style={styles.chipsRow}>
          <TouchableOpacity onPress={() => setCategory('')}>
            <Chip variant={!category ? 'accent' : 'default'} compact>
              全部分类
            </Chip>
          </TouchableOpacity>
          {categories.map(cat => (
            <TouchableOpacity key={cat} onPress={() => setCategory(cat === category ? '' : cat)}>
              <Chip variant={cat === category ? 'accent' : 'default'} compact>
                {cat}
              </Chip>
            </TouchableOpacity>
          ))}
        </View>
      </Card>

      <Card style={styles.sortCard} padding="sm">
        <View style={styles.sortRow}>
          <View style={styles.sortChips}>
            {SORT_OPTIONS.map(opt => (
              <TouchableOpacity key={opt.key} onPress={() => setSort(opt.key)}>
                <Chip variant={sort === opt.key ? 'primary' : 'default'} compact>
                  {opt.label}
                </Chip>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.meta}>共 {total} 件商品</Text>
        </View>
      </Card>
    </View>
  )

  if (loading && products.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Tokens.accent} />
      </View>
    )
  }

  if (!loading && filteredProducts.length === 0) {
    return (
      <View style={styles.container}>
        {renderHeader()}
        <StatePanel
          title="没有找到相关商品"
          description="换个关键词或清空筛选条件试试"
          primaryAction={{ label: '查看全部商品', onPress: clearFilters }}
        />
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={filteredProducts}
        numColumns={2}
        keyExtractor={item => `search-${item.merchantGoodsId}`}
        columnWrapperStyle={styles.gridRow}
        contentContainerStyle={styles.gridContent}
        ListHeaderComponent={renderHeader}
        renderItem={({ item }) => <ProductCard product={item} />}
        ListFooterComponent={
          total > 0 ? (
            <View style={styles.pagination}>
              <Button
                variant="outline"
                size="sm"
                onPress={() => load(Math.max(1, page - 1))}
                disabled={page <= 1 || loading}
              >
                上一页
              </Button>
              <Text style={styles.pageText}>
                第 {page} / {totalPages} 页
              </Text>
              <Button
                variant="outline"
                size="sm"
                onPress={() => load(Math.min(totalPages, page + 1))}
                disabled={page >= totalPages || loading}
              >
                下一页
              </Button>
            </View>
          ) : null
        }
      />
    </View>
  )
}

function normalizeSort(value: string | undefined | null): SortKey {
  if (value === 'price-asc' || value === 'price-desc' || value === 'sales' || value === 'newest') {
    return value
  }
  return 'default'
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
  searchCard: {
    margin: 12,
    marginBottom: 0,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  searchWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Tokens.separator,
    borderRadius: Tokens.radiusFull,
    paddingLeft: 10,
    backgroundColor: Tokens.surfaceSecondary,
  },
  searchInput: {
    flex: 1,
    backgroundColor: 'transparent',
    elevation: 0,
    shadowOpacity: 0,
  },
  searchInputStyle: {
    fontSize: 14,
    color: Tokens.foreground,
  },
  clearBtn: {
    padding: 4,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  sortCard: {
    marginHorizontal: 12,
    marginBottom: 12,
  },
  sortRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sortChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    flex: 1,
  },
  meta: {
    fontSize: 12,
    color: Tokens.muted,
    marginLeft: 12,
  },
  gridContent: {
    padding: 12,
  },
  gridRow: {
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginVertical: 20,
  },
  pageText: {
    fontSize: 13,
    color: Tokens.muted,
  },
})
