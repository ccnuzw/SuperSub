/**
 * 订阅管理通用工具函数
 */

import type { Subscription } from '@/types/entities'
import { formatBytes } from '@/utils/format'
import { getNaiveTagColor } from '@/utils/colors'

/**
 * 订阅状态枚举
 */
export enum SubscriptionStatus {
  SUCCESS = 'success',
  FAILED = 'failed',
  PENDING = 'pending',
  DISABLED = 'disabled'
}

/**
 * 订阅健康状态
 */
export interface SubscriptionHealth {
  score: number
  status: 'healthy' | 'warning' | 'critical'
  color: 'success' | 'warning' | 'error'
  text: string
}

/**
 * 订阅统计信息
 */
export interface SubscriptionStats {
  total: number
  active: number
  failed: number
  pending: number
  disabled: number
  successRate: number
  totalNodes: number
  healthScore: number
}

/**
 * 订阅过滤选项
 */
export interface SubscriptionFilterOptions {
  status?: SubscriptionStatus
  groupId?: string | null
  searchTerm?: string
  hasError?: boolean
  enabled?: boolean
  dateRange?: {
    start: Date
    end: Date
  }
}

/**
 * 批量操作选项
 */
export interface BatchOperationOptions {
  action: 'update' | 'delete' | 'enable' | 'disable' | 'move'
  subscriptionIds: string[]
  groupId?: string
  data?: any
}

/**
 * 获取订阅状态
 */
export function getSubscriptionStatus(subscription: Subscription): SubscriptionStatus {
  if (!subscription.enabled) {
    return SubscriptionStatus.DISABLED
  }

  if (subscription.error) {
    return SubscriptionStatus.FAILED
  }

  if (!subscription.last_updated) {
    return SubscriptionStatus.PENDING
  }

  return SubscriptionStatus.SUCCESS
}

/**
 * 获取订阅状态标签
 */
export function getSubscriptionStatusTag(status: SubscriptionStatus) {
  const statusMap = {
    [SubscriptionStatus.SUCCESS]: {
      type: 'success' as const,
      text: '成功'
    },
    [SubscriptionStatus.FAILED]: {
      type: 'error' as const,
      text: '失败'
    },
    [SubscriptionStatus.PENDING]: {
      type: 'default' as const,
      text: '待更新'
    },
    [SubscriptionStatus.DISABLED]: {
      type: 'warning' as const,
      text: '已禁用'
    }
  }

  return statusMap[status] || statusMap[SubscriptionStatus.PENDING]
}

/**
 * 检查订阅是否即将到期
 */
export function isSubscriptionExpiring(subscription: Subscription, daysThreshold = 7): boolean {
  if (!subscription.remaining_days && !subscription.remaining_traffic) {
    return false
  }

  const isExpiringByDays = subscription.remaining_days !== null &&
    subscription.remaining_days !== undefined &&
    subscription.remaining_days <= daysThreshold

  const GB = 1024 * 1024 * 1024
  const isExpiringByTraffic = subscription.remaining_traffic !== null &&
    subscription.remaining_traffic !== undefined &&
    subscription.remaining_traffic < GB

  return isExpiringByDays || isExpiringByTraffic
}

/**
 * 格式化订阅流量信息
 */
export function formatSubscriptionTraffic(traffic: number | null | undefined): string {
  if (traffic === null || traffic === undefined) {
    return 'N/A'
  }

  return formatBytes(traffic)
}

/**
 * 格式化订阅时间信息
 */
