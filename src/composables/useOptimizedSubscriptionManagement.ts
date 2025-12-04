/**
 * 优化后的订阅管理 Composable
 * 集成了缓存、错误处理、性能优化和新的工具函数
 */

import { ref, computed, reactive, readonly, watch, onUnmounted, nextTick } from 'vue'
import { useMessage, useDialog } from 'naive-ui'
import type {
  Subscription,
  SubscriptionFormData,
  SubscriptionUIState,
  SubscriptionOperationState,
  SubscriptionFilterOptions,
  BatchUpdateConfig,
  SubscriptionUpdateLog,
  SubscriptionPreviewData,
  BatchImportData,
  SubscriptionStats
} from '@/types/subscription'

import {
  advancedSubscriptionService,
  subscriptionService
} from '@/services/advancedSubscriptionService'

import {
  SubscriptionStatus,
  filterSubscriptions,
  sortSubscriptions,
  calculateSubscriptionStats,
  getSubscriptionStatus,
  getSubscriptionStatusTag
} from '@/utils/subscriptionUtils'

import {
  errorHandler,
  useErrorHandler
} from '@/utils/errorHandler'

import { createSuccessResponse } from '@/utils/apiResponse'

export function useOptimizedSubscriptionManagement() {
  // 基础状态
  const subscriptions = ref<Subscription[]>([])
  const loading = ref(false)
  const initialLoading = ref(true)
  const error = ref<string | null>(null)

  // UI状态
  const uiState = reactive<SubscriptionUIState>({
    loading: false,
    saving: false,
    showModal: false,
    showPreviewModal: false,
    showUpdateModal: false,
    updatingIds: new Set<string>(),
    checkedRowKeys: []
  })

  // 操作状态
  const operationState = reactive<SubscriptionOperationState>({
    editingSubscription: null,
    previewData: null,
    previewLoading: false,
    showBatchModal: false,
    batchLoading: false,
    showGroupModal: false,
    groupLoading: false
  })

  // 表单状态
  const formState = ref<SubscriptionFormData>({
    id: '',
    name: '',
    url: '',
    group_id: undefined,
    enabled: true
  })

  // 过滤状态
  const filterOptions = ref<SubscriptionFilterOptions>({})

  // 分页状态
  const pagination = ref({
    page: 1,
    pageSize: 20,
    total: 0,
    pageSizeOptions: [10, 20, 50, 100]
  })

  // 排序状态
  const sortState = ref({
    sortBy: 'name' as string,
    sortOrder: 'asc' as 'asc' | 'desc'
  })

  // 自动刷新配置
  const autoRefresh = ref({
    enabled: false,
    interval: 30000, // 30秒
    timer: null as NodeJS.Timeout | null
  })

  // 搜索状态
  const searchTerm = ref('')
  const searchDebounceTimer = ref<NodeJS.Timeout | null>(null)

  // 响应式工具
  const message = useMessage()
  const dialog = useDialog()
  const { handleError, clearErrors, hasErrors } = useErrorHandler()

  // 计算属性
  const modalTitle = computed(() =>
    operationState.editingSubscription ? '编辑订阅' : '新增订阅'
  )

  const filteredSubscriptions = computed(() => {
    let filtered = subscriptions.value

    // 应用搜索过滤
    if (searchTerm.value) {
      filterOptions.value.searchTerm = searchTerm.value
    }

    // 应用过滤选项
    filtered = filterSubscriptions(filtered, filterOptions.value)

    // 应用排序
    filtered = sortSubscriptions(
      filtered,
      sortState.value.sortBy,
      sortState.value.sortOrder
    )

    // 更新分页总数
    pagination.value.total = filtered.length

    // 应用分页
    const start = (pagination.value.page - 1) * pagination.value.pageSize
    const end = start + pagination.value.pageSize
    return filtered.slice(start, end)
  })

  const stats = computed(() => {
    return calculateSubscriptionStats(subscriptions.value)
  })

  const selectedSubscriptions = computed(() => {
    return subscriptions.value.filter(s => uiState.checkedRowKeys.includes(s.id))
  })

  const hasSelection = computed(() => uiState.checkedRowKeys.length > 0)

  const allSelected = computed(() => {
    return filteredSubscriptions.value.length > 0 &&
           uiState.checkedRowKeys.length === filteredSubscriptions.value.length
  })

  const isIndeterminate = computed(() => {
    return uiState.checkedRowKeys.length > 0 &&
           uiState.checkedRowKeys.length < filteredSubscriptions.value.length
  })

  // 方法定义

  /**
   * 获取订阅列表
   */
  const fetchSubscriptions = async (options: {
    forceRefresh?: boolean
    showLoading?: boolean
  } = {}) => {
    const { forceRefresh = false, showLoading = true } = options

    if (showLoading) {
      loading.value = true
    }

    error.value = null

    try {
      const data = await subscriptionService.getAll({ forceRefresh })
      subscriptions.value = data

      if (initialLoading.value) {
        initialLoading.value = false
      }

    } catch (err: any) {
      const subscriptionError = handleError(err, 'fetchSubscriptions')
      error.value = subscriptionError.message
      message.error(error.value)
    } finally {
      loading.value = false
    }
  }

  /**
   * 创建或更新订阅
   */
  const saveSubscription = async (data: SubscriptionFormData) => {
    uiState.saving = true

    try {
      let savedSubscription: Subscription

      if (data.id) {
        // 更新现有订阅
        savedSubscription = await subscriptionService.update(data.id, data)
        message.success('订阅更新成功')
      } else {
        // 创建新订阅
        savedSubscription = await subscriptionService.create(data)
        message.success('订阅创建成功')
      }

      // 更新本地数据
      if (data.id) {
        const index = subscriptions.value.findIndex(s => s.id === data.id)
        if (index !== -1) {
          subscriptions.value[index] = savedSubscription
        }
      } else {
        subscriptions.value.unshift(savedSubscription)
      }

      closeModal()
      return savedSubscription

    } catch (err: any) {
      const subscriptionError = handleError(err, 'saveSubscription')
      message.error(subscriptionError.message)
      throw err
    } finally {
      uiState.saving = false
    }
  }

  /**
   * 删除订阅
   */
  const deleteSubscription = async (subscription: Subscription) => {
    return new Promise<void>((resolve, reject) => {
      dialog.warning({
        title: '确认删除',
        content: `确定要删除订阅"${subscription.name}"吗？此操作不可恢复。`,
        positiveText: '确定删除',
        negativeText: '取消',
        onPositiveClick: async () => {
          try {
            await subscriptionService.delete(subscription.id)

            // 从本地数据中移除
            const index = subscriptions.value.findIndex(s => s.id === subscription.id)
            if (index !== -1) {
              subscriptions.value.splice(index, 1)
            }

            message.success('订阅删除成功')
            resolve()
          } catch (err: any) {
            const subscriptionError = handleError(err, 'deleteSubscription')
            message.error(subscriptionError.message)
            reject(err)
          }
        }
      })
    })
  }

  /**
   * 批量删除订阅
   */
  const batchDeleteSubscriptions = async (ids: string[]) => {
    if (ids.length === 0) {
      message.warning('请选择要删除的订阅')
      return
    }

    return new Promise<void>((resolve, reject) => {
      dialog.warning({
        title: '确认批量删除',
        content: `确定要删除选中的 ${ids.length} 个订阅吗？此操作不可恢复。`,
        positiveText: '确定删除',
        negativeText: '取消',
        onPositiveClick: async () => {
          try {
            await subscriptionService.batchDelete(ids)

            // 从本地数据中移除
            subscriptions.value = subscriptions.value.filter(
              s => !ids.includes(s.id)
            )

            // 清除选择
            uiState.checkedRowKeys = []

            message.success(`成功删除 ${ids.length} 个订阅`)
            resolve()
          } catch (err: any) {
            const subscriptionError = handleError(err, 'batchDeleteSubscriptions')
            message.error(subscriptionError.message)
            reject(err)
          }
        }
      })
    })
  }

  /**
   * 更新订阅内容
   */
  const updateSubscriptionContent = async (id: string) => {
    uiState.updatingIds.add(id)

    try {
      const updatedSubscription = await subscriptionService.updateContent(id)

      // 更新本地数据
      const index = subscriptions.value.findIndex(s => s.id === id)
      if (index !== -1) {
        subscriptions.value[index] = updatedSubscription
      }

      message.success(`订阅"${updatedSubscription.name}"更新成功`)
      return updatedSubscription

    } catch (err: any) {
      const subscriptionError = handleError(err, 'updateSubscriptionContent')
      message.error(subscriptionError.message)
      throw err
    } finally {
      uiState.updatingIds.delete(id)
    }
  }

  /**
   * 批量更新订阅
   */
  const batchUpdateSubscriptions = async (ids: string[], config: BatchUpdateConfig) => {
    if (ids.length === 0) {
      message.warning('请选择要更新的订阅')
      return
    }

    operationState.showBatchModal = true

    try {
      const logs = await subscriptionService.batchUpdate(ids, config)

      // 更新本地数据（需要重新获取）
      await fetchSubscriptions({ forceRefresh: true, showLoading: false })

      const success = logs.filter(log => log.status === 'success').length
      const failed = logs.filter(log => log.status === 'failed').length

      if (failed === 0) {
        message.success(`所有 ${success} 个订阅更新成功`)
      } else {
        message.warning(`${success} 个订阅更新成功，${failed} 个更新失败`)
      }

      return logs

    } catch (err: any) {
      const subscriptionError = handleError(err, 'batchUpdateSubscriptions')
      message.error(subscriptionError.message)
      throw err
    } finally {
      operationState.showBatchModal = false
      uiState.checkedRowKeys = []
    }
  }

  /**
   * 预览订阅
   */
  const previewSubscription = async (id: string, applyRules = true) => {
    operationState.previewLoading = true
    operationState.previewData = null

    try {
      const previewData = await subscriptionService.preview(id, { applyRules })
      operationState.previewData = previewData

      if (previewData.error) {
        message.error('预览失败：' + previewData.error)
      } else {
        message.success(`获取到 ${previewData.nodes?.length || 0} 个节点`)
      }

      return previewData

    } catch (err: any) {
      const subscriptionError = handleError(err, 'previewSubscription')
      message.error(subscriptionError.message)
      operationState.previewData = { error: subscriptionError.message }
      throw err
    } finally {
      operationState.previewLoading = false
    }
  }

  /**
   * 打开编辑模态框
   */
  const openModal = (subscription?: Subscription) => {
    if (subscription) {
      operationState.editingSubscription = subscription
      formState.value = {
        id: subscription.id,
        name: subscription.name,
        url: subscription.url,
        group_id: subscription.group_id,
        enabled: subscription.enabled
      }
    } else {
      operationState.editingSubscription = null
      formState.value = {
        id: '',
        name: '',
        url: '',
        group_id: undefined,
        enabled: true
      }
    }
    uiState.showModal = true
  }

  /**
   * 关闭模态框
   */
  const closeModal = () => {
    uiState.showModal = false
    operationState.editingSubscription = null
    // 清除表单错误
    clearErrors()
  }

  /**
   * 打开预览模态框
   */
  const openPreviewModal = (subscription: Subscription) => {
    operationState.editingSubscription = subscription
    uiState.showPreviewModal = true
  }

  /**
   * 搜索处理（带防抖）
   */
  const handleSearch = (term: string) => {
    if (searchDebounceTimer.value) {
      clearTimeout(searchDebounceTimer.value)
    }

    searchDebounceTimer.value = setTimeout(() => {
      searchTerm.value = term
      pagination.value.page = 1 // 重置到第一页
    }, 300)
  }

  /**
   * 处理选择变化
   */
  const handleSelectionChange = (keys: string[]) => {
    uiState.checkedRowKeys = keys
  }

  /**
   * 全选/取消全选
   */
  const toggleSelectAll = () => {
    if (allSelected.value) {
      uiState.checkedRowKeys = []
    } else {
      uiState.checkedRowKeys = filteredSubscriptions.value.map(s => s.id)
    }
  }

  /**
   * 分页处理
   */
  const handlePageChange = (page: number) => {
    pagination.value.page = page
  }

  const handlePageSizeChange = (pageSize: number) => {
    pagination.value.pageSize = pageSize
    pagination.value.page = 1
  }

  /**
   * 排序处理
   */
  const handleSortChange = (column: { key: string; order: 'asc' | 'desc' | null }) => {
    if (column.order) {
      sortState.value.sortBy = column.key
      sortState.value.sortOrder = column.order
    }
  }

  /**
   * 启动自动刷新
   */
  const startAutoRefresh = () => {
    if (autoRefresh.value.timer) {
      clearInterval(autoRefresh.value.timer)
    }

    autoRefresh.value.timer = setInterval(() => {
      fetchSubscriptions({ forceRefresh: true, showLoading: false })
    }, autoRefresh.value.interval)
  }

  /**
   * 停止自动刷新
   */
  const stopAutoRefresh = () => {
    if (autoRefresh.value.timer) {
      clearInterval(autoRefresh.value.timer)
      autoRefresh.value.timer = null
    }
  }

  /**
   * 切换自动刷新
   */
  const toggleAutoRefresh = () => {
    autoRefresh.value.enabled = !autoRefresh.value.enabled
    if (autoRefresh.value.enabled) {
      startAutoRefresh()
    } else {
      stopAutoRefresh()
    }
  }

  /**
   * 批量导入
   */
  const batchImport = async (data: BatchImportData) => {
    try {
      const result = await subscriptionService.batchImport(data)

      await fetchSubscriptions({ forceRefresh: true, showLoading: false })

      if (result.errors.length === 0) {
        message.success(`成功导入 ${result.created + result.updated} 个订阅`)
      } else {
        message.warning(
          `成功导入 ${result.created + result.updated} 个订阅，` +
          `跳过 ${result.skipped} 个，失败 ${result.errors.length} 个`
        )
      }

      return result

    } catch (err: any) {
      const subscriptionError = handleError(err, 'batchImport')
      message.error(subscriptionError.message)
      throw err
    }
  }

  /**
   * 清除缓存
   */
  const clearCache = () => {
    subscriptionService.clearCache()
    message.success('缓存已清除')
  }

  /**
   * 获取缓存信息
   */
  const getCacheInfo = () => {
    return subscriptionService.getCacheInfo()
  }

  // 监听器
  watch(
    () => filterOptions.value,
    () => {
      pagination.value.page = 1
    },
    { deep: true }
  )

  // 生命周期
  onUnmounted(() => {
    stopAutoRefresh()
    if (searchDebounceTimer.value) {
      clearTimeout(searchDebounceTimer.value)
    }
  })

  // 初始加载
  const initialize = async () => {
    await fetchSubscriptions()

    // 如果设置了自动刷新，启动它
    if (autoRefresh.value.enabled) {
      startAutoRefresh()
    }
  }

  return {
    // 状态
    subscriptions: readonly(subscriptions),
    loading: readonly(loading),
    initialLoading: readonly(initialLoading),
    error: readonly(error),
    uiState: readonly(uiState),
    operationState: readonly(operationState),
    formState: readonly(formState),
    filterOptions: readonly(filterOptions),
    pagination: readonly(pagination),
    sortState: readonly(sortState),
    autoRefresh: readonly(autoRefresh),
    searchTerm: readonly(searchTerm),

    // 计算属性
    modalTitle,
    filteredSubscriptions,
    stats,
    selectedSubscriptions,
    hasSelection,
    allSelected,
    isIndeterminate,

    // 方法
    fetchSubscriptions,
    saveSubscription,
    deleteSubscription,
    batchDeleteSubscriptions,
    updateSubscriptionContent,
    batchUpdateSubscriptions,
    previewSubscription,
    openModal,
    closeModal,
    openPreviewModal,
    handleSearch,
    handleSelectionChange,
    toggleSelectAll,
    handlePageChange,
    handlePageSizeChange,
    handleSortChange,
    startAutoRefresh,
    stopAutoRefresh,
    toggleAutoRefresh,
    batchImport,
    clearCache,
    getCacheInfo,
    initialize,

    // 工具函数
    getSubscriptionStatus,
    getSubscriptionStatusTag,

    // 错误处理
    hasErrors,
    clearErrors
  }
}