import { Card, Row, Col, Statistic, Button, Spin } from 'antd'
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import type { MetricCardItem } from '../../../types/models'
import { fetchCustomerDashboard } from '../../../services/ant-design-pro/customer'
import { getAuthProfile } from '../../../utils/auth'

export function CustomerWorkspacePage() {
  const [metrics, setMetrics] = useState<MetricCardItem[]>([])
  const [loading, setLoading] = useState(true)
  const profile = getAuthProfile()
  const navigate = useNavigate()

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      setLoading(true)
      const data = await fetchCustomerDashboard()
      setMetrics(data?.metrics || [])
    } catch (error: any) {
      console.error('加载数据失败:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!profile) {
    return (
      <Card>
        <div style={{ textAlign: 'center', padding: 40 }}>
          <p>请先登录</p>
          <Button type="primary" onClick={() => navigate('/login')}>
            去登录
          </Button>
        </div>
      </Card>
    )
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 40 }}>
        <Spin size="large" />
      </div>
    )
  }

  return (
    <div>
      <Row gutter={[8, 8]}>
        {metrics.length > 0 ? (
          metrics.map((item) => (
            <Col xs={24} sm={12} md={6} key={item.label}>
              <Card hoverable size="small" styles={{ body: { padding: '8px 12px' } }}>
                <Statistic title={item.label} value={item.value} />
                {item.trend && <div style={{ color: '#999', fontSize: 12 }}>{item.trend}</div>}
              </Card>
            </Col>
          ))
        ) : (
          <>
            <Col xs={24} sm={12} md={6}>
              <Card hoverable size="small" styles={{ body: { padding: '8px 12px' } }}>
                <Statistic title="待付款订单" value={0} />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card hoverable size="small" styles={{ body: { padding: '8px 12px' } }}>
                <Statistic title="待收货订单" value={0} />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card hoverable size="small" styles={{ body: { padding: '8px 12px' } }}>
                <Statistic title="已完成订单" value={0} />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card hoverable size="small" styles={{ body: { padding: '8px 12px' } }}>
                <Statistic title="我的积分" value={0} />
              </Card>
            </Col>
          </>
        )}
      </Row>

      <Card title="快捷入口" size="small" style={{ marginTop: 8 }} styles={{ body: { padding: '8px 12px' } }}>
        <Row gutter={[8, 8]}>
          <Col xs={12} md={6}>
            <Link to="/member/customer/orders">
              <Button block>我的订单</Button>
            </Link>
          </Col>
          <Col xs={12} md={6}>
            <Link to="/member/customer/aftersale">
              <Button block>售后申请</Button>
            </Link>
          </Col>
          <Col xs={12} md={6}>
            <Link to="/mall/home">
              <Button block>继续购物</Button>
            </Link>
          </Col>
          <Col xs={12} md={6}>
            <Link to="/member/customer/points">
              <Button block>积分商城</Button>
            </Link>
          </Col>
        </Row>
      </Card>
    </div>
  )
}

export default CustomerWorkspacePage