export function formatSubscriptionTime(date: string | null | undefined): string {
  if (!date) {
    return 'N/A'
  }

  return new Date(date).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

/**
 * 计算订阅健康分数
 */
export function calculateHealthScore(subscriptions: Subscription[]): number {
  if (subscriptions.length === 0) return 100

  let totalScore = 0

  for (const subscription of subscriptions) {
    let score = 0

    // 基础分数 (0-60分)
    const status = getSubscriptionStatus(subscription)
    switch (status) {
      case SubscriptionStatus.SUCCESS:
        score = 60
        break
      case SubscriptionStatus.FAILED:
        score = 0
        break
      case SubscriptionStatus.PENDING:
        score = 30
        break
      case SubscriptionStatus.DISABLED:
        score = 20
        break
    }

    // 节点数加分 (0-20分)
    const nodeCount = subscription.node_count || 0
    if (nodeCount > 0) {
      score += Math.min(20, Math.log10(nodeCount + 1) * 5)
    }

    // 最近更新加分 (0-20分)
    if (subscription.last_updated) {
      const daysSinceUpdate = Math.floor(
        (Date.now() - new Date(subscription.last_updated).getTime()) / (1000 * 60 * 60 * 24)
      )

      if (daysSinceUpdate <= 1) {
        score += 20
      } else if (daysSinceUpdate <= 7) {
        score += 15
      } else if (daysSinceUpdate <= 30) {
        score += 10
      } else if (daysSinceUpdate <= 90) {
        score += 5
      }
    }

    // 处理剩余流量和天数（转换为number处理）
    const remainingTraffic = subscription.remaining_traffic ? Number(subscription.remaining_traffic) : 0
    const remainingDays = subscription.remaining_days || 0

    // 剩余流量加分 (0-10分)
    if (remainingTraffic > 0) {
      const GB = 1024 * 1024 * 1024
      score += Math.min(10, Math.log10(remainingTraffic / GB + 1) * 2)
    }

    // 剩余天数加分 (0-10分)
    if (remainingDays > 0) {
      score += Math.min(10, Math.log10(remainingDays + 1) * 3)
    }

    totalScore += score
  }

  return Math.round(totalScore / subscriptions.length)
}

/**
 * 获取健康状态信息
 */
export function getHealthStatus(score: number): SubscriptionHealth {
  if (score >= 80) {
    return {
      score,
      status: 'healthy',
      color: 'success',
      text: '良好'
    }
  } else if (score >= 60) {
    return {
      score,
      status: 'warning',
      color: 'warning',
      text: '一般'
    }
  } else {
    return {
      score,
      status: 'critical',
      color: 'error',
      text: '较差'
    }
  }
}

/**
 * 计算订阅统计信息
 */
export function calculateSubscriptionStats(subscriptions: Subscription[]): SubscriptionStats {
  const total = subscriptions.length
  const active = subscriptions.filter(s => s.enabled && getSubscriptionStatus(s) === SubscriptionStatus.SUCCESS).length
  const failed = subscriptions.filter(s => getSubscriptionStatus(s) === SubscriptionStatus.FAILED).length
  const pending = subscriptions.filter(s => getSubscriptionStatus(s) === SubscriptionStatus.PENDING).length
  const disabled = subscriptions.filter(s => !s.enabled).length

  const totalNodes = subscriptions.reduce((sum, s) => sum + (s.node_count || 0), 0)
  const healthScore = calculateHealthScore(subscriptions)

  return {
    total,
    active,
    failed,
    pending,
    disabled,
    successRate: total > 0 ? Math.round((active / total) * 100) : 0,
    totalNodes,
    healthScore
  }
}

/**
 * 过滤订阅列表
 */
export function filterSubscriptions(
  subscriptions: Subscription[],
  options: SubscriptionFilterOptions
): Subscription[] {
  return subscriptions.filter(subscription => {
    // 状态过滤
    if (options.status !== undefined) {
      if (getSubscriptionStatus(subscription) !== options.status) {
        return false
      }
    }

    // 分组过滤
    if (options.groupId !== undefined) {
      if (options.groupId === null) {
        if (subscription.group_id !== null) {
          return false
        }
      } else {
        if (subscription.group_id !== options.groupId) {
          return false
        }
      }
    }

    // 错误过滤
    if (options.hasError !== undefined) {
      const hasError = !!subscription.error
      if (hasError !== options.hasError) {
        return false
      }
    }

    // 启用状态过滤
    if (options.enabled !== undefined) {
      if (subscription.enabled !== options.enabled) {
        return false
      }
    }

    // 搜索过滤
    if (options.searchTerm) {
      const term = options.searchTerm.toLowerCase()
      const searchableText = `${subscription.name} ${subscription.url}`.toLowerCase()
      if (!searchableText.includes(term)) {
        return false
      }
    }

    // 日期范围过滤
    if (options.dateRange) {
      if (!subscription.last_updated) {
        return false
      }

      const updateDate = new Date(subscription.last_updated).getTime()
      if (updateDate < options.dateRange.start.getTime() || updateDate > options.dateRange.end.getTime()) {
        return false
      }
    }

    return true
  })
}

/**
 * 排序订阅列表
 */
export function sortSubscriptions(
  subscriptions: Subscription[],
  sortBy: string = 'name',
  sortOrder: 'asc' | 'desc' = 'asc'
): Subscription[] {
  return [...subscriptions].sort((a, b) => {
    let aVal = (a as any)[sortBy]
    let bVal = (b as any)[sortBy]

    // 处理日期字段
    if (sortBy === 'created_at' || sortBy === 'last_updated') {
      aVal = aVal ? new Date(aVal as string).getTime() : 0
      bVal = bVal ? new Date(bVal as string).getTime() : 0
    }

    // 处理数字字段
    if (typeof aVal === 'string' && typeof bVal === 'string') {
      return sortOrder === 'asc'
        ? aVal.localeCompare(bVal)
        : bVal.localeCompare(aVal)
    }

    return sortOrder === 'asc'
      ? (aVal as any) - (bVal as any)
      : (bVal as any) - (aVal as any)
  })
}

/**
 * 验证订阅URL
 */
export function validateSubscriptionUrl(url: string): { valid: boolean; error?: string } {
  if (!url || !url.trim()) {
    return { valid: false, error: '订阅链接不能为空' }
  }

  try {
    const urlObj = new URL(url.trim())

    // 检查协议
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return { valid: false, error: '订阅链接必须使用 HTTP 或 HTTPS 协议' }
    }

    // 检查域名
    if (!urlObj.hostname) {
      return { valid: false, error: '订阅链接格式无效' }
    }

    return { valid: true }
  } catch {
    return { valid: false, error: '订阅链接格式无效' }
  }
}

