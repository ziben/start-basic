import tailwindcss from '@tailwindcss/vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import tsconfigPaths from 'vite-tsconfig-paths'
import { devtools } from '@tanstack/devtools-vite'

export default defineConfig({
  plugins: [
    devtools(),
    tsconfigPaths({
      projects: ['./tsconfig.json'],
    }),
    tailwindcss(),
    tanstackStart(
      ( {
        customViteReactPlugin: true,
      } as any )
    ),
    react(),
  ],
  resolve: {
    alias: {

    },
  },
})
