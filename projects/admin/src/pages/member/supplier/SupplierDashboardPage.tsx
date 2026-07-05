import { Card, Row, Col, Statistic, Spin } from 'antd'
import { useEffect, useState } from 'react'
import type { MetricCardItem } from '../../../types/models'
import { fetchSupplierDashboard } from '../../../services/ant-design-pro/supplier'

export function SupplierDashboardPage() {
  const [metrics, setMetrics] = useState<MetricCardItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      setLoading(true)
      const dashboardData = await fetchSupplierDashboard()
      if (dashboardData?.metrics) {
        setMetrics(dashboardData.metrics)
      }
    } catch (error) {
      console.error('加载数据失败:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 20 }}>
        <Spin size="large" />
      </div>
    )
  }

  return (
    <div>
      <Row gutter={[8, 8]}>
        {metrics.length > 0
          ? metrics.map((item, index) => (
              <Col xs={24} sm={12} md={6} key={index}>
                <Card hoverable size="small" styles={{ body: { padding: '8px 12px' } }}>
                  <Statistic title={item.label} value={item.value} suffix={item.unit} />
                </Card>
              </Col>
            ))
          : [
              { label: '在售商品', value: '-' },
              { label: '合作关系', value: '-' },
              { label: '待处理供货', value: '-' },
              { label: '本月销售额', value: '-' },
            ].map((item) => (
              <Col xs={24} sm={12} md={6} key={item.label}>
                <Card hoverable size="small" styles={{ body: { padding: '8px 12px' } }}>
                  <Statistic title={item.label} value={item.value} />
                </Card>
              </Col>
            ))}
      </Row>
    </div>
  )
}

export default SupplierDashboardPage
