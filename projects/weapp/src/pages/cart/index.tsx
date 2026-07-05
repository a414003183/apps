import { useEffect, useState } from 'react'
import { View, Text, ScrollView, Image, Button, Checkbox, CheckboxGroup } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { fetchCart, updateCartItem, removeCartItem } from '../../api/cart'
import { resolveFileUrl } from '../../api/file'
import { formatCurrency } from '../../utils/format'
import { useSessionStore } from '../../stores/session'
import type { MallCartItem } from '../../types/models'
import './index.scss'

export default function CartPage() {
  const [items, setItems] = useState<MallCartItem[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [loading, setLoading] = useState(true)
  const profile = useSessionStore((s) => s.profile)
  const refreshCartCount = useSessionStore((s) => s.refreshCartCount)

  useEffect(() => {
    if (profile) {
      loadCart()
    } else {
      setLoading(false)
    }
  }, [profile])

  async function loadCart() {
    setLoading(true)
    try {
      const result = await fetchCart({ page: 1, pageSize: 999 })
      const list = result?.list || []
      setItems(list)
      setSelectedIds(new Set(list.map((i) => i.merchantGoodsId)))
    } catch (err: any) {
      Taro.showToast({ title: err?.message || '加载失败', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  async function changeQuantity(item: MallCartItem, delta: number) {
    const next = item.quantity + delta
    if (next < 1 || next > item.stockQty) return
    try {
      await updateCartItem(item.merchantGoodsId, next)
      setItems((prev) =>
        prev.map((i) => (i.merchantGoodsId === item.merchantGoodsId ? { ...i, quantity: next } : i)),
      )
      refreshCartCount()
    } catch (err: any) {
      Taro.showToast({ title: err?.message || '更新失败', icon: 'none' })
    }
  }

  async function removeItem(item: MallCartItem) {
    Taro.showModal({
      title: '确认删除',
      content: `删除 ${item.productName}?`,
      success: async (res) => {
        if (res.confirm) {
          try {
            await removeCartItem(item.merchantGoodsId)
            setItems((prev) => prev.filter((i) => i.merchantGoodsId !== item.merchantGoodsId))
            setSelectedIds((prev) => {
              const next = new Set(prev)
              next.delete(item.merchantGoodsId)
              return next
            })
            refreshCartCount()
          } catch (err: any) {
            Taro.showToast({ title: err?.message || '删除失败', icon: 'none' })
          }
        }
      },
    })
  }

  function toggleSelect(id: number) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleSelectAll() {
    if (selectedIds.size === items.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(items.map((i) => i.merchantGoodsId)))
    }
  }

  function goCheckout() {
    if (selectedIds.size === 0) {
      Taro.showToast({ title: '请选择商品', icon: 'none' })
      return
    }
    const ids = Array.from(selectedIds)
    Taro.navigateTo({ url: `/pages/checkout/index?selectedIds=${JSON.stringify(ids)}` })
  }

  const selectedItems = items.filter((i) => selectedIds.has(i.merchantGoodsId))
  const totalAmount = selectedItems.reduce((sum, i) => sum + i.lineAmount, 0)
  const totalFreight = selectedItems.reduce((sum, i) => sum + (i.freightAmount || 0), 0)

  if (!profile) {
    return (
      <View className='cart-page empty'>
        <Text className='text-muted'>请先登录</Text>
        <Button className='btn-primary login-btn' onClick={() => Taro.navigateTo({ url: '/pages/login/index' })}>
          去登录
        </Button>
      </View>
    )
  }

  if (loading) {
    return (
      <View className='cart-page empty'>
        <Text className='text-muted'>加载中...</Text>
      </View>
    )
  }

  return (
    <View className='cart-page'>
      <ScrollView className='cart-list' scrollY>
        {items.length === 0 ? (
          <View className='empty-state'>
            <Text className='text-muted'>购物车是空的</Text>
          </View>
        ) : (
          items.map((item) => (
            <View key={item.merchantGoodsId} className='cart-item'>
              <View className='checkbox-wrap' onClick={() => toggleSelect(item.merchantGoodsId)}>
                <Checkbox
                  value={String(item.merchantGoodsId)}
                  checked={selectedIds.has(item.merchantGoodsId)}
                />
              </View>
              <Image className='item-image' src={resolveFileUrl(item.mainImageId)} mode='aspectFill' />
              <View className='item-info'>
                <Text className='item-name line-clamp-2'>{item.productName}</Text>
                <Text className='item-spec line-clamp-1'>{item.specText}</Text>
                <View className='item-bottom'>
                  <Text className='item-price'>{formatCurrency(item.finalUnitPrice)}</Text>
                  <View className='stepper'>
                    <Text
                      className={`btn ${item.quantity <= 1 ? 'disabled' : ''}`}
                      onClick={() => changeQuantity(item, -1)}
                    >
                      -
                    </Text>
                    <Text className='value'>{item.quantity}</Text>
                    <Text
                      className={`btn ${item.quantity >= item.stockQty ? 'disabled' : ''}`}
                      onClick={() => changeQuantity(item, 1)}
                    >
                      +
                    </Text>
                  </View>
                </View>
              </View>
              <Text className='delete-btn' onClick={() => removeItem(item)}>
                删除
              </Text>
            </View>
          ))
        )}
      </ScrollView>

      {items.length > 0 ? (
        <View className='bottom-bar'>
          <View className='select-all' onClick={toggleSelectAll}>
            <Checkbox value='all' checked={selectedIds.size === items.length && items.length > 0} />
            <Text className='text'>全选</Text>
          </View>
          <View className='total-wrap'>
            <Text className='total-label'>合计:</Text>
            <Text className='total-price'>{formatCurrency(totalAmount + totalFreight)}</Text>
            {totalFreight > 0 ? <Text className='freight'>(含运费 {formatCurrency(totalFreight)})</Text> : null}
          </View>
          <Button className='checkout-btn' onClick={goCheckout}>
            去结算({selectedIds.size})
          </Button>
        </View>
      ) : null}
    </View>
  )
}