/**
 * 验证订阅名称
 */
export function validateSubscriptionName(name: string): { valid: boolean; error?: string } {
  if (!name || !name.trim()) {
    return { valid: false, error: '订阅名称不能为空' }
  }

  const trimmedName = name.trim()

  if (trimmedName.length < 1) {
    return { valid: false, error: '订阅名称不能为空' }
  }

  if (trimmedName.length > 100) {
    return { valid: false, error: '订阅名称不能超过100个字符' }
  }

  return { valid: true }
}

/**
 * 生成订阅显示名称
 */
export function generateSubscriptionDisplayName(subscription: Subscription): string {
  return subscription.name || subscription.url?.replace(/^https?:\/\//, '').split('/')[0] || '未知订阅'
}

/**
 * 检查订阅是否重复
 */
export function isDuplicateSubscription(
  subscription: Subscription,
  existingSubscriptions: Subscription[]
): boolean {
  return existingSubscriptions.some(existing =>
    existing.id !== subscription.id &&
    (existing.name === subscription.name || existing.url === subscription.url)
  )
}

/**
 * 生成订阅预览文本
 */
export function generateSubscriptionPreviewText(subscription: Subscription): string {
  const parts = []

  if (subscription.name) {
    parts.push(`名称: ${subscription.name}`)
  }

  if (subscription.node_count !== undefined && subscription.node_count !== null) {
    parts.push(`节点数: ${subscription.node_count}`)
  }

  const status = getSubscriptionStatus(subscription)
  const statusTag = getSubscriptionStatusTag(status)
  parts.push(`状态: ${statusTag.text}`)

  if (subscription.last_updated) {
    parts.push(`最后更新: ${formatSubscriptionTime(subscription.last_updated)}`)
  }

  return parts.join(' | ')
}