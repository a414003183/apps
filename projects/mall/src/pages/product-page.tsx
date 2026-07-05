import { ArrowRight, ShieldCheck, ShoppingCart, Store, Truck, Package, Minus, Plus } from 'lucide-react'
import { Breadcrumbs, Button, Card, Chip, Spinner, toast } from '@heroui/react'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useSession } from '../auth/session'
import { addMallCartItem, fetchProductById } from '../api/mall'
import { resolveFileUrl } from '../api/http'
import { StatePanel } from '../components/common/state-panel'
import { getErrorMessage } from '../lib/errors'
import { formatCurrency } from '../lib/format'
import type { Product } from '../types/models'

export function ProductPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const session = useSession()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)
  const [adding, setAdding] = useState(false)

  useEffect(() => {
    if (!id) {
      setLoading(false)
      return
    }
    let m = true
    setLoading(true)
    fetchProductById(id)
      .then((d) => {
        if (m) setProduct(d)
      })
      .catch(() => {
        if (m) setProduct(null)
      })
      .finally(() => {
        if (m) setLoading(false)
      })
    return () => {
      m = false
    }
  }, [id])

  async function addToCart() {
    if (!product) return
    if (!session.isAuthenticated) {
      toast.warning('请先登录')
      navigate(`/login?redirect=${encodeURIComponent(`/product/${product.id}`)}`)
      return
    }
    if (!session.isCustomer) {
      toast.warning('需要客户身份')
      return
    }
    setAdding(true)
    try {
      await addMallCartItem({ merchantGoodsId: product.merchantGoodsId, quantity })
      await session.refreshCartCount()
      toast.success(`已加入购物车 (${quantity}件)`)
    } catch (e) {
      toast.danger(getErrorMessage(e))
    } finally {
      setAdding(false)
    }
  }

  function buyNow() {
    if (!product) return
    if (!session.isAuthenticated) {
      toast.warning('请先登录')
      navigate(`/login?redirect=${encodeURIComponent(`/product/${product.id}`)}`)
      return
    }
    if (!session.isCustomer) {
      toast.warning('需要客户身份')
      return
    }
    navigate('/checkout', {
      state: {
        directBuy: {
          merchantGoodsId: product.merchantGoodsId,
          skuId: product.skuId,
          quantity,
          snapshot: product,
        },
      },
    })
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" color="accent" />
      </div>
    )
  }

  if (!product) {
    return (
      <StatePanel
        eyebrow="商品不存在"
        title="未找到对应商品"
        description="该商品可能已下架"
        primaryAction={{ label: '返回首页', onPress: () => navigate('/') }}
      />
    )
  }

  const imageUrl = resolveFileUrl(product.mainImageId)
  const mp = product.memberPrice || product.price
  const hasDiscount = product.price > mp

  return (
    <div className="space-y-3">
      {/* 面包屑 */}
      <Card>
        <Card.Content className="px-4 py-2">
          <Breadcrumbs>
            <Breadcrumbs.Item href="#" onPress={() => navigate('/')}>
              首页
            </Breadcrumbs.Item>
            <Breadcrumbs.Item href="#" onPress={() => navigate('/search')}>
              全部商品
            </Breadcrumbs.Item>
            <Breadcrumbs.Item href="#" onPress={() => navigate(`/search?category=${product.category}`)}>
              {product.category}
            </Breadcrumbs.Item>
            <Breadcrumbs.Item>{product.name}</Breadcrumbs.Item>
          </Breadcrumbs>
        </Card.Content>
      </Card>

      {/* 商品主信息 */}
      <Card>
        <Card.Content className="p-5">
          <div className="grid lg:grid-cols-[400px_1fr] gap-8">
            {/* 左图 */}
            <div className="aspect-square rounded-lg overflow-hidden bg-surface border border-border">
              {imageUrl ? (
                <img src={imageUrl} alt={product.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted">暂无图片</div>
              )}
            </div>

            {/* 右侧信息 */}
            <div>
              <h1 className="text-[18px] font-bold text-foreground leading-snug mb-2">{product.name}</h1>
              <p className="text-[13px] text-muted mb-4">{product.summary}</p>

              {/* 价格区 */}
              <div className="bg-accent-soft rounded-lg p-4 mb-4">
                <div className="flex items-baseline gap-3">
                  <div>
                    <span className="text-[12px] text-muted">会员价</span>
                    <span className="text-accent text-[32px] font-bold ml-1">¥{mp.toFixed(mp % 1 === 0 ? 0 : 2)}</span>
                  </div>
                  {hasDiscount && (
                    <div>
                      <span className="text-[12px] text-muted">市场价</span>
                      <span className="text-muted text-base line-through ml-1">{formatCurrency(product.price)}</span>
                    </div>
                  )}
                </div>
                {product.levelPrices && product.levelPrices.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {product.levelPrices.map((lp) => (
                      <Chip
                        key={lp.levelCode}
                        size="sm"
                        color={lp.levelCode === product.currentLevel ? 'accent' : 'default'}
                        variant={lp.levelCode === product.currentLevel ? 'secondary' : 'tertiary'}
                      >
                        {lp.levelName}: {formatCurrency(lp.price)}
                      </Chip>
                    ))}
                  </div>
                )}
              </div>

              {/* 服务保障 */}
              <div className="flex flex-wrap gap-4 text-[12px] text-default-foreground mb-4 pb-4 border-b border-border">
                <span className="flex items-center gap-1">
                  <Truck size={14} className="text-accent" /> 配送: {product.leadTime || '待确认'}
                </span>
                <span className="flex items-center gap-1">
                  <ShieldCheck size={14} className="text-success" /> 库存: {product.stock}
                </span>
                <span className="flex items-center gap-1">
                  <Package size={14} className="text-warning" /> 运费: {formatCurrency(product.freightAmount ?? 0)}
                </span>
              </div>

              {/* 规格/品牌/店铺 */}
              <div className="space-y-2 text-[13px] mb-4 pb-4 border-b border-border">
                <div className="flex">
                  <span className="text-muted w-[60px] shrink-0">品　牌</span>
                  <span>{product.brand}</span>
                </div>
                <div className="flex">
                  <span className="text-muted w-[60px] shrink-0">分　类</span>
                  <span>{product.category}</span>
                </div>
                <div className="flex">
                  <span className="text-muted w-[60px] shrink-0">规　格</span>
                  <span>{product.specs || '标准规格'}</span>
                </div>
                <div className="flex items-center">
                  <span className="text-muted w-[60px] shrink-0">店　铺</span>
                  <button
                    onClick={() => navigate(`/shop/${product.merchantId}`)}
                    className="text-accent hover:underline flex items-center gap-1"
                  >
                    <Store size={13} /> {product.shopName}
                  </button>
                </div>
              </div>

              {/* 数量 + 操作 */}
              <div className="flex items-center gap-4 mb-4">
                <span className="text-[13px] text-muted">数量</span>
                <div className="flex items-center border border-border rounded-lg overflow-hidden">
                  <button
                    disabled={quantity <= 1}
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-[30px] h-[30px] flex items-center justify-center hover:bg-surface disabled:text-muted"
                  >
                    <Minus size={14} />
                  </button>
                  <input
                    type="number"
                    value={quantity}
                    min={1}
                    max={product.stock}
                    onChange={(e) => setQuantity(Math.max(1, Math.min(product.stock, parseInt(e.target.value) || 1)))}
                    className="w-[50px] h-[30px] text-center border-x border-border text-sm outline-none bg-transparent"
                  />
                  <button
                    disabled={quantity >= product.stock}
                    onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                    className="w-[30px] h-[30px] flex items-center justify-center hover:bg-surface disabled:text-muted"
                  >
                    <Plus size={14} />
                  </button>
                </div>
                <span className="text-[11px] text-muted">库存 {product.stock} 件</span>
              </div>

              <div className="flex gap-3">
                <Button size="lg" onPress={buyNow}>
                  <ArrowRight size={17} /> 立即购买
                </Button>
                <Button size="lg" variant="secondary" onPress={addToCart} isPending={adding}>
                  <ShoppingCart size={17} /> {adding ? '加入中...' : '加入购物车'}
                </Button>
              </div>
            </div>
          </div>
        </Card.Content>
      </Card>

      {/* 详情 */}
      <div className="grid lg:grid-cols-[1fr_300px] gap-3">
        <Card>
          <Card.Header>
            <Card.Title>商品详情</Card.Title>
          </Card.Header>
          <Card.Content className="p-4 text-[13px] text-default-foreground space-y-4">
            {product.detailContent && (
              <div>
                <h4 className="font-bold text-foreground mb-1">详细描述</h4>
                <p className="whitespace-pre-wrap">{product.detailContent}</p>
              </div>
            )}
            {product.description && (
              <div>
                <h4 className="font-bold text-foreground mb-1">商品说明</h4>
                <p className="whitespace-pre-wrap">{product.description}</p>
              </div>
            )}
          </Card.Content>
        </Card>
        <Card>
          <Card.Header>
            <Card.Title>采购信息</Card.Title>
          </Card.Header>
          <Card.Content className="p-4 text-[13px] space-y-3">
            {[
              ['所属分类', product.category],
              ['商品规格', product.specs || '标准'],
              ['累计销量', `${product.saleCount ?? 0} 件`],
              ['最小起订', '1 件'],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between">
                <span className="text-muted">{k}</span>
                <span>{v}</span>
              </div>
            ))}
          </Card.Content>
        </Card>
      </div>
    </div>
  )
}
