/**
 * 订阅批量操作相关的功能
 */

import { ref, computed } from 'vue'
import { useMessage, useDialog } from 'naive-ui'
import { useSubscriptionManagement } from './useSubscriptionManagement'
import type { Subscription } from '@/types'
import httpClient from '@/services/http/HttpClient';

export function useSubscriptionBatchActions() {
  const message = useMessage()
  const dialog = useDialog()
  const { subscriptions, handleDeleteSubscription, handleUpdateSubscription } = useSubscriptionManagement()

  // 批量操作状态
  const checkedRowKeys = ref<string[]>([])
  const showMoveToGroupModal = ref(false)
  const moveToGroupId = ref<string | null>(null)
  const moveToGroupLoading = ref(false)

  // 批量导入状态
  const showImportModal = ref(false)
  const importUrls = ref('')
  const importLoading = ref(false)
  const importGroupId = ref<string | undefined>(undefined)

  // 计算属性
  const hasSelected = computed(() => checkedRowKeys.value.length > 0)
  const selectedSubscriptions = computed(() =>
    subscriptions.value.filter(s => checkedRowKeys.value.includes(s.id))
  )

  // 批量删除
  const handleBatchDelete = () => {
    if (!hasSelected.value) {
      message.warning('请先选择要删除的订阅')
      return
    }

    dialog.warning({
      title: '批量删除确认',
      content: `确定要删除选中的 ${checkedRowKeys.value.length} 个订阅吗？此操作不可撤销。`,
      positiveText: '确定删除',
      negativeText: '取消',
      onPositiveClick: async () => {
        try {
          await Promise.all(
            checkedRowKeys.value.map(id => {
              const subscription = subscriptions.value.find(s => s.id === id)
              return subscription ? handleDeleteSubscription(subscription) : Promise.resolve()
            })
          )
          checkedRowKeys.value = []
          message.success('批量删除完成')
        } catch (error) {
          console.error('Batch delete failed:', error)
        }
      }
    })
  }

  // 批量更新
  const handleBatchUpdate = async () => {
    if (!hasSelected.value) {
      message.warning('请先选择要更新的订阅')
      return
    }

    try {
      await Promise.all(
        selectedSubscriptions.value.map(subscription =>
          handleUpdateSubscription(subscription, false)
        )
      )
      message.success('批量更新完成')
    } catch (error) {
      console.error('Batch update failed:', error)
    }
  }

  // 批量导入
  const handleBulkImport = async () => {
    if (!importUrls.value.trim()) {
      message.warning('请输入订阅链接')
      return
    }

    const urls = importUrls.value.split('\n').map(url => url.trim()).filter(url => url)
    if (urls.length === 0) {
      message.warning('请输入有效的订阅链接')
      return
    }

    importLoading.value = true
    try {
      const response = await httpClient.post('/subscriptions/bulk-import', {
        urls,
        group_id: importGroupId.value
      })

      if (response.data && response.data.subscriptions) {
        // 更新本地订阅列表
        subscriptions.value.push(...response.data.subscriptions)
        message.success(`成功导入 ${response.data.subscriptions.length} 个订阅`)

        // 重置表单
        importUrls.value = ''
        importGroupId.value = undefined
        showImportModal.value = false
      }
    } catch (error: any) {
      console.error('Bulk import failed:', error)
      message.error(error.response?.data?.message || '批量导入失败')
    } finally {
      importLoading.value = false
    }
  }

  // 移动到分组
  const handleMoveToGroup = async () => {
    if (!hasSelected.value) {
      message.warning('请先选择要移动的订阅')
      return
    }

    if (!moveToGroupId.value) {
      message.warning('请选择目标分组')
      return
    }

    moveToGroupLoading.value = true
    try {
      await httpClient.post('/subscriptions/move-to-group', {
        subscription_ids: checkedRowKeys.value,
        group_id: moveToGroupId.value
      })

      message.success('移动成功')
      showMoveToGroupModal.value = false
      moveToGroupId.value = null
      checkedRowKeys.value = []

      // 刷新订阅列表
      // await fetchSubscriptions()
    } catch (error: any) {
      console.error('Move to group failed:', error)
      message.error(error.response?.data?.message || '移动失败')
    } finally {
      moveToGroupLoading.value = false
    }
  }

  // 重试失败的订阅
  const handleRetryFailed = async () => {
    const failedSubscriptions = subscriptions.value.filter(s => s.status === 'error')
    if (failedSubscriptions.length === 0) {
      message.warning('没有失败的订阅需要重试')
      return
    }

    try {
      await Promise.all(
        failedSubscriptions.map(subscription =>
          handleUpdateSubscription(subscription, false)
        )
      )
      message.success('重试完成')
    } catch (error) {
      console.error('Retry failed:', error)
    }
  }

  // 清除失败的订阅
  const handleClearFailed = () => {
    const failedSubscriptions = subscriptions.value.filter(s => s.status === 'error')
    if (failedSubscriptions.length === 0) {
      message.warning('没有失败的订阅需要清除')
      return
    }

    dialog.warning({
      title: '清除失败订阅',
      content: `确定要清除 ${failedSubscriptions.length} 个失败的订阅吗？此操作不可撤销。`,
      positiveText: '确定清除',
      negativeText: '取消',
      onPositiveClick: async () => {
        try {
          await Promise.all(
            failedSubscriptions.map(subscription => handleDeleteSubscription(subscription))
          )
          message.success('清除失败订阅完成')
        } catch (error) {
          console.error('Clear failed failed:', error)
        }
      }
    })
  }

  return {
    // 状态
    checkedRowKeys,
    hasSelected,
    selectedSubscriptions,
    showImportModal,
    showMoveToGroupModal,
    moveToGroupId,
    importUrls,
    importGroupId,
    importLoading,
    moveToGroupLoading,

    // 方法
    handleBatchDelete,
    handleBatchUpdate,
    handleBulkImport,
    handleMoveToGroup,
    handleRetryFailed,
    handleClearFailed
  }
}