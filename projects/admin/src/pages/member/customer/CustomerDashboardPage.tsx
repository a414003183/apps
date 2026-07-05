import {
  ArrowRightOutlined,
  GiftOutlined,
  HomeOutlined,
  ShoppingCartOutlined,
  ShoppingOutlined,
  StarOutlined,
  CustomerServiceOutlined,
  TrophyOutlined,
  TeamOutlined,
} from '@ant-design/icons'
import { PageContainer } from '@ant-design/pro-components'
import { Avatar, Col, Row, Card, Statistic, Spin, Table, Tag, List, Typography } from 'antd'
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import type { MetricCardItem, OrderItem } from '../../../types/models'
import { fetchCustomerDashboard } from '../../../services/ant-design-pro/customer'
import { fetchCustomerOrders } from '../../../services/ant-design-pro/order'
import { fetchCustomerPoints } from '../../../services/ant-design-pro/points'
import { getAuthProfile } from '../../../utils/auth'

const { Text } = Typography

/* ── 快捷导航 ── */
const quickLinks = [
  { title: '我的订单', icon: <ShoppingOutlined style={{ color: '#1890ff' }} />, to: '/member/customer/orders' },
  {
    title: '售后服务',
    icon: <CustomerServiceOutlined style={{ color: '#52c41a' }} />,
    to: '/member/customer/aftersale',
  },
  { title: '我的积分', icon: <GiftOutlined style={{ color: '#faad14' }} />, to: '/member/customer/points' },
  { title: '继续购物', icon: <ShoppingCartOutlined style={{ color: '#eb2f96' }} />, to: '/mall/home' },
  { title: '推荐有奖', icon: <TrophyOutlined style={{ color: '#722ed1' }} />, to: '/member/customer/referral' },
  { title: '个人资料', icon: <TeamOutlined style={{ color: '#13c2c2' }} />, to: '/member/customer/profile' },
]

/* ── 问候语 ── */
function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 6) return '夜深了'
  if (hour < 9) return '早上好'
  if (hour < 12) return '上午好'
  if (hour < 14) return '中午好'
  if (hour < 18) return '下午好'
  return '晚上好'
}

/* ── 订单状态 ── */
const statusMap: Record<string, { text: string; color: string }> = {
  PENDING_PAYMENT: { text: '待付款', color: 'orange' },
  WAIT_SHIP: { text: '待发货', color: 'blue' },
  WAIT_RECEIVE: { text: '待收货', color: 'cyan' },
  FINISHED: { text: '已完成', color: 'green' },
  CANCELLED: { text: '已取消', color: 'default' },
}

