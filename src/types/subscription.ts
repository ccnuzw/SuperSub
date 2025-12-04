/**
 * 订阅管理扩展类型定义
 */

import type { Subscription, SubscriptionGroup, SubscriptionRule } from './entities'

// 重新导出基础类型
export type { Subscription, SubscriptionGroup, SubscriptionRule } from './entities'

// 重用我们之前创建的工具类型
export type { ErrorCode, ApiError as ApiErrorType } from '@/utils/errorHandler'
export type { ApiResponse, PaginatedResponse } from '@/utils/apiResponse'
export type {
  SubscriptionStatus,
  SubscriptionHealth,
  SubscriptionStats,
  SubscriptionFilterOptions,
  BatchOperationOptions
} from '@/utils/subscriptionUtils'

/**
 * 订阅表单状态
 */
export interface SubscriptionFormData {
  id: string
  name: string
  url: string
  group_id?: string
  enabled: boolean
}

/**
 * 订阅UI状态
 */
export interface SubscriptionUIState {
  loading: boolean
  saving: boolean
  showModal: boolean
  showPreviewModal: boolean
  showUpdateModal: boolean
  updatingIds: Set<string>
  checkedRowKeys: string[]
}

/**
 * 订阅操作状态
 */
export interface SubscriptionOperationState {
  // 编辑状态
  editingSubscription: Subscription | null

  // 预览状态
  previewData: any
  previewLoading: boolean

  // 批量操作状态
  showBatchModal: boolean
  batchLoading: boolean

  // 分组操作状态
  showGroupModal: boolean
  groupLoading: boolean
}

/**
 * 订阅表格行
 */
export interface SubscriptionRow extends Subscription {
  // 计算属性
  status: string
  statusTag: {
    type: string
    text: string
  }
  displayName: string
  healthScore: number
  isExpiring: boolean

  // UI状态
  updating?: boolean
  checked?: boolean
}

/**
 * 订阅表格列定义
 */
export interface SubscriptionColumn {
  key: string
  title: string
  width?: number
  minWidth?: number
  maxWidth?: number
  align?: 'left' | 'center' | 'right'
  ellipsis?: boolean | { tooltip?: boolean }
  fixed?: 'left' | 'right'
  sortable?: boolean
  filterable?: boolean
  render?: (row: SubscriptionRow) => any
  children?: SubscriptionColumn[]
}

/**
 * 订阅分组表单数据
 */
export interface SubscriptionGroupFormData {
  id: string
  name: string
  description?: string
  color?: string
  sort_order: number
  is_enabled: boolean
}

/**
 * 规则表单数据
 */
export interface SubscriptionRuleFormData {
  id: number
  name: string
  type: SubscriptionRule['type']
  value: string
  enabled: boolean
  sort_order: number

  // 扩展字段用于特定规则类型
  keywords?: string[]
  regex?: string
  renameRegex?: string
  renameFormat?: string
}

/**
 * 批量导入数据
 */
export interface BatchImportData {
  subscriptions: Array<{
    name: string
    url: string
    group_id?: string
  }>
  groupId?: string
  skipDuplicates?: boolean
}

/**
 * 批量更新配置
 */
export interface BatchUpdateConfig {
  concurrency: number
  retries: number
  delay: number
  batchDelay: number
  timeout: number
  expiringDaysThreshold: number
  expiringTrafficThresholdGB: number
}

/**
 * 订阅更新日志
 */
export interface SubscriptionUpdateLog {
  id: string
  name: string
  status: 'success' | 'failed' | 'skipped'
  error?: string
  nodeCount?: number
  remainingTraffic?: number
  remainingDays?: number
  duration?: number
  timestamp: number
}

/**
 * 批量操作结果
 */
export interface BatchOperationResult {
  total: number
  success: number
  failed: number
  skipped: number
  errors: Array<{
    item: any
    error: string
  }>
  duration: number
}

/**
 * 订阅预览数据
 */
export interface SubscriptionPreviewData {
  mode: 'local' | 'remote'
  nodes: Array<{
    id: string
    name: string
    protocol: string
    server: string
    port: number
    raw: string
    [key: string]: any
  }>
  analysis?: {
    totalNodes: number
    protocols: Record<string, number>
    countries: Record<string, number>
  }
  error?: string
  loading?: boolean
}

