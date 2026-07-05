import { useEffect, useState } from 'react'
import { View, Text, ScrollView, Image, Input } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import { fetchCategories, fetchProducts, fetchPublicProducts } from '../../api/mall'
import { resolveFileUrl } from '../../api/file'
import { formatCurrency } from '../../utils/format'
import { useSessionStore } from '../../stores/session'
import type { Product } from '../../types/models'
import './index.scss'

type SortType = 'default' | 'price_asc' | 'price_desc' | 'sale'

export default function SearchPage() {
  const router = useRouter()
  const profile = useSessionStore((s) => s.profile)
  const [keyword, setKeyword] = useState('')
  const [categoryId, setCategoryId] = useState<number | undefined>()
  const [sortBy, setSortBy] = useState<SortType>('default')
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)

  useEffect(() => {
    loadCategories()
    const cid = router.params?.categoryId
    if (cid) {
      setCategoryId(Number(cid))
    }
  }, [])

  useEffect(() => {
    setPage(1)
    loadProducts(1, true)
  }, [keyword, categoryId, sortBy])

  async function loadCategories() {
    try {
      const list = await fetchCategories()
      setCategories(list || [])
    } catch {
      // ignore
    }
  }

  async function loadProducts(nextPage: number, reset = false) {
    if (loading) return
    setLoading(true)
    try {
      const params = {
        page: nextPage,
        pageSize: 20,
        keyword,
        categoryId,
        sortBy: sortBy === 'default' ? undefined : sortBy,
      }
      const result = profile
        ? await fetchProducts(params)
        : await fetchPublicProducts({ page: params.page, pageSize: params.pageSize })
      const list = result?.list || []
      let filtered = list
      if (keyword) {
        const kw = keyword.toLowerCase()
        filtered = list.filter((p) => p.name?.toLowerCase().includes(kw))
      }
      if (categoryId !== undefined) {
        const cats = Array.from(new Set(list.map((p) => p.category)))
        const target = cats[categoryId]
        if (target) {
          filtered = filtered.filter((p) => p.category === target)
        }
      }
      if (sortBy === 'price_asc') {
        filtered.sort((a, b) => (a.memberPrice || a.price) - (b.memberPrice || b.price))
      } else if (sortBy === 'price_desc') {
        filtered.sort((a, b) => (b.memberPrice || b.price) - (a.memberPrice || a.price))
      }
      setTotal(filtered.length)
      setProducts((prev) => (reset ? filtered : [...prev, ...filtered]))
      setHasMore(filtered.length === 20 && (nextPage * 20) < filtered.length)
    } catch (err: any) {
      Taro.showToast({ title: err?.message || '加载失败', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  function handleScrollToLower() {
    if (hasMore && !loading) {
      const next = page + 1
      setPage(next)
      loadProducts(next)
    }
  }

  function goProduct(product: Product) {
    Taro.navigateTo({ url: `/pages/product/detail?id=${product.id}` })
  }

  return (
    <View className='search-page'>
      <View className='search-header'>
        <View className='search-input-wrap'>
          <Input
            className='search-input'
            placeholder='搜索商品名称'
            value={keyword}
            onInput={(e) => setKeyword(e.detail.value)}
            onConfirm={() => {
              setPage(1)
              loadProducts(1, true)
            }}
          />
        </View>
      </View>

      <ScrollView className='category-bar' scrollX>
        <View
          className={`category-chip ${categoryId === undefined ? 'active' : ''}`}
          onClick={() => setCategoryId(undefined)}
        >
          全部
        </View>
        {categories.map((cat) => (
          <View
            key={cat.id}
            className={`category-chip ${categoryId === cat.id ? 'active' : ''}`}
            onClick={() => setCategoryId(cat.id)}
          >
            {cat.name}
          </View>
        ))}
      </ScrollView>

      <View className='sort-bar'>
        {[
          { key: 'default', label: '综合' },
          { key: 'sale', label: '销量' },
          { key: 'price_asc', label: '价格↑' },
          { key: 'price_desc', label: '价格↓' },
        ].map((item) => (
          <View
            key={item.key}
            className={`sort-item ${sortBy === item.key ? 'active' : ''}`}
            onClick={() => setSortBy(item.key as SortType)}
          >
            <Text>{item.label}</Text>
          </View>
        ))}
      </View>

      <ScrollView className='product-list' scrollY onScrollToLower={handleScrollToLower}>
        {products.map((product) => (
          <View key={product.id} className='product-row' onClick={() => goProduct(product)}>
            <Image className='product-image' src={resolveFileUrl(product.mainImageId)} mode='aspectFill' />
            <View className='product-info'>
              <Text className='product-name line-clamp-2'>{product.name}</Text>
              <Text className='product-shop line-clamp-1'>{product.shopName}</Text>
              <View className='product-meta'>
                <Text className='product-price'>{formatCurrency(product.memberPrice || product.price)}</Text>
                <Text className='product-sales'>销量 {product.saleCount || 0}</Text>
              </View>
            </View>
          </View>
        ))}
        {loading ? <Text className='load-more'>加载中...</Text> : null}
        {!hasMore && products.length > 0 ? <Text className='load-more'>没有更多了</Text> : null}
        {!loading && products.length === 0 ? (
          <View className='empty-state'>
            <Text className='text-muted'>暂无商品</Text>
          </View>
        ) : null}
      </ScrollView>
    </View>
  )
}