export function CustomerDashboardPage() {
  const navigate = useNavigate()
  const profile = getAuthProfile()
  const [metrics, setMetrics] = useState<MetricCardItem[]>([])
  const [orders, setOrders] = useState<OrderItem[]>([])
  const [points, setPoints] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      setLoading(true)
      const [dashboardData, ordersData, pointsData] = await Promise.all([
        fetchCustomerDashboard(),
        fetchCustomerOrders({ pageSize: 5 }),
        fetchCustomerPoints(),
      ])
      setMetrics(dashboardData?.metrics || [])
      setOrders(ordersData?.list || [])
      setPoints(pointsData?.currentPoints || 0)
    } catch (error: any) {
      console.error('加载数据失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const pendingPaymentCount = orders.filter((o) => o.status === 'PENDING_PAYMENT').length
  const waitReceiveCount = orders.filter((o) => o.status === 'WAIT_RECEIVE').length
  const finishedCount = orders.filter((o) => o.status === 'FINISHED').length

  const columns = [
    {
      title: '订单号',
      dataIndex: 'orderNo',
      width: 180,
      render: (v: string) => <a onClick={() => navigate(`/member/customer/orders`)}>{v}</a>,
    },
    { title: '商家', dataIndex: 'merchantName', width: 150, ellipsis: true },
    { title: '金额', dataIndex: 'amount', width: 100, render: (v: number) => <Text strong>￥{v}</Text> },
    {
      title: '来源',
      dataIndex: 'orderSource',
      width: 90,
      render: (v: string) => {
        if (v === 'ANDROID_APP') return <Tag color="blue">安卓App</Tag>
        return <Tag color="green">网页商城</Tag>
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (s: string) => {
        const info = statusMap[s] || { text: s, color: 'default' }
        return <Tag color={info.color}>{info.text}</Tag>
      },
    },
    { title: '时间', dataIndex: 'createdAt', width: 160 },
  ]

  /* ── 页面头部内容（仿 antd-pro 官网工作台） ── */
  const headerContent = (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      <Avatar size={48} style={{ backgroundColor: '#1890ff', fontSize: 22, marginRight: 16 }}>
        {profile?.name?.charAt(0) || 'U'}
      </Avatar>
      <div>
        <div style={{ fontSize: 16, fontWeight: 500, lineHeight: '24px' }}>
          {getGreeting()}，{profile?.name || '用户'}，祝你开心每一天！
        </div>
        <div style={{ color: 'rgba(0,0,0,0.45)', marginTop: 2, fontSize: 13 }}>
          {profile?.headline || '欢迎使用会员中心'}
        </div>
      </div>
    </div>
  )

  const extraContent = (
    <div style={{ display: 'flex', gap: 24 }}>
      <Statistic title="待处理订单" value={pendingPaymentCount + waitReceiveCount} />
      <Statistic title="已完成订单" value={finishedCount} />
      <Statistic title="我的积分" value={points} />
    </div>
  )

  return (
    <PageContainer content={headerContent} extraContent={extraContent}>
      {loading ? (
        <div style={{ textAlign: 'center', padding: 24 }}>
          <Spin size="large" />
        </div>
      ) : (
        <Row gutter={16}>
          {/* ── 统计 + 订单 ── */}
          <Col xl={24} lg={24} md={24} sm={24} xs={24}>
            {/* 统计卡片 */}
            <Row gutter={[8, 8]} style={{ marginBottom: 12 }}>
              <Col xs={12} sm={6}>
                <Link to="/member/customer/orders">
                  <Card hoverable size="small">
                    <Statistic
                      title="待付款"
                      value={pendingPaymentCount}
                      prefix={<ShoppingOutlined />}
                      valueStyle={{ color: '#fa8c16' }}
                    />
                  </Card>
                </Link>
              </Col>
              <Col xs={12} sm={6}>
                <Link to="/member/customer/orders">
                  <Card hoverable size="small">
                    <Statistic
                      title="待收货"
                      value={waitReceiveCount}
                      prefix={<HomeOutlined />}
                      valueStyle={{ color: '#1890ff' }}
                    />
                  </Card>
                </Link>
              </Col>
              <Col xs={12} sm={6}>
                <Link to="/member/customer/orders">
                  <Card hoverable size="small">
                    <Statistic
                      title="已完成"
                      value={finishedCount}
                      prefix={<StarOutlined />}
                      valueStyle={{ color: '#52c41a' }}
                    />
                  </Card>
                </Link>
              </Col>
              <Col xs={12} sm={6}>
                <Link to="/member/customer/points">
                  <Card hoverable size="small">
                    <Statistic
                      title="我的积分"
                      value={points}
                      prefix={<GiftOutlined />}
                      valueStyle={{ color: '#722ed1' }}
                    />
                  </Card>
                </Link>
              </Col>
            </Row>

            {/* 最近订单 */}
            <Card
              title="最近订单"
              variant="borderless"
              size="small"
              extra={
                <Link to="/member/customer/orders">
                  查看全部 <ArrowRightOutlined />
                </Link>
              }
              style={{ marginBottom: 12 }}
            >
              <Table dataSource={orders} columns={columns} rowKey="id" pagination={false} size="small" />
            </Card>
          </Col>
        </Row>
      )}
    </PageContainer>
  )
}

export default CustomerDashboardPage
