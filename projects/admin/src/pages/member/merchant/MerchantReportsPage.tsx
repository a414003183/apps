import { Card, Row, Col, Statistic, Spin, DatePicker } from 'antd'
import { useEffect, useState } from 'react'
import { fetchMerchantReports } from '../../../services/ant-design-pro/merchant'
import dayjs from 'dayjs'

interface ReportData {
  overview?: {
    todaySales?: number
    todayOrders?: number
    todayVisitors?: number
    conversionRate?: number
    grossSales?: number
    netSales?: number
    refundAmount?: number
    netProfit?: number
  }
  trend?: Array<{
    date: string
    sales: number
    orders: number
  }>
}

export function MerchantReportsPage() {
  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState<[string, string]>([
    dayjs().subtract(7, 'day').format('YYYY-MM-DD'),
    dayjs().format('YYYY-MM-DD'),
  ])

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      setLoading(true)
      const result = await fetchMerchantReports({
        startDate: dateRange[0],
        endDate: dateRange[1],
        reportType: 'overview',
      })
      setReportData(result)
    } catch (error) {
      console.error('加载报表数据失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const overview = reportData?.overview

  if (loading) {
    return (
      <Card size="small">
        <div style={{ textAlign: 'center', padding: 20 }}>
          <Spin size="large" />
        </div>
      </Card>
    )
  }

  return (
    <Card size="small" styles={{ body: { padding: '8px 12px' } }}>
      <Row gutter={[8, 8]}>
        <Col md={6}>
          <Card size="small" styles={{ body: { padding: '8px 12px' } }}>
            <Statistic title="今日销售额" value={overview?.todaySales || 0} prefix="￥" precision={2} />
          </Card>
        </Col>
        <Col md={6}>
          <Card size="small" styles={{ body: { padding: '8px 12px' } }}>
            <Statistic title="今日订单" value={overview?.todayOrders || 0} />
          </Card>
        </Col>
        <Col md={6}>
          <Card size="small" styles={{ body: { padding: '8px 12px' } }}>
            <Statistic title="今日访客" value={overview?.todayVisitors || 0} />
          </Card>
        </Col>
        <Col md={6}>
          <Card size="small" styles={{ body: { padding: '8px 12px' } }}>
            <Statistic title="转化率" value={overview?.conversionRate || 0} suffix="%" precision={2} />
          </Card>
        </Col>
      </Row>
      <Card title="销售趋势" size="small" style={{ marginTop: 8 }}>
        <div style={{ height: 240, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>
          {reportData?.trend && reportData.trend.length > 0 ? <div>趋势图表区域 - 数据已加载</div> : '暂无趋势数据'}
        </div>
      </Card>
    </Card>
  )
}

export default MerchantReportsPage
