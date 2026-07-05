import { Button, Card, Result } from 'antd'
import { useNavigate, useSearchParams } from 'react-router-dom'

export function MallOrderResultPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const orderNo = searchParams.get('orderNo') || ''

  return (
    <div>
      <Card>
        <Result
          status="success"
          title="订单提交成功"
          subTitle={`订单号: ${orderNo}，请尽快完成支付`}
          extra={[
            <Button type="primary" key="orders" onClick={() => navigate('/member/customer/orders')}>
              查看订单
            </Button>,
            <Button key="home" onClick={() => navigate('/mall/home')}>
              继续购物
            </Button>,
          ]}
        />
      </Card>
    </div>
  )
}

export default MallOrderResultPage
