/**
 * 订阅预览业务逻辑层
 * 遵循分层架构：视图层 → 组件层 → 业务逻辑层 → 服务层 → 基础设施层
 */

import { ref, computed, watch, nextTick } from 'vue'
import { useMessage } from 'naive-ui'
import type { ISubscription } from '@/types'
import { httpClient } from '@/services/http/HttpClient'
import { useAuthStore } from '@/stores/auth'

/**
 * 预览节点数据结构
 */
export interface IPreviewNode {
  id: string
  user_id: string
  group_id: string | null
  name: string
  server: string
  port: number
  protocol: string
  protocol_params: any
  server_name: string
  status: string
  latency: number | null
  created_at: string
  updated_at: string
  sort_order: number
  last_checked: string | null
  error: string | null
  type: string
  link: string
  password: string
  params: string
}

/**
 * 订阅预览状态
 */
export interface ISubscriptionPreviewState {
  loading: boolean
  showModal: boolean
  subscription: ISubscription | null
  nodes: IPreviewNode[]
  error: string | null
  filters: {
    enabled: boolean
    search: string
    type: string
  }
}

/**
 * 订阅预览统计信息
 */
export interface IPreviewStats {
  total: number
  enabled: number
  disabled: number
  healthy: number
  failed: number
}

/**
 * 订阅预览 Composable
 * 负责订阅节点预览的完整业务逻辑，包括数据获取、过滤、统计等
 */
