import { ArrowRightOutlined, ShopOutlined } from '@ant-design/icons'
import { Button, Card, Image, Typography, Tag } from 'antd'
import { Link } from 'react-router-dom'
import type { Product } from '../../types/models'

const currencyFormatter = new Intl.NumberFormat('zh-CN', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
})

function formatCurrency(value: number) {
  return `￥${currencyFormatter.format(value)}`
}

export function ProductCard({ product }: { product: Product }) {
  return (
    <Card
      hoverable
      cover={
        product.mainImageId ? (
          <img
            alt={product.name}
            src={`/api/files/${product.mainImageId}`}
            style={{ height: 160, objectFit: 'cover' }}
          />
        ) : (
          <div
            style={{
              height: 160,
              background: '#f5f5f5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#999',
            }}
          >
            暂无图片
          </div>
        )
      }
    >
      <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
        <Tag color="blue">{product.category}</Tag>
        {product.badge && <Tag color="orange">{product.badge}</Tag>}
      </div>

      <Typography.Title level={5} style={{ marginBottom: 8, marginTop: 0, height: 44, overflow: 'hidden' }}>
        {product.name}
      </Typography.Title>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <ShopOutlined style={{ color: '#666' }} />
        <Link to={`/mall/shop/${product.merchantId}`} style={{ fontWeight: 500 }}>
          {product.shopName}
        </Link>
        {product.saleCount !== undefined && product.saleCount > 0 && <Tag color="orange">已售 {product.saleCount}</Tag>}
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 12 }}>
        <Typography.Text type="secondary">销售价</Typography.Text>
        <Typography.Title level={4} style={{ margin: 0, color: '#ff4d4f' }}>
          {formatCurrency(product.price)}
        </Typography.Title>
      </div>

      {product.memberPrice && product.memberPrice < product.price && (
        <div style={{ marginBottom: 12 }}>
          <Typography.Text type="secondary">会员价 </Typography.Text>
          <Typography.Text strong style={{ color: '#ff4d4f', fontSize: 16 }}>
            {formatCurrency(product.memberPrice)}
          </Typography.Text>
        </div>
      )}

      <Link to={`/mall/product/${product.id}`}>
        <Button block size="small" type="primary" ghost>
          查看详情 <ArrowRightOutlined />
        </Button>
      </Link>
    </Card>
  )
}

export default ProductCard
