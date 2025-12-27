import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useAuthStore } from './auth'
import { HealthStatus } from '@/types'
import { nodeStatusApi } from '@/api/nodeStatus'

export const useNodeStatusStore = defineStore('nodeStatus', () => {
  const statuses = ref<Record<string, HealthStatus>>({})
  const loading = ref(false)
  const authStore = useAuthStore()

  const getStatusByNodeId = computed(() => {
    return (nodeId: string) => statuses.value[nodeId]
  })

  const fetchStatuses = async () => {
    if (!authStore.token) return

    loading.value = true
    try {
      const response = await nodeStatusApi.fetchStatuses();
      const result = response.data;
      if (result.success && result.data) {
        const newStatuses: Record<string, HealthStatus> = {}
        for (const status of result.data) {
          newStatuses[status.node_id] = status
        }
        statuses.value = newStatuses
      } else {
        console.error('Failed to fetch node statuses:', result.message)
      }
    } catch (err) {
      console.error('Error fetching node statuses:', err)
    } finally {
      loading.value = false
    }
  }

  const checkNodesHealth = async (nodeIds: string[]): Promise<{ success: boolean; message: string }> => {
    if (!authStore.token || nodeIds.length === 0) {
      return { success: false, message: '未选择节点或用户未认证' }
    }

    try {
      const response = await nodeStatusApi.checkHealth(nodeIds);
      const result = response.data;
      if (response.status === 200 && result.success) {
        // Immediately fetch statuses to show 'testing' state
        fetchStatuses();
        // Fetch again after a few seconds to get final results
        setTimeout(() => fetchStatuses(), 3000);
        setTimeout(() => fetchStatuses(), 8000); // And again to catch slower nodes
        return { success: true, message: result.message || '节点健康检查已启动' }
      } else {
        return { success: false, message: result.message || '启动健康检查失败' }
      }
    } catch (err) {
      return { success: false, message: '请求健康检查失败' }
    }
  }


  return {
    statuses,
    loading,
    getStatusByNodeId,
    fetchStatuses,
    checkNodesHealth,
  }
})