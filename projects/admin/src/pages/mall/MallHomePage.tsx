import { ArrowRightOutlined, SearchOutlined, ThunderboltOutlined } from '@ant-design/icons'
import { Col, Empty, Input, Pagination, Row, Spin, message } from 'antd'
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ProductCard } from '../../components/cards/ProductCard'
import type { Product } from '../../types/models'
import { getAuthProfile } from '../../utils/auth'
import { fetchMallProducts } from '../../services/ant-design-pro/mall'

export function MallHomePage() {
  const [products, setProducts] = useState<Product[]>([])
  const [searchValue, setSearchValue] = useState('')
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(15)
  const [total, setTotal] = useState(0)
  const navigate = useNavigate()
  const profile = getAuthProfile()

  useEffect(() => {
    loadProducts(1, pageSize)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function loadProducts(currentPage = 1, currentPageSize = 15) {
    try {
      setLoading(true)
      const result = await fetchMallProducts({ page: currentPage, pageSize: currentPageSize })
      if (result?.list) {
        setProducts(result.list)
        setTotal(result.total || 0)
        setPage(currentPage)
        setPageSize(currentPageSize)
      }
    } catch (error: any) {
      console.error('加载商品失败:', error)
      message.error('加载商品失败')
    } finally {
      setLoading(false)
    }
  }

  const productCategories = useMemo(() => {
    const counts = new Map<string, number>()
    products.forEach((item) => {
      counts.set(item.category, (counts.get(item.category) ?? 0) + 1)
    })
    return Array.from(counts.entries()).map(([name, count]) => ({ name, count }))
  }, [products])

  const visibleCategories = productCategories.slice(0, 6)
  const entryPath = profile?.route ?? '/login'
  const entryLabel = profile ? '进入工作台' : '登录 / 注册'

  function handleSearch() {
    const q = searchValue.trim()
    navigate(q ? `/mall/search?q=${encodeURIComponent(q)}` : '/mall/search')
  }

  return (
    <div style={{ padding: 16, display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* 搜索 + 统计 行 */}
      <div style={{ marginBottom: 24, flexShrink: 0 }}>
        <div style={{ marginBottom: 16 }}>
          <Input.Search
            size="large"
            placeholder="搜索商品名称、品牌、分类..."
            enterButton={
              <>
                <SearchOutlined /> 搜索
              </>
            }
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onSearch={handleSearch}
            style={{ maxWidth: 600 }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <span>
            <strong>{loading ? '-' : total}</strong> 款商品
          </span>
          <span>
            <strong>{productCategories.length}</strong> 个分类
          </span>
          <Link to={entryPath} style={{ marginLeft: 'auto' }}>
            {entryLabel} <ArrowRightOutlined />
          </Link>
        </div>
      </div>

      {/* 分类快捷入口 */}
      {visibleCategories.length > 0 && (
        <div style={{ marginBottom: 24, flexShrink: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ margin: 0 }}>商品分类</h2>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
            {visibleCategories.map((item) => (
              <Link
                key={item.name}
                to={`/mall/search?q=${encodeURIComponent(item.name)}`}
                style={{
                  padding: '8px 16px',
                  background: '#f5f5f5',
                  borderRadius: 4,
                  display: 'flex',
                  gap: 8,
                }}
              >
                <span>{item.name}</span>
                <span style={{ color: '#999' }}>({item.count})</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* 重点商品 */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 16,
            flexShrink: 0,
          }}
        >
          <h2 style={{ margin: 0 }}>
            <ThunderboltOutlined /> 重点商品
          </h2>
        </div>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, flex: 1 }}>
            <Spin size="large" />
          </div>
        ) : products.length === 0 ? (
          <Empty description="暂无可展示商品" style={{ flex: 1 }} />
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
    </div>
  )
}

export default MallHomePage
