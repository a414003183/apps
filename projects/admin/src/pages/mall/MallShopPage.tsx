import { Button, Card, Image, Pagination, Rate, Spin, message } from 'antd'
import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ShopOutlined } from '@ant-design/icons'
import type { Product } from '../../types/models'
import { fetchShopInfo, fetchShopProducts } from '../../services/ant-design-pro/mall'

export function MallShopPage() {
  const { merchantId } = useParams<{ merchantId: string }>()
  const [shop, setShop] = useState<any>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(15)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    loadShopData(1, pageSize)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [merchantId])

  async function loadShopData(currentPage = 1, currentPageSize = 15) {
    if (!merchantId) return
    try {
      setLoading(true)
      const [shopData, productsData] = await Promise.all([
        fetchShopInfo(Number(merchantId)),
        fetchShopProducts(Number(merchantId), { page: currentPage, pageSize: currentPageSize }),
      ])
      setShop(shopData)
      if (productsData?.list) {
        setProducts(productsData.list)
        setTotal(productsData.total || 0)
        setPage(currentPage)
        setPageSize(currentPageSize)
      }
    } catch (error: any) {
      console.error('加载店铺失败:', error)
      message.error('加载店铺失败')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 40 }}>
        <Spin size="large" />
      </div>
    )
  }

  if (!shop) {
    return <div>店铺不存在</div>
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Card style={{ marginBottom: 24, flexShrink: 0 }}>
        <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
          <div
            style={{
              width: 80,
              height: 80,
              background: '#1890ff',
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontSize: 32,
            }}
          >
            <ShopOutlined />
          </div>
          <div>
            <h2 style={{ margin: '0 0 8px' }}>{shop.shopName || shop.name || '店铺'}</h2>
            <div style={{ display: 'flex', gap: 16 }}>
              <span>
                店铺评分: <Rate disabled value={shop.rating || 5} style={{ fontSize: 14 }} />
              </span>
              <span>商品数量: {shop.productCount || total}</span>
              <span>销量: {shop.saleCount || 0}</span>
            </div>
          </div>
        </div>
      </Card>

      <h3 style={{ flexShrink: 0 }}>店铺商品</h3>
      {products.length === 0 ? (
        <div style={{ textAlign: 'center', color: '#999', padding: 40, flex: 1 }}>暂无商品</div>
      ) : (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <div style={{ flex: 1, overflow: 'auto' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
              {products.map((product) => (
                <Link to={`/mall/product/${product.id}`} key={product.id}>
                  <Card
                    hoverable
                    cover={
                      <div
                        style={{
                          height: 160,
                          background: '#f5f5f5',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {product.mainImageId ? (
                          <Image
                            src={`/api/files/${product.mainImageId}`}
                            width="100%"
                            height={160}
                            style={{ objectFit: 'cover' }}
                          />
                        ) : (
                          '暂无图片'
                        )}
                      </div>
                    }
                  >
                    <Card.Meta
                      title={product.name}
                      description={
                        <div>
                          <div style={{ color: '#ff4d4f', fontSize: 18 }}>￥{product.price}</div>
                        </div>
                      }
                    />
                  </Card>
                </Link>
              ))}
            </div>
          </div>
          <div style={{ marginTop: 24, display: 'flex', justifyContent: 'center', flexShrink: 0 }}>
            <Pagination
              current={page}
              pageSize={pageSize}
              total={total}
              showSizeChanger
              pageSizeOptions={[10, 15, 20, 50]}
              onChange={(p, ps) => loadShopData(p, ps || 15)}
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default MallShopPage
