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
    }),
    viteReact(),
  ],
  define: {
    'process.env.PRISMA_SKIP_POSTINSTALL_GENERATE': JSON.stringify('true'),
  },
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
    dedupe: ['react', 'react-dom', 'react/jsx-runtime', 'react/jsx-dev-runtime'],
  },
  ssr: {
    noExternal: ['@tanstack/react-router'],
    external: [
      '@prisma/client',
      '.prisma/client',
      '@prisma/adapter-libsql',
    ],
  },
  optimizeDeps: {
    exclude: [
      '@prisma/client',
      '.prisma/client',
      '@prisma/adapter-libsql',
    ],
  },
  build: {
    rollupOptions: {
      external: (id) => {
        // 只排除 Prisma 引擎和 adapter，不排除生成的 client
        if (id.includes('@prisma/client') || id.includes('.prisma/client') || id.includes('@prisma/adapter')) {
          return true
        }
        return false
      },
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
    deps: {
      inline: ['react', 'react-dom', 'react/jsx-runtime', 'react/jsx-dev-runtime'],
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      reportsDirectory: './coverage',
    },
  },
})
