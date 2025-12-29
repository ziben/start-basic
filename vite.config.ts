import tailwindcss from '@tailwindcss/vite'
import { devtools } from '@tanstack/devtools-vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'
import { normalizePath } from 'vite'
import Inspect from 'vite-plugin-inspect'
import tsconfigPaths from 'vite-tsconfig-paths'
import { defineConfig } from 'vitest/config'

const SRC_DIR = `${normalizePath(fileURLToPath(new URL('./src', import.meta.url)))}/`

export default defineConfig({
  plugins: [
    devtools({
      eventBusConfig: {
        debug: false,
      },
      enhancedLogs: {
        enabled: true,
      },
    }),
    Inspect(),
    tsconfigPaths({
      projects: ['./tsconfig.json'],
    }),
    tailwindcss(),
    tanstackStart({
      customViteReactPlugin: true,
      server: {
        preset: 'node-server',
      },
    }),
    viteReact(),
  ],
  resolve: {
    alias: [
      {
        find: /^@\//,
        replacement: SRC_DIR,
      },
      {
        find: /^~\//,
        replacement: SRC_DIR,
      },
    ],
  },
  ssr: {
    noExternal: ['@tanstack/react-start'],
  },
  optimizeDeps: {
    exclude: ['@prisma/client', '.prisma/client'],
  },
  build: {
    rollupOptions: {
      external: ['@prisma/client', '.prisma/client'],
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      reportsDirectory: './coverage',
    },
  },
})
