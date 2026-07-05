import { Minus, Plus, Trash2, ShoppingCart } from 'lucide-react'
import { Button, Card, Spinner } from '@heroui/react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSession } from '../auth/session'
import { fetchMallCart, removeMallCartItem, updateMallCartItem } from '../api/mall'
import { resolveFileUrl } from '../api/http'
import { StatePanel } from '../components/common/state-panel'
import { getErrorMessage } from '../lib/errors'
import { formatCurrency } from '../lib/format'
import type { MallCartItem } from '../types/models'

export function CartPage() {
  const navigate = useNavigate()
  const session = useSession()
  const [items, setItems] = useState<MallCartItem[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(15)
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  async function load() {
    setLoading(true)
    try {
      const data = await fetchMallCart({ page, pageSize })
      const result = Array.isArray(data) ? { list: data, total: data.length } : data
      setItems(result.list)
      setTotal(result.total)
      // 保留仍然存在的选中项
      const existingIds = new Set(result.list.map((i: MallCartItem) => i.id))
      setSelectedIds((prev) => {
        const next = new Set<string>()
        prev.forEach((id) => {
          if (existingIds.has(id)) next.add(id)
        })
        return next
      })
    } catch {
      setItems([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (session.ready && session.isCustomer) void load()
    else if (session.ready) setLoading(false)
  }, [session.ready, session.isCustomer, page, pageSize])

  const selectedItems = useMemo(() => items.filter((i) => selectedIds.has(i.id)), [items, selectedIds])

  const goodsTotal = selectedItems.reduce((s, i) => s + i.finalUnitPrice * i.quantity, 0)
  const freightTotal = selectedItems.reduce((s, i) => s + (i.freightAmount ?? 0), 0)
  const payTotal = goodsTotal + freightTotal

  async function changeQty(item: MallCartItem, q: number) {
    if (q < 1 || q > item.stockQty) return
    setBusyId(item.id)
    try {
      await updateMallCartItem(item.merchantGoodsId, q)
      await session.refreshCartCount()
      await load()
    } catch (e) {
      console.error(getErrorMessage(e))
    } finally {
      setBusyId(null)
    }
  }

  async function remove(item: MallCartItem) {
    setBusyId(item.id)
    try {
      await removeMallCartItem(item.merchantGoodsId)
      await session.refreshCartCount()
      await load()
    } catch (e) {
      console.error(getErrorMessage(e))
    } finally {
      setBusyId(null)
    }
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleSelectAll() {
    setSelectedIds((prev) => {
      if (prev.size === items.length) return new Set<string>()
      return new Set(items.map((i) => i.id))
    })
  }

  function handleCheckout() {
    if (selectedItems.length === 0) {
      alert('请至少选择一件商品')
      return
    }
    navigate('/checkout', {
      state: { selectedMerchantGoodsIds: selectedItems.map((i) => i.merchantGoodsId) },
    })
  }

  if (!session.ready || loading)
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" color="accent" />
      </div>
    )
  if (!session.isAuthenticated)
    return (
      <StatePanel
        eyebrow="请登录"
        title="登录后查看购物车"
        description="需要客户登录"
        primaryAction={{ label: '去登录', onPress: () => navigate('/login?redirect=%2Fcart') }}
      />
    )
  if (!session.isCustomer)
    return (
      <StatePanel
        eyebrow="身份限制"
        title="需要客户身份"
        description="请切换到客户身份"
        primaryAction={{ label: '返回首页', onPress: () => navigate('/') }}
      />
    )

  return (
    <div className="space-y-3">
      <Card>
        <Card.Content className="px-4 py-3 flex items-center justify-between">
          <h1 className="text-lg font-bold">我的购物车</h1>
          <span className="text-sm text-muted">共 {total} 件商品</span>
        </Card.Content>
      </Card>

      {items.length === 0 ? (
        <StatePanel
          eyebrow="购物车空"
          title="购物车还是空的"
          description="去看看有什么好物"
          primaryAction={{ label: '去逛逛', onPress: () => navigate('/search') }}
        />
      ) : (
        <div className="grid xl:grid-cols-[1fr_320px] gap-3">
          <div className="flex flex-col gap-2" style={{ minHeight: 0 }}>
            {/* 表头 + 全选 */}
            <Card>
              <Card.Content className="px-4 py-2 hidden sm:grid grid-cols-[40px_1fr_100px_140px_100px_50px] text-xs text-muted gap-4 items-center">
                <input
                  type="checkbox"
                  checked={selectedIds.size === items.length && items.length > 0}
                  onChange={toggleSelectAll}
                  className="cursor-pointer"
                />
                <span>商品信息</span>
                <span className="text-center">单价</span>
                <span className="text-center">数量</span>
                <span className="text-center">小计</span>
                <span className="text-center">操作</span>
              </Card.Content>
            </Card>

            {/* 商品列表 */}
            <div className="flex-1 space-y-2">
              {items.map((item) => {
                const img = resolveFileUrl(item.mainImageId)
                const isSelected = selectedIds.has(item.id)
                return (
                  <Card key={item.id} className={isSelected ? 'ring-1 ring-accent' : ''}>
                    <Card.Content className="px-4 py-3 sm:grid sm:grid-cols-[40px_1fr_100px_140px_100px_50px] gap-4 items-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelect(item.id)}
                        className="cursor-pointer"
                      />
                      <div className="flex items-center gap-3">
                        <div className="w-[60px] h-[60px] shrink-0 rounded-lg bg-surface overflow-hidden">
                          {img ? (
                            <img src={img} alt={item.productName} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-xs text-muted">
                              无图
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium line-clamp-1">{item.productName}</p>
                          <p className="text-[11px] text-muted">{item.skuName || item.specText || '标准规格'}</p>
                        </div>
                      </div>
                      <div className="text-center text-sm">{formatCurrency(item.finalUnitPrice)}</div>
                      <div className="flex items-center justify-center">
                        <div className="flex items-center border border-border rounded-lg overflow-hidden">
                          <button
                            disabled={busyId === item.id || item.quantity <= 1}
                            onClick={() => changeQty(item, item.quantity - 1)}
                            className="w-[26px] h-[26px] flex items-center justify-center hover:bg-surface disabled:text-muted"
                          >
                            <Minus size={12} />
                          </button>
                          <span className="w-[36px] text-center text-sm border-x border-border">{item.quantity}</span>
                          <button
                            disabled={busyId === item.id || item.quantity >= item.stockQty}
                            onClick={() => changeQty(item, item.quantity + 1)}
                            className="w-[26px] h-[26px] flex items-center justify-center hover:bg-surface disabled:text-muted"
                          >
                            <Plus size={12} />
                          </button>
                        </div>
                      </div>
                      <div className="text-center text-accent font-bold text-sm">{formatCurrency(item.lineAmount)}</div>
                      <div className="text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          isIconOnly
                          isDisabled={busyId === item.id}
                          onPress={() => remove(item)}
                        >
                          <Trash2 size={15} />
                        </Button>
                      </div>
                    </Card.Content>
                  </Card>
                )
              })}
            </div>

            {/* 分页 - 始终在底部 */}
            {total > 0 && (
              <div className="flex items-center justify-between pt-2">
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
          </div>

          <Card className="xl:sticky xl:top-[140px] h-fit">
            <Card.Header>
              <Card.Title>结算摘要</Card.Title>
            </Card.Header>
            <Card.Content className="p-4 space-y-3">
              <div className="text-sm space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted">已选商品</span>
                  <span>{selectedItems.length} 件</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">商品金额</span>
                  <span>{formatCurrency(goodsTotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">运费</span>
                  <span>{formatCurrency(freightTotal)}</span>
                </div>
              </div>
              <div className="flex justify-between items-center pt-3 border-t border-border">
                <span className="font-bold">应付总额</span>
                <span className="text-accent text-[22px] font-bold">{formatCurrency(payTotal)}</span>
              </div>
              <Button fullWidth size="lg" onPress={handleCheckout} isDisabled={selectedItems.length === 0}>
                <ShoppingCart size={17} /> 去结算
              </Button>
              <Button fullWidth variant="outline" onPress={() => navigate('/search')}>
                继续购物
              </Button>
            </Card.Content>
          </Card>
        </div>
      )}
    </div>
  )
}
