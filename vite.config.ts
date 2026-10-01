/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Chrome/Edge preload modules natively; without the polyfill the bundle contains no fetch() at all.
    modulePreload: { polyfill: false },
  },
  test: {
    environment: 'node',
    include: ['src/test/**/*.test.ts'],
  },
})