/**
 * 订阅统计卡片数据
 */
export interface SubscriptionStatsCard {
  title: string
  value: number | string
  suffix?: string
  color?: string
  icon?: string
  trend?: {
    value: number
    direction: 'up' | 'down'
  }
}

/**
 * 订阅操作历史
 */
export interface SubscriptionOperationHistory {
  id: string
  type: 'create' | 'update' | 'delete' | 'enable' | 'disable' | 'move'
  subscriptionId: string
  subscriptionName: string
  userId: string
  details: any
  timestamp: string
}

/**
 * 订阅通知设置
 */
export interface SubscriptionNotificationSettings {
  enabled: boolean
  channels: Array<'email' | 'webhook' | 'push'>
  events: Array<{
    type: 'update_success' | 'update_failed' | 'expiring_soon' | 'quota_low'
    enabled: boolean
    threshold?: number
  }>
  webhookUrl?: string
  email?: string
}

/**
 * 订阅自动化规则
 */
export interface SubscriptionAutomationRule {
  id: string
  name: string
  enabled: boolean
  trigger: {
    type: 'schedule' | 'event'
    schedule?: string // cron expression
    event?: string
  }
  conditions: Array<{
    field: string
    operator: 'equals' | 'contains' | 'greater_than' | 'less_than'
    value: any
  }>
  actions: Array<{
    type: 'update' | 'disable' | 'move' | 'notify'
    params: any
  }>
  createdAt: string
  updatedAt: string
}

/**
 * 订阅配置导出/导入
 */
export interface SubscriptionConfigExport {
  version: string
  timestamp: string
  subscriptions: Array<{
    name: string
    url: string
    group: string
    enabled: boolean
    rules: any[]
  }>
  groups: Array<{
    name: string
    description?: string
    color?: string
    sort_order: number
  }>
  settings: {
    autoUpdate: boolean
    updateInterval: number
    notificationSettings: SubscriptionNotificationSettings
  }
}

/**
 * 订阅管理器配置
 */
export interface SubscriptionManagerConfig {
  // 分页配置
  pageSize: number
  pageSizeOptions: number[]

  // 自动刷新配置
  autoRefresh: boolean
  refreshInterval: number

  // 缓存配置
  cacheEnabled: boolean
  cacheTTL: number

  // 批量操作配置
  maxBatchSize: number
  batchTimeout: number

  // 预览配置
  previewMaxNodes: number
  previewTimeout: number

  // 通知配置
  notifications: SubscriptionNotificationSettings
}

/**
 * 订阅事件
 */
export interface SubscriptionEvent {
  type: 'created' | 'updated' | 'deleted' | 'status_changed' | 'expiring' | 'quota_exceeded'
  subscriptionId: string
  subscription: Subscription
  timestamp: string
  data?: any
}

/**
 * 订阅事件监听器
 */
export type SubscriptionEventListener = (event: SubscriptionEvent) => void

/**
 * 订阅上下文
 */
export interface SubscriptionContext {
  user: {
    id: string
    role: string
  }
  settings: SubscriptionManagerConfig
  groups: SubscriptionGroup[]
  eventListeners: Map<string, SubscriptionEventListener[]>
}

/**
 * 通用响应包装器
 */
export interface TypedResponse<T> {
  data: T
  success: boolean
  message?: string
  error?: string
  meta?: {
    pagination?: {
      page: number
      pageSize: number
      total: number
      totalPages: number
    }
    timestamp: string
    requestId?: string
  }
}

/**
 * API请求选项
 */
export interface ApiRequestOptions {
  timeout?: number
  retries?: number
  headers?: Record<string, string>
  signal?: AbortSignal
}

/**
 * 缓存键
 */
export type CacheKey =
  | 'subscriptions'
  | 'subscription-groups'
  | 'subscription-rules'
  | `subscription-${string}`
  | `group-${string}`
  | `rules-${string}`

/**
 * 缓存项
 */
export interface CacheItem<T> {
  data: T
  timestamp: number
  ttl: number
  key: string
}