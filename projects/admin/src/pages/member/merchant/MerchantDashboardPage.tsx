import { CarOutlined, DollarOutlined, FundOutlined, SolutionOutlined } from '@ant-design/icons'
import { Area, Column, Pie } from '@ant-design/plots'
import { Col, Row, Card, Table, Tag, Spin, Statistic, Empty, Typography, Progress } from 'antd'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import type { OrderItem } from '../../../types/models'
import { fetchMerchantOrders } from '../../../services/ant-design-pro/order'
import { fetchMerchantReports } from '../../../services/ant-design-pro/merchant'
import { request } from '@umijs/max'

const currencyFmt = new Intl.NumberFormat('zh-CN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
const fmtCny = (v: number) => `￥${currencyFmt.format(v)}`

const ORDER_STATUS_MAP: Record<string, { text: string; color: string }> = {
  WAIT_PAY: { text: '待付款', color: 'orange' },
  PENDING_PAYMENT: { text: '待付款', color: 'orange' },
  PENDING_AUDIT: { text: '待审核', color: 'gold' },
  WAIT_SHIP: { text: '待发货', color: 'blue' },
  SHIPPED: { text: '已发货', color: 'cyan' },
  WAIT_RECEIVE: { text: '待收货', color: 'cyan' },
  FINISHED: { text: '已完成', color: 'green' },
  COMPLETED: { text: '已完成', color: 'green' },
  CANCELLED: { text: '已取消', color: 'default' },
  CLOSED: { text: '已关闭', color: 'default' },
  REFUNDING: { text: '退款中', color: 'purple' },
  REFUNDED: { text: '已退款', color: 'purple' },
}

interface ReportData {
  overview: {
    totalOrders: number
    grossSales: number
    refundAmount: number
    netSales: number
    grossProfit: number
    netProfit: number
  }
  productRanking: Array<{
    productName: string
    saleQty: number
    grossAmount: number
    netAmount: number
  }>
}

interface TrendReport {
  overview?: {
    todaySales?: number
    todayOrders?: number
    todayVisitors?: number
    conversionRate?: number
  }
  trend?: Array<{ date: string; sales: number; orders: number }>
}

export function MerchantDashboardPage() {
  const [orders, setOrders] = useState<OrderItem[]>([])
  const [loading, setLoading] = useState(true)
  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [trendData, setTrendData] = useState<TrendReport | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      setLoading(true)
      const [ordersData, reportRes, trendRes] = await Promise.all([
        fetchMerchantOrders({ page: 1, pageSize: 200 }),
        request<any>('/api/member/merchant/reports', { method: 'GET', params: { type: 'product' } }).catch(() => null),
        fetchMerchantReports({ reportType: 'overview', startDate: '', endDate: '' }).catch(() => null),
      ])
      setOrders(ordersData?.list || [])
      setReportData(reportRes?.data || null)
      setTrendData(trendRes || null)
    } catch (error: any) {
      console.error('加载数据失败:', error)
    } finally {
      setLoading(false)
    }
  }

  /* ---------- 派生数据 ---------- */
  const waitAuditCount = orders.filter((o) => ['PENDING_AUDIT'].includes(o.status)).length
  const waitShipCount = orders.filter((o) => ['WAIT_SHIP'].includes(o.status)).length
  const finishedCount = orders.filter((o) => ['FINISHED', 'COMPLETED'].includes(o.status)).length
  const totalAmount = orders.reduce((sum, o) => sum + Number(o.amount || 0), 0)

  // 订单状态分布 (饼图)
  const statusDistribution = useMemo(() => {
    const countMap: Record<string, number> = {}
    orders.forEach((o) => {
      const label = ORDER_STATUS_MAP[o.status]?.text || o.status
      countMap[label] = (countMap[label] || 0) + 1
    })
    return Object.entries(countMap).map(([type, value]) => ({ type, value }))
  }, [orders])

  // 每日订单量/金额 (趋势图)
  const dailyTrend = useMemo(() => {
    if (trendData?.trend && trendData.trend.length > 0) {
      return trendData.trend.map((t) => ({
        date: t.date,
        value: t.sales,
        category: '销售额',
      }))
    }
    // 从订单数据派生
    const dayMap: Record<string, { sales: number; count: number }> = {}
    orders.forEach((o) => {
      const d = (o.createdAt || '').slice(0, 10)
      if (!d) return
      if (!dayMap[d]) dayMap[d] = { sales: 0, count: 0 }
      dayMap[d].sales += Number(o.amount || 0)
      dayMap[d].count += 1
    })
    const sorted = Object.entries(dayMap).sort(([a], [b]) => a.localeCompare(b))
    const result: Array<{ date: string; value: number; category: string }> = []
    sorted.forEach(([date, v]) => {
      result.push({ date, value: v.sales, category: '销售额' })
      result.push({ date, value: v.count, category: '订单数' })
    })
    return result
  }, [orders, trendData])

  // 商品排行 (柱状图)
  const rankingChartData = useMemo(() => {
    return (reportData?.productRanking || []).slice(0, 8).map((item) => ({
      name: item.productName.length > 8 ? item.productName.slice(0, 8) + '...' : item.productName,
      value: item.saleQty,
      amount: item.netAmount,
    }))
  }, [reportData])

  const orderColumns = [
    { title: '订单号', dataIndex: 'orderNo', width: 180 },
    { title: '客户', dataIndex: 'customerName', width: 120 },
    { title: '金额', dataIndex: 'amount', width: 100, render: (v: number) => fmtCny(v) },
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
      render: (s: string) => {
        const item = ORDER_STATUS_MAP[s] || { text: s, color: 'default' }
        return <Tag color={item.color}>{item.text}</Tag>
      },
    },
    { title: '时间', dataIndex: 'createdAt', width: 140 },
  ]

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 24 }}>
        <Spin size="large" />
      </div>
    )
  }

  const overview = reportData?.overview
  const grossSales = overview?.grossSales ?? totalAmount
  const netProfit = overview?.netProfit ?? 0
  const refundAmount = overview?.refundAmount ?? 0
  const refundRate = grossSales > 0 ? (refundAmount / grossSales) * 100 : 0

  return (
    <div>
      {/* ===== Row 1: 统计卡片 ===== */}
      <Row gutter={[8, 8]} style={{ marginBottom: 8 }}>
        <Col xs={24} sm={12} md={6}>
          <Link to="/member/merchant/orders">
            <Card hoverable size="small" styles={{ body: { padding: '8px 12px' } }}>
              <Statistic
                title="待审核订单"
                value={waitAuditCount}
                prefix={<SolutionOutlined style={{ color: '#faad14' }} />}
                valueStyle={{ fontSize: 28, fontWeight: 600 }}
              />
            </Card>
          </Link>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Link to="/member/merchant/shipping">
            <Card hoverable size="small" styles={{ body: { padding: '8px 12px' } }}>
              <Statistic
                title="待发货订单"
                value={waitShipCount}
                prefix={<CarOutlined style={{ color: '#1677ff' }} />}
                valueStyle={{ fontSize: 28, fontWeight: 600 }}
              />
            </Card>
          </Link>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card size="small" styles={{ body: { padding: '8px 12px' } }}>
            <Statistic
              title="销售总额"
              value={grossSales}
              prefix={<DollarOutlined style={{ color: '#52c41a' }} />}
              precision={2}
              valueStyle={{ fontSize: 28, fontWeight: 600 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card size="small" styles={{ body: { padding: '8px 12px' } }}>
            <Statistic
              title="净利润"
              value={netProfit}
              prefix={<FundOutlined style={{ color: '#3f8604' }} />}
              precision={2}
              valueStyle={{ fontSize: 28, fontWeight: 600, color: '#3f8604' }}
            />
          </Card>
        </Col>
      </Row>

      {/* ===== Row 2: 销售趋势 + 订单分布 ===== */}
      <Row gutter={[8, 8]} style={{ marginBottom: 8 }}>
        <Col xs={24} md={16}>
          <Card title="销售趋势" size="small" styles={{ body: { padding: '8px 12px' } }}>
            {dailyTrend.length > 0 ? (
              <Area
                data={dailyTrend}
                xField="date"
                yField="value"
                colorField="category"
                shapeField="smooth"
                height={220}
                style={{ fillOpacity: 0.15 }}
                axis={{
                  x: { title: false },
                  y: { title: false, gridLineDash: null, gridStroke: '#eee' },
                }}
                legend={{ color: { position: 'top-right' as const } }}
                tooltip={{ channel: 'y', name: '数值' }}
              />
            ) : (
              <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Empty description="暂无趋势数据" image={Empty.PRESENTED_IMAGE_SIMPLE} />
              </div>
            )}
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card title="订单状态分布" size="small" styles={{ body: { padding: '8px 12px' } }}>
            {statusDistribution.length > 0 ? (
              <Pie
                data={statusDistribution}
                angleField="value"
                colorField="type"
                height={220}
                radius={0.8}
                innerRadius={0.55}
                legend={false}
                label={{
                  position: 'spider' as const,
                  text: (d: any) => `${d.type}: ${d.value}`,
                }}
              />
            ) : (
              <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Empty description="暂无订单" image={Empty.PRESENTED_IMAGE_SIMPLE} />
              </div>
            )}
          </Card>
        </Col>
      </Row>

      {/* ===== Row 3: 商品排行 + 销售概览 ===== */}
      <Row gutter={[8, 8]} style={{ marginBottom: 8 }}>
        <Col xs={24} md={14}>
          <Card title="商品销量排行" size="small" styles={{ body: { padding: '8px 12px' } }}>
            {rankingChartData.length > 0 ? (
              <Column
                data={rankingChartData}
                xField="name"
                yField="value"
                height={200}
                paddingBottom={12}
                axis={{
                  x: { title: false },
                  y: { title: false, gridLineDash: null, gridStroke: '#eee' },
                }}
                scale={{ x: { paddingInner: 0.4 } }}
                tooltip={{ name: '销量', channel: 'y' }}
              />
            ) : (
              <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Empty description="暂无商品数据" image={Empty.PRESENTED_IMAGE_SIMPLE} />
              </div>
            )}
          </Card>
        </Col>
        <Col xs={24} md={10}>
          <Card title="销售概览" size="small" styles={{ body: { padding: '8px 12px' } }}>
            <Row gutter={[8, 12]}>
              <Col span={12}>
                <Statistic
                  title="销售总额"
                  value={grossSales}
                  prefix="￥"
                  precision={2}
                  valueStyle={{ fontSize: 18 }}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="净销售额"
                  value={overview?.netSales ?? 0}
                  prefix="￥"
                  precision={2}
                  valueStyle={{ fontSize: 18 }}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="退款金额"
                  value={refundAmount}
                  prefix="￥"
                  precision={2}
                  valueStyle={{ fontSize: 18, color: refundAmount > 0 ? '#ff4d4f' : undefined }}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="净利润"
                  value={netProfit}
                  prefix="￥"
                  precision={2}
                  valueStyle={{ fontSize: 18, color: '#3f8604' }}
                />
              </Col>
              <Col span={24}>
                <div style={{ marginTop: 4 }}>
                  <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                    {'退款率'}
                  </Typography.Text>
                  <Progress
                    percent={Number(refundRate.toFixed(1))}
                    size="small"
                    strokeColor={refundRate > 10 ? '#ff4d4f' : '#1677ff'}
                    format={(p) => `${p}%`}
                    style={{ marginBottom: 0 }}
                  />
                </div>
                <div style={{ marginTop: 4 }}>
                  <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                    {'完成率'}
                  </Typography.Text>
                  <Progress
                    percent={orders.length > 0 ? Number(((finishedCount / orders.length) * 100).toFixed(1)) : 0}
                    size="small"
                    strokeColor="#52c41a"
                    format={(p) => `${p}%`}
                    style={{ marginBottom: 0 }}
                  />
                </div>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      {/* ===== Row 4: 最近订单 ===== */}
      <Row gutter={[8, 8]}>
        <Col xs={24}>
          <Card title="最近订单" size="small" extra={<Link to="/member/merchant/orders">{'查看全部'}</Link>}>
            <Table dataSource={orders.slice(0, 8)} columns={orderColumns} rowKey="id" pagination={false} size="small" />
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default MerchantDashboardPage
