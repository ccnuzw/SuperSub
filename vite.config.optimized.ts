import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import Components from 'unplugin-vue-components/vite'
import { NaiveUiResolver } from 'unplugin-vue-components/resolvers'
import tailwindcss from 'tailwindcss'
import autoprefixer from 'autoprefixer'
import { fileURLToPath, URL } from 'node:url'

// 性能优化配置
const performanceConfig = {
  // 代码分割优化
  rollupOptions: {
    output: {
      // 手动代码分割
      manualChunks: {
        // Vue相关
        'vue-vendor': ['vue', 'vue-router', 'pinia'],
        // UI库
        'ui-vendor': ['naive-ui'],
        // 工具库
        'utils-vendor': ['axios', 'date-fns', 'lodash-es'],
        // 图标
        'icons-vendor': ['@vicons/ionicons5', '@vicons/fluent'],
        // 其他第三方库
        'vendor': ['codemirror', 'echarts', 'js-yaml']
      },
      // 优化文件名
      chunkFileNames: 'js/[name]-[hash].js',
      entryFileNames: 'js/[name]-[hash].js',
      assetFileNames: (assetInfo: any) => {
        const info = assetInfo.name.split('.')
        const ext = info[info.length - 1]
        if (/\.(mp4|webm|ogg|mp3|wav|flac|aac)$/.test(assetInfo.name)) {
          return 'media/[name]-[hash][extname]'
        }
        if (/\.(png|jpe?g|gif|svg|webp|avif)$/.test(assetInfo.name)) {
          return 'img/[name]-[hash][extname]'
        }
        if (/\.(woff2?|eot|ttf|otf)$/.test(assetInfo.name)) {
          return 'fonts/[name]-[hash][extname]'
        }
        return 'assets/[name]-[hash][extname]'
      }
    }
  }
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    Components({
      resolvers: [NaiveUiResolver({
        importStyle: 'css', // 使用CSS导入方式
        // 按需导入组件
        components: ['*']
      })]
    })
  ],

  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },

  css: {
    postcss: {
      plugins: [
        tailwindcss,
        autoprefixer,
      ],
    },
    // CSS代码分割
    devSourcemap: false,
    preprocessorOptions: {
      scss: {
        additionalData: `@use "@/styles/variables.scss" as *;`
      }
    }
  },

  // 构建优化
  build: {
    // 启用gzip压缩
    reportCompressedSize: true,
    // 生成sourcemap
    sourcemap: false, // 生产环境关闭sourcemap
    // 构建目标
    target: 'es2015',
    // 代码压缩
    minify: 'terser',
    terserOptions: {
      compress: {
        // 移除console
        drop_console: true,
        // 移除debugger
        drop_debugger: true,
        // 移除无用代码
        pure_funcs: ['console.log', 'console.info', 'console.debug', 'console.warn']
      }
    },
    // 分包策略
    ...performanceConfig.rollupOptions,
    // 大文件警告阈值
    chunkSizeWarningLimit: 1000,
    // 静态资源内联阈值
    assetsInlineLimit: 4096,
    // CSS代码分割
    cssCodeSplit: true
  },

  // 预构建优化
  optimizeDeps: {
    include: [
      'vue',
      'vue-router',
      'pinia',
      'naive-ui',
      '@vicons/ionicons5',
      'date-fns',
      'axios'
    ],
    exclude: ['@iconify/json']
  },

  // 开发服务器配置
  server: {
    host: '0.0.0.0',
    port: 5173,
    // 启用HMR
    hmr: true,
    // 代理配置
    proxy: {
      '/api': {
        target: 'http://localhost:8793',
        changeOrigin: true,
        timeout: 30000
      }
    }
  },

  // 预览服务器配置
  preview: {
    host: '0.0.0.0',
    port: 4173
  },

  // 实验性功能
  experimental: {
    renderBuiltUrl(filename: string, { hostType }: any) {
      if (hostType === 'js') {
        return { js: `/${filename}` }
      } else {
        return { relative: true }
      }
    }
  },

  // 环境变量
  define: {
    // 生产环境移除开发工具
    __VUE_PROD_DEVTOOLS__: 'false',
    __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: 'false'
  }
})