/**
 * 订阅管理相关的数据和方法
 */

import { ref, computed } from 'vue'
import { useMessage } from 'naive-ui'
import type { ISubscription } from '@/types'
import { httpClient } from '@/services/http/HttpClient'

export function useSubscriptionManagement() {
  const message = useMessage()

  // 数据状态
  const subscriptions = ref<ISubscription[]>([])
  const loading = ref(true)
  const updatingIds = ref(new Set<string>())

  // 计算属性
  const updatingCount = computed(() => updatingIds.value.size)

  // 获取订阅列表
  const fetchSubscriptions = async () => {
    try {
      loading.value = true
      const response = await httpClient.get('/subscriptions')
      if (response.success && response.data) {
        // 修复: 直接使用response.data，因为后端返回的数据结构就是订阅列表
        subscriptions.value = Array.isArray(response.data) ? response.data : []
      }
    } catch (error) {
      console.error('Failed to fetch subscriptions:', error)
      message.error('获取订阅列表失败')
    } finally {
      loading.value = false
    }
  }

  // 保存订阅
  const handleSaveSubscription = async (subscriptionData: Partial<ISubscription>, editingId?: string) => {
    try {
      let response
      if (editingId) {
        response = await httpClient.put(`/subscriptions/${editingId}`, subscriptionData)
        message.success('订阅更新成功')
      } else {
        response = await httpClient.post('/subscriptions', subscriptionData)
        message.success('订阅添加成功')
      }

      if (response.data) {
        const index = subscriptions.value.findIndex(s => s.id === editingId)
        if (index !== -1) {
          subscriptions.value[index] = response.data
        } else {
          subscriptions.value.push(response.data)
        }
      }

      return response.data
    } catch (error: any) {
      console.error('Save subscription failed:', error)
      message.error(error.response?.data?.message || '保存失败')
      throw error
    }
  }

  // 删除订阅
  const handleDeleteSubscription = async (subscription: ISubscription) => {
    try {
      await httpClient.delete(`/subscriptions/${subscription.id}`)
      subscriptions.value = subscriptions.value.filter(s => s.id !== subscription.id)
      message.success('订阅删除成功')
    } catch (error: any) {
      console.error('Delete subscription failed:', error)
      message.error(error.response?.data?.message || '删除失败')
      throw error
    }
  }

  // 更新订阅
  const handleUpdateSubscription = async (subscription: ISubscription, silent = false, signal?: AbortSignal): Promise<{ success: boolean; data: ISubscription; error?: string }> => {
    try {
      if (!silent) {
        updatingIds.value.add(subscription.id)
      }

      const response = await httpClient.post(`/subscriptions/${subscription.id}/update`, {}, { signal })

      if (response.data && response.data.subscription) {
        // 更新本地数据
        const index = subscriptions.value.findIndex(s => s.id === subscription.id)
        if (index !== -1) {
          subscriptions.value[index] = response.data.subscription
        }

        if (!silent) {
          message.success(`"${subscription.name}" 更新完成`)
        }
        return { success: true, data: response.data.subscription }
      } else {
        throw new Error('更新失败：返回数据格式错误')
      }
    } catch (error: any) {
      console.error('Update subscription failed:', error)
      let errorMsg = error.response?.data?.message || error.message || '更新失败'

      if (error.name === 'CanceledError') {
        errorMsg = '更新已取消'
      }

      if (!silent) {
        message.error(`"${subscription.name}" ${errorMsg}`)
      }

      return { success: false, data: subscription, error: errorMsg }
    } finally {
      if (!silent) {
        updatingIds.value.delete(subscription.id)
      }
    }
  }

  // 批量更新所有订阅
  const handleUpdateAllSubscriptions = async () => {
    if (subscriptions.value.length === 0) {
      message.warning('没有可更新的订阅')
      return
    }

    try {
      const response = await httpClient.post('/subscriptions/update-all')
      if (response.data && response.data.results) {
        response.data.results.forEach((result: any) => {
          const index = subscriptions.value.findIndex(s => s.id === result.subscription.id)
          if (index !== -1) {
            subscriptions.value[index] = result.subscription
          }
        })
        message.success('批量更新完成')
      }
    } catch (error: any) {
      console.error('Batch update failed:', error)
      message.error(error.response?.data?.message || '批量更新失败')
    }
  }

  return {
    // 数据
    subscriptions,
    loading,
    updatingIds,
    updatingCount,

    // 方法
    fetchSubscriptions,
    handleSaveSubscription,
    handleDeleteSubscription,
    handleUpdateSubscription,
    handleUpdateAllSubscriptions
  }
}