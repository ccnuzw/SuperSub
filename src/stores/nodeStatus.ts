import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useAuthStore } from './auth'
import { HealthStatus } from '@/types'
import { api } from '@/utils/api'

export const useNodeStatusStore = defineStore('nodeStatus', () => {
  const statuses = ref<Record<string, HealthStatus>>({})
  const loading = ref(false)
  const authStore = useAuthStore()
  // const message = useMessage() // This cannot be called at the top level of a store.

  const getStatusByNodeId = computed(() => {
    return (nodeId: string) => statuses.value[nodeId]
  })

  const fetchStatuses = async () => {
    if (!authStore.token) return

    loading.value = true
    try {
      const response = await api.get('/node-statuses');
      const result = response.data;
      if (result.success && result.data) {
        const newStatuses: Record<string, HealthStatus> = {}
        for (const status of result.data) {
          newStatuses[status.node_id] = status
        }
        statuses.value = newStatuses
      } else {
        // Do not show error message on every fetch, as it can be annoying during polling
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
      const response = await api.post('/nodes/health-check', { nodeIds });
      const result = response.data;
      if (response.status === 200 && result.success) {
        // 立即获取状态以显示测试中的状态
        fetchStatuses();
        // 5秒后获取最终结果
        setTimeout(() => fetchStatuses(), 5000);
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