import { Button, Card, Descriptions, Image, InputNumber, message, Space, Tag, Spin } from 'antd'
import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ShoppingCartOutlined, ShopOutlined } from '@ant-design/icons'
import type { Product } from '../../types/models'
import { fetchMallProductDetail } from '../../services/ant-design-pro/mall'
import { addCartItem } from '../../services/ant-design-pro/cart'
import { getAuthProfile } from '../../utils/auth'

export function MallProductPage() {
  const { id } = useParams<{ id: string }>()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [quantity, setQuantity] = useState(1)
  const navigate = useNavigate()
  const profile = getAuthProfile()

  useEffect(() => {
    loadProduct()
  }, [id])

  async function loadProduct() {
    try {
      setLoading(true)
      const data = await fetchMallProductDetail(Number(id))
      setProduct(data)
    } catch (error: any) {
      console.error('加载商品失败:', error)
      message.error('加载商品失败')
    } finally {
      setLoading(false)
    }
  }

  const handleAddToCart = async () => {
    if (!profile) {
      message.warning('请先登录')
      navigate('/login')
      return
    }
    if (!product) return

    try {
      setAdding(true)
      await addCartItem({
        merchantGoodsId: product.merchantGoodsId,
        skuId: product.skuId,
        quantity,
      })
      message.success(`已添加 ${quantity} 件到购物车`)
    } catch (error: any) {
      message.error('添加购物车失败')
    } finally {
      setAdding(false)
    }
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 40 }}>
        <Spin size="large" />
      </div>
    )
  }

  if (!product) {
    return <div>商品不存在</div>
  }

  const handleBuyNow = () => {
    navigate('/mall/checkout')
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 24, marginBottom: 24 }}>
        <div style={{ flex: '0 0 400px' }}>
          {product.mainImageId ? (
            <Image src={`/api/files/${product.mainImageId}`} width={400} height={400} style={{ objectFit: 'cover' }} />
          ) : (
            <div
              style={{
                width: 400,
                height: 400,
                background: '#f5f5f5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#999',
                fontSize: 16,
              }}
            >
              暂无图片
            </div>
          )}
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ marginBottom: 8 }}>
            <Tag color="blue">{product.category}</Tag>
            {product.badge && <Tag color="orange">{product.badge}</Tag>}
          </div>

          <h1 style={{ marginBottom: 8 }}>{product.name}</h1>

          <p style={{ color: '#666', marginBottom: 16 }}>{product.summary}</p>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24 }}>
            <ShopOutlined />
            <Link to={`/mall/shop/${product.merchantId}`}>{product.shopName}</Link>
            <span style={{ color: '#999' }}>已售 {product.saleCount}</span>
          </div>

          <Card style={{ marginBottom: 24 }}>
            <div style={{ marginBottom: 12 }}>
              <span style={{ color: '#666' }}>销售价 </span>
              <span style={{ fontSize: 28, color: '#ff4d4f', fontWeight: 'bold' }}>￥{product.price}</span>
            </div>
            {product.memberPrice && product.memberPrice < product.price && (
              <div>
                <span style={{ color: '#666' }}>会员价 </span>
                <span style={{ fontSize: 20, color: '#ff4d4f' }}>￥{product.memberPrice}</span>
              </div>
            )}
          </Card>

          <div style={{ marginBottom: 16 }}>
            <span style={{ marginRight: 16 }}>规格: {product.specs}</span>
            <span>库存: {product.stock}</span>
          </div>

          <div style={{ marginBottom: 16 }}>
            <span style={{ marginRight: 16 }}>配送: {product.leadTime}</span>
            {product.freightAmount === 0 && <Tag color="green">免运费</Tag>}
          </div>

          <div style={{ marginBottom: 24 }}>
            <span style={{ marginRight: 16 }}>数量:</span>
            <InputNumber
              min={1}
              max={product.stock}
              value={quantity}
              onChange={(val) => val !== null && setQuantity(val)}
            />
          </div>

          <Space>
            <Button type="primary" size="large" icon={<ShoppingCartOutlined />} onClick={handleAddToCart}>
              加入购物车
            </Button>
            <Button type="primary" size="large" danger onClick={handleBuyNow}>
              立即购买
            </Button>
          </Space>
        </div>
      </div>

      <Card title="商品详情">
        <div dangerouslySetInnerHTML={{ __html: product.detailContent || '' }} />
      </Card>
    </div>
  )
}

export default MallProductPage
