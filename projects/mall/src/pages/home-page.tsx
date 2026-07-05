import { ChevronRight, Heart, Store } from 'lucide-react'
import { Accordion, Button, Card, Chip, Spinner, Tabs } from '@heroui/react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchProducts } from '../api/mall'
import { resolveFileUrl } from '../api/http'
import { ProductCard } from '../components/commerce/product-card'
import { formatCurrency } from '../lib/format'
import type { Product } from '../types/models'

interface CatTreeNode {
  label: string
  count: number
  children: { label: string; count: number; children: { label: string; count: number }[] }[]
}

interface TopMemberProduct extends Product {
  topMemberName: string
  topMemberPrice: number
  topMemberSavings: number
  topMemberDiscountValue: number
}

interface ShowcaseTileProps {
  product: Product
  price: number
  onPress: () => void
}

function hasShowcaseImage(mainImageId?: number) {
  return typeof mainImageId === 'number' && mainImageId >= 1000
}

function pickShowcaseProducts<T extends Product>(products: T[], count: number) {
  const withImage = products.filter((product) => hasShowcaseImage(product.mainImageId))
  const source = withImage.length >= count ? withImage : products
  return source.slice(0, count)
}

function buildCategoryTree(products: Product[]): CatTreeNode[] {
  const map = new Map<string, CatTreeNode>()

  products.forEach((product) => {
    const root = product.rootCategory || product.parentCategory || product.category
    const mid = product.rootCategory
      ? product.parentCategory || product.category
      : product.parentCategory
      ? product.category
      : ''
    const leaf = product.rootCategory && product.parentCategory ? product.category : ''

    if (!root) {
      return
    }

    if (!map.has(root)) {
      map.set(root, { label: root, count: 0, children: [] })
    }

    const rootNode = map.get(root)!
    rootNode.count += 1

    if (mid && mid !== root) {
      let midNode = rootNode.children.find((child) => child.label === mid)

      if (!midNode) {
        midNode = { label: mid, count: 0, children: [] }
        rootNode.children.push(midNode)
      }

      midNode.count += 1

      if (leaf && leaf !== mid) {
        let leafNode = midNode.children.find((child) => child.label === leaf)

        if (!leafNode) {
          leafNode = { label: leaf, count: 0 }
          midNode.children.push(leafNode)
        }

        leafNode.count += 1
      }
    }
  })

  return Array.from(map.values()).sort((left, right) => right.count - left.count)
}

function getTopMemberOffer(product: Product): TopMemberProduct | null {
  const topTier = (product.levelPrices ?? []).reduce<NonNullable<Product['levelPrices']>[number] | null>(
    (best, current) => {
      if (!best) {
        return current
      }

      if (current.discountValue < best.discountValue) {
        return current
      }

      if (current.discountValue === best.discountValue && current.price < best.price) {
        return current
      }

      return best
    },
    null,
  )

  if (!topTier) {
    return null
  }

  const savings = Math.max(0, product.price - topTier.price)

  if (savings <= 0) {
    return null
  }

  return {
    ...product,
    topMemberName: topTier.levelName,
    topMemberPrice: topTier.price,
    topMemberSavings: savings,
    topMemberDiscountValue: topTier.discountValue,
  }
}

function ShowcaseTile({ product, price, onPress }: ShowcaseTileProps) {
  return (
    <Card
      variant="transparent"
      className="group cursor-pointer overflow-hidden rounded-none bg-transparent shadow-none transition-transform duration-200 hover:z-10 hover:scale-[1.01]"
      onClick={onPress}
    >
      <div
        className="relative aspect-[5/2] overflow-hidden"
        style={{
          background:
            'linear-gradient(180deg, color-mix(in oklab, var(--surface) 60%, var(--accent) 10%) 0%, color-mix(in oklab, var(--surface) 80%, var(--accent) 6%) 100%)',
        }}
      >
        {product.mainImageId ? (
          <img
            alt={product.name}
            src={resolveFileUrl(product.mainImageId)}
            className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-[1.03]"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted">
            <Store size={32} />
          </div>
        )}

        <div className="pointer-events-none absolute top-1 left-1">
          <span
            className="inline-block rounded px-1.5 py-px text-[10px] font-extrabold text-white shadow-md"
            style={{
              background:
                'linear-gradient(135deg, var(--accent), color-mix(in oklab, var(--accent) 70%, var(--foreground) 30%))',
            }}
          >
            {formatCurrency(price)}
          </span>
        </div>
      </div>
    </Card>
  )
}

