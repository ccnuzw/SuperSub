import { ref, h } from 'vue'
import { useMessage, useDialog, type MessageReactive } from 'naive-ui'
import { subscriptionsApi } from '@/api/subscriptions'
import type { SubscriptionGroup } from '@/stores/subscriptionGroups'
import type { Ref } from 'vue'

export function useSubscriptionGroups(
    subscriptionGroupStore: any,
    fetchSubscriptions: () => void,
    activeTab: Ref<string>
) {
    const message = useMessage()
    const dialog = useDialog()

    // --- Add Group ---
    const showAddGroupModal = ref(false)
    const addGroupLoading = ref(false)
    const newGroupName = ref('')
    const newGroupDescription = ref('')

    const handleSaveGroup = async () => {
        if (!newGroupName.value.trim()) {
            message.warning('分组名称不能为空')
            return
        }
        addGroupLoading.value = true
        try {
            const response = await subscriptionGroupStore.addGroup(newGroupName.value, newGroupDescription.value)
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

    // --- Edit Group ---
    const showEditGroupModal = ref(false)
    const editGroupLoading = ref(false)
    const editingGroup = ref<SubscriptionGroup | null>(null)
    const editingGroupName = ref('')
    const editingGroupDescription = ref('')

    const openEditGroupModal = (group: SubscriptionGroup) => {
        editingGroup.value = group
        editingGroupName.value = group.name
        editingGroupDescription.value = group.description || ''
        showEditGroupModal.value = true
    }

    const handleUpdateGroup = async () => {
        if (!editingGroup.value || !editingGroupName.value.trim()) {
            message.warning('分组名称不能为空')
            return
        }
        editGroupLoading.value = true
        try {
            const response = await subscriptionGroupStore.updateGroup(editingGroup.value.id, editingGroupName.value, editingGroupDescription.value)
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

    // --- Delete Group ---
    const handleDeleteGroup = (group: SubscriptionGroup) => {
        dialog.warning({
            title: '确认删除',
            content: `确定要删除分组 "${group.name}" 吗？分组下的订阅将变为“未分组”。`,
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
                        fetchSubscriptions()
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
        } catch (err: any) {
            message.error(err.message || '操作失败')
        }
    }

    // --- Move To Group ---
    const showMoveToGroupModal = ref(false)
    const moveToGroupLoading = ref(false)

    const handleMoveToGroup = async (checkedRowKeys: Ref<string[]>, groupId: string | null) => {
        if (checkedRowKeys.value.length === 0) {
            message.warning('请至少选择一个订阅')
            return
        }
        moveToGroupLoading.value = true
        try {
            const response = await subscriptionsApi.batchUpdateGroup({
                subscriptionIds: checkedRowKeys.value,
                groupId: groupId,
            })
            if (response.data.success) {
                message.success('订阅分组更新成功')
                showMoveToGroupModal.value = false
                checkedRowKeys.value = []
                fetchSubscriptions()
            } else {
                message.error(response.data.message || '移动失败')
            }
        } catch (error: any) {
            message.error(error.message || '请求失败')
        } finally {
            moveToGroupLoading.value = false
        }
    }

    // --- Sort Groups ---
    const showSortModal = ref(false)
    const sortLoading = ref(false)
    // sortableGroups is local to modal now (initialized from props)

    const handleSortSave = async (groups: SubscriptionGroup[]) => {
        sortLoading.value = true
        try {
            const groupIds = groups.map(g => g.id)
            await subscriptionGroupStore.updateGroupOrder(groupIds)
            message.success('分组顺序已更新')
            showSortModal.value = false
        } catch (error: any) {
            message.error(error.message || '更新分组顺序失败')
        } finally {
            sortLoading.value = false
        }
    }

    // --- Deduplicate ---
    const handleDeduplicateGroup = (groupId: string, subscriptions: Ref<import('@/types').Subscription[]>) => {
        const subsInGroup = subscriptions.value.filter(s => s.group_id === groupId)
        const urlMap = new Map<string, import('@/types').Subscription[]>()

        subsInGroup.forEach(sub => {
            const existing = urlMap.get(sub.url)
            if (existing) {
                existing.push(sub)
            } else {
                urlMap.set(sub.url, [sub])
            }
        })

        const idsToDelete: string[] = []
        urlMap.forEach(subs => {
            if (subs.length > 1) {
                subs.slice(1).forEach(sub => idsToDelete.push(sub.id))
            }
        })

        if (idsToDelete.length === 0) {
            message.info('该分组内没有发现重复的订阅链接。')
            return
        }

        const totalCount = subsInGroup.length
        const duplicatesCount = idsToDelete.length
        const remainingCount = totalCount - duplicatesCount

        dialog.warning({
            title: '确认去重',
            content: () => h('div', null, [
                h('p', null, `分组内共有 ${totalCount} 条订阅。`),
                h('p', null, `检测到 ${duplicatesCount} 条重复订阅。`),
                h('p', null, `去重后将剩余 ${remainingCount} 条。`),
            ]),
            positiveText: '确定删除',
            negativeText: '取消',
            onPositiveClick: async () => {
                const chunkSize = 50;
                const chunks = [];
                for (let i = 0; i < idsToDelete.length; i += chunkSize) {
                    chunks.push(idsToDelete.slice(i, i + chunkSize));
                }

                try {
                    let hasError = false;
                    for (const chunk of chunks) {
                        const response = await subscriptionsApi.batchDelete(chunk);
                        if (!response.data.success) {
                            hasError = true;
                            message.error(response.data.message || `一批订阅删除失败`);
                            break;
                        }
                    }

                    if (!hasError) {
                        message.success(`成功删除了 ${duplicatesCount} 个重复订阅。`);
                    } else {
                        message.warning('部分重复订阅删除失败，请刷新后重试。');
                    }

                    fetchSubscriptions();
                } catch (err) {
                    message.error('请求失败，请稍后重试');
                }
            }
        })
    }


    return {
        // Add
        showAddGroupModal,
        addGroupLoading,
        newGroupName,
        newGroupDescription,
        handleSaveGroup,
        // Edit
        showEditGroupModal,
        editGroupLoading,
        editingGroupName,
        editingGroupDescription,
        openEditGroupModal,
        handleUpdateGroup,
        // Delete/Toggle
        handleDeleteGroup,
        handleToggleGroup,
        // Move
        showMoveToGroupModal,
        moveToGroupLoading,
        handleMoveToGroup,
        // Sort
        showSortModal,
        sortLoading,
        handleSortSave,
        // Deduplicate
        handleDeduplicateGroup
    }
}
