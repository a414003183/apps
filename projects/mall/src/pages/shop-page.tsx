import { ArrowLeft, Phone, Store, Package, TrendingUp } from 'lucide-react'
import { Avatar, Button, Card, Chip, Spinner } from '@heroui/react'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { fetchShop, fetchShopProducts } from '../api/mall'
import { ProductCard } from '../components/commerce/product-card'
import { StatePanel } from '../components/common/state-panel'
import { formatCompactNumber } from '../lib/format'
import type { Product, ShopInfo } from '../types/models'

export function ShopPage() {
  const navigate = useNavigate()
  const { merchantId } = useParams()
  const [shop, setShop] = useState<ShopInfo | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(15)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!merchantId) {
      setLoading(false)
      return
    }
    let m = true
    setLoading(true)
    Promise.all([fetchShop(Number(merchantId)), fetchShopProducts(Number(merchantId), { page, pageSize })])
      .then(([s, p]) => {
        if (m) {
          setShop(s)
          const result = Array.isArray(p) ? { list: p, total: p.length } : p
          setProducts(result.list)
          setTotal(result.total)
        }
      })
      .catch(() => {
        if (m) {
          setShop(null)
          setProducts([])
          setTotal(0)
        }
      })
      .finally(() => {
        if (m) setLoading(false)
      })
    return () => {
      m = false
    }
  }, [merchantId, page, pageSize])

  if (loading)
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" color="accent" />
      </div>
    )
  if (!shop)
    return (
      <StatePanel
        eyebrow="店铺不存在"
        title="未找到店铺"
        description="该商家店铺不存在"
        primaryAction={{ label: '返回', onPress: () => navigate('/search') }}
      />
    )

  return (
    <div className="space-y-3">
      <Button variant="ghost" size="sm" onPress={() => navigate(-1)}>
        <ArrowLeft size={16} /> 返回
      </Button>

      <Card>
        <Card.Content className="p-5">
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-3">
                <Avatar size="lg" color="accent">
                  <Avatar.Fallback>{shop.shopName.charAt(0)}</Avatar.Fallback>
                </Avatar>
                <div>
                  <h1 className="text-xl font-bold">{shop.shopName}</h1>
                  {shop.shopDesc && <p className="text-sm text-muted mt-0.5">{shop.shopDesc}</p>}
                </div>
              </div>
              <div className="flex flex-wrap gap-3 text-xs text-default-foreground">
                {shop.contactName && (
                  <span className="flex items-center gap-1">
                    <Store size={12} /> {shop.contactName}
                  </span>
                )}
                {shop.contactPhone && (
                  <span className="flex items-center gap-1">
                    <Phone size={12} /> {shop.contactPhone}
                  </span>
                )}
                <Chip size="sm" color={shop.status === '营业中' ? 'success' : 'default'} variant="soft">
                  {shop.status}
                </Chip>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[
                { icon: Package, color: 'text-accent', val: formatCompactNumber(shop.productCount), label: '商品' },
                { icon: TrendingUp, color: 'text-success', val: formatCompactNumber(shop.totalSales), label: '销量' },
                { icon: Store, color: 'text-warning', val: '营业中', label: '状态' },
              ].map((s) => (
                <div key={s.label} className="text-center px-4 py-3 bg-surface rounded-lg">
                  <s.icon size={20} className={`mx-auto mb-1 ${s.color}`} />
                  <div className="text-lg font-bold">{s.val}</div>
                  <div className="text-[11px] text-muted">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </Card.Content>
      </Card>

      <Card>
        <Card.Header>
          <Card.Title>全部商品 ({total})</Card.Title>
        </Card.Header>
        <Card.Content className="p-3">
          {products.length === 0 ? (
            <div className="text-center py-12 text-muted">该店铺暂无商品</div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
                {products.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
              {total > 0 && (
                <div className="flex items-center justify-between pt-4">
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onPress={() => setPage(Math.max(1, page - 1))}
                      isDisabled={page <= 1}
                    >
                      上一页
                    </Button>
                    <span className="text-sm">
                      第 {page} / {Math.ceil(total / pageSize)} 页
                    </span>
                    <Button
                      size="sm"
                      variant="secondary"
                      onPress={() => setPage(Math.min(Math.ceil(total / pageSize), page + 1))}
                      isDisabled={page >= Math.ceil(total / pageSize)}
                    >
                      下一页
                    </Button>
                  </div>
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value))
                      setPage(1)
                    }}
                    className="text-sm border rounded-md px-2 py-1 bg-background"
                  >
                    <option value={10}>10条/页</option>
                    <option value={15}>15条/页</option>
                    <option value={20}>20条/页</option>
                    <option value={50}>50条/页</option>
                  </select>
                </div>
              )}
            </>
          )}
        </Card.Content>
      </Card>
    </div>
  )
}
