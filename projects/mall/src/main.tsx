import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Toast } from '@heroui/react'
import { BrowserRouter } from 'react-router-dom'
import { SessionProvider } from './auth/session'
import { App } from './app'
import './styles/globals.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SessionProvider>
      <BrowserRouter basename="/mall">
        <App />
        <Toast.Provider placement="bottom end" />
      </BrowserRouter>
    </SessionProvider>
  </StrictMode>,
)
