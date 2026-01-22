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
      '~/generated/prisma/client',
    ],
  },
  optimizeDeps: {
    exclude: [
      '@prisma/client',
      '.prisma/client',
      '@prisma/adapter-libsql',
      '~/generated/prisma/client',
    ],
  },
  build: {
    rollupOptions: {
      external: (id) => {
        // 确保 Prisma 相关模块在客户端构建时被排除
        if (id.includes('@prisma') || id.includes('.prisma') || id.includes('generated/prisma')) {
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
