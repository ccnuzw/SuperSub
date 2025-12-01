import { ref, computed } from 'vue'
import { useMessage, useDialog } from 'naive-ui'
import { SubscriptionService } from '@/services/subscriptionService'
import { useSubscriptionGroupStore } from '@/stores/subscriptionGroups'

export function useSubscriptionGroups() {
  const message = useMessage()
  const dialog = useDialog()
  const subscriptionGroupStore = useSubscriptionGroupStore()
  const subscriptionService = new SubscriptionService()

  // UI状态
  const showAddGroupModal = ref(false)
  const showEditGroupModal = ref(false)
  const showSortModal = ref(false)
  const showDropdown = ref(false)
  const dropdownX = ref(0)
  const dropdownY = ref(0)

  // 表单状态
  const newGroupName = ref('')
  const newGroupDescription = ref('')
  const addGroupLoading = ref(false)

  const editingGroup = ref<any>(null)
  const editingGroupName = ref('')
  const editingGroupDescription = ref('')
  const editGroupLoading = ref(false)

  const sortableGroups = ref<any[]>([])
  const sortLoading = ref(false)

  // 活动标签
  const activeTab = ref('all')

  // 计算属性
  const filteredSubscriptions = computed(() => {
    // 这里应该从外部传入subscriptions数组
    // 为了演示，我们使用空数组
    return []
  })

  const groupCounts = computed(() => {
    // 同样需要从外部获取
    return {
      all: 0,
      ungrouped: 0
    }
  })

  // 分组管理方法
  const handleAddGroup = async () => {
    if (!newGroupName.value.trim()) {
      message.warning('分组名称不能为空')
      return
    }

    addGroupLoading.value = true
    try {
      const response = await subscriptionGroupStore.addGroup(
        newGroupName.value,
        newGroupDescription.value
      )
      if (response.success) {
        message.success('分组创建成功')
        showAddGroupModal.value = false
        newGroupName.value = ''
        newGroupDescription.value = ''
      } else {
        message.error(response.message || '创建失败')
      }
    } catch (error: any) {
      message.error(error.message || '创建失败')
    } finally {
      addGroupLoading.value = false
    }
  }

  const handleEditGroup = async () => {
    if (!editingGroup.value || !editingGroupName.value.trim()) {
      message.warning('分组名称不能为空')
      return
    }

    editGroupLoading.value = true
    try {
      const response = await subscriptionGroupStore.updateGroup(
        editingGroup.value.id,
        editingGroupName.value,
        editingGroupDescription.value
      )
      if (response.success) {
        message.success('分组更新成功')
        showEditGroupModal.value = false
      } else {
        message.error(response.message || '更新失败')
      }
    } catch (error: any) {
      message.error(error.message || '更新失败')
    } finally {
      editGroupLoading.value = false
    }
  }

  const handleDeleteGroup = (group: any) => {
    dialog.warning({
      title: '确认删除',
      content: `确定要删除分组 "${group.name}" 吗？分组下的订阅将变为"未分组"。`,
      positiveText: '确定',
      negativeText: '取消',
      onPositiveClick: async () => {
        try {
          const response = await subscriptionGroupStore.deleteGroup(group.id)
          if (response.success) {
            message.success('分组删除成功')
            if (activeTab.value === group.id) {
              activeTab.value = 'all'
            }
          } else {
            message.error(response.message || '删除失败')
          }
        } catch (error: any) {
          message.error(error.message || '删除失败')
        }
      }
    })
  }

  const handleToggleGroup = async (groupId: string) => {
    try {
      await subscriptionGroupStore.toggleGroup(groupId)
    } catch (error: any) {
      message.error(error.message || '操作失败')
    }
  }

  // 排序相关
  const openSortModal = async () => {
    try {
      await subscriptionGroupStore.fetchGroups()
      sortableGroups.value = [...subscriptionGroupStore.groups]
      showSortModal.value = true
    } catch (error: any) {
      message.error('获取分组数据失败')
    }
  }

  const handleSortSave = async () => {
    sortLoading.value = true
    try {
      const groupIds = sortableGroups.value.map(g => g.id)
      await subscriptionGroupStore.updateGroupOrder(groupIds)
      message.success('分组顺序已更新')
      showSortModal.value = false
    } catch (error: any) {
      message.error(error.message || '更新分组顺序失败')
    } finally {
      sortLoading.value = false
    }
  }

  // 导出功能
  const exportData = ref({
    urls: '',
    count: 0,
    groupName: ''
  })

  const handleExportGroup = (groupId: string, subscriptions: any[]) => {
    const group = subscriptionGroupStore.groups.find(g => g.id === groupId)
    const subsInGroup = subscriptions.filter(s => s.group_id === groupId)

    if (subsInGroup.length === 0) {
      message.warning('该分组下没有订阅可导出')
      return
    }

    exportData.value.urls = subsInGroup.map(s => s.url).join('\n')
    exportData.value.count = subsInGroup.length
    exportData.value.groupName = group?.name || '该分组'
    // 这里应该显示导出模态框
  }

  const handleCopyExportUrls = () => {
    if (!exportData.value.urls) {
      message.warning('没有内容可复制')
      return
    }
    navigator.clipboard.writeText(exportData.value.urls).then(() => {
      message.success('已成功复制到剪贴板')
    }).catch(() => {
      message.error('复制失败')
    })
  }

  // 右键菜单
  const activeDropdownGroup = ref<any>(null)

  const handleGroupMenuClick = (group: any, event: MouseEvent) => {
    showDropdown.value = true
    dropdownX.value = event.clientX
    dropdownY.value = event.clientY
    activeDropdownGroup.value = group
  }

  const handleGroupAction = (key: string) => {
    showDropdown.value = false
    const group = activeDropdownGroup.value
    if (!group) return

    switch (key) {
      case 'update-group':
        message.info(`开始更新分组 [${group.name}] 的订阅`)
        // TODO: 实现分组更新功能
        break
      case 'deduplicate-group':
        message.info(`开始对分组 [${group.name}] 进行去重`)
        // TODO: 实现去重功能
        break
      case 'export-group':
        message.info(`开始导出分组 [${group.name}] 的订阅`)
        // TODO: 调用导出功能，需要传入订阅数据
        break
      case 'group-rules':
        message.info(`开始管理分组 [${group.name}] 的规则`)
        // TODO: 实现分组规则管理
        break
      case 'batch-replace-group':
        message.info(`开始批量替换分组 [${group.name}] 的订阅`)
        // TODO: 实现批量替换功能
        break
      case 'rename':
      case 'edit':
        editingGroup.value = group
        editingGroupName.value = group.name
        editingGroupDescription.value = group.description || ''
        showEditGroupModal.value = true
        break
      case 'toggle':
        handleToggleGroup(group.id)
        break
      case 'delete':
        handleDeleteGroup(group)
        break
    }
  }

  const getDropdownOptions = (group: any) => {
    return [
      { label: '更新本组', key: 'update-group' },
      { label: '一键去重', key: 'deduplicate-group' },
      { label: '导出订阅', key: 'export-group' },
      { label: '分组规则', key: 'group-rules' },
      { type: 'divider' },
      { label: '批量替换', key: 'batch-replace-group' },
      { label: '标签编辑', key: 'rename' },
      { label: group.is_enabled ? '禁用' : '启用', key: 'toggle' },
      { type: 'divider' },
      { label: '删除', key: 'delete', props: { style: 'color: red' } }
    ]
  }

  // Tab点击处理
  const handleTabClick = (group: any, event: MouseEvent) => {
    const target = event.target as HTMLElement
    if (target.closest('.group-actions-button')) {
      return // 如果点击的是菜单按钮，不执行标签切换逻辑
    } else {
      activeTab.value = group.id
    }
  }

  return {
    // 状态
    showAddGroupModal,
    showEditGroupModal,
    showSortModal,
    showDropdown,
    dropdownX,
    dropdownY,
    activeTab,
    activeDropdownGroup,

    // 表单数据
    newGroupName,
    newGroupDescription,
    addGroupLoading,
    editingGroup,
    editingGroupName,
    editingGroupDescription,
    editGroupLoading,
    sortableGroups,
    sortLoading,

    // 计算属性
    filteredSubscriptions,
    groupCounts,

    // 方法
    handleAddGroup,
    handleEditGroup,
    handleDeleteGroup,
    handleToggleGroup,
    openSortModal,
    handleSortSave,
    handleExportGroup,
    handleCopyExportUrls,
    handleGroupMenuClick,
    handleGroupAction,
    handleTabClick,

    // 工具
    getDropdownOptions,
    exportData
  }
}