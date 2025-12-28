import { ref, computed } from 'vue'
import { useDialog } from 'naive-ui'
import { useNotification } from '@/composables/useNotification'
import { useGroupStore } from '@/stores/groups'
import { nodesApi } from '@/api/nodes'

export function useNodeGroups() {
    const notify = useNotification()
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
            notify.preset.validationError('分组名称不能为空')
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
                notify.actionSuccess.action('分组', groupFormMode.value === 'add' ? 'create' : 'update')
                groupFormVisible.value = false
            } else {
                notify.error(response.message || '操作失败')
            }
        } catch (error: any) {
            notify.actionError.network(error.message)
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
                notify.success(`已将 ${nodeIds.length} 个节点移动到新分组`)
                moveModalVisible.value = false
                if (onSuccess) onSuccess()
            } else {
                notify.error(response.data.message || '移动失败')
            }
        } catch (error: any) {
            notify.actionError.network(error.message)
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
            notify.success('分组顺序已更新')
            sortModalVisible.value = false
        } catch (error: any) {
            notify.error(error.message || '更新分组顺序失败')
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
                        notify.actionSuccess.delete('分组')
                        if (onSuccess) onSuccess()
                    } else {
                        notify.actionError.delete('分组', response.message)
                    }
                } catch (error: any) {
                    notify.actionError.network(error.message)
                }
            }
        })
    }

    const toggleGroup = async (id: string) => {
        try {
            await groupStore.toggleGroup(id)
        } catch (err: any) {
            notify.error(err.message || '操作失败')
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
