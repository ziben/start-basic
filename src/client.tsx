/// <reference types="vinxi/types/client" />
import { StartClient } from '@tanstack/react-start'
import { StrictMode } from 'react'
import { hydrateRoot } from 'react-dom/client'
import { FontProvider } from './context/font-context'
import { ThemeProvider } from './context/theme-context'
import { createRouter } from './router'

const router = createRouter()

hydrateRoot(
  document,
  <StrictMode>
    <ThemeProvider defaultTheme='light' storageKey='vite-ui-theme'>
      <FontProvider>
        <StartClient router={router} />
      </FontProvider>
    </ThemeProvider>
  </StrictMode>
)
