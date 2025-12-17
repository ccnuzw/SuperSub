import type { App } from 'vue'
import type { RouteRecordRaw } from 'vue-router'

// 懒加载组件类型定义
type LazyComponent = () => Promise<typeof import('*.vue')>

// 基础组件 - 直接导入（使用频率高）
import SsButton from './base/SsButton.vue'
import SsInput from './base/SsInput.vue'
import SsCard from './base/SsCard.vue'
import SsBadge from './base/SsBadge.vue'
import SsStatus from './base/SsStatus.vue'

// 业务组件 - 懒加载
const NodeCard = (): Promise<any> => import('./business/NodeCard.vue')
const SubscriptionCard = (): Promise<any> => import('./business/SubscriptionCard.vue')
const NodeStatusIndicator = (): Promise<any> => import('./business/NodeStatusIndicator.vue')
const SubscriptionStatusIndicator = (): Promise<any> => import('./business/SubscriptionStatusIndicator.vue')

// 节点相关组件
const GroupSelector = (): Promise<any> => import('./nodes/GroupSelector.vue')
const NodeTable = (): Promise<any> => import('./nodes/NodeTable.vue')
const NodeFormModal = (): Promise<any> => import('./nodes/NodeFormModal.vue')

// 页面组件 - 懒加载（路由级别）
export const lazyRoutes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Dashboard',
    component: () => import('@/views/HomeView.vue'),
    meta: { preload: true } // 预加载首页
  },
  {
    path: '/nodes',
    name: 'Nodes',
    component: () => import('@/views/NodesView.vue'),
    meta: { preload: false }
  },
  {
    path: '/subscriptions',
    name: 'Subscriptions',
    component: () => import('@/views/SubscriptionsView.vue'),
    meta: { preload: false }
  },
  {
    path: '/profiles',
    name: 'Profiles',
    component: () => import('@/views/ProfilesView.vue'),
    meta: { preload: false }
  },
  {
    path: '/settings',
    name: 'Settings',
    component: () => import('@/views/SettingsView.vue'),
    meta: { preload: false }
  }
]

// 基础组件注册
export function registerBaseComponents(app: App) {
  // 注册高频率使用的基础组件
  app.component('SsButton', SsButton)
  app.component('SsInput', SsInput)
  app.component('SsCard', SsCard)
  app.component('SsBadge', SsBadge)
  app.component('SsStatus', SsStatus)
}

// 懒加载业务组件注册
export function registerLazyComponents(app: App) {
  app.component('NodeCard', NodeCard)
  app.component('SubscriptionCard', SubscriptionCard)
  app.component('NodeStatusIndicator', NodeStatusIndicator)
  app.component('SubscriptionStatusIndicator', SubscriptionStatusIndicator)
  app.component('GroupSelector', GroupSelector)
  app.component('NodeTable', NodeTable)
  app.component('NodeFormModal', NodeFormModal)
}

// 预加载函数
export function preloadComponents(routes: RouteRecordRaw[]) {
  routes.forEach(route => {
    if (route.meta?.preload && typeof route.component === 'function') {
      // 在空闲时间预加载组件
      if ('requestIdleCallback' in window) {
        window.requestIdleCallback(async () => {
          try {
            await (route.component as () => Promise<any>)()
          } catch (error) {
            console.warn(`Failed to preload component for route ${String(route.name)}:`, error)
          }
        })
      } else {
        // 回退方案：延迟预加载
        setTimeout(async () => {
          try {
            await (route.component as () => Promise<any>)()
          } catch (error) {
            console.warn(`Failed to preload component for route ${String(route.name)}:`, error)
          }
        }, 2000)
      }
    }
  })
}

// 组件打包分析信息
export const bundleAnalysis = {
  // 基础组件包大小估算
  baseComponents: {
    SsButton: '~2.1KB',
    SsInput: '~3.8KB',
    SsCard: '~1.6KB',
    SsBadge: '~1.8KB',
    SsStatus: '~2.4KB'
  },

  // 业务组件包大小估算
  businessComponents: {
    NodeCard: '~8.7KB',
    SubscriptionCard: '~9.2KB',
    NodeStatusIndicator: '~4.3KB',
    SubscriptionStatusIndicator: '~4.8KB'
  },

  // 页面组件包大小估算
  pageComponents: {
    Dashboard: '~15.2KB',
    Nodes: '~18.7KB',
    Subscriptions: '~22.4KB',
    Profiles: '~31.8KB',
    Settings: '~12.3KB'
  }
}

export default {
  registerBaseComponents,
  registerLazyComponents,
  preloadComponents,
  lazyRoutes,
  bundleAnalysis
}