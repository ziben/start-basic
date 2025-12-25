import tailwindcss from '@tailwindcss/vite'
import { devtools } from '@tanstack/devtools-vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import { nitro } from 'nitro/vite'
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
      nitro: {
        wasm: false,
        commonJS: {
          ignoreDynamicRequires: true,
        },
        rollupConfig: {
          external: [
            'libsql',
            '@libsql/client',
            '@libsql/core',
            '@libsql/hrana-client',
            '@neon-rs/load',
            '@libsql/win32-x64-msvc',
            '@libsql/linux-x64-gnu',
            '@libsql/linux-x64-musl',
            '@libsql/darwin-x64',
            '@libsql/darwin-arm64',
          ],
        },
      },
      customViteReactPlugin: true,
    }),
    nitro(),
    viteReact(),
  ],
  nitro: {
    wasm: false,
    commonJS: {
      ignoreDynamicRequires: true,
    },
    rollupConfig: {
      external: [
        'libsql',
        '@libsql/client',
        '@libsql/core',
        '@libsql/hrana-client',
        '@neon-rs/load',
        '@libsql/win32-x64-msvc',
        '@libsql/linux-x64-gnu',
        '@libsql/linux-x64-musl',
        '@libsql/darwin-x64',
        '@libsql/darwin-arm64',
      ],
    },
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
