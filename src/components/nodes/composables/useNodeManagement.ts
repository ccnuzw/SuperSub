/**
 * 节点管理相关的数据和方法
 */

import { ref, computed } from 'vue'
import { useMessage } from 'naive-ui'
import type { INode } from '@/types'
import httpClient from '@/services/http/HttpClient'

export function useNodeManagement() {
  const message = useMessage()

  // 数据状态
  const nodes = ref<INode[]>([])
  const loading = ref(true)
  const checkedRowKeys = ref<string[]>([])

  // 获取节点列表
  const fetchNodes = async () => {
    try {
      loading.value = true
      const response = await httpClient.get('/nodes')
      if (response.success && response.data) {
        // 确保响应数据是数组格式
        const nodesData = Array.isArray(response.data) ? response.data : []
        nodes.value = nodesData
      }
    } catch (error: any) {
      console.error('Failed to fetch nodes:', error)
      message.error(error.message || '获取节点列表失败')
    } finally {
      loading.value = false
    }
  }

  // 保存节点
  const handleSaveNode = async (nodeData: Partial<INode>, editingId?: string) => {
    try {
      let response
      if (editingId) {
        response = await httpClient.put(`/nodes/${editingId}`, nodeData)
        message.success('节点更新成功')
      } else {
        response = await httpClient.post('/nodes', nodeData)
        message.success('节点添加成功')
      }

      if (response.success && response.data) {
        const index = nodes.value.findIndex(n => n.id === editingId)
        if (index !== -1) {
          nodes.value[index] = response.data
        } else {
          nodes.value.push(response.data)
        }
      }

      return response.data
    } catch (error: any) {
      console.error('Save node failed:', error)
      message.error(error.message || '保存失败')
      throw error
    }
  }

  // 删除节点
  const handleDeleteNode = async (node: INode) => {
    try {
      const response = await httpClient.delete(`/nodes/${node.id}`)
      if (response.success) {
        nodes.value = nodes.value.filter(n => n.id !== node.id)
        message.success('节点删除成功')
      } else {
        message.error(response.message || '删除失败')
      }
    } catch (error: any) {
      console.error('Delete node failed:', error)
      message.error(error.message || '删除失败')
      throw error
    }
  }

  // 批量删除节点
  const handleBatchDeleteNodes = async (nodeIds: string[]) => {
    try {
      const response = await httpClient.post('/nodes/batch-delete', { nodeIds })
      if (response.success) {
        nodes.value = nodes.value.filter(n => !nodeIds.includes(n.id))
        message.success(`成功删除 ${nodeIds.length} 个节点`)
        checkedRowKeys.value = []
      } else {
        message.error(response.message || '批量删除失败')
      }
    } catch (error: any) {
      console.error('Batch delete failed:', error)
      message.error(error.message || '批量删除失败')
      throw error
    }
  }

  // 批量操作
  const handleBatchAction = async (action: 'sort' | 'deduplicate' | 'clear', groupId?: string) => {
    try {
      const response = await httpClient.post('/nodes/batch-actions', {
        action,
        groupId
      })

      if (response.success) {
        message.success(response.message || '操作成功')
        await fetchNodes()
      } else {
        message.error(response.message || '操作失败')
      }
    } catch (error: any) {
      console.error('Batch action failed:', error)
      message.error(error.message || '请求失败')
    }
  }

  // 从链接批量导入节点
  const handleBatchImportFromLinks = async (links: string[], groupId?: string) => {
    try {
      const response = await httpClient.post('/nodes/batch-import', {
        links,
        groupId
      })

      if (response.success && response.data) {
        nodes.value.push(...response.data.nodes)
        message.success(`成功导入 ${response.data.nodes.length} 个节点`)
        return response.data
      } else {
        message.error(response.message || '批量导入失败')
        return null
      }
    } catch (error: any) {
      console.error('Batch import failed:', error)
      message.error(error.message || '批量导入失败')
      return null
    }
  }

  // 移动节点到分组
  const handleMoveNodesToGroup = async (nodeIds: string[], groupId: string) => {
    try {
      const response = await httpClient.post('/nodes/move-to-group', {
        nodeIds,
        groupId
      })

      if (response.success) {
        message.success('移动成功')
        checkedRowKeys.value = []
        await fetchNodes()
      } else {
        message.error(response.message || '移动失败')
      }
    } catch (error: any) {
      console.error('Move to group failed:', error)
      message.error(error.message || '移动失败')
      throw error
    }
  }

  // 计算属性
  const selectedNodes = computed(() =>
    nodes.value.filter(node => checkedRowKeys.value.includes(node.id))
  )

  const hasSelected = computed(() => checkedRowKeys.value.length > 0)

  const selectedCount = computed(() => checkedRowKeys.value.length)

  return {
    // 数据
    nodes,
    loading,
    checkedRowKeys,
    selectedNodes,
    hasSelected,
    selectedCount,

    // 方法
    fetchNodes,
    handleSaveNode,
    handleDeleteNode,
    handleBatchDeleteNodes,
    handleBatchAction,
    handleBatchImportFromLinks,
    handleMoveNodesToGroup
  }
}