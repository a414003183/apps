export function formatCurrency(value?: number) {
  if (value === undefined || value === null) return '¥0.00'
  return `¥${Number(value).toFixed(2)}`
}

export function formatNumber(value?: number) {
  if (value === undefined || value === null) return '0'
  return value.toLocaleString('zh-CN')
}
