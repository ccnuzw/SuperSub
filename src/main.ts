import { createApp } from 'vue'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import App from './App.vue'
import router from './router'
import naive from './plugins/naive'

// 性能监控
import { installPerformanceMonitoring } from '@/utils/performance'
// 组件懒加载
import { registerBaseComponents, registerLazyComponents, preloadComponents } from '@/components'

import './assets/main.css'

const app = createApp(App)
const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)

app.use(pinia)
app.use(router)
app.use(naive)

// 注册基础组件
registerBaseComponents(app)

// 安装性能监控
installPerformanceMonitoring(app)

// 预加载关键组件
preloadComponents(router.options.routes as any)

// 延迟注册业务组件（避免阻塞首屏）
setTimeout(() => {
  registerLazyComponents(app)
}, 100)

app.mount('#app')