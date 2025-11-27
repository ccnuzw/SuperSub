/**
 * SuperSub 组件库类型定义
 */

import type { Component } from 'vue'
import type { ButtonProps, DataTableColumns, PaginationProps, DialogProps } from 'naive-ui'

// ============================================================================
// 通用组件类型
// ============================================================================

// ActionButtonGroup
export interface ActionButton {
  key: string
  label: string
  icon?: Component
  type?: ButtonProps['type']
  disabled?: boolean
  loading?: boolean
  circle?: boolean
  quaternary?: boolean
  ghost?: boolean
  handler?: () => void | Promise<void>
}

export interface ActionButtonGroupProps {
  actions: ActionButton[]
  size?: 'small' | 'medium' | 'large'
  vertical?: boolean
  compact?: boolean
}

export interface ActionButtonGroupEmits {
  (e: 'action', key: string): void
}

// StatsCard
export type StatsCardColor = 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info'
export type StatsCardSize = 'small' | 'medium' | 'large'
export type StatsCardTrend = 'up' | 'down' | 'neutral'

export interface StatsCardProps {
  title: string
  value: number | string
  unit?: string
  subtitle?: string
  icon?: Component
  iconColor?: string
  iconSize?: number
  size?: StatsCardSize
  color?: StatsCardColor
  trend?: StatsCardTrend
  trendValue?: string
  formatter?: (value: number | string) => string
  bordered?: boolean
  hoverable?: boolean
}

// ConfirmDialog
export interface ConfirmDialogProps {
  show: boolean
  title: string
  message?: string
  type?: 'info' | 'success' | 'warning' | 'error'
  positiveText?: string
  negativeText?: string
  loading?: boolean
}

export interface ConfirmDialogEmits {
  (e: 'confirm'): void
  (e: 'cancel'): void
  (e: 'update:show', value: boolean): void
}

// DataTable
export interface DataTableProps<T = any> {
  columns: DataTableColumns<T>[]
  data: T[]
  loading?: boolean
  pagination?: PaginationProps | false
  bordered?: boolean
  scrollX?: number
  minHeight?: number | string
  maxHeight?: number | string
  size?: 'small' | 'medium' | 'large'
}

export interface DataTableEmits {
  (e: 'update:checked-row-keys', keys: any[]): void
  (e: 'update:page', page: number): void
  (e: 'update:page-size', pageSize: number): void
}

// ErrorBoundary
export interface ErrorBoundaryProps {
  fallback?: Component
  onError?: (error: Error, instance: Component | null, info: string) => void
}

export interface ErrorBoundaryEmits {
  (e: 'error', error: Error): void
  (e: 'fallback', error: Error): void
}

// LoadingSpinner
export interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large'
  text?: string
  color?: string
}

// SkeletonLoader
export interface SkeletonLoaderProps {
  rows?: number
  animated?: boolean
  height?: number | string
  avatar?: boolean
}

// ============================================================================
// 订阅管理组件类型
// ============================================================================

// SubscriptionImport
export interface SubscriptionGroup {
  id: string
  name: string
  description?: string
  is_enabled?: boolean
}

export interface SubscriptionImportProps {
  show: boolean
  groups: SubscriptionGroup[]
}

export interface SubscriptionImportEmits {
  (e: 'success'): void
  (e: 'cancel'): void
  (e: 'update:show', value: boolean): void
}

// ============================================================================
// 节点管理组件类型
// ============================================================================

// NodeForm
export interface Node {
  id: string
  name: string
  server: string
  port: number
  type: string
  protocol: string
  group_id?: string
  enabled: boolean
}

export interface NodeGroup {
  id: string
  name: string
  description?: string
}

export interface NodeFormProps {
  show: boolean
  node?: Node
  groups: NodeGroup[]
}

export interface NodeFormEmits {
  (e: 'success', node: Node): void
  (e: 'cancel'): void
  (e: 'update:show', value: boolean): void
}

// ============================================================================
// 实体表单组件类型 (通用表单)
// ============================================================================

export interface EntityFormAction {
  key: string
  label: string
  type?: 'primary' | 'default' | 'warning' | 'error'
  handler: () => void | Promise<void>
  disabled?: boolean
  loading?: boolean
}

export interface EntityFormConfig {
  title: string
  fields: EntityFormField[]
  actions?: EntityFormAction[]
  size?: 'small' | 'medium' | 'large'
  labelWidth?: number | string
  labelPlacement?: 'left' | 'top' | 'right'
}

export interface EntityFormField {
  key: string
  label: string
  type: 'input' | 'textarea' | 'select' | 'number' | 'switch' | 'radio' | 'checkbox' | 'date'
  required?: boolean
  placeholder?: string
  options?: Array<{ label: string; value: any }>
  rules?: any[]
  defaultValue?: any
  disabled?: boolean
  span?: number
}

export interface EntityFormProps {
  config: EntityFormConfig
  modelValue: Record<string, any>
  loading?: boolean
  readonly?: boolean
}

export interface EntityFormEmits {
  (e: 'update:modelValue', value: Record<string, any>): void
  (e: 'submit', value: Record<string, any>): void
  (e: 'reset'): void
  (e: 'cancel'): void
}

// ============================================================================
// 性能监控类型
// ============================================================================

export interface PerformanceMetric {
  name: string
  value: number
  unit: string
  timestamp: number
}

export interface PerformanceReport {
  metrics: PerformanceMetric[]
  totalDuration: number
  timestamp: number
}

export interface PerformanceStats {
  avg: number
  min: number
  max: number
  count: number
}

// ============================================================================
// 工具函数类型
// ============================================================================

export interface UsePerformanceReturn {
  start: (name: string) => void
  end: (name: string) => number
  record: (name: string, value: number, unit?: string) => void
  getStats: (name: string) => PerformanceStats | null
  getMetricNames: () => string[]
  clear: (name: string) => void
  clearAll: () => void
  generateReport: () => PerformanceReport
  export: () => string
  print: (name?: string) => void
  measureAsync: <T>(name: string, fn: () => Promise<T>) => Promise<T>
  measureSync: <T>(name: string, fn: () => T) => T
}

// ============================================================================
// 响应式工具类型
// ============================================================================

export interface MediaQueryReturn {
  isMobile: boolean
  isTablet: boolean
  isDesktop: boolean
  screenWidth: number
  screenHeight: number
}

export interface UseMediaQueryOptions {
  mobile?: number
  tablet?: number
  desktop?: number
}

// ============================================================================
// 常量类型
// ============================================================================

export const COMPONENT_SIZES = ['small', 'medium', 'large'] as const
export const BUTTON_TYPES = ['default', 'primary', 'info', 'success', 'warning', 'error'] as const
export const CARD_COLORS = ['default', 'primary', 'success', 'warning', 'error', 'info'] as const
export const DIALOG_TYPES = ['info', 'success', 'warning', 'error'] as const

export type ComponentSize = typeof COMPONENT_SIZES[number]
export type ButtonType = typeof BUTTON_TYPES[number]
export type CardColor = typeof CARD_COLORS[number]
export type DialogType = typeof DIALOG_TYPES[number]