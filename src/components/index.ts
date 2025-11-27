/**
 * SuperSub 组件库统一入口
 */

// 导出所有组件类型
export * from './types'

// 导入并重新导出通用组件
export { default as ActionButtonGroup } from './common/ActionButtonGroup.vue'
export { default as StatsCard } from './common/StatsCard.vue'
export { default as ConfirmDialog } from './common/ConfirmDialog.vue'
export { default as DataTable } from './common/DataTable.vue'
export { default as ErrorBoundary } from './common/ErrorBoundary.vue'
export { default as LoadingSpinner } from './common/LoadingSpinner.vue'
export { default as SkeletonLoader } from './common/SkeletonLoader.vue'
export { default as SimpleDataTable } from './common/SimpleDataTable.vue'
export { default as EntityForm } from './common/EntityForm.vue'
export { default as ConfirmModal } from './common/ConfirmModal.vue'

// 导入并重新导出订阅管理组件
export { default as SubscriptionImport } from './subscription/SubscriptionImport.vue'

// 导入并重新导出节点管理组件
export { default as NodeForm } from './nodes/NodeForm.vue'

// 导出工具函数
export { performanceMonitor, measureAsync, measureSync, usePerformance } from '../utils/performance'

// 导出 Composables
export { useIsMobile } from '../composables/useMediaQuery'

// 组件元数据
export const COMPONENTS = {
  // 通用组件
  ActionButtonGroup: {
    name: 'ActionButtonGroup',
    description: '操作按钮组组件',
    category: 'common',
    version: '1.0.0'
  },
  StatsCard: {
    name: 'StatsCard',
    description: '统计卡片组件',
    category: 'common',
    version: '1.0.0'
  },
  ConfirmDialog: {
    name: 'ConfirmDialog',
    description: '确认对话框组件',
    category: 'common',
    version: '1.0.0'
  },
  DataTable: {
    name: 'DataTable',
    description: '增强数据表格组件',
    category: 'common',
    version: '1.0.0'
  },
  ErrorBoundary: {
    name: 'ErrorBoundary',
    description: '错误边界组件',
    category: 'common',
    version: '1.0.0'
  },
  LoadingSpinner: {
    name: 'LoadingSpinner',
    description: '加载动画组件',
    category: 'common',
    version: '1.0.0'
  },
  SkeletonLoader: {
    name: 'SkeletonLoader',
    description: '骨架屏组件',
    category: 'common',
    version: '1.0.0'
  },
  SimpleDataTable: {
    name: 'SimpleDataTable',
    description: '简单数据表格组件',
    category: 'common',
    version: '1.0.0'
  },
  EntityForm: {
    name: 'EntityForm',
    description: '通用实体表单组件',
    category: 'common',
    version: '1.0.0'
  },
  ConfirmModal: {
    name: 'ConfirmModal',
    description: '确认模态框组件',
    category: 'common',
    version: '1.0.0'
  },

  // 业务组件
  SubscriptionImport: {
    name: 'SubscriptionImport',
    description: '订阅批量导入组件',
    category: 'subscription',
    version: '1.0.0'
  },
  NodeForm: {
    name: 'NodeForm',
    description: '节点表单组件',
    category: 'nodes',
    version: '1.0.0'
  }
} as const

// 默认导出
export default {
  version: '1.0.0',
  components: COMPONENTS,
  types: {
    // 导出所有类型（在需要时使用）
  }
}