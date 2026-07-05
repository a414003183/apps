import { useEffect, useState } from 'react'
import { View, Text, Button } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { formatCurrency } from '../../utils/format'
import './result.scss'

export default function OrderResultPage() {
  const [info, setInfo] = useState({ orderNo: '', orderId: '', payAmount: 0 })

  useEffect(() => {
    const params = Taro.getCurrentInstance().router?.params
    setInfo({
      orderNo: params?.orderNo || '',
      orderId: params?.orderId || '',
      payAmount: Number(params?.payAmount || 0),
    })
  }, [])

  return (
    <View className='order-result-page'>
      <View className='result-icon'>✓</View>
      <Text className='result-title'>下单成功</Text>
      <Text className='result-subtitle'>订单已提交，请按选择的支付方式完成付款</Text>

      <View className='card info-card'>
        <View className='info-row'>
          <Text className='label'>订单编号</Text>
          <Text className='value'>{info.orderNo}</Text>
        </View>
        <View className='info-row'>
          <Text className='label'>应付金额</Text>
          <Text className='value price'>{formatCurrency(info.payAmount)}</Text>
        </View>
      </View>

      <View className='action-row'>
        <Button
          className='btn-outline action-btn'
          onClick={() => Taro.redirectTo({ url: '/pages/order/list' })}
        >
          查看订单
        </Button>
        <Button
          className='btn-primary action-btn'
          onClick={() => Taro.switchTab({ url: '/pages/home/index' })}
        >
          继续采购
        </Button>
      </View>
    </View>
  )
}
