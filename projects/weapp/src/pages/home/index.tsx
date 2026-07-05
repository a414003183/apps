import { useEffect, useState } from 'react'
import { View, Text, ScrollView, Image, Swiper, SwiperItem, Input } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { fetchHome, fetchPublicProducts } from '../../api/mall'
import { resolveFileUrl } from '../../api/file'
import { formatCurrency } from '../../utils/format'
import { useSessionStore } from '../../stores/session'
import type { Product } from '../../types/models'
import './index.scss'

export default function HomePage() {
  const [loading, setLoading] = useState(true)
  const [categories, setCategories] = useState<{ id: number; name: string; productCount: number }[]>([])
  const [featured, setFeatured] = useState<Product[]>([])
  const [memberDeals, setMemberDeals] = useState<Product[]>([])
  const [newArrivals, setNewArrivals] = useState<Product[]>([])
  const profile = useSessionStore((s) => s.profile)

  useEffect(() => {
    loadHome()
  }, [profile])

  async function loadHome() {
    try {
      let data
      if (profile) {
        data = await fetchHome()
      } else {
        const result = await fetchPublicProducts({ page: 1, pageSize: 100 })
        const list = result?.list || []
        const cats = buildCategories(list)
        data = {
          categories: cats,
          featured: list.slice(0, 8),
          memberDeals: list.filter((p) => p.memberPrice && p.memberPrice < p.price).slice(0, 4),
          newArrivals: list.slice(-4),
        }
      }
      setCategories(data.categories || [])
      setFeatured(data.featured || [])
      setMemberDeals(data.memberDeals || [])
      setNewArrivals(data.newArrivals || [])
    } catch (err: any) {
      Taro.showToast({ title: err?.message || '加载失败', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  function buildCategories(products: Product[]) {
    const map = new Map<string, number>()
    products.forEach((p) => {
      if (p.category) {
        map.set(p.category, (map.get(p.category) || 0) + 1)
      }
    })
    let idx = 0
    return Array.from(map.entries()).map(([name, count]) => ({ id: idx++, name, productCount: count }))
  }

  function goSearch(categoryId?: number) {
    const url = categoryId !== undefined
      ? `/pages/search/index?categoryId=${categoryId}`
      : '/pages/search/index'
    Taro.navigateTo({ url })
  }

  function goProduct(product: Product) {
    Taro.navigateTo({ url: `/pages/product/detail?id=${product.id}` })
  }

  if (loading) {
    return (
      <View className='home-page loading'>
        <Text className='text-muted'>加载中...</Text>
      </View>
    )
  }

  return (
    <ScrollView className='home-page' scrollY>
      <View className='search-bar' onClick={() => goSearch()}>
        <Text className='search-placeholder'>搜索商品</Text>
      </View>

      {featured.length > 0 ? (
        <Swiper className='banner' indicatorColor='#999' indicatorActiveColor='#2563eb' circular autoplay>
          {featured.slice(0, 5).map((product) => (
            <SwiperItem key={product.id}>
              <View className='banner-item' onClick={() => goProduct(product)}>
                <Image
                  className='banner-image'
                  src={resolveFileUrl(product.mainImageId)}
                  mode='aspectFill'
                />
                <View className='banner-info'>
                  <Text className='banner-title'>{product.name}</Text>
                  <Text className='banner-price'>{formatCurrency(product.memberPrice || product.price)}</Text>
                </View>
              </View>
            </SwiperItem>
          ))}
        </Swiper>
      ) : null}

      <View className='card category-card'>
        <Text className='section-title'>商品分类</Text>
        <View className='category-list'>
          {categories.slice(0, 10).map((cat) => (
            <View key={cat.id} className='category-item' onClick={() => goSearch(cat.id)}>
              <Text className='category-name'>{cat.name}</Text>
              <Text className='category-count'>{cat.productCount}件</Text>
            </View>
          ))}
        </View>
      </View>

      <ProductSection title='热门推荐' products={featured} onProductClick={goProduct} />
      <ProductSection title='会员特惠' products={memberDeals} onProductClick={goProduct} />
      <ProductSection title='新品上新' products={newArrivals} onProductClick={goProduct} />

      <View className='safe-bottom' />
    </ScrollView>
  )
}

function ProductSection({
  title,
  products,
  onProductClick,
}: {
  title: string
  products: Product[]
  onProductClick: (p: Product) => void
}) {
  if (!products.length) return null
  return (
    <View className='card product-section'>
      <View className='section-header'>
        <Text className='section-title'>{title}</Text>
      </View>
      <View className='product-grid'>
        {products.map((product) => (
          <View key={product.id} className='product-card' onClick={() => onProductClick(product)}>
            <Image className='product-image' src={resolveFileUrl(product.mainImageId)} mode='aspectFill' />
            <View className='product-info'>
              <Text className='product-name line-clamp-2'>{product.name}</Text>
              <Text className='product-shop line-clamp-1'>{product.shopName}</Text>
              <View className='product-price-row'>
                <Text className='product-price'>{formatCurrency(product.memberPrice || product.price)}</Text>
                {product.memberPrice && product.memberPrice < product.price ? (
                  <Text className='product-original'>{formatCurrency(product.price)}</Text>
                ) : null}
              </View>
            </View>
          </View>
        ))}
      </View>
    </View>
  )
}
