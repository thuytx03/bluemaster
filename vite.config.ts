import { defineConfig } from 'vite'
import { crx } from '@crxjs/vite-plugin'
import react from '@vitejs/plugin-react'
import viteTsconfigPaths from 'vite-tsconfig-paths'
// @ts-ignore
import manifest from './src/manifest'

export default defineConfig(({ mode }) => {
  return {
    build: {
      emptyOutDir: true,
      outDir: 'build',
      minify: true,
      rollupOptions: {
        output: {
          chunkFileNames: 'assets/chunk-[hash].js',
        },
      },
      chunkSizeWarningLimit: 2000,
    },
    server: {
      port: 8386,
      strictPort: true,
      hmr: {
        port: 8386,
      },
    },
    plugins: [
      crx({ manifest }),
      react(),
      viteTsconfigPaths(), // 👈 thêm dòng này
    ],
    legacy: {
      skipWebSocketTokenCheck: true,
    },
  }
})
