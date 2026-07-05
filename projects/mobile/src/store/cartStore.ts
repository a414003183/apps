import { create } from 'zustand'
import type { MallCartItem } from '../types/api'

interface CartState {
  items: MallCartItem[]
  selectedIds: Set<number>
  setItems: (items: MallCartItem[]) => void
  toggleSelect: (id: number) => void
  selectAll: () => void
  deselectAll: () => void
  clear: () => void
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  selectedIds: new Set(),
  setItems: items => set({ items, selectedIds: new Set(items.map(i => i.merchantGoodsId)) }),
  toggleSelect: id => {
    const { selectedIds } = get()
    const next = new Set(selectedIds)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    set({ selectedIds: next })
  },
  selectAll: () => set({ selectedIds: new Set(get().items.map(i => i.merchantGoodsId)) }),
  deselectAll: () => set({ selectedIds: new Set() }),
  clear: () => set({ items: [], selectedIds: new Set() }),
}))
