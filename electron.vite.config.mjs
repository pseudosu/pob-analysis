import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    build: {
      emptyOutDir: true,
      lib: {
        entry: resolve(__dirname, 'electron/main.ts'),
        formats: ['cjs'],
        fileName: () => 'main.js'
      },
      rollupOptions: {
        output: { entryFileNames: 'main.js' }
      },
      outDir: resolve(__dirname, 'dist-electron')
    }
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    build: {
      emptyOutDir: false,
      lib: {
        entry: resolve(__dirname, 'electron/preload.ts'),
        formats: ['cjs'],
        fileName: () => 'preload.js'
      },
      rollupOptions: {
        output: { entryFileNames: 'preload.js' }
      },
      outDir: resolve(__dirname, 'dist-electron')
    }
  },
  renderer: {
    plugins: [react()],
    root: resolve(__dirname, '.'),
    build: {
      outDir: resolve(__dirname, 'dist'),
      rollupOptions: {
        input: resolve(__dirname, 'index.html')
      }
    }
  }
})
