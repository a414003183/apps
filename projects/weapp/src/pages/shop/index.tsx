import { useEffect, useState } from 'react'
import { View, Text, ScrollView, Image } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { fetchShop, fetchShopProducts } from '../../api/mall'
import { resolveFileUrl } from '../../api/file'
import { formatCurrency } from '../../utils/format'
import type { Product, ShopInfo } from '../../types/models'
import './index.scss'

export default function ShopPage() {
  const [shop, setShop] = useState<ShopInfo | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)

  useEffect(() => {
    const merchantId = Taro.getCurrentInstance().router?.params?.merchantId
    if (merchantId) {
      loadShop(Number(merchantId))
      loadProducts(Number(merchantId), 1, true)
    }
  }, [])

  async function loadShop(merchantId: number) {
    try {
      const data = await fetchShop(merchantId)
      setShop(data)
    } catch {
      // ignore
    }
  }

  async function loadProducts(merchantId: number, nextPage: number, reset = false) {
    if (loading) return
    setLoading(true)
    try {
      const result = await fetchShopProducts(merchantId, { page: nextPage, pageSize: 20 })
      const list = result?.list || []
      setProducts((prev) => (reset ? list : [...prev, ...list]))
      setHasMore(list.length === 20 && (nextPage * 20) < (result?.total || 0))
      setPage(nextPage)
    } catch (err: any) {
      Taro.showToast({ title: err?.message || '加载失败', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  function handleScrollToLower() {
    const merchantId = Taro.getCurrentInstance().router?.params?.merchantId
    if (merchantId && hasMore && !loading) {
      loadProducts(Number(merchantId), page + 1)
    }
  }

  function goProduct(product: Product) {
    Taro.navigateTo({ url: `/pages/product/detail?id=${product.id}` })
  }

  return (
    <View className='shop-page'>
      <View className='shop-header'>
        <Text className='shop-name'>{shop?.shopName || '店铺'}</Text>
        <View className='shop-meta'>
          <Text className='meta-item'>商品 {shop?.productCount || 0}</Text>
          <Text className='meta-item'>销量 {shop?.totalSales || 0}</Text>
        </View>
        {shop?.shopDesc ? <Text className='shop-desc'>{shop.shopDesc}</Text> : null}
      </View>

      <ScrollView className='product-list' scrollY onScrollToLower={handleScrollToLower}>
        <View className='product-grid'>
          {products.map((product) => (
            <View key={product.id} className='product-card' onClick={() => goProduct(product)}>
              <Image className='product-image' src={resolveFileUrl(product.mainImageId)} mode='aspectFill' />
              <View className='product-info'>
                <Text className='product-name line-clamp-2'>{product.name}</Text>
                <Text className='product-price'>{formatCurrency(product.memberPrice || product.price)}</Text>
              </View>
            </View>
          ))}
        </View>
        {loading ? <Text className='load-more'>加载中...</Text> : null}
        {!hasMore && products.length > 0 ? <Text className='load-more'>没有更多了</Text> : null}
        {!loading && products.length === 0 ? (
          <View className='empty-state'>
            <Text className='text-muted'>店铺暂无商品</Text>
          </View>
        ) : null}
      </ScrollView>
    </View>
  )
}
