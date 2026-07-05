import type { WorkspaceMenuNode } from '@apps/types'

export function normalizeWorkspaceMenuNode(menu: WorkspaceMenuNode): WorkspaceMenuNode {
  if (menu.path === '/member/customer/profile' || menu.id === 202) {
    return {
      ...menu,
      menuName: '客户资料',
    }
  }

  if (menu.path === '/member/customer/referral' || menu.id === 206) {
    return {
      ...menu,
      menuName: '推荐关系',
    }
  }

  if (menu.path === '/member/supplier/products' || menu.id === 403) {
    return {
      ...menu,
      menuName: '商品档案',
    }
  }

  return menu
}

export function normalizeWorkspaceMenus(menus?: WorkspaceMenuNode[]) {
  return (menus ?? []).map((menu) => normalizeWorkspaceMenuNode(menu))
}
