export default [
  {
    path: '/',
    layout: false,
    component: './mall/MallRedirectPage',
  },
  {
    path: '/mall/*',
    layout: false,
    component: './mall/MallRedirectPage',
  },
  {
    path: '/login',
    layout: false,
    name: 'login',
    component: './user/login',
  },
  {
    path: '/register',
    layout: false,
    name: 'register',
    component: './user/register',
  },
  {
    path: '/member/customer',
    layout: false,
    access: 'canCustomer',
    name: 'customer-center',
    wrappers: ['@/layouts/MemberLayout'],
    routes: [
      {
        path: '/member/customer/dashboard',
        name: 'customer-dashboard',
        component: './member/customer/CustomerDashboardPage',
      },
      {
        path: '/member/customer/profile',
        name: 'customer-profile',
        component: './member/customer/CustomerWorkspacePage',
      },
      {
        path: '/member/customer/orders',
        name: 'customer-orders',
        component: './member/customer/CustomerOrdersPage',
      },
      {
        path: '/member/customer/orders/:id',
        name: 'customer-order-detail',
        component: './member/customer/CustomerOrderDetailPage',
      },
      {
        path: '/member/customer/aftersale',
        name: 'customer-aftersale',
        component: './member/customer/CustomerAftersalePage',
      },
      {
        path: '/member/customer/points',
        name: 'customer-points',
        component: './member/customer/CustomerPointsPage',
      },
      {
        path: '/member/customer/referral',
        name: 'customer-referral',
        component: './member/customer/CustomerWorkspacePage',
      },
    ],
  },
  {
    path: '/member/merchant',
    layout: false,
    access: 'canMerchant',
    name: 'merchant-center',
    wrappers: ['@/layouts/MemberLayout'],
    routes: [
      {
        path: '/member/merchant/dashboard',
        name: 'merchant-dashboard',
        component: './member/merchant/MerchantDashboardPage',
      },
      {
        path: '/member/merchant/profile',
        name: 'merchant-profile',
        component: './member/merchant/MerchantProfilePage',
      },
      {
        path: '/member/merchant/goods',
        name: 'merchant-goods',
        component: './member/merchant/MerchantGoodsPage',
      },
      {
        path: '/member/merchant/goods/auth',
        redirect: '/member/merchant/supply/catalog',
      },
      {
        path: '/member/merchant/pricing',
        redirect: '/member/merchant/pricing/level',
      },
      {
        path: '/member/merchant/pricing/level',
        name: 'merchant-pricing-level',
        component: './member/merchant/MerchantPricingPage',
      },
      {
        path: '/member/merchant/pricing/customer',
        name: 'merchant-pricing-customer',
        component: './member/merchant/MerchantPricingPage',
      },
      {
        path: '/member/merchant/orders',
        name: 'merchant-orders',
        component: './member/merchant/MerchantOrdersPage',
      },
      {
        path: '/member/merchant/orders/:id',
        name: 'merchant-order-detail',
        component: './member/merchant/MerchantOrderDetailPage',
      },
      {
        path: '/member/merchant/shipping',
        name: 'merchant-shipping',
        component: './member/merchant/MerchantShippingPage',
      },
      {
        path: '/member/merchant/aftersale',
        name: 'merchant-aftersale',
        component: './member/merchant/MerchantAftersalePage',
      },
      {
        path: '/member/merchant/supply',
        redirect: '/member/merchant/supply/relations',
      },
      {
        path: '/member/merchant/supply-catalog',
        redirect: '/member/merchant/supply/catalog',
      },
      {
        path: '/member/merchant/supply-relations',
        redirect: '/member/merchant/supply/relations',
      },
      {
        path: '/member/merchant/supply/catalog',
        name: 'merchant-supply-catalog',
        component: './member/merchant/MerchantSupplyCatalogPage',
      },
      {
        path: '/member/merchant/supply/relations',
        name: 'merchant-supply-relations',
        component: './member/merchant/MerchantSupplyRelationsPage',
      },
      {
        path: '/member/merchant/reports/product',
        name: 'merchant-reports-product',
        component: './member/merchant/MerchantReportsPage',
      },
      {
        path: '/member/merchant/reports/order',
        name: 'merchant-reports-order',
        component: './member/merchant/MerchantReportsPage',
      },
      {
        path: '/member/merchant/reports/customer',
        name: 'merchant-reports-customer',
        component: './member/merchant/MerchantReportsPage',
      },
    ],
  },
  {
    path: '/member/supplier',
    layout: false,
    access: 'canSupplier',
    name: 'supplier-center',
    wrappers: ['@/layouts/MemberLayout'],
    routes: [
      {
        path: '/member/supplier/dashboard',
        name: 'supplier-dashboard',
        component: './member/supplier/SupplierDashboardPage',
      },
      {
        path: '/member/supplier/profile',
        name: 'supplier-profile',
        component: './member/supplier/SupplierWorkspacePage',
      },
      {
        path: '/member/supplier/products',
        name: 'supplier-products',
        component: './member/supplier/SupplierProductsPage',
      },
      {
        path: '/member/supplier/stock',
        name: 'supplier-stock',
        component: './member/supplier/SupplierWorkspacePage',
      },
      {
        path: '/member/supplier/supply-status',
        name: 'supplier-supply-status',
        component: './member/supplier/SupplierSupplyStatusPage',
      },
      {
        path: '/member/supplier/cooperation',
        redirect: '/member/supplier/cooperation/relations',
      },
      {
        path: '/member/supplier/cooperation-relations',
        redirect: '/member/supplier/cooperation/relations',
      },
      {
        path: '/member/supplier/cooperation-authorizations',
        redirect: '/member/supplier/cooperation/authorizations',
      },
      {
        path: '/member/supplier/cooperation/relations',
        name: 'supplier-cooperation-relations',
        component: './member/supplier/SupplierCooperationRelationsPage',
      },
      {
        path: '/member/supplier/cooperation/authorizations',
        name: 'supplier-cooperation-authorizations',
        component: './member/supplier/SupplierCooperationAuthorizationsPage',
      },
    ],
  },
  {
    path: '/admin',
    layout: false,
    access: 'canAdmin',
    name: 'admin',
    wrappers: ['@/layouts/AdminLayout'],
    routes: [
      {
        path: '/admin/dashboard',
        name: 'admin-dashboard',
        component: './admin/AdminDashboardPage',
      },
      {
        path: '/admin/users',
        name: 'admin-users',
        component: './admin/AdminUsersPage',
      },
      {
        path: '/admin/roles',
        name: 'admin-roles',
        component: './admin/AdminGovernancePage',
      },
      {
        path: '/admin/customer-levels',
        name: 'admin-customer-levels',
        component: './admin/AdminCustomerLevelsPage',
      },
      {
        path: '/admin/brands',
        name: 'admin-brands',
        component: './admin/AdminBrandsPage',
      },
      {
        path: '/admin/categories',
        name: 'admin-categories',
        component: './admin/AdminCategoriesPage',
      },
      {
        path: '/admin/registrations',
        name: 'admin-registrations',
        component: './admin/AdminRegistrationsPage',
      },
      {
        path: '/admin/governance',
        redirect: '/admin/import-export',
      },
      {
        path: '/admin/menus',
        name: 'admin-menus',
        component: './admin/AdminGovernancePage',
      },
      {
        path: '/admin/login-log',
        name: 'admin-login-log',
        component: './admin/AdminGovernancePage',
      },
      {
        path: '/admin/operation-log',
        name: 'admin-operation-log',
        component: './admin/AdminGovernancePage',
      },
      {
        path: '/admin/import-export',
        name: 'admin-import-export',
        component: './admin/AdminGovernancePage',
      },
    ],
  },
  {
    component: '404',
    path: '/*',
  },
]
