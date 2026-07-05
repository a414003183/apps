import { Card, Row, Col, Button, Statistic } from 'antd'
import { Link } from 'react-router-dom'
import { ShoppingOutlined, ShopOutlined, FileTextOutlined, BarChartOutlined } from '@ant-design/icons'

export function MerchantWorkspacePage() {
  return (
    <div>
      <Row gutter={[8, 8]}>
        {[
          { label: '待审核订单', value: '-' },
          { label: '待发货订单', value: '-' },
          { label: '今日销售额', value: '-' },
          { label: '商品总数', value: '-' },
        ].map((item) => (
          <Col xs={24} sm={12} md={6} key={item.label}>
            <Card hoverable size="small" styles={{ body: { padding: '8px 12px' } }}>
              <Statistic title={item.label} value={item.value} />
            </Card>
          </Col>
        ))}
      </Row>

      <Card title="快捷入口" size="small" style={{ marginTop: 8 }} styles={{ body: { padding: '8px 12px' } }}>
        <Row gutter={[8, 8]}>
          <Col xs={12} md={6}>
            <Link to="/member/merchant/orders">
              <Button block icon={<FileTextOutlined />}>
                订单管理
              </Button>
            </Link>
          </Col>
          <Col xs={12} md={6}>
            <Link to="/member/merchant/goods">
              <Button block icon={<ShopOutlined />}>
                商品管理
              </Button>
            </Link>
          </Col>
          <Col xs={12} md={6}>
            <Link to="/member/merchant/supply">
              <Button block icon={<ShoppingOutlined />}>
                供货管理
              </Button>
            </Link>
          </Col>
          <Col xs={12} md={6}>
            <Link to="/member/merchant/reports">
              <Button block icon={<BarChartOutlined />}>
                经营报表
              </Button>
            </Link>
          </Col>
        </Row>
      </Card>
    </div>
  )
}

export default MerchantWorkspacePage
