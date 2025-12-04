import { computed, type Ref } from 'vue'
import type { Subscription } from '@/types/entities'

export function useSubscriptionStats(subscriptions: Ref<Subscription[]> | Subscription[]) {
  // Reactive computed to always get the current value
  const subArray = computed(() => 'value' in subscriptions ? subscriptions.value : subscriptions)

  // 基础统计
  const totalSubscriptions = computed(() => subArray.value.length)

  const activeSubscriptions = computed(() =>
    subArray.value.filter(s => s.enabled).length
  )

  const failedSubscriptions = computed(() =>
    subArray.value.filter(s => s.node_count === 0).length
  )

  const successRate = computed(() => {
    const active = activeSubscriptions.value
    const total = totalSubscriptions.value
    return total > 0 ? Math.round((active / total) * 100) : 0
  })

  // 流量统计
  const totalRemainingTraffic = computed(() => {
    return subArray.value.reduce((sum, sub) => {
      const traffic = sub.remaining_traffic
      return traffic !== null && traffic !== undefined && traffic > 0 ? sum + Number(traffic) : sum
    }, 0)
  })

  const expiringSubscriptions = computed(() => {
    return subArray.value.filter(sub => {
      const days = sub.remaining_days
      return days !== null && days !== undefined && days < 7 && days >= 0
    })
  })

  const expiredSubscriptions = computed(() => {
    return subArray.value.filter(sub => {
      const days = sub.remaining_days
      return days !== null && days !== undefined && days < 0
    })
  })

  // 按分组统计
  const statsByGroup = computed(() => {
    const stats: Record<string, {
      total: number
      active: number
      failed: number
      successRate: number
    }> = {}

    // 包含未分组的统计
    stats['未分组'] = { total: 0, active: 0, failed: 0, successRate: 0 }

    subArray.value.forEach(sub => {
      const groupKey = sub.group_id || '未分组'

      if (!stats[groupKey]) {
        stats[groupKey] = { total: 0, active: 0, failed: 0, successRate: 0 }
      }

      stats[groupKey].total++
      if (sub.enabled && sub.node_count && sub.node_count > 0) {
        stats[groupKey].active++
      }
      if (sub.node_count === 0) {
        stats[groupKey].failed++
      }
    })

    // 计算每个分组的成功率
    Object.keys(stats).forEach(key => {
      const stat = stats[key]
      stat.successRate = stat.total > 0 ? Math.round((stat.active / stat.total) * 100) : 0
    })

    return stats
  })

  // 节点统计
  const totalNodes = computed(() => {
    return subArray.value.reduce((sum, sub) => sum + (sub.node_count || 0), 0)
  })

  const averageNodesPerSubscription = computed(() => {
    const activeWithNodes = subArray.value.filter(s => s.enabled && s.node_count && s.node_count > 0)
    if (activeWithNodes.length === 0) return 0

    const total = activeWithNodes.reduce((sum, sub) => sum + (sub.node_count || 0), 0)
    return Math.round(total / activeWithNodes.length)
  })

  // 最近更新统计
  const recentlyUpdated = computed(() => {
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000
    return subArray.value.filter(sub => {
      if (!sub.last_updated) return false
      return new Date(sub.last_updated).getTime() > oneDayAgo
    }).length
  })

  const notUpdatedRecently = computed(() => {
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000
    return subArray.value.filter(sub => {
      if (!sub.last_updated) return true // 从未更新的也算需要更新
      return new Date(sub.last_updated).getTime() <= oneDayAgo
    }).length
  })

  // 格式化辅助函数
  const formatTraffic = (bytes: number): string => {
    if (!bytes || bytes <= 0) return 'N/A'

    const GB = 1024 * 1024 * 1024
    const MB = 1024 * 1024
    const KB = 1024

    if (bytes >= GB) {
      return `${(bytes / GB).toFixed(2)} GB`
    } else if (bytes >= MB) {
      return `${(bytes / MB).toFixed(2)} MB`
    } else if (bytes >= KB) {
      return `${(bytes / KB).toFixed(2)} KB`
    } else {
      return `${bytes} B`
    }
  }

  const getGroupDistribution = computed(() => {
    const distribution: Array<{ name: string; value: number; percentage: number }> = []
    const total = totalSubscriptions.value

    if (total === 0) return distribution

    Object.entries(statsByGroup.value).forEach(([name, stats]) => {
      distribution.push({
        name,
        value: stats.total,
        percentage: Math.round((stats.total / total) * 100)
      })
    })

    return distribution.sort((a, b) => b.value - a.value)
  })

  return {
    // 基础数据
    totalSubscriptions,
    activeSubscriptions,
    failedSubscriptions,
    successRate,
    ungroupedCount: computed(() => {
      return subArray.value.filter(s => !s.group_id).length
    }),

    // 流量和状态
    totalRemainingTraffic,
    expiringSubscriptions,
    expiredSubscriptions,

    // 节点统计
    totalNodes,
    averageNodesPerSubscription,

    // 更新统计
    recentlyUpdated,
    notUpdatedRecently,

    // 分组统计
    statsByGroup,
    getGroupDistribution,

    // 工具函数
    formatTraffic
  }
}