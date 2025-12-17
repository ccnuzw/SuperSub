import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import Components from 'unplugin-vue-components/vite'
import { NaiveUiResolver } from 'unplugin-vue-components/resolvers'
import tailwindcss from 'tailwindcss'
import autoprefixer from 'autoprefixer'
import { fileURLToPath, URL } from 'node:url'
import { visualizer } from 'rollup-plugin-visualizer'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    Components({
      resolvers: [
        NaiveUiResolver(),
        // 自动导入基础组件
        {
          type: 'component',
          resolve: (name) => {
            if (name.startsWith('Ss')) {
              return {
                name,
                from: '@/components/base'
              }
            }
          }
        }
      ]
    }),
    // 打包分析工具
    process.env.NODE_ENV === 'analyze' && visualizer({
      filename: 'dist/stats.html',
      open: true,
      gzipSize: true,
      brotliSize: true
    })
  ].filter(Boolean),

  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },

  build: {
    // 启用代码分割
    rollupOptions: {
      output: {
        // 手动代码分割
        manualChunks: {
          // 基础框架
          'vue-vendor': ['vue', 'vue-router', 'pinia'],

          // UI组件库
          'ui-vendor': ['naive-ui'],

          // 工具库
          'utils-vendor': ['dayjs', 'lodash-es'],

          // 基础组件
          'base-components': [
            './src/components/base/SsButton.vue',
            './src/components/base/SsInput.vue',
            './src/components/base/SsCard.vue',
            './src/components/base/SsBadge.vue',
            './src/components/base/SsStatus.vue'
          ]
        },

        // 资源文件命名
        chunkFileNames: (chunkInfo) => {
          // 业务组件单独分包
          if (chunkInfo.name && chunkInfo.name.includes('business')) {
            return `js/business-[name]-[hash].js`
          }
          // 页面组件单独分包
          if (chunkInfo.name && chunkInfo.name.includes('views')) {
            return `js/pages-[name]-[hash].js`
          }
          return `js/[name]-[hash].js`
        },

        assetFileNames: (assetInfo) => {
          const extType = assetInfo.name?.split('.').pop()
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(extType || '')) {
            return `images/[name]-[hash][extname]`
          }
          if (/woff2?|eot|ttf|otf/i.test(extType || '')) {
            return `fonts/[name]-[hash][extname]`
          }
          return `assets/[name]-[hash][extname]`
        }
      }
    },

    // 压缩配置
    minify: 'terser',
    terserOptions: {
      compress: {
        // 移除 console
        drop_console: true,
        // 移除 debugger
        drop_debugger: true,
        // 移除未使用的代码
        pure_funcs: ['console.log', 'console.info', 'console.debug', 'console.warn']
      },
      mangle: {
        // 保留类名（便于调试）
        keep_classnames: true,
        keep_fnames: true
      }
    },

    // 生成 source map
    sourcemap: process.env.NODE_ENV === 'development',

    // 设置 chunk 大小警告限制（KB）
    chunkSizeWarningLimit: 1000,

    // 构建目标
    target: ['es2015', 'chrome58', 'firefox57', 'safari11'],

    // CSS 代码分割
    cssCodeSplit: true
  },

  css: {
    postcss: {
      plugins: [
        tailwindcss,
        autoprefixer
      ]
    }
  },

  server: {
    host: '0.0.0.0',
    proxy: {
      '/api': {
        target: 'http://localhost:8793',
        changeOrigin: true,
      },
    },
    hmr: {
      // 热更新配置
      overlay: true
    }
  },

  // 环境变量配置
  define: {
    __VUE_OPTIONS_API__: false, // 禁用 Options API
    __VUE_PROD_DEVTOOLS__: false // 生产环境禁用 devtools
  },

  // 预加载配置
  optimizeDeps: {
    // 预构建的依赖
    include: [
      'vue',
      'vue-router',
      'pinia',
      'naive-ui',
      'dayjs',
      'lodash-es',
      '@iconify/vue'
    ],
    exclude: ['@iconify/vue']
  }
})