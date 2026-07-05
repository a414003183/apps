import { Card, Row, Col, Button } from 'antd'
import { Link } from 'react-router-dom'

export function SupplierWorkspacePage() {
  return (
    <Card size="small" styles={{ body: { padding: '8px 12px' } }}>
      <Row gutter={[8, 8]}>
        <Col xs={12} md={6}>
          <Link to="/member/supplier/products">
            <Button block>商品档案</Button>
          </Link>
        </Col>
        <Col xs={12} md={6}>
          <Link to="/member/supplier/supply-status">
            <Button block>供货状态</Button>
          </Link>
        </Col>
        <Col xs={12} md={6}>
          <Link to="/member/supplier/cooperation">
            <Button block>合作关系</Button>
          </Link>
        </Col>
        <Col xs={12} md={6}>
          <Link to="/member/supplier/cooperation-authorizations">
            <Button block>授权管理</Button>
          </Link>
        </Col>
      </Row>
    </Card>
  )
}

export default SupplierWorkspacePage
