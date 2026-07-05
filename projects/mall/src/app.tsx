import { Route, Routes } from 'react-router-dom'
import { StorefrontShell } from './components/layout/storefront-shell'
import { CartPage } from './pages/cart-page'
import { CheckoutPage } from './pages/checkout-page'
import { HomePage } from './pages/home-page'
import { LoginPage } from './pages/login-page'
import { NotFoundPage } from './pages/not-found-page'
import { RegisterPage } from './pages/register-page'
import { OrderResultPage } from './pages/order-result-page'
import { ProductPage } from './pages/product-page'
import { SearchPage } from './pages/search-page'
import { ShopPage } from './pages/shop-page'

export function App() {
  return (
    <Routes>
      <Route element={<StorefrontShell />}>
        <Route index element={<HomePage />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/product/:id" element={<ProductPage />} />
        <Route path="/shop/:merchantId" element={<ShopPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/order/result" element={<OrderResultPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
