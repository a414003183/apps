import { useEffect, useState } from 'react'
import { View, Text, ScrollView, Image, Button } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { fetchProductById, fetchPublicProductById } from '../../api/mall'
import { addCartItem } from '../../api/cart'
import { resolveFileUrl } from '../../api/file'
import { formatCurrency } from '../../utils/format'
import { useSessionStore } from '../../stores/session'
import type { Product } from '../../types/models'
import './detail.scss'

export default function ProductDetailPage() {
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)
  const [adding, setAdding] = useState(false)
  const profile = useSessionStore((s) => s.profile)
  const refreshCartCount = useSessionStore((s) => s.refreshCartCount)

  useEffect(() => {
    const id = Taro.getCurrentInstance().router?.params?.id
    if (id) {
      loadProduct(id)
    }
  }, [])

  async function loadProduct(id: string) {
    try {
      const data = profile ? await fetchProductById(id) : await fetchPublicProductById(id)
      setProduct(data)
    } catch (err: any) {
      Taro.showToast({ title: err?.message || '加载失败', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  async function handleAddCart() {
    if (!product) return
    if (!profile) {
      Taro.navigateTo({ url: '/pages/login/index' })
      return
    }
    setAdding(true)
    try {
      await addCartItem({ merchantGoodsId: product.merchantGoodsId, quantity })
      await refreshCartCount()
      Taro.showToast({ title: '已加入购物车', icon: 'success' })
    } catch (err: any) {
      Taro.showToast({ title: err?.message || '加购失败', icon: 'none' })
    } finally {
      setAdding(false)
    }
  }

  function handleBuyNow() {
    if (!product) return
    if (!profile) {
      Taro.navigateTo({ url: '/pages/login/index' })
      return
    }
    const params = encodeURIComponent(
      JSON.stringify({
        merchantGoodsId: product.merchantGoodsId,
        skuId: product.skuId,
        quantity,
      }),
    )
    Taro.navigateTo({ url: `/pages/checkout/index?directBuy=${params}` })
  }

  function goShop() {
    if (!product) return
    Taro.navigateTo({ url: `/pages/shop/index?merchantId=${product.merchantId}` })
  }

  if (loading) {
    return (
      <View className='product-detail-page loading'>
        <Text className='text-muted'>加载中...</Text>
      </View>
    )
  }

  if (!product) {
    return (
      <View className='product-detail-page loading'>
        <Text className='text-muted'>商品不存在</Text>
      </View>
    )
  }

  return (
    <View className='product-detail-page'>
      <ScrollView className='content' scrollY>
        <Image className='main-image' src={resolveFileUrl(product.mainImageId)} mode='aspectFill' />

        <View className='card info-card'>
          <View className='price-row'>
            <Text className='price'>{formatCurrency(product.memberPrice || product.price)}</Text>
            {product.memberPrice && product.memberPrice < product.price ? (
              <Text className='original-price'>{formatCurrency(product.price)}</Text>
            ) : null}
          </View>
          <Text className='name'>{product.name}</Text>
          <Text className='summary'>{product.summary}</Text>
          <View className='meta-row'>
            <Text className='meta'>库存 {product.stock}</Text>
            <Text className='meta'>销量 {product.saleCount || 0}</Text>
            <Text className='meta'>{product.leadTime}</Text>
          </View>
        </View>

        <View className='card spec-card'>
          <Text className='section-title'>规格参数</Text>
          <Text className='spec-text'>{product.specs || '暂无规格信息'}</Text>
        </View>

        {product.levelPrices && product.levelPrices.length > 0 ? (
          <View className='card level-card'>
            <Text className='section-title'>会员等级价</Text>
            {product.levelPrices.map((lp) => (
              <View key={lp.levelCode} className='level-row'>
                <Text className='level-name'>{lp.levelName}</Text>
                <Text className='level-price'>{formatCurrency(lp.price)}</Text>
              </View>
            ))}
          </View>
        ) : null}

        <View className='card shop-card' onClick={goShop}>
          <Text className='section-title'>店铺信息</Text>
          <View className='shop-row'>
            <Text className='shop-name'>{product.shopName}</Text>
            <Text className='enter-shop'>进入店铺 ›</Text>
          </View>
        </View>

        <View className='card detail-card'>
          <Text className='section-title'>商品详情</Text>
          <Text className='detail-text'>{product.detailContent || product.description || '暂无详情'}</Text>
        </View>

        <View className='safe-bottom' />
      </ScrollView>

      <View className='bottom-bar'>
        <View className='quantity-control'>
          <Text className='label'>数量</Text>
          <View className='stepper'>
            <Text
              className={`btn ${quantity <= 1 ? 'disabled' : ''}`}
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            >
              -
            </Text>
            <Text className='value'>{quantity}</Text>
            <Text
              className={`btn ${quantity >= product.stock ? 'disabled' : ''}`}
              onClick={() => setQuantity((q) => Math.min(product.stock || 999, q + 1))}
            >
              +
            </Text>
          </View>
        </View>
        <Button className='action-btn cart-btn' disabled={adding} onClick={handleAddCart}>
          加入购物车
        </Button>
        <Button className='action-btn buy-btn' onClick={handleBuyNow}>
          立即购买
        </Button>
      </View>
    </View>
  )
}