export function HomePage() {
  const navigate = useNavigate()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('猜你喜欢')

  useEffect(() => {
    let mounted = true

    fetchProducts()
      .then((data) => {
        if (mounted) {
          setProducts(Array.isArray(data) ? data : data.list)
        }
      })
      .catch(() => {
        if (mounted) {
          setProducts([])
        }
      })
      .finally(() => {
        if (mounted) {
          setLoading(false)
        }
      })

    return () => {
      mounted = false
    }
  }, [])

  const categoryTree = useMemo(() => buildCategoryTree(products).slice(0, 8), [products])

  const hotProducts = useMemo(
    () => [...products].sort((left, right) => (right.saleCount ?? 0) - (left.saleCount ?? 0) || right.id - left.id),
    [products],
  )

  const memberSpecialProducts = useMemo(
    () =>
      products
        .map((product) => getTopMemberOffer(product))
        .filter((product): product is TopMemberProduct => product !== null)
        .sort(
          (left, right) =>
            right.topMemberSavings - left.topMemberSavings ||
            left.topMemberDiscountValue - right.topMemberDiscountValue ||
            (right.saleCount ?? 0) - (left.saleCount ?? 0),
        ),
    [products],
  )

  const newProducts = useMemo(() => [...products].sort((left, right) => right.id - left.id), [products])

  const allTabs = useMemo(() => ['猜你喜欢', ...categoryTree.map((item) => item.label)], [categoryTree])

  const productsByTab = useMemo(() => {
    const grouped: Record<string, Product[]> = {
      猜你喜欢: hotProducts,
    }

    categoryTree.forEach((category) => {
      grouped[category.label] = products.filter((product) => {
        const root = product.rootCategory || product.parentCategory || product.category
        return root === category.label
      })
    })

    return grouped
  }, [categoryTree, hotProducts, products])

  useEffect(() => {
    if (!allTabs.includes(activeTab)) {
      setActiveTab('猜你喜欢')
    }
  }, [activeTab, allTabs])

  const hotShowcaseProducts = useMemo(() => pickShowcaseProducts(hotProducts, 4), [hotProducts])
  const memberShowcaseProducts = useMemo(() => pickShowcaseProducts(memberSpecialProducts, 2), [memberSpecialProducts])
  const newShowcaseProducts = useMemo(() => pickShowcaseProducts(newProducts, 2), [newProducts])
  const memberRankShowcaseProducts = useMemo(
    () => pickShowcaseProducts(memberSpecialProducts, 2),
    [memberSpecialProducts],
  )
  const activeCategory = useMemo(
    () => categoryTree.find((category) => category.label === hoveredCategory) ?? null,
    [categoryTree, hoveredCategory],
  )

  useEffect(() => {
    if (hoveredCategory && !categoryTree.some((category) => category.label === hoveredCategory)) {
      setHoveredCategory(null)
    }
  }, [categoryTree, hoveredCategory])

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" color="accent" />
      </div>
    )
  }

  return (
    <div className="space-y-1">
      <div className="grid gap-1 lg:grid-cols-[160px_minmax(0,1fr)]">
        <Card variant="default" className="relative z-20 overflow-visible shadow-[var(--shadow-surface)]">
          <Card.Header className="py-1">
            <Card.Title className="text-xs font-extrabold tracking-tight">全部商品分类</Card.Title>
          </Card.Header>

          <Card.Content className="px-1 pt-0 pb-0.5">
            {categoryTree.length === 0 ? (
              <Card variant="tertiary">
                <Card.Content className="py-10 text-center text-sm text-muted">暂无分类数据</Card.Content>
              </Card>
            ) : (
              <>
                <div className="relative" onMouseLeave={() => setHoveredCategory(null)}>
                  <div className="space-y-0">
                    {categoryTree.map((category) => {
                      const isActive = category.label === hoveredCategory

                      return (
                        <Button
                          key={category.label}
                          variant={isActive ? 'secondary' : 'ghost'}
                          className="flex w-full items-center justify-between rounded-[calc(var(--radius)*2)] px-2 py-1 text-left"
                          onMouseEnter={() => setHoveredCategory(category.label)}
                          onFocus={() => setHoveredCategory(category.label)}
                          onPress={() => navigate(`/search?category=${encodeURIComponent(category.label)}`)}
                        >
                          <span className="text-xs font-semibold text-foreground">{category.label}</span>
                          <span className="flex items-center gap-1">
                            <span className="text-[10px] text-muted">{category.count}</span>
                            <ChevronRight size={14} className={isActive ? 'text-accent' : 'text-muted'} />
                          </span>
                        </Button>
                      )
                    })}
                  </div>

                  {activeCategory ? (
                    <div className="absolute left-full top-0 hidden pl-3 xl:block">
                      <Card
                        variant="default"
                        className="w-[340px] border border-[color:var(--border)] shadow-[var(--shadow-overlay)]"
                      >
                        <Card.Content className="space-y-4 p-4">
                          {activeCategory.children.length > 0 ? (
                            activeCategory.children.map((levelTwo) => (
                              <div key={levelTwo.label} className="space-y-2">
                                <Button
                                  variant="ghost"
                                  className="justify-start rounded-2xl px-0 font-semibold"
                                  onPress={() => navigate(`/search?category=${encodeURIComponent(levelTwo.label)}`)}
                                >
                                  {levelTwo.label}
                                </Button>

                                <div className="flex flex-wrap gap-2">
                                  {(levelTwo.children.length > 0
                                    ? levelTwo.children
                                    : [{ label: levelTwo.label, count: levelTwo.count }]
                                  ).map((leaf) => (
                                    <Button
                                      key={`${levelTwo.label}-${leaf.label}`}
                                      variant="secondary"
                                      size="sm"
                                      className="rounded-full"
                                      onPress={() => navigate(`/search?category=${encodeURIComponent(leaf.label)}`)}
                                    >
                                      {leaf.label}
                                    </Button>
                                  ))}
                                </div>
                              </div>
                            ))
                          ) : (
                            <Button
                              variant="secondary"
                              size="sm"
                              className="rounded-full"
                              onPress={() => navigate(`/search?category=${encodeURIComponent(activeCategory.label)}`)}
                            >
                              {activeCategory.label}
                            </Button>
                          )}
                        </Card.Content>
                      </Card>
                    </div>
                  ) : null}
                </div>

                {false ? (
                  <Accordion variant="surface" hideSeparator>
                    {categoryTree.map((category) => (
                      <Accordion.Item key={category.label} id={`category-${category.label}`}>
                        <Accordion.Heading>
                          <Accordion.Trigger className="w-full px-0 py-3">
                            <div className="flex w-full items-center justify-between gap-3">
                              <span className="text-sm font-semibold text-foreground">{category.label}</span>
                              <Chip color="default" variant="secondary" size="sm">
                                {category.count}
                              </Chip>
                            </div>
                          </Accordion.Trigger>
                        </Accordion.Heading>
                        <Accordion.Panel>
                          <Accordion.Body className="pt-0">
                            <div className="space-y-3 pb-3">
                              <Button
                                variant="secondary"
                                size="sm"
                                className="rounded-full"
                                onPress={() => navigate(`/search?category=${encodeURIComponent(category.label)}`)}
                              >
                                查看全部
                              </Button>

                              {category.children.length > 0
                                ? category.children.map((levelTwo) => (
                                    <div key={levelTwo.label} className="space-y-2">
                                      <Button
                                        variant="ghost"
                                        className="justify-start rounded-2xl px-0 font-semibold"
                                        onPress={() =>
                                          navigate(`/search?category=${encodeURIComponent(levelTwo.label)}`)
                                        }
                                      >
                                        {levelTwo.label}
                                      </Button>
                                      <div className="flex flex-wrap gap-2">
                                        {(levelTwo.children.length > 0
                                          ? levelTwo.children
                                          : [{ label: levelTwo.label, count: levelTwo.count }]
                                        ).map((leaf) => (
                                          <Button
                                            key={`${levelTwo.label}-${leaf.label}`}
                                            variant="secondary"
                                            size="sm"
                                            className="rounded-full"
                                            onPress={() =>
                                              navigate(`/search?category=${encodeURIComponent(leaf.label)}`)
                                            }
                                          >
                                            {leaf.label}
                                          </Button>
                                        ))}
                                      </div>
                                    </div>
                                  ))
                                : null}
                            </div>
                          </Accordion.Body>
                        </Accordion.Panel>
                      </Accordion.Item>
                    ))}
                  </Accordion>
                ) : null}
              </>
            )}
          </Card.Content>
        </Card>

        <div className="space-y-1">
          <Card variant="default" className="overflow-hidden shadow-[var(--shadow-surface)]">
            <Card.Header className="flex flex-row items-start justify-between gap-4 px-2 pb-0 pt-1">
              <Card.Title className="text-sm font-extrabold tracking-tight">热门推荐</Card.Title>
            </Card.Header>

            <Card.Content className="px-0.5 pb-0.5 pt-0">
              <div className="grid grid-cols-2 gap-px md:grid-cols-4">
                {hotShowcaseProducts.map((product) => (
                  <ShowcaseTile
                    key={product.id}
                    product={product}
                    price={product.memberPrice || product.price}
                    onPress={() => navigate(`/product/${product.id}`)}
                  />
                ))}
              </div>
            </Card.Content>
          </Card>

          <div className="grid gap-1 md:grid-cols-3">
            <Card variant="default" className="shadow-[var(--shadow-surface)]" id="member-special">
              <Card.Header className="flex flex-row items-start justify-between gap-4 px-2 pb-0 pt-1">
                <Card.Title className="text-sm font-extrabold tracking-tight">会员特惠</Card.Title>
              </Card.Header>

              <Card.Content className="px-0.5 pb-0.5 pt-0">
                <div className="grid grid-cols-2 gap-px">
                  {memberShowcaseProducts.map((product) => (
                    <ShowcaseTile
                      key={product.id}
                      product={product}
                      price={product.topMemberPrice}
                      onPress={() => navigate(`/product/${product.id}`)}
                    />
                  ))}
                </div>
              </Card.Content>
            </Card>

            <Card variant="default" className="shadow-[var(--shadow-surface)]">
              <Card.Header className="flex flex-row items-start justify-between gap-4 px-2 pb-0 pt-1">
                <Card.Title className="text-sm font-extrabold tracking-tight">新品上新</Card.Title>
              </Card.Header>

              <Card.Content className="px-0.5 pb-0.5 pt-0">
                <div className="grid grid-cols-2 gap-px">
                  {newShowcaseProducts.map((product) => (
                    <ShowcaseTile
                      key={product.id}
                      product={product}
                      price={product.memberPrice || product.price}
                      onPress={() => navigate(`/product/${product.id}`)}
                    />
                  ))}
                </div>
              </Card.Content>
            </Card>

            <Card variant="default" className="shadow-[var(--shadow-surface)]">
              <Card.Header className="px-2 pb-0 pt-1">
                <Card.Title className="text-sm font-extrabold tracking-tight">会员特惠榜</Card.Title>
              </Card.Header>

              <Card.Content className="px-0.5 pb-0.5 pt-0">
                <div className="grid grid-cols-2 gap-px">
                  {memberRankShowcaseProducts.map((product) => (
                    <ShowcaseTile
                      key={product.id}
                      product={product}
                      price={product.topMemberPrice}
                      onPress={() => navigate(`/product/${product.id}`)}
                    />
                  ))}
                </div>
              </Card.Content>
            </Card>
          </div>
        </div>
      </div>

      <Card variant="default" className="shadow-[var(--shadow-surface)]">
        <Card.Header className="pb-1">
          <Card.Title className="text-sm font-extrabold tracking-tight">首页商品流</Card.Title>
        </Card.Header>

        <Card.Content className="pt-0">
          <Tabs variant="secondary" selectedKey={activeTab} onSelectionChange={(key) => setActiveTab(String(key))}>
            <Tabs.ListContainer>
              <Tabs.List aria-label="商品分类标签">
                {allTabs.map((tab) => (
                  <Tabs.Tab key={tab} id={tab}>
                    {tab === '猜你喜欢' ? <Heart size={13} className="mr-1 inline text-accent" /> : null}
                    {tab}
                  </Tabs.Tab>
                ))}
              </Tabs.List>
            </Tabs.ListContainer>

            {allTabs.map((tab) => {
              const tabProducts = productsByTab[tab] ?? []

              return (
                <Tabs.Panel key={tab} id={tab} className="px-0 pb-0 pt-2">
                  {tabProducts.length === 0 ? (
                    <Card variant="tertiary">
                      <Card.Content className="py-12 text-center text-sm text-muted">该分类下暂时没有商品</Card.Content>
                    </Card>
                  ) : (
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
                      {tabProducts.map((product) => (
                        <ProductCard key={product.id} product={product} />
                      ))}
                    </div>
                  )}
                </Tabs.Panel>
              )
            })}
          </Tabs>
        </Card.Content>
      </Card>
    </div>
  )
}
