/**
 * 节点管理业务逻辑层
 * 处理节点相关的业务逻辑和状态管理
 */

import { ref, computed, reactive } from 'vue'
import { useMessage, useDialog } from 'naive-ui'
import type { INode, INodeGroup, ICreateNodeDto, IUpdateNodeDto, IBatchNodeOperation } from '@/types'
import { nodeService } from '@/services/NodeService'
import { nodeGroupService } from '@/services/NodeGroupService'
import { useNodeStatusStore } from '@/stores/nodeStatus'

/**
 * 节点管理状态接口
 */
interface INodeManagementState {
  nodes: INode[]
  selectedNodeIds: Set<string>
  loading: boolean
  error: string | null
  searchQuery: string
  currentGroupId: string | null
  pagination: {
    page: number
    pageSize: number
    total: number
  }
  filters: {
    protocol: string[]
    status: string[]
    region: string[]
  }
}

/**
 * 节点管理Composable
 */
export function useNodeManagement() {
  const message = useMessage()
  const dialog = useDialog()
  const nodeStatusStore = useNodeStatusStore()

  // 响应式状态
  const state = reactive<INodeManagementState>({
    nodes: [],
    selectedNodeIds: new Set(),
    loading: false,
    error: null,
    searchQuery: '',
    currentGroupId: null,
    pagination: {
      page: 1,
      pageSize: 20,
      total: 0
    },
    filters: {
      protocol: [],
      status: [],
      region: []
    }
  })

  // 节点测试状态
  const testingNodeIds = ref<Set<string>>(new Set())

  // 计算属性
  const hasNodes = computed(() => state.nodes.length > 0)

  const selectedNodes = computed(() =>
    state.nodes.filter(node => state.selectedNodeIds.has(node.id))
  )

  const hasSelection = computed(() => state.selectedNodeIds.size > 0)

  const selectionCount = computed(() => state.selectedNodeIds.size)

  const filteredNodes = computed(() => {
    let filtered = state.nodes

    // 搜索过滤
    if (state.searchQuery.trim()) {
      const query = state.searchQuery.toLowerCase()
      filtered = filtered.filter(node =>
        node.name.toLowerCase().includes(query) ||
        node.server.toLowerCase().includes(query) ||
        (node.region && node.region.toLowerCase().includes(query))
      )
    }

    // 分组过滤
    if (state.currentGroupId) {
      filtered = filtered.filter(node => node.group_id === state.currentGroupId)
    }

    // 协议过滤
    if (state.filters.protocol.length > 0) {
      filtered = filtered.filter(node =>
        state.filters.protocol.includes(node.protocol)
      )
    }

    // 状态过滤
    if (state.filters.status.length > 0) {
      filtered = filtered.filter(node =>
        node.status && state.filters.status.includes(node.status)
      )
    }

    // 地区过滤
    if (state.filters.region.length > 0) {
      filtered = filtered.filter(node =>
        node.region && state.filters.region.includes(node.region)
      )
    }

    return filtered
  })

  /**
   * 获取节点列表
   */
  const fetchNodes = async (refresh = false) => {
    if (refresh) {
      state.nodes = []
      state.pagination.page = 1
    }

    try {
      state.loading = true
      state.error = null

      const response = await nodeService.getNodes({
        page: state.pagination.page,
        page_size: state.pagination.pageSize,
        group_id: state.currentGroupId,
        search: state.searchQuery || undefined
      })

      state.nodes = response.items || []
      state.pagination.total = response.pagination?.total || 0

      // 更新节点状态缓存
      nodeStatusStore.updateMultipleStatuses(
        Object.fromEntries(
          state.nodes.map(node => [node.id, {
            node_id: node.id,
            status: node.status as any,
            latency: node.latency,
            last_checked: node.last_checked,
            error: node.error
          }])
        )
      )

    } catch (error: any) {
      state.error = error.message || 'Failed to fetch nodes'
      message.error(state.error)
    } finally {
      state.loading = false
    }
  }

  /**
   * 获取分组节点数据
   */
  const fetchGroupedNodes = async () => {
    try {
      state.loading = true
      state.error = null

      const response = await nodeService.getGroupedNodes()
      state.nodes = response.nodes || []

    } catch (error: any) {
      state.error = error.message || 'Failed to fetch grouped nodes'
      message.error(state.error)
    } finally {
      state.loading = false
    }
  }

  /**
   * 创建节点
   */
  const createNode = async (nodeData: ICreateNodeDto) => {
    try {
      const newNode = await nodeService.create(nodeData)
      state.nodes.unshift(newNode)
      message.success('节点创建成功')
      return newNode
    } catch (error: any) {
      message.error(error.message || '创建节点失败')
      throw error
    }
  }

  /**
   * 更新节点
   */
  const updateNode = async (id: string, nodeData: IUpdateNodeDto) => {
    try {
      const updatedNode = await nodeService.update(id, nodeData)

      // 更新本地状态
      const index = state.nodes.findIndex(node => node.id === id)
      if (index !== -1) {
        state.nodes[index] = { ...state.nodes[index], ...updatedNode }
      }

      message.success('节点更新成功')
      return updatedNode
    } catch (error: any) {
      message.error(error.message || '更新节点失败')
      throw error
    }
  }

  /**
   * 删除节点
   */
  const deleteNode = async (id: string) => {
    return new Promise<void>((resolve, reject) => {
      dialog.warning({
        title: '删除节点',
        content: '确定要删除这个节点吗？此操作不可撤销。',
        positiveText: '确定删除',
        negativeText: '取消',
        onPositiveClick: async () => {
          try {
            await nodeService.delete(id)
            state.nodes = state.nodes.filter(node => node.id !== id)
            state.selectedNodeIds.delete(id)
            message.success('节点删除成功')
            resolve()
          } catch (error: any) {
            message.error(error.message || '删除节点失败')
            reject(error)
          }
        },
        onNegativeClick: () => {
          reject(new Error('User cancelled'))
        }
      })
    })
  }

  /**
   * 批量删除节点
   */
  const batchDeleteNodes = async (nodeIds: string[]) => {
    if (nodeIds.length === 0) {
      message.warning('请选择要删除的节点')
      return
    }

    return new Promise<void>((resolve, reject) => {
      dialog.warning({
        title: '批量删除节点',
        content: `确定要删除选中的 ${nodeIds.length} 个节点吗？此操作不可撤销。`,
        positiveText: '确定删除',
        negativeText: '取消',
        onPositiveClick: async () => {
          try {
            const response = await nodeService.batchDelete(nodeIds)

            if (response.success) {
              state.nodes = state.nodes.filter(node => !nodeIds.includes(node.id))
              nodeIds.forEach(id => state.selectedNodeIds.delete(id))
              message.success(response.message || `成功删除 ${nodeIds.length} 个节点`)
              resolve()
            } else {
              throw new Error(response.message || '批量删除失败')
            }
          } catch (error: any) {
            message.error(error.message || '批量删除失败')
            reject(error)
          }
        },
        onNegativeClick: () => {
          reject(new Error('User cancelled'))
        }
      })
    })
  }

  /**
   * 节点健康检查
   */
  const healthCheck = async (nodeIds: string[]) => {
    if (nodeIds.length === 0) {
      message.warning('请选择要测试的节点')
      return
    }

    try {
      nodeIds.forEach(id => testingNodeIds.value.add(id))

      const response = await nodeService.healthCheck(nodeIds)

      if (response.success) {
        message.success(response.message)

        // 启动状态轮询
        startStatusPolling(nodeIds)
      }
    } catch (error: any) {
      message.error(error.message || '健康检查失败')
      nodeIds.forEach(id => testingNodeIds.value.delete(id))
    }
  }

  /**
   * 测试单个节点
   */
  const testNode = async (nodeId: string) => {
    try {
      testingNodeIds.value.add(nodeId)
      await healthCheck([nodeId])
    } catch (error: any) {
      testingNodeIds.value.delete(nodeId)
      throw error
    }
  }

  /**
   * 批量操作
   */
  const performBatchOperation = async (operation: IBatchNodeOperation) => {
    if (operation.node_ids.length === 0) {
      message.warning('请选择要操作的节点')
      return
    }

    try {
      state.loading = true

      const response = await nodeService.batchOperation(operation)

      if (response.success) {
        message.success(response.message)

        // 刷新节点列表以反映更改
        await fetchNodes()

        // 清空选择
        operation.node_ids.forEach(id => state.selectedNodeIds.delete(id))
      } else {
        throw new Error(response.message || '批量操作失败')
      }
    } catch (error: any) {
      message.error(error.message || '批量操作失败')
      throw error
    } finally {
      state.loading = false
    }
  }

  /**
   * 移动节点到分组
   */
  const moveToGroup = async (nodeIds: string[], groupId: string | null) => {
    if (nodeIds.length === 0) {
      message.warning('请选择要移动的节点')
      return
    }

    try {
      const response = await nodeService.moveToGroup({
        node_ids: nodeIds,
        group_id: groupId
      })

      if (response.success) {
        message.success(response.message)

        // 更新本地状态
        state.nodes.forEach(node => {
          if (nodeIds.includes(node.id)) {
            node.group_id = groupId
          }
        })

        // 清空选择
        nodeIds.forEach(id => state.selectedNodeIds.delete(id))
      } else {
        throw new Error(response.message || '移动失败')
      }
    } catch (error: any) {
      message.error(error.message || '移动失败')
      throw error
    }
  }

  /**
   * 批量导入节点
   */
  const batchImportNodes = async (links: string[], groupId?: string | null) => {
    if (!links || links.length === 0) {
      message.warning('请提供要导入的节点链接')
      return
    }

    try {
      state.loading = true

      const response = await nodeService.batchImport({
        links,
        group_id: groupId
      })

      if (response.success && response.imported) {
        state.nodes.unshift(...response.imported)
        message.success(`成功导入 ${response.imported.length} 个节点`)
        return response.imported
      } else {
        throw new Error(response.message || '批量导入失败')
      }
    } catch (error: any) {
      message.error(error.message || '批量导入失败')
      throw error
    } finally {
      state.loading = false
    }
  }

  /**
   * 更新节点排序
   */
  const updateNodeOrder = async (updates: { id: string; sort_order: number }[]) => {
    try {
      const response = await nodeService.updateOrder(updates)

      if (response.success) {
        message.success('排序更新成功')
        await fetchNodes()
      }
    } catch (error: any) {
      message.error(error.message || '更新排序失败')
      throw error
    }
  }

  /**
   * 启动状态轮询
   */
  let statusPollingInterval: number | null = null

  const startStatusPolling = (nodeIds: string[]) => {
    if (statusPollingInterval) {
      clearInterval(statusPollingInterval)
    }

    statusPollingInterval = setInterval(async () => {
      try {
        await nodeStatusStore.fetchStatuses(nodeIds)

        // 检查是否还有测试中的节点
        const stillTesting = nodeIds.some(id =>
          testingNodeIds.value.has(id) ||
          nodeStatusStore.getStatusByNodeId(id)?.status === 'testing'
        )

        if (!stillTesting) {
          stopStatusPolling()
          await fetchNodes() // 刷新节点数据
        }
      } catch (error) {
        console.error('Status polling error:', error)
      }
    }, 2000) // 每2秒轮询一次

    // 30秒后自动停止轮询
    setTimeout(() => {
      stopStatusPolling()
    }, 30000)
  }

  const stopStatusPolling = () => {
    if (statusPollingInterval) {
      clearInterval(statusPollingInterval)
      statusPollingInterval = null
    }

    nodeIds.forEach(id => testingNodeIds.value.delete(id))
  }

  /**
   * 选择管理
   */
  const selectNode = (nodeId: string, selected: boolean) => {
    if (selected) {
      state.selectedNodeIds.add(nodeId)
    } else {
      state.selectedNodeIds.delete(nodeId)
    }
  }

  const selectAllNodes = () => {
    filteredNodes.value.forEach(node => state.selectedNodeIds.add(node.id))
  }

  const clearSelection = () => {
    state.selectedNodeIds.clear()
  }

  const toggleAllSelection = () => {
    if (state.selectedNodeIds.size === filteredNodes.value.length) {
      clearSelection()
    } else {
      selectAllNodes()
    }
  }

  /**
   * 过滤器管理
   */
  const updateFilter = (type: keyof typeof state.filters, value: string[]) => {
    state.filters[type] = value
    state.pagination.page = 1 // 重置到第一页
  }

  const clearFilters = () => {
    state.filters = {
      protocol: [],
      status: [],
      region: []
    }
    state.searchQuery = ''
    state.pagination.page = 1
  }

  /**
   * 分组管理
   */
  const setCurrentGroup = (groupId: string | null) => {
    state.currentGroupId = groupId
    state.pagination.page = 1
    clearSelection()
  }

  /**
   * 搜索
   */
  const search = (query: string) => {
    state.searchQuery = query
    state.pagination.page = 1
  }

  /**
   * 重置状态
   */
  const reset = () => {
    state.nodes = []
    state.selectedNodeIds.clear()
    state.loading = false
    state.error = null
    state.searchQuery = ''
    state.currentGroupId = null
    state.pagination = {
      page: 1,
      pageSize: 20,
      total: 0
    }
    state.filters = {
      protocol: [],
      status: [],
      region: []
    }

    stopStatusPolling()
    testingNodeIds.value.clear()
  }

  return {
    // 状态
    state,
    nodes: computed(() => state.nodes),
    loading: computed(() => state.loading),
    error: computed(() => state.error),
    selectedNodes,
    hasSelection,
    selectionCount,
    hasNodes,
    filteredNodes,
    testingNodeIds,

    // 方法
    fetchNodes,
    fetchGroupedNodes,
    createNode,
    updateNode,
    deleteNode,
    batchDeleteNodes,
    healthCheck,
    testNode,
    performBatchOperation,
    moveToGroup,
    batchImportNodes,
    updateNodeOrder,

    // 选择管理
    selectNode,
    selectAllNodes,
    clearSelection,
    toggleAllSelection,

    // 过滤器
    updateFilter,
    clearFilters,

    // 分组
    setCurrentGroup,

    // 搜索
    search,

    // 工具
    reset,
    stopStatusPolling
  }
}