export function useSubscriptionPreview() {
  const message = useMessage()
  const authStore = useAuthStore()
  const user = authStore.user

  // 状态管理
  const loading = ref(false)
  const showModal = ref(false)
  const subscription = ref<ISubscription | null>(null)
  const nodes = ref<IPreviewNode[]>([])
  const error = ref<string | null>(null)

  // 简单缓存机制
  const cache = new Map<string, { data: IPreviewNode[]; timestamp: number }>()
  const CACHE_TTL = 5 * 60 * 1000 // 5分钟缓存
  const MAX_CACHE_SIZE = 20 // 最大缓存数量

  // 清理过期缓存
  const cleanCache = () => {
    const now = Date.now()
    for (const [key, value] of cache.entries()) {
      if (now - value.timestamp > CACHE_TTL) {
        cache.delete(key)
      }
    }

    // 如果缓存仍然过大，删除最旧的条目
    if (cache.size > MAX_CACHE_SIZE) {
      const entries = Array.from(cache.entries())
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp)
      const toDelete = entries.slice(0, entries.length - MAX_CACHE_SIZE)
      toDelete.forEach(([key]) => cache.delete(key))
    }
  }

  // 过滤器状态
  const filters = ref({
    enabled: true,
    search: '',
    type: ''
  })

  // 计算属性
  const isLoading = computed(() => loading.value)
  const hasError = computed(() => !!error.value)
  const hasNodes = computed(() => nodes.value.length > 0)
  const filteredNodes = computed(() => {
    let result = nodes.value

    // 过滤启用状态
    if (filters.value.enabled) {
      result = result.filter(node => node.status === 'healthy' || node.status === null || node.status === 'unknown' || node.status === 'testing')
    }

    // 过滤搜索关键词
    if (filters.value.search) {
      const search = filters.value.search.toLowerCase()
      result = result.filter(node =>
        node.name?.toLowerCase().includes(search) ||
        node.server?.toLowerCase().includes(search) ||
        node.server_name?.toLowerCase().includes(search)
      )
    }

    // 过滤节点类型
    if (filters.value.type) {
      result = result.filter(node => node.type === filters.value.type)
    }

    return result
  })

  // 统计信息
  const stats = computed((): IPreviewStats => {
    // 在预览场景中，所有节点都是 'unknown' 状态，应该被视为可用节点
    const total = nodes.value.length
    const enabled = nodes.value.filter(node =>
      node.status === 'healthy' ||
      node.status === null ||
      node.status === 'unknown' ||
      node.status === 'testing' ||
      node.status === ''
    ).length
    const disabled = nodes.value.filter(node => node.status === 'unhealthy').length
    const healthy = nodes.value.filter(node => node.status === 'healthy').length
    const failed = nodes.value.filter(node => node.status === 'unhealthy').length

    return {
      total,
      enabled,
      disabled,
      healthy,
      failed
    }
  })

  // 节点类型选项
  const nodeTypeOptions = computed(() => {
    const types = [...new Set(nodes.value.map(node => node.type).filter(Boolean))]
    return types.map(type => ({ label: type, value: type }))
  })

  // 清除错误状态
  const clearError = () => {
    error.value = null
  }

  // 设置错误状态
  const setError = (errorMessage: string) => {
    error.value = errorMessage
  }

  // 获取订阅节点数据
  const fetchSubscriptionNodes = async (subscriptionId: string): Promise<void> => {
    if (!subscriptionId) {
      setError('订阅ID不能为空')
      return
    }

    // 先清理过期缓存
    cleanCache()

    // 检查缓存
    const cacheKey = `subscription_${subscriptionId}_${user.id}`
    const cached = cache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      nodes.value = [...cached.data]
      message.info('使用缓存的节点数据')
      return
    }

    loading.value = true
    clearError()

    try {
      // 添加超时限制，设置15秒超时
      const response = await httpClient.get(`/subscriptions/${subscriptionId}/preview`, {
        timeout: 15000
      })

      if (response.success && response.data) {
        const nodesData = response.data.nodes || response.data

        // 处理数据格式
        let processedNodes = []

        if (Array.isArray(nodesData)) {
          processedNodes = nodesData.map((node: any, index) => ({
            ...node,
            id: node.id || `node-${index}`,
            user_id: user.id || 'temp-user',
            group_id: null,
            link: node.link || '',
            protocol: node.protocol || 'unknown',
            protocol_params: node.protocol_params || {},
            server_name: node.server_name || node.name || `Node ${index + 1}`,
            port: node.port || 0,
            password: '',
            type: node.type || 'unknown',
            params: '',
            created_at: node.created_at || new Date().toISOString(),
            updated_at: node.updated_at || new Date().toISOString(),
            sort_order: node.sort_order || index,
            status: node.status || 'unknown',
            latency: node.latency || null,
            last_checked: null,
            error: null
          }));
        }

        // 先设置数据
        nodes.value = [...processedNodes];

        // 缓存数据
        cache.set(cacheKey, {
          data: [...processedNodes],
          timestamp: Date.now()
        })

        // 等待下一个tick确保响应式更新完成
        await nextTick()

        message.success(`成功获取 ${processedNodes.length} 个��点`)
      } else {
        throw new Error(response.message || '获取节点数据失败')
      }
    } catch (err: any) {
      let errorMessage = '获取节点数据失败'

      if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
        errorMessage = '请求超时，请检查订阅链接或稍后重试'
      } else if (err.response?.status === 408) {
        errorMessage = '请求超时，订阅服务器响应过慢'
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message
      } else if (err.message) {
        errorMessage = err.message
      }

      setError(errorMessage)
      message.error(errorMessage)
      nodes.value = []
    } finally {
      loading.value = false
    }
  }

  // 打开预览模态框
  const openPreview = (subscriptionData: ISubscription) => {
    subscription.value = subscriptionData
    showModal.value = true

    // 重置过滤器和错误状态
    filters.value = {
      enabled: true,
      search: '',
      type: ''
    }
    clearError()

    // 获取节点数据
    if (subscriptionData.id) {
      fetchSubscriptionNodes(subscriptionData.id)
    }
  }

  // 关闭预览模态框
  const closePreview = () => {
    showModal.value = false
    subscription.value = null
    nodes.value = []
    clearError()
  }

  // 更新过滤器
  const updateFilters = (newFilters: Partial<typeof filters.value>) => {
    filters.value = { ...filters.value, ...newFilters }
  }

  // 刷新节点数据
  const refreshNodes = (forceRefresh = false) => {
    if (forceRefresh && subscription.value?.id) {
      // 强制刷新时清除缓存
      const cacheKey = `subscription_${subscription.value.id}_${user.id}`
      cache.delete(cacheKey)
    }

    if (subscription.value?.id) {
      fetchSubscriptionNodes(subscription.value.id)
    }
  }

  // 复制节点配置
  const copyNodeConfig = (node: IPreviewNode) => {
    try {
      const config = JSON.stringify(node, null, 2)
      navigator.clipboard.writeText(config)
      message.success('节点配置已复制到剪贴板')
    } catch (error) {
      message.error('复制失败')
    }
  }

  // 导出节点列表
  const exportNodes = () => {
    try {
      const data = JSON.stringify(filteredNodes.value, null, 2)
      const blob = new Blob([data], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `nodes-${subscription.value?.name || 'export'}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      message.success('节点列表已导出')
    } catch (error) {
      message.error('导出失败')
    }
  }

  // 重置状态
  const reset = () => {
    loading.value = false
    showModal.value = false
    subscription.value = null
    nodes.value = []
    error.value = null
    filters.value = {
      enabled: true,
      search: '',
      type: ''
    }
  }

  return {
    // 状态
    loading: isLoading,
    showModal,
    subscription,
    nodes,
    error,
    hasError,
    hasNodes,

    // 过滤器
    filters,
    filteredNodes,
    nodeTypeOptions,

    // 统计信息
    stats,

    // 方法
    clearError,
    setError,
    fetchSubscriptionNodes,
    openPreview,
    closePreview,
    updateFilters,
    refreshNodes,
    copyNodeConfig,
    exportNodes,
    reset
  }
}