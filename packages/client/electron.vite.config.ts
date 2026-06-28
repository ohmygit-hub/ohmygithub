import { resolve } from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import { defineConfig, externalizeDepsPlugin, loadEnv } from 'electron-vite'

export default defineConfig(({ mode }) => {
  const root = resolve(__dirname, '../..')
  const env = loadEnv(mode, root, '')

  return {
    main: {
      resolve: {
        alias: {
          '@oh-my-github/api': resolve(__dirname, '../api/src/index.ts')
        }
      },
      define: {
        'process.env.GITHUB_CLIENT_ID': JSON.stringify(
          env.GITHUB_CLIENT_ID ?? process.env.GITHUB_CLIENT_ID ?? ''
        )
      },
      plugins: [externalizeDepsPlugin({ exclude: ['@oh-my-github/api'] })],
      build: {
        rollupOptions: {
          input: resolve(__dirname, 'src/main/index.ts')
        }
      }
    },
    preload: {
      plugins: [externalizeDepsPlugin()],
      build: {
        rollupOptions: {
          input: resolve(__dirname, 'src/preload/index.ts')
        }
      }
    },
    renderer: {
      resolve: {
        alias: {
          '@renderer': resolve(__dirname, 'src/renderer'),
          '#': resolve(__dirname, '../ui/src'),
          '@oh-my-github/api': resolve(__dirname, '../api/src/index.ts'),
          '@oh-my-github/ui/style.css': resolve(__dirname, '../ui/src/style.css'),
          '@oh-my-github/ui/styles.css': resolve(__dirname, '../ui/src/style.css'),
          '@oh-my-github/ui': resolve(__dirname, '../ui/src/index.ts')
        }
      },
      optimizeDeps: {
        include: ['monaco-editor', 'stream-monaco', 'shiki']
      },
      build: {
        rollupOptions: {
          input: resolve(__dirname, 'src/renderer/index.html'),
          output: {
            manualChunks(id) {
              if (id.includes('monaco-editor') || id.includes('stream-monaco')) {
                return 'monaco-editor'
              }

              if (
                id.includes('markstream-vue') ||
                id.includes('stream-markdown') ||
                id.includes('mermaid') ||
                id.includes('katex') ||
                id.includes('shiki') ||
                id.includes('@shikijs')
              ) {
                return 'rich-content'
              }

              return undefined
            }
          }
        }
      },
      plugins: [vue(), tailwindcss()]
    }
  }
})
