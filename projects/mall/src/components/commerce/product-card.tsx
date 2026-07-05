import { Store } from 'lucide-react'
import { Card, Chip } from '@heroui/react'
import { useNavigate } from 'react-router-dom'
import { resolveFileUrl } from '../../api/http'
import { formatCurrency } from '../../lib/format'
import type { Product } from '../../types/models'

interface ProductCardProps {
  product: Product
}

export function ProductCard({ product }: ProductCardProps) {
  const navigate = useNavigate()
  const imageUrl = resolveFileUrl(product.mainImageId)
  const memberPrice = product.memberPrice || product.price
  const originalPrice = product.price
  const hasDiscount = originalPrice > memberPrice

  return (
    <Card
      variant="default"
      className="group cursor-pointer overflow-hidden transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-overlay)]"
      onClick={() => navigate(`/product/${product.id}`)}
    >
      <div
        className="relative aspect-[2/1] overflow-hidden"
        style={{
          background:
            'linear-gradient(180deg, color-mix(in oklab, var(--surface) 74%, var(--accent) 12%) 0%, color-mix(in oklab, var(--surface) 92%, var(--accent) 8%) 100%)',
        }}
      >
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted">
            <Store size={36} />
          </div>
        )}

        <div className="pointer-events-none absolute top-1.5 left-1.5">
          <span
            className="inline-block rounded px-1.5 py-px text-[10px] font-extrabold text-white shadow-md"
            style={{
              background:
                'linear-gradient(135deg, var(--accent), color-mix(in oklab, var(--accent) 70%, var(--foreground) 30%))',
            }}
          >
            {formatCurrency(memberPrice)}
          </span>
        </div>

        {product.badge ? (
          <Chip color="accent" variant="secondary" size="sm" className="absolute right-1.5 top-1.5">
            {product.badge}
          </Chip>
        ) : null}
      </div>

      <Card.Content className="space-y-0.5 p-1.5">
        <div>
          <h3 className="text-[11px] font-semibold leading-tight text-foreground line-clamp-1">{product.name}</h3>
        </div>

        <div className="flex items-end gap-1">
          <span className="text-xs font-extrabold tracking-tight text-accent">{formatCurrency(memberPrice)}</span>
          {hasDiscount ? (
            <span className="text-[9px] text-muted line-through">{formatCurrency(originalPrice)}</span>
          ) : null}
        </div>

        <div className="flex items-center justify-between text-[9px] text-muted">
          <span className="max-w-[60%] truncate">{product.shopName}</span>
          <span>{product.saleCount ?? 0}付款</span>
        </div>
      </Card.Content>
    </Card>
  )
}
