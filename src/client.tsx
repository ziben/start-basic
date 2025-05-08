/// <reference types="vinxi/types/client" />
import { StartClient } from '@tanstack/react-start'
import { StrictMode } from 'react'
import { hydrateRoot } from 'react-dom/client'
import { FontProvider } from './context/font-context'
import { ThemeProvider } from './context/theme-context'
import { AuthProvider } from './context/auth-context'
import { LocaleProvider } from './context/locale-context'
import { createRouter } from './router'

const router = createRouter() // 创建应用路由器，管理页面导航

// 将应用挂载到 DOM 上，使用 hydrateRoot 进行客户端渲染
hydrateRoot(
  document,
  <StrictMode>
    <ThemeProvider defaultTheme='light' storageKey='vite-ui-theme'>
      <FontProvider>
        <LocaleProvider>
          <AuthProvider>
            <StartClient router={router} />
          </AuthProvider>
        </LocaleProvider>
      </FontProvider>
    </ThemeProvider>
  </StrictMode>
)
