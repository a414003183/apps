import { SearchOutlined } from '@ant-design/icons'
import { Col, Empty, Input, Pagination, Row, Spin, message } from 'antd'
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { ProductCard } from '../../components/cards/ProductCard'
import type { Product } from '../../types/models'
import { fetchMallProducts } from '../../services/ant-design-pro/mall'

export function MallSearchPage() {
  const { q } = useParams<{ q?: string }>()
  const [products, setProducts] = useState<Product[]>([])
  const [searchValue, setSearchValue] = useState(q || '')
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(15)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    loadProducts(1, pageSize)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q])

  async function loadProducts(currentPage = 1, currentPageSize = 15) {
    try {
      setLoading(true)
      const result = await fetchMallProducts({
        keyword: q,
        page: currentPage,
        pageSize: currentPageSize,
      })
      if (result?.list) {
        setProducts(result.list)
        setTotal(result.total || 0)
        setPage(currentPage)
        setPageSize(currentPageSize)
      }
    } catch (error: any) {
      console.error('搜索商品失败:', error)
      message.error('搜索商品失败')
    } finally {
      setLoading(false)
    }
  }

  function handleSearch(value: string) {
    if (value.trim()) {
      window.location.href = `/mall/search/${encodeURIComponent(value)}`
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ marginBottom: 24, flexShrink: 0 }}>
        <Input.Search
          size="large"
          placeholder="搜索商品名称、品牌、分类..."
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          onSearch={handleSearch}
          enterButton={<SearchOutlined />}
          style={{ maxWidth: 600 }}
        />
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, flex: 1 }}>
          <Spin size="large" />
        </div>
      ) : (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <div style={{ marginBottom: 16, flexShrink: 0 }}>
            <h3>找到 {total} 个商品</h3>
          </div>

          {products.length === 0 ? (
            <Empty description="未找到相关商品" style={{ flex: 1 }} />
          ) : (
            <div style={{ flex: 1, overflow: 'auto' }}>
              <Row gutter={[16, 16]}>
                {products.map((product) => (
                  <Col xs={24} sm={12} lg={6} key={product.id}>
                    <ProductCard product={product} />
                  </Col>
                ))}
              </Row>
            </div>
          )}

          <div style={{ marginTop: 24, display: 'flex', justifyContent: 'center', flexShrink: 0 }}>
            <Pagination
              current={page}
              pageSize={pageSize}
              total={total}
              showSizeChanger
              pageSizeOptions={[10, 15, 20, 50]}
              onChange={(p, ps) => loadProducts(p, ps || 15)}
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default MallSearchPage
