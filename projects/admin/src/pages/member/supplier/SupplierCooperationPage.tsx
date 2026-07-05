import { Card, Row, Col, Statistic } from 'antd'

export function SupplierCooperationPage() {
  return (
    <Card size="small" styles={{ body: { padding: '8px 12px' } }}>
      <Row gutter={[8, 8]}>
        <Col md={8}>
          <Statistic title="合作商家" value={10} />
        </Col>
        <Col md={8}>
          <Statistic title="授权商品" value={50} />
        </Col>
        <Col md={8}>
          <Statistic title="本月供货" value={100} />
        </Col>
      </Row>
    </Card>
  )
}

export default SupplierCooperationPage
