const currencyFormatter = new Intl.NumberFormat('zh-CN', {
  style: 'currency',
  currency: 'CNY',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
})

const numberFormatter = new Intl.NumberFormat('zh-CN')

const compactFormatter = new Intl.NumberFormat('zh-CN', {
  notation: 'compact',
  maximumFractionDigits: 1,
})

export function formatCurrency(value: number) {
  return currencyFormatter.format(value ?? 0)
}

export function formatNumber(value: number) {
  return numberFormatter.format(value ?? 0)
}

export function formatCompactNumber(value: number) {
  return compactFormatter.format(value ?? 0)
}
