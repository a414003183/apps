import { Search, X } from 'lucide-react'
import { Button, Card, Chip, InputGroup, Skeleton } from '@heroui/react'
import { startTransition, useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import { fetchProducts } from '../api/mall'
import { ProductCard } from '../components/commerce/product-card'
import type { Product } from '../types/models'

type SortKey = 'default' | 'price-asc' | 'price-desc' | 'sales' | 'newest'

function matchQ(product: Product, query: string) {
  if (!query) {
    return true
  }

  const keyword = query.toLowerCase()

  return (
    product.name.toLowerCase().includes(keyword) ||
    product.brand.toLowerCase().includes(keyword) ||
    product.category.toLowerCase().includes(keyword) ||
    (product.keywords ?? '').toLowerCase().includes(keyword)
  )
}

function normalizeSort(value: string | null): SortKey {
  if (value === 'price-asc' || value === 'price-desc' || value === 'sales' || value === 'newest') {
    return value
  }

  return 'default'
}

function doSort(products: Product[], sort: SortKey) {
  const copied = [...products]

  if (sort === 'price-asc') {
    return copied.sort((left, right) => (left.memberPrice || left.price) - (right.memberPrice || right.price))
  }

  if (sort === 'price-desc') {
    return copied.sort((left, right) => (right.memberPrice || right.price) - (left.memberPrice || left.price))
  }

  if (sort === 'sales') {
    return copied.sort((left, right) => (right.saleCount ?? 0) - (left.saleCount ?? 0))
  }

  if (sort === 'newest') {
    return copied.sort((left, right) => right.id - left.id)
  }

  return copied
}

export function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const query = searchParams.get('q') ?? ''
  const category = searchParams.get('category') ?? ''
  const sort = normalizeSort(searchParams.get('sort'))
  const [products, setProducts] = useState<Product[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(15)
  const [loading, setLoading] = useState(true)
  const [draft, setDraft] = useState(query)

  useEffect(() => {
    setDraft(query)
  }, [query])

  useEffect(() => {
    setPage(1)
  }, [query, category, sort])

  useEffect(() => {
    let mounted = true
    setLoading(true)

    const sortMap: Record<SortKey, { sortBy?: string; sortOrder?: string }> = {
      default: {},
      'price-asc': { sortBy: 'price', sortOrder: 'asc' },
      'price-desc': { sortBy: 'price', sortOrder: 'desc' },
      sales: { sortBy: 'saleCount', sortOrder: 'desc' },
      newest: { sortBy: 'id', sortOrder: 'desc' },
    }

    const { sortBy, sortOrder } = sortMap[sort]

    fetchProducts({
      page,
      pageSize,
      keyword: query || undefined,
      categoryId: category || undefined,
      sortBy,
      sortOrder,
    })
      .then((data) => {
        if (!mounted) return
        const result = Array.isArray(data) ? { list: data, total: data.length } : data
        setProducts(result.list)
        setTotal(result.total)
      })
      .catch(() => {
        if (mounted) {
          setProducts([])
          setTotal(0)
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
  }, [query, category, sort, page, pageSize])

  const categories = useMemo(
    () => Array.from(new Set(products.map((product) => product.category))).filter(Boolean),
    [products],
  )

  const filteredProducts = useMemo(
    () =>
      doSort(
        products.filter((product) => (category ? product.category === category : true) && matchQ(product, query)),
        sort,
      ),
    [category, products, query, sort],
  )

  function updateParams(next: { q?: string; category?: string; sort?: SortKey }) {
    startTransition(() => {
      const params = new URLSearchParams()
      const nextQuery = next.q ?? query
      const nextCategory = next.category ?? category
      const nextSort = next.sort ?? sort

      if (nextQuery.trim()) {
        params.set('q', nextQuery.trim())
      }

      if (nextCategory) {
        params.set('category', nextCategory)
      }

      if (nextSort !== 'default') {
        params.set('sort', nextSort)
      }

      setSearchParams(params)
    })
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    updateParams({ q: draft })
  }

  function clearFilters() {
    setDraft('')
    setSearchParams({})
  }

  const sorts: { key: SortKey; label: string }[] = [
    { key: 'default', label: '综合' },
    { key: 'sales', label: '销量' },
    { key: 'price-asc', label: '价格从低到高' },
    { key: 'price-desc', label: '价格从高到低' },
    { key: 'newest', label: '最新上架' },
  ]

  return (
    <div className="space-y-3">
      <Card variant="default" className="shadow-[var(--shadow-surface)]">
        <Card.Content className="space-y-4 p-4">
          <form onSubmit={handleSubmit}>
            <InputGroup fullWidth>
              <InputGroup.Prefix>
                <Search size={16} className="text-accent" />
              </InputGroup.Prefix>
              <InputGroup.Input
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder="搜索商品、品牌、分类"
              />
              <InputGroup.Suffix>
                <div className="flex items-center gap-2">
                  {draft ? (
                    <Button isIconOnly type="button" variant="ghost" size="sm" onPress={() => setDraft('')}>
                      <X size={14} />
                    </Button>
                  ) : null}
                  <Button type="submit" variant="primary" size="sm">
                    搜索
                  </Button>
                </div>
              </InputGroup.Suffix>
            </InputGroup>
          </form>

          <div className="flex flex-wrap gap-1.5">
            <Chip
              color={!category ? 'accent' : 'default'}
              variant={!category ? 'primary' : 'secondary'}
              size="sm"
              className="cursor-pointer"
              onClick={() => updateParams({ category: '' })}
            >
              全部分类
            </Chip>
            {categories.map((item) => (
              <Chip
                key={item}
                color={item === category ? 'accent' : 'default'}
                variant={item === category ? 'primary' : 'secondary'}
                size="sm"
                className="cursor-pointer"
                onClick={() => updateParams({ category: item })}
              >
                {item}
              </Chip>
            ))}
          </div>
        </Card.Content>
      </Card>

      <Card variant="default" className="shadow-[var(--shadow-surface)]">
        <Card.Content className="flex flex-col gap-3 px-4 py-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap gap-1.5">
            {sorts.map((item) => (
              <Button
                key={item.key}
                size="sm"
                variant={sort === item.key ? 'primary' : 'ghost'}
                onPress={() => updateParams({ sort: item.key })}
              >
                {item.label}
              </Button>
            ))}
          </div>

          <div className="flex items-center gap-3 text-xs text-muted">
            <span>共 {total} 件商品</span>
            {query || category || sort !== 'default' ? (
              <Button variant="outline" size="sm" onPress={clearFilters}>
                清空筛选
              </Button>
            ) : null}
          </div>
        </Card.Content>
      </Card>

      <Card variant="default" className="shadow-[var(--shadow-surface)]">
        <Card.Content className="p-3">
          {loading ? (
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
              {[...Array(10)].map((_, index) => (
                <div key={index}>
                  <Skeleton className="mb-2 aspect-square w-full" />
                  <Skeleton className="mb-1 h-3 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <Card variant="tertiary">
              <Card.Content className="py-16 text-center">
                <p className="text-sm text-muted">没有找到相关商品</p>
                <Button className="mt-4" onPress={clearFilters}>
                  查看全部商品
                </Button>
              </Card.Content>
            </Card>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
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
