/**
 * 性能优化路由配置 - 阶段五：性能优化
 * 包含路由懒加载、预加载、代码分割等功能
 */

import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { preloadRoutes, preloadResources } from '@/utils/performance/LazyLoadUtils'

// 核心路由（立即加载）
import HomeView from '../views/HomeView.vue'

// 懒加载路由
const routes = [
  {
    path: '/',
    name: 'home',
    component: HomeView,
    meta: {
      requiresAuth: true,
      preload: true, // 预加载此路由
      priority: 'high'
    }
  },
  {
    path: '/nodes',
    name: 'nodes',
    component: () => import(/* webpackChunkName: "nodes" */ '../views/NodesView.vue'),
    meta: {
      requiresAuth: true,
      preload: true,
      priority: 'medium'
    }
  },
  {
    path: '/subscriptions',
    name: 'subscriptions',
    component: () => import(/* webpackChunkName: "subscriptions" */ '../views/SubscriptionsView.vue'),
    meta: {
      requiresAuth: true,
      preload: true,
      priority: 'high'
    }
  },
  {
    path: '/new-subscriptions',
    name: 'new-subscriptions',
    component: () => import(/* webpackChunkName: "subscriptions-enhanced" */ '../views/NewSubscriptionsView.vue'),
    meta: {
      requiresAuth: true,
      preload: true,
      priority: 'high'
    }
  },
  {
    path: '/profiles',
    name: 'profiles',
    component: () => import(/* webpackChunkName: "profiles" */ '../views/ProfilesView.vue'),
    meta: {
      requiresAuth: true,
      preload: false,
      priority: 'low'
    }
  },
  {
    path: '/settings',
    name: 'settings',
    component: () => import(/* webpackChunkName: "settings" */ '../views/SettingsView.vue'),
    meta: {
      requiresAuth: true,
      preload: false,
      priority: 'medium'
    }
  },
  {
    path: '/profiles/new',
    name: 'new-profile',
    component: () => import(/* webpackChunkName: "profile-edit" */ '../views/ProfileEditView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/profiles/edit/:id',
    name: 'edit-profile',
    component: () => import(/* webpackChunkName: "profile-edit" */ '../views/ProfileEditView.vue'),
    props: true,
    meta: { requiresAuth: true }
  },
  {
    path: '/user-management',
    name: 'user-management',
    component: () => import(/* webpackChunkName: "admin" */ '../views/UserManagementView.vue'),
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/test-state-management',
    name: 'test-state-management',
    component: () => import(/* webpackChunkName: "test" */ '../views/TestStateManagement.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/login',
    name: 'login',
    component: () => import(/* webpackChunkName: "auth" */ '../views/LoginView.vue'),
    meta: { preload: true }
  },
  {
    path: '/register',
    name: 'register',
    component: () => import(/* webpackChunkName: "auth" */ '../views/RegisterView.vue'),
    meta: { preload: true }
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior(to, from, savedPosition) {
    // 保持滚动位置或滚动到顶部
    if (savedPosition) {
      return savedPosition
    } else {
      return { top: 0 }
    }
  }
})

// 路由预加载策略
const preloadStrategies = {
  // 高优先级路由 - 立即预加载
  high: () => {
    const highPriorityRoutes = ['nodes', 'subscriptions', 'new-subscriptions']
    return preloadRoutes(highPriorityRoutes)
  },

  // 中优先级路由 - 空闲时预加载
  medium: () => {
    const mediumPriorityRoutes = ['settings']
    // 使用 requestIdleCallback 在空闲时预加载
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        preloadRoutes(mediumPriorityRoutes)
      })
    } else {
      setTimeout(() => {
        preloadRoutes(mediumPriorityRoutes)
      }, 2000)
    }
  },

  // 低优先级路由 - 用户交互时预加载
  low: () => {
    const lowPriorityRoutes = ['profiles']
    return preloadRoutes(lowPriorityRoutes)
  }
}

// 资源预加载
const preloadCriticalResources = () => {
  const resources = [
    { url: '/api/stats', as: 'fetch', type: 'application/json' },
    { url: '/api/system/settings', as: 'fetch', type: 'application/json' }
  ]

  preloadResources(resources)
}

// 路由守卫
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()

  // 预加载策略
  if (from.meta.preload) {
    const priority = from.meta.priority as string
    if (preloadStrategies[priority as keyof typeof preloadStrategies]) {
      preloadStrategies[priority as keyof typeof preloadStrategies]()
    }
  }

  // 尝试获取用户信息
  if (authStore.token && !authStore.user) {
    try {
      await authStore.fetchUser()
    } catch (error) {
      // 如果获取用户信息失败，清除认证状态
      authStore.logout()
    }
  }

  const requiresAuth = to.matched.some(record => record.meta.requiresAuth)
  const isAuthenticated = authStore.isAuthenticated
  const isAdmin = authStore.isAdmin
  const requiresAdmin = to.matched.some(record => record.meta.requiresAdmin)

  if (requiresAuth && !isAuthenticated) {
    next({ name: 'login', query: { redirect: to.fullPath } })
  } else if (requiresAdmin && !isAdmin) {
    next({ name: 'home' })
  } else if ((to.name === 'login' || to.name === 'register') && isAuthenticated) {
    next({ name: 'home' })
  } else {
    next()
  }
})

// 路由后置守卫 - 性能监控
router.afterEach((to, from) => {
  // 记录路由切换性能
  if ('performance' in window && 'getEntriesByType' in performance) {
    const navigationEntries = performance.getEntriesByType('navigation')
    if (navigationEntries.length > 0) {
      const navEntry = navigationEntries[0] as PerformanceNavigationTiming
      const routeChangeTime = navEntry.loadEventEnd - navEntry.navigationStart

      console.log(`Route ${from.path} -> ${to.path} took ${routeChangeTime}ms`)
    }
  }
})

// 初始化预加载策略
const initializePreloading = () => {
  // 页面加载完成后开始预加载
  if (document.readyState === 'complete') {
    executePreloading()
  } else {
    window.addEventListener('load', executePreloading)
  }
}

const executePreloading = () => {
  // 预加载关键资源
  setTimeout(preloadCriticalResources, 1000)

  // 根据网络条件调整预加载策略
  if ('connection' in navigator) {
    const connection = (navigator as any).connection

    // 慢速网络减少预加载
    if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
      return
    }

    // 快速网络增加预加载
    if (connection.effectiveType === '4g') {
      setTimeout(() => {
        preloadStrategies.medium()
      }, 1000)

      setTimeout(() => {
        preloadStrategies.low()
      }, 3000)
    }
  }
}

// 启动预加载
initializePreloading()

// 导出路由实例和预加载工具
export { router, preloadStrategies, preloadCriticalResources }
export default router