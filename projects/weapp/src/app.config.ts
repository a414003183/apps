export default defineAppConfig({
  pages: [
    'pages/home/index',
    'pages/search/index',
    'pages/product/detail',
    'pages/shop/index',
    'pages/cart/index',
    'pages/checkout/index',
    'pages/order/result',
    'pages/order/list',
    'pages/order/detail',
    'pages/login/index',
    'pages/register/index',
    'pages/mine/index',
  ],
  window: {
    backgroundTextStyle: 'dark',
    navigationBarBackgroundColor: '#fff',
    navigationBarTitleText: '电信供应链',
    navigationBarTextStyle: 'black',
  },
  tabBar: {
    color: '#999999',
    selectedColor: '#2563eb',
    backgroundColor: '#ffffff',
    borderStyle: 'black',
    list: [
      {
        pagePath: 'pages/home/index',
        text: '首页',
      },
      {
        pagePath: 'pages/search/index',
        text: '分类',
      },
      {
        pagePath: 'pages/cart/index',
        text: '购物车',
      },
      {
        pagePath: 'pages/mine/index',
        text: '我的',
      },
    ],
  },
})
