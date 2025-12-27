import { ref, computed } from 'vue'
import { useMessage, useDialog } from 'naive-ui'
import { useGroupStore } from '@/stores/groups'
import { nodesApi } from '@/api/nodes'

export function useNodeGroups() {
    const message = useMessage()
    const dialog = useDialog()
    const groupStore = useGroupStore()

    // Group Form State (Add/Edit)
    const groupFormVisible = ref(false)
    const groupFormMode = ref<'add' | 'edit'>('add')
    const groupFormName = ref('')
    const groupFormId = ref<string | null>(null)
    const groupFormLoading = ref(false)

    const groupFormTitle = computed(() => groupFormMode.value === 'add' ? '新增分组' : '重命名分组')

    const openAddGroup = () => {
        groupFormMode.value = 'add'
        groupFormName.value = ''
        groupFormId.value = null
        groupFormVisible.value = true
    }

    const openEditGroup = (group: { id: string; name: string }) => {
        groupFormMode.value = 'edit'
        groupFormName.value = group.name
        groupFormId.value = group.id
        groupFormVisible.value = true
    }

    const submitGroupForm = async () => {
        if (!groupFormName.value.trim()) {
            message.warning('分组名称不能为空')
            return
        }
        groupFormLoading.value = true
        try {
            let response
            if (groupFormMode.value === 'add') {
                response = await groupStore.addGroup(groupFormName.value)
            } else {
                if (!groupFormId.value) return
                response = await groupStore.updateGroup(groupFormId.value, groupFormName.value)
            }

            if (response.success) {
                message.success(groupFormMode.value === 'add' ? '分组创建成功' : '分组更新成功')
                groupFormVisible.value = false
            } else {
                message.error(response.message || '操作失败')
            }
        } catch (error: any) {
            message.error(error.message || '操作失败')
        } finally {
            groupFormLoading.value = false
        }
    }

    // Move to Group State
    const moveModalVisible = ref(false)
    const moveModalLoading = ref(false)

    const openMoveModal = () => {
        moveModalVisible.value = true
    }

    const submitMove = async (nodeIds: string[], groupId: string | null, onSuccess?: () => void) => {
        moveModalLoading.value = true
        try {
            const response = await nodesApi.batchUpdateGroup(nodeIds, groupId)
            if (response.data.success) {
                message.success('节点分组更新成功')
                moveModalVisible.value = false
                if (onSuccess) onSuccess()
            } else {
                message.error(response.data.message || '移动失败')
            }
        } catch (error: any) {
            message.error(error.message || '请求失败')
        } finally {
            moveModalLoading.value = false
        }
    }

    // Sort Groups State
    const sortModalVisible = ref(false)
    const sortLoading = ref(false)

    const openSortModal = () => {
        sortModalVisible.value = true
    }

    const submitSort = async (sortedIds: string[]) => {
        sortLoading.value = true
        try {
            await groupStore.updateGroupOrder(sortedIds)
            message.success('分组顺序已更新')
            sortModalVisible.value = false
        } catch (error: any) {
            message.error(error.message || '更新分组顺序失败')
        } finally {
            sortLoading.value = false
        }
    }

    // Standard Actions
    const deleteGroup = (group: { id: string; name: string }, onSuccess?: () => void) => {
        dialog.warning({
            title: '确认删除',
            content: `确定要删除分组 "${group.name}" 吗？分组下的节点将变为“未分组”。`,
            positiveText: '确定',
            negativeText: '取消',
            onPositiveClick: async () => {
                try {
                    const response = await groupStore.deleteGroup(group.id)
                    if (response.success) {
                        message.success('分组删除成功')
                        if (onSuccess) onSuccess()
                    } else {
                        message.error(response.message || '删除失败')
                    }
                } catch (error: any) {
                    message.error(error.message || '删除失败')
                }
            }
        })
    }

    const toggleGroup = async (id: string) => {
        try {
            await groupStore.toggleGroup(id)
        } catch (err: any) {
            message.error(err.message || '操作失败')
        }
    }

    return {
        // Form
        groupFormVisible,
        groupFormName,
        groupFormLoading,
        groupFormTitle,
        openAddGroup,
        openEditGroup,
        submitGroupForm,
        // Move
        moveModalVisible,
        moveModalLoading,
        openMoveModal,
        submitMove,
        // Sort
        sortModalVisible,
        sortLoading,
        openSortModal,
        submitSort,
        // Actions
        deleteGroup,
        toggleGroup
    }
}
