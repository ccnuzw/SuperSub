/**
 * 节点分组管理业务逻辑层
 * 处理节点分组相关的业务逻辑和状态管理
 */

import { ref, computed, reactive } from 'vue'
import { useMessage, useDialog } from 'naive-ui'
import type { INodeGroup, ICreateGroupDto, IUpdateGroupDto } from '@/types'
import { nodeGroupService } from '@/services/NodeGroupService'

/**
 * 分组管理状态接口
 */
interface IGroupManagementState {
  groups: INodeGroup[]
  selectedGroupId: string | null
  loading: boolean
  error: string | null
  searchQuery: string
  pagination: {
    page: number
    pageSize: number
    total: number
  }
  editingGroup: INodeGroup | null
  showCreateModal: boolean
  showEditModal: boolean
}

/**
 * 节点分组管理Composable
 */
export function useGroupManagement() {
  const message = useMessage()
  const dialog = useDialog()

  // 响应式状态
  const state = reactive<IGroupManagementState>({
    groups: [],
    selectedGroupId: null,
    loading: false,
    error: null,
    searchQuery: '',
    pagination: {
      page: 1,
      pageSize: 50,
      total: 0
    },
    editingGroup: null,
    showCreateModal: false,
    showEditModal: false
  })

  // 计算属性
  const hasGroups = computed(() => state.groups.length > 0)

  const selectedGroup = computed(() =>
    state.groups.find(group => group.id === state.selectedGroupId)
  )

  const filteredGroups = computed(() => {
    let filtered = state.groups

    if (state.searchQuery.trim()) {
      const query = state.searchQuery.toLowerCase()
      filtered = filtered.filter(group =>
        group.name.toLowerCase().includes(query) ||
        (group.description && group.description.toLowerCase().includes(query))
      )
    }

    return filtered
  })

  const groupOptions = computed(() => {
    const options = [{ label: '全部节点', value: '', node_count: state.groups.reduce((sum, group) => sum + group.node_count, 0) }]

    state.groups.forEach(group => {
      options.push({
        label: group.name,
        value: group.id,
        node_count: group.node_count || 0
      })
    })

    return options
  })

  const enabledGroups = computed(() =>
    state.groups.filter(group => group.is_enabled !== false)
  )

  const disabledGroups = computed(() =>
    state.groups.filter(group => group.is_enabled === false)
  )

  /**
   * 获取分组列表
   */
  const fetchGroups = async (refresh = false) => {
    if (refresh) {
      state.groups = []
      state.pagination.page = 1
    }

    try {
      state.loading = true
      state.error = null

      const response = await nodeGroupService.getAllWithNodeCount({
        page: state.pagination.page,
        page_size: state.pagination.pageSize,
        search: state.searchQuery || undefined,
        sort_by: 'sort_order',
        sort_order: 'asc'
      })

      state.groups = response.items || []
      state.pagination.total = response.pagination?.total || 0

    } catch (error: any) {
      state.error = error.message || 'Failed to fetch groups'
      message.error(state.error)
    } finally {
      state.loading = false
    }
  }

  /**
   * 创建分组
   */
  const createGroup = async (groupData: ICreateGroupDto) => {
    try {
      // 检查名称是否重复
      const nameExists = await nodeGroupService.checkNameExists(groupData.name)
      if (nameExists) {
        throw new Error('分组名称已存在')
      }

      const newGroup = await nodeGroupService.create(groupData)
      state.groups.push(newGroup)

      // 根据sort_order排序
      state.groups.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))

      message.success('分组创建成功')
      state.showCreateModal = false

      return newGroup
    } catch (error: any) {
      message.error(error.message || '创建分组失败')
      throw error
    }
  }

  /**
   * 更新分组
   */
  const updateGroup = async (id: string, groupData: IUpdateGroupDto) => {
    try {
      // 检查名称是否重复（排除当前分组）
      if (groupData.name) {
        const nameExists = await nodeGroupService.checkNameExists(groupData.name, id)
        if (nameExists) {
          throw new Error('分组名称已存在')
        }
      }

      const updatedGroup = await nodeGroupService.update(id, groupData)

      // 更新本地状态
      const index = state.groups.findIndex(group => group.id === id)
      if (index !== -1) {
        state.groups[index] = { ...state.groups[index], ...updatedGroup }
      }

      message.success('分组更新成功')
      state.showEditModal = false
      state.editingGroup = null

      return updatedGroup
    } catch (error: any) {
      message.error(error.message || '更新分组失败')
      throw error
    }
  }

  /**
   * 删除分组
   */
  const deleteGroup = async (id: string) => {
    const group = state.groups.find(g => g.id === id)
    if (!group) return

    return new Promise<void>((resolve, reject) => {
      dialog.warning({
        title: '删除分组',
        content: `确定要删除分组"${group.name}"吗？如果分组中还有节点，此操作将失败。`,
        positiveText: '确定删除',
        negativeText: '取消',
        onPositiveClick: async () => {
          try {
            await nodeGroupService.delete(id)
            state.groups = state.groups.filter(g => g.id !== id)

            // 如果删除的是当前选中的分组，清空选择
            if (state.selectedGroupId === id) {
              state.selectedGroupId = null
            }

            message.success('分组删除成功')
            resolve()
          } catch (error: any) {
            message.error(error.message || '删除分组失败')
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
   * 切换分组启用状态
   */
  const toggleGroupEnabled = async (id: string) => {
    try {
      const response = await nodeGroupService.toggleEnabled(id)

      if (response.success) {
        // 更新本地状态
        const index = state.groups.findIndex(group => group.id === id)
        if (index !== -1) {
          state.groups[index] = response.group
        }

        message.success(response.message || '状态切换成功')
      } else {
        throw new Error(response.message || '状态切换失败')
      }
    } catch (error: any) {
      message.error(error.message || '状态切换失败')
      throw error
    }
  }

  /**
   * 更新分组排序
   */
  const updateGroupOrder = async (updates: { id: string; sort_order: number }[]) => {
    try {
      const response = await nodeGroupService.updateOrder(updates)

      if (response.success) {
        // 更新本地状态
        updates.forEach(({ id, sort_order }) => {
          const group = state.groups.find(g => g.id === id)
          if (group) {
            group.sort_order = sort_order
          }
        })

        // 重新排序
        state.groups.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))

        message.success(response.message || '排序更新成功')
      } else {
        throw new Error(response.message || '排序更新失败')
      }
    } catch (error: any) {
      message.error(error.message || '排序更新失败')
      throw error
    }
  }

  /**
   * 搜索分组
   */
  const searchGroups = async (query: string) => {
    try {
      if (!query.trim()) {
        await fetchGroups()
        return
      }

      const groups = await nodeGroupService.searchGroups(query)
      state.groups = groups
    } catch (error: any) {
      message.error(error.message || '搜索失败')
      throw error
    }
  }

  /**
   * 复制分组
   */
  const duplicateGroup = async (id: string, newName: string) => {
    try {
      const duplicatedGroup = await nodeGroupService.duplicateGroup(id, newName)
      state.groups.push(duplicatedGroup)

      // 重新排序
      state.groups.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))

      message.success('分组复制成功')
      return duplicatedGroup
    } catch (error: any) {
      message.error(error.message || '复制分组失败')
      throw error
    }
  }

  /**
   * 获取分组统计信息
   */
  const getGroupStats = async () => {
    try {
      const stats = await nodeGroupService.getGroupStats()
      return stats
    } catch (error: any) {
      message.error(error.message || '获取统计信息失败')
      throw error
    }
  }

  /**
   * 选择管理
   */
  const selectGroup = (groupId: string | null) => {
    state.selectedGroupId = groupId
  }

  const clearSelection = () => {
    state.selectedGroupId = null
  }

  /**
   * 模态框管理
   */
  const showCreateModal = () => {
    state.showCreateModal = true
    state.editingGroup = null
  }

  const showEditModal = (group: INodeGroup) => {
    state.editingGroup = { ...group }
    state.showEditModal = true
  }

  const hideCreateModal = () => {
    state.showCreateModal = false
  }

  const hideEditModal = () => {
    state.showEditModal = false
    state.editingGroup = null
  }

  /**
   * 搜索
   */
  const search = (query: string) => {
    state.searchQuery = query
    state.pagination.page = 1

    if (query.trim()) {
      searchGroups(query)
    } else {
      fetchGroups()
    }
  }

  /**
   * 重置状态
   */
  const reset = () => {
    state.groups = []
    state.selectedGroupId = null
    state.loading = false
    state.error = null
    state.searchQuery = ''
    state.pagination = {
      page: 1,
      pageSize: 50,
      total: 0
    }
    state.editingGroup = null
    state.showCreateModal = false
    state.showEditModal = false
  }

  /**
   * 拖拽排序
   */
  const handleDragSort = async (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return

    const groups = [...state.groups]
    const [movedGroup] = groups.splice(fromIndex, 1)
    groups.splice(toIndex, 0, movedGroup)

    // 生成排序更新
    const updates = groups.map((group, index) => ({
      id: group.id,
      sort_order: index
    }))

    try {
      await updateGroupOrder(updates)
    } catch (error) {
      // 如果更新失败，恢复原始顺序
      console.error('Failed to update group order:', error)
    }
  }

  return {
    // 状态
    state,
    groups: computed(() => state.groups),
    loading: computed(() => state.loading),
    error: computed(() => state.error),
    selectedGroup,
    hasGroups,
    filteredGroups,
    groupOptions,
    enabledGroups,
    disabledGroups,

    // 方法
    fetchGroups,
    createGroup,
    updateGroup,
    deleteGroup,
    toggleGroupEnabled,
    updateGroupOrder,
    searchGroups,
    duplicateGroup,
    getGroupStats,

    // 选择管理
    selectGroup,
    clearSelection,

    // 模态框
    showCreateModal,
    showEditModal,
    hideCreateModal,
    hideEditModal,

    // 搜索
    search,

    // 工具
    reset,
    handleDragSort
  }
}