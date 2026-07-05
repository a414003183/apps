import { useEffect } from 'react'
import { View, Text, Button } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useSessionStore } from '../../stores/session'
import { formatCurrency } from '../../utils/format'
import './index.scss'

export default function MinePage() {
  const { profile, logout, refreshCartCount, cartCount } = useSessionStore()

  useEffect(() => {
    if (profile) {
      refreshCartCount()
    }
  }, [profile])

  function handleLogin() {
    Taro.navigateTo({ url: '/pages/login/index' })
  }

  function handleLogout() {
    Taro.showModal({
      title: '确认退出',
      content: '退出后需要重新登录',
      success: (res) => {
        if (res.confirm) {
          logout()
          Taro.showToast({ title: '已退出', icon: 'success' })
        }
      },
    })
  }

  if (!profile) {
    return (
      <View className='mine-page'>
        <View className='card guest-card'>
          <Text className='title'>未登录</Text>
          <Text className='subtitle'>登录后查看订单、积分与采购信息</Text>
          <Button className='btn-primary login-btn' onClick={handleLogin}>
            登录 / 注册
          </Button>
        </View>
      </View>
    )
  }

  return (
    <View className='mine-page'>
      <View className='card profile-card'>
        <View className='avatar'>
          <Text className='avatar-text'>{profile.name?.[0] || '客'}</Text>
        </View>
        <View className='info'>
          <Text className='name'>{profile.name || profile.username}</Text>
          <Text className='tag'>{profile.memberLevel || profile.identityType}</Text>
        </View>
      </View>

      <View className='card menu-card'>
        <View
          className='menu-item'
          onClick={() => Taro.navigateTo({ url: '/pages/order/list' })}
        >
          <Text className='text'>我的订单</Text>
          <Text className='arrow'>›</Text>
        </View>
        <View className='menu-item' onClick={() => Taro.switchTab({ url: '/pages/cart/index' })}>
          <Text className='text'>购物车</Text>
          <View className='badge-wrap'>
            {cartCount > 0 ? <Text className='badge'>{cartCount}</Text> : null}
            <Text className='arrow'>›</Text>
          </View>
        </View>
        <View className='menu-item'>
          <Text className='text'>收货地址</Text>
          <Text className='arrow'>›</Text>
        </View>
      </View>

      <Button className='btn-outline logout-btn' onClick={handleLogout}>
        退出登录
      </Button>
    </View>
  )
}
