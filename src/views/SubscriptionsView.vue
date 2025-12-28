<script setup lang="ts">
import { ref, onMounted, reactive, h, computed, nextTick, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useDialog, NButton, NSpace, NTag, NDataTable, NModal, NForm, NFormItem, NInput, NTooltip, NGrid, NGi, NStatistic, NCard, NSwitch, NSelect, NDynamicTags, NRadioGroup, NRadioButton, NInputGroup, NIcon, NTabs, NTabPane, NDropdown, NProgress, NCollapse, NCollapseItem, NInputNumber, NPagination } from 'naive-ui'
import { useNotification } from '@/composables/useNotification'
import draggable from 'vuedraggable'
import { EyeOutline, FilterOutline, CreateOutline, SyncOutline, TrashOutline as TrashIcon, EllipsisVertical as MoreIcon, SettingsOutline, ReorderFourOutline, AddOutline, EllipsisHorizontal, RefreshOutline as RefreshIcon, CheckmarkCircle as CheckmarkCircleIcon, CloseCircle as CloseCircleIcon } from '@vicons/ionicons5'
import type { DataTableColumns, FormInst, DropdownOption } from 'naive-ui'
import { useIsMobile } from '@/composables/useMediaQuery'
import { Subscription, Node, ApiResponse } from '@/types'
import { subscriptionsApi } from '@/api/subscriptions';
import { subscriptionGroupsApi } from '@/api/subscriptionGroups';

import { useAuthStore } from '@/stores/auth'
import { useSubscriptionGroupStore } from '@/stores/subscriptionGroups'
import { useGroupStore as useNodeGroupStore } from '@/stores/groups'
import SubscriptionNodesPreview from '@/components/SubscriptionNodesPreview.vue'
import ImportModal from '@/components/subscriptions/modals/ImportModal.vue'
import ExportModal from '@/components/subscriptions/modals/ExportModal.vue'
import BatchReplaceModal from '@/components/subscriptions/modals/BatchReplaceModal.vue'
import GroupFormModal from '@/components/subscriptions/modals/GroupFormModal.vue'
import UpdateLogModal from '@/components/subscriptions/modals/UpdateLogModal.vue'
import SubscriptionTable from '@/components/subscriptions/SubscriptionTable.vue'
import { useSubscriptionUpdater } from '@/composables/subscriptions/useSubscriptionUpdater'
import { useSubscriptionGroups } from '@/composables/subscriptions/useSubscriptionGroups'
import { format } from 'date-fns'
import Button from '@/components/ui/Button.vue'
import Card from '@/components/ui/Card.vue'
import Badge from '@/components/ui/Badge.vue'

const router = useRouter()
const notify = useNotification()
const dialog = useDialog()
const isMobile = useIsMobile()
const subscriptionGroupStore = useSubscriptionGroupStore()
const nodeGroupStore = useNodeGroupStore()

const subscriptions = ref<Subscription[]>([])
const loading = ref(true)
const showModal = ref(false)
const saveLoading = ref(false)
const updatingId = ref<string | null>(null)
const editingSubscription = ref<Subscription | null>(null)
const updatingIds = ref(new Set<string>())
const activeTab = ref('all')

// For bulk import
const showImportModal = ref(false)

// For batch actions
const checkedRowKeys = ref<string[]>([])

// For pagination
interface Pagination {
  page: number;
  pageSize: number;
  itemCount: number;
  pageCount: number;
}

const pagination: Pagination = reactive({
  page: 1,
  pageSize: 15,
  itemCount: 0,
  pageCount: computed(() => Math.ceil(pagination.itemCount / pagination.pageSize)),
});

// For dropdown logic
const showDropdown = ref(false)
const dropdownX = ref(0)
const dropdownY = ref(0)
const activeDropdownGroup = ref<import('@/stores/subscriptionGroups').SubscriptionGroup | null>(null)

const {
    showAddGroupModal, addGroupLoading, newGroupName, newGroupDescription, handleSaveGroup,
    showEditGroupModal, editGroupLoading, editingGroupName, editingGroupDescription, openEditGroupModal, handleUpdateGroup,
    handleDeleteGroup, handleToggleGroup,
    showMoveToGroupModal, moveToGroupLoading, handleMoveToGroup: executeMoveToGroup,
    showSortModal, sortLoading, handleSortSave: executeSortSave,
    handleDeduplicateGroup
} = useSubscriptionGroups(subscriptionGroupStore, () => fetchSubscriptions(), activeTab)

// Wrapper handlers to pass args
const handleSortSave = (groups: import('@/stores/subscriptionGroups').SubscriptionGroup[]) => executeSortSave(groups)
const handleMoveToGroup = (groupId: string | null) => executeMoveToGroup(checkedRowKeys, groupId)

// For Export Group Modal
const showExportModal = ref(false)
const exportData = reactive({
  urls: '',
  count: 0,
  groupName: ''
})

// For Batch Replace Modal
const showBatchReplaceModal = ref(false)
const batchReplaceGroupId = ref<string | null>(null)

// For Node Preview in Modal
const showNodePreviewModal = ref(false)
const currentSubscriptionForPreview = ref<Subscription | null>(null)
const nodePreviewRef = ref<{ fetchPreview: () => void } | null>(null)

// Update Logic (Composable)
const {
    showUpdateLogModal,
    updateLogLoading,
    updateStage,
    updateProgress,
    updateLog,
    updateSettings,
    prepareAndShowUpdateModal,
    executeSubscriptionUpdates,
    handleCancelUpdate,
    handleRetryFailed,
    handleClearFailed,
    handleClearExpiring,
    handleUpdateSingle
} = useSubscriptionUpdater((updatedSub) => {
    const index = subscriptions.value.findIndex(s => s.id === updatedSub.id)
    if (index !== -1) subscriptions.value[index] = updatedSub
}, () => {
    fetchSubscriptions()
})

// For Subscription & Group Rules
const showRulesModal = ref(false)
const ruleContext = ref<{ type: 'subscription' | 'group'; id: string; name: string }>({ type: 'subscription', id: '', name: '' })



const formState = reactive({
  id: '',
  name: '',
  url: '',
})

const modalTitle = computed(() => (editingSubscription.value ? '编辑订阅' : '新建订阅'))

const filteredSubscriptions = computed(() => {
  return subscriptions.value.filter(sub => {
    if (activeTab.value === 'all') return true
    if (activeTab.value === 'ungrouped') return !sub.group_id
    return sub.group_id === activeTab.value
  })
})

const paginatedSubscriptions = computed(() => {
  const start = (pagination.page - 1) * pagination.pageSize;
  const end = start + pagination.pageSize;
  return filteredSubscriptions.value.slice(start, end);
});

watch(filteredSubscriptions, (value) => {
  pagination.itemCount = value.length;
  pagination.page = 1; 
});


const groupCounts = computed(() => {
  const counts: { all: number; ungrouped: number; [key: string]: number } = {
    all: subscriptions.value.length,
    ungrouped: 0,
  }
  subscriptions.value.forEach(sub => {
    if (sub.group_id) {
      counts[sub.group_id] = (counts[sub.group_id] || 0) + 1
    } else {
      counts.ungrouped++
    }
  })
  return counts
})

const formatBytes = (bytes: number, decimals = 2) => {
  if (!bytes) return '0 Bytes'; // Handle null/undefined/0 safely
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}




const onPreviewNodes = (row: Subscription) => {
    currentSubscriptionForPreview.value = row
    showNodePreviewModal.value = true
    nextTick(() => {
        nodePreviewRef.value?.fetchPreview()
    })
}

// Placeholder for onManageRules until implemented
const onManageRules = async (row: Subscription) => {
    ruleContext.value = { type: 'subscription', id: row.id, name: row.name }
    showRulesModal.value = true
}

const handleGroupRules = async (group: import('@/stores/subscriptionGroups').SubscriptionGroup) => {
    ruleContext.value = { type: 'group', id: group.id, name: group.name }
    showRulesModal.value = true
}

const openModal = (sub: Subscription | null = null) => {
  if (sub) {
    editingSubscription.value = { ...sub }
    formState.id = sub.id
    formState.name = sub.name
    formState.url = sub.url
  } else {
    editingSubscription.value = null
    formState.id = ''
    formState.name = ''
    formState.url = ''
  }
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
}

const fetchSubscriptions = async () => {
  const authStore = useAuthStore()
  if (!authStore.isAuthenticated) return
  loading.value = true
  try {
    const subsResponse = await subscriptionsApi.fetchSubscriptions()
    if (subsResponse.data.success && subsResponse.data.data) {
      subscriptions.value = subsResponse.data.data
    } else {
      notify.preset.loadFailed('订阅', subsResponse.data.message)
    }
  } catch (err) {
    notify.actionError.network()
  } finally {
    loading.value = false
  }
}

const handleSave = async () => {
  saveLoading.value = true
  try {
    const payload = { name: formState.name, url: formState.url }
    const response = editingSubscription.value
      ? await subscriptionsApi.updateSubscription(editingSubscription.value.id, payload)
      : await subscriptionsApi.addSubscription(payload)
      
    if (response.data.success) {
      notify.actionSuccess.action('订阅', editingSubscription.value ? 'update' : 'create')
      closeModal()
      fetchSubscriptions()
    } else {
      notify.actionError.save('订阅', response.data.message)
    }
  } catch (err) {
    notify.actionError.network()
  } finally {
    saveLoading.value = false
  }
}

const handleDelete = (row: Subscription) => {
  dialog.warning({
    title: '确认删除',
    content: `您确定要删除 "${row.name}" 吗?`,
    positiveText: '删除',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        const response = await subscriptionsApi.deleteSubscription(row.id)
        if (response.data.success) {
          notify.actionSuccess.delete('订阅')
          fetchSubscriptions()
        } else {
          notify.actionError.delete('订阅', response.data.message)
        }
      } catch (err) {
        notify.actionError.network()
      }
    },
  })
}

const handleUpdate = async (row: Subscription, silent = false, signal?: AbortSignal): Promise<{ success: boolean; data: Subscription; error?: string }> => {
  updatingId.value = row.id
  updatingIds.value.add(row.id)
  if (!silent) {
    notify.info(`正在更新「${row.name}」...`)
  }
  try {
    // Delegate to composable
    const result = await handleUpdateSingle(row, silent, signal)
    return result
  } catch (err: any) {
    // Should be handled by handleUpdateSingle, but just incase
     const errorMsg = err.message || '请求失败'
     if (!silent) notify.actionError.action('订阅', 'update', errorMsg)
     return { success: false, data: row, error: errorMsg }
  } finally {
    updatingId.value = null
    updatingIds.value.delete(row.id)
  }
}


const openImportModal = () => {
  showImportModal.value = true
}

const handleBatchDelete = () => {
  if (checkedRowKeys.value.length === 0) {
    notify.preset.validationError('请至少选择一个订阅');
    return;
  }
  dialog.warning({
    title: '确认批量删除',
    content: `您确认要删除这 ${checkedRowKeys.value.length} 个订阅吗?`,
    positiveText: '确认',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        const response = await subscriptionsApi.batchDelete(checkedRowKeys.value);
        if (response.data.success) {
          notify.actionSuccess.delete('订阅', checkedRowKeys.value.length);
          fetchSubscriptions();
          checkedRowKeys.value = [];
        } else {
          notify.actionError.delete('订阅', response.data.message);
        }
      } catch (err) {
        notify.actionError.network();
      }
    }
  });
};

const handleClearCurrentGroup = () => {
  const tab = activeTab.value;
  let groupName = '';
  let subCount = 0;

  if (tab === 'all') {
    groupName = 'All';
    subCount = subscriptions.value.length;
  } else if (tab === 'ungrouped') {
    groupName = 'Ungrouped';
    subCount = groupCounts.value.ungrouped;
  } else {
    const group = subscriptionGroupStore.groups.find(g => g.id === tab);
    if (group) {
      groupName = group.name;
      subCount = groupCounts.value[tab] || 0;
    }
  }

  if (subCount === 0) {
    notify.preset.noData(`「${groupName}」中没有可清理的订阅`);
    return;
  }

  dialog.warning({
    title: '确认清空',
    content: `您确定要删除 "${groupName}" 中的所有 ${subCount} 个订阅吗?`,
    positiveText: '确认清空',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        let response;
        if (tab === 'all') {
          response = await subscriptionsApi.clearAll();
        } else {
          const groupId = tab === 'ungrouped' ? null : tab;
          response = await subscriptionsApi.clearByGroup(groupId);
        }

        if (response.data.success) {
          notify.success(response.data.message || `已清空「${groupName}」中的 ${subCount} 个订阅`);
          fetchSubscriptions();
        } else {
          notify.error(response.data.message || '清空失败');
        }
      } catch (err) {
        notify.actionError.network();
      }
    }
  });
};

const handleClearAllFailed = () => {
  const tab = activeTab.value;
  const failedSubs = filteredSubscriptions.value.filter(sub => sub.error);
  
  let groupName = '';
  if (tab === 'all') {
    groupName = 'All';
  } else if (tab === 'ungrouped') {
    groupName = 'Ungrouped';
  } else {
    const group = subscriptionGroupStore.groups.find(g => g.id === tab);
    if (group) {
      groupName = group.name;
    }
  }

  if (failedSubs.length === 0) {
    notify.preset.noData(`「${groupName}」中没有无效订阅`);
    return;
  }

  dialog.warning({
    title: `清理无效订阅`,
    content: `发现 ${failedSubs.length} 个无效订阅，是否全部删除?`,
    positiveText: '确认清空',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        const groupId = tab === 'all' ? 'all' : (tab === 'ungrouped' ? null : tab);
        const response = await subscriptionsApi.clearFailed(groupId);
        if (response.data.success) {
          notify.success(response.data.message || `已清理 ${failedSubs.length} 个无效订阅`);
          fetchSubscriptions();
        } else {
          notify.error(response.data.message || '清理失败');
        }
      } catch (err) {
        notify.actionError.network();
      }
    }
  });
};


const getDropdownOptions = (group: import('@/stores/subscriptionGroups').SubscriptionGroup): DropdownOption[] => {
  return [
    { label: '更新分组', key: 'update-group' },
    { label: '去重', key: 'deduplicate-group' },
    { label: '规则', key: 'group-rules' },
    { label: '导出', key: 'export-group' },
    { type: 'divider', key: 'd1' },
    { label: '批量替换', key: 'batch-replace-group' },
    { label: '重命名', key: 'rename' },
    { label: group.is_enabled ? '禁用' : '启用', key: 'toggle' },
    { type: 'divider', key: 'd2' },
    { label: '删除', key: 'delete', props: { style: 'color: red;' } }
  ]
}

const handleGroupAction = (key: string) => {
  showDropdown.value = false
  const group = activeDropdownGroup.value
  if (!group) return

  switch (key) {
    case 'update-group':
      handleUpdateGroupSubscriptions(group.id)
      break
    case 'deduplicate-group':
      handleDeduplicateGroup(group.id, subscriptions)
      break
    case 'export-group':
      handleExportGroup(group.id)
      break
    case 'batch-replace-group':
      openBatchReplaceModal(group.id)
      break
    case 'group-rules':
      handleGroupRules(group)
      break
    case 'rename':
      openEditGroupModal(group)
      break
    case 'toggle':
      handleToggleGroup(group.id)
      break
    case 'delete':
      handleDeleteGroup(group)
      break
  }
}

const handleTabClick = (group: import('@/stores/subscriptionGroups').SubscriptionGroup, event: MouseEvent) => {
  const target = event.target as HTMLElement
  if (target.closest('.group-actions-button')) {
    showDropdown.value = true
    dropdownX.value = event.clientX
    dropdownY.value = event.clientY
    activeDropdownGroup.value = group
  } else {
    activeTab.value = group.id
  }
}

const handleContextMenu = (group: import('@/stores/subscriptionGroups').SubscriptionGroup, event: MouseEvent) => {
  event.preventDefault()
  showDropdown.value = false
  setTimeout(() => {
    showDropdown.value = true
    dropdownX.value = event.clientX
    dropdownY.value = event.clientY
    activeDropdownGroup.value = group
  }, 50)
}


const handleExportGroup = (groupId: string) => {
  const group = subscriptionGroupStore.groups.find(g => g.id === groupId)
  const subsInGroup = subscriptions.value.filter(s => s.group_id === groupId)
  if (subsInGroup.length === 0) {
    notify.preset.noData('该分组没有可导出的订阅')
    return
  }

  exportData.urls = subsInGroup.map(s => s.url).join('\n')
  exportData.count = subsInGroup.length
  exportData.groupName = group?.name || '分组'
  showExportModal.value = true
}


const openBatchReplaceModal = (groupId: string) => {
  const subsInGroupLinkCount = subscriptions.value.filter(s => s.group_id === groupId).length
  if (subsInGroupLinkCount === 0) {
    notify.preset.noData('该分组没有可替换的订阅')
    return
  }
  batchReplaceGroupId.value = groupId
  showBatchReplaceModal.value = true
}


// Update actions using composable
const handleUpdateAll = () => {
  const subs = checkedRowKeys.value.length > 0
    ? subscriptions.value.filter(s => checkedRowKeys.value.includes(s.id))
    : subscriptions.value.filter(s => s.is_enabled !== false)
  prepareAndShowUpdateModal(subs)
}

const handleUpdateGroupSubscriptions = (groupId: string) => {
  const subs = subscriptions.value.filter(s => s.group_id === groupId && s.is_enabled !== false)
  prepareAndShowUpdateModal(subs)
}


onMounted(() => {
  fetchSubscriptions();
  subscriptionGroupStore.fetchGroups();
});
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
      <div>
        <h1 class="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">订阅列表</h1>
        <p class="text-slate-500 dark:text-slate-400 mt-1">管理您的订阅链接和节点。</p>
      </div>
      <div class="flex gap-2">
         <Button variant="primary" @click="openModal(null)" class="flex items-center whitespace-nowrap !w-10 !h-10 !p-0 !rounded-full md:!w-auto md:!h-10 md:!px-5 md:!rounded-xl">
             <n-icon :component="AddOutline" class="md:mr-2" />
             <span class="hidden md:inline">新建订阅</span>
         </Button>
         <n-dropdown
            trigger="click"
            :options="[
              { label: '全部更新', key: 'update-all' },
              { label: '批量导入', key: 'import' },
              { label: '添加分组', key: 'add-group' },
              { label: '调整排序', key: 'sort' },
              { label: '移动到分组', key: 'move-to-group', disabled: checkedRowKeys.length === 0 },
              { label: '批量删除', key: 'batch-delete', disabled: checkedRowKeys.length === 0 },
              { label: '清理无效订阅', key: 'clear-failed' },
              { label: '清空当前组', key: 'clear-current-group' },
            ]"
            @select="key => {
                if (key === 'update-all') handleUpdateAll();
                if (key === 'import') openImportModal();
                if (key === 'add-group') showAddGroupModal = true;
                if (key === 'sort') showSortModal = true;
                if (key === 'move-to-group') showMoveToGroupModal = true;
                if (key === 'batch-delete') handleBatchDelete();
                if (key === 'clear-failed') handleClearAllFailed();
                if (key === 'clear-current-group') handleClearCurrentGroup();
            }"
        >
            <Button variant="secondary" class="flex items-center whitespace-nowrap !w-10 !h-10 !p-0 !rounded-full md:!w-auto md:!h-10 md:!px-5 md:!rounded-xl">
                 <n-icon :component="EllipsisHorizontal" />
                 <span class="hidden md:inline ml-2">操作</span>
            </Button>
        </n-dropdown>
      </div>
    </div>

    <!-- Tabs & Content -->
    <Card :bordered="false" content-style="padding: 0;" class="overflow-hidden rounded-xl shadow-sm border border-gray-100 dark:border-dark-border bg-white dark:bg-dark-surface">
        <n-tabs 
            type="line" 
            animated 
            class="px-4 pt-2"
            v-model:value="activeTab" 
            @update:value="showDropdown = false"
        >
            <n-tab-pane name="all" :tab="`全部 (${groupCounts.all})`" />
            <n-tab-pane name="ungrouped" :tab="`未分组 (${groupCounts.ungrouped})`" />
            <n-tab-pane
                v-for="group in subscriptionGroupStore.groups"
                :key="group.id"
                :name="group.id"
            >
              <template #tab>
                <div
                  class="flex items-center group cursor-pointer py-2"
                  @click.prevent="handleTabClick(group, $event)"
                  @contextmenu.prevent="handleContextMenu(group, $event)"
                >
                  <span :class="{'text-slate-400': !group.is_enabled, 'mr-2': true}">
                    {{ group.name }} ({{ groupCounts[group.id] || 0 }})
                  </span>
                  <div class="ml-2 opacity-0 group-hover:opacity-100 transition-opacity" v-if="!isMobile">
                       <n-icon :component="MoreIcon" class="text-slate-400 hover:text-slate-600 group-actions-button" />
                  </div>
                </div>
              </template>
            </n-tab-pane>
        </n-tabs>
        
        <div class="p-0">
             <SubscriptionTable
                v-if="!isMobile"
                v-model:checked-row-keys="checkedRowKeys"
                :subscriptions="paginatedSubscriptions"
                :loading="loading"
                :updating-ids="updatingIds"
                :updating-id="updatingId"
                @edit="openModal"
                @update="handleUpdate"
                @delete="handleDelete"
                @preview="onPreviewNodes"
                @manage-rules="onManageRules"
            />
             <div v-if="!isMobile" class="flex justify-end mt-4 px-4">
                <n-pagination
                  v-if="pagination.pageCount > 1"
                  v-model:page="pagination.page"
                  :page-count="pagination.pageCount"
                />
             </div>
             <div v-else class="p-4 space-y-4 bg-gray-50 dark:bg-dark-bg min-h-[300px]">
                 <Card v-for="sub in paginatedSubscriptions" :key="sub.id" padding="sm" class="flex flex-col gap-3">
                    <div class="flex flex-col gap-1">
                        <div class="flex justify-between items-start">
                             <div class="font-medium text-slate-900 dark:text-white">{{ sub.name }}</div>
                             <Badge :variant="sub.last_updated ? 'success' : (sub.error ? 'error' : 'default')">
                                 {{ sub.last_updated ? '正常' : (sub.error ? '失败' : '待更新') }}
                             </Badge>
                        </div>
                        <div class="text-xs text-slate-500 truncate">{{ sub.url }}</div>
                        <div class="flex gap-2 mt-1">
                            <Badge variant="info">{{ sub.node_count || 0 }} 节点</Badge>
                            <Badge variant="warning" v-if="sub.remaining_traffic">
                                {{ formatBytes(sub.remaining_traffic) }}
                            </Badge>
                        </div>
                    </div>
                    
                    <div class="flex justify-end gap-2 pt-2 border-t border-gray-100 dark:border-dark-border">
                        <Button variant="ghost" size="sm" icon @click="onPreviewNodes(sub)">
                            <n-icon :component="EyeOutline" />
                        </Button>
                        <Button variant="ghost" size="sm" icon @click="handleUpdate(sub)">
                            <n-icon :component="SyncOutline" :class="{'animate-spin': updatingId === sub.id}" />
                        </Button>
                        <Button variant="ghost" size="sm" icon @click="openModal(sub)">
                            <n-icon :component="CreateOutline" />
                        </Button>
                         <Button variant="ghost" size="sm" icon class="text-red-500" @click="handleDelete(sub)">
                            <n-icon :component="TrashIcon" />
                        </Button>
                    </div>
                 </Card>
                 
                 <n-pagination
                  v-if="pagination.pageCount > 1"
                  v-model:page="pagination.page"
                  :page-count="pagination.pageCount"
                  class="flex justify-center mt-4"
                />
             </div>
        </div>
    </Card>
    
    <!-- Context Menu Dropdown -->
    <n-dropdown
      placement="bottom-start"
      trigger="manual"
      :x="dropdownX"
      :y="dropdownY"
      :options="activeDropdownGroup ? getDropdownOptions(activeDropdownGroup) : []"
      :show="showDropdown"
      :on-clickoutside="() => showDropdown = false"
      @select="handleGroupAction"
    />

    <!-- Modals -->
    <n-modal v-model:show="showModal" preset="card" :title="modalTitle" style="width: 500px;">
        <n-form :model="formState" label-placement="top">
            <n-form-item label="名称" path="name">
                <n-input v-model:value="formState.name" placeholder="订阅名称" />
            </n-form-item>
            <n-form-item label="链接" path="url">
                <n-input type="textarea" v-model:value="formState.url" placeholder="订阅链接" />
            </n-form-item>
        </n-form>
         <template #footer>
            <div class="flex justify-end gap-2">
                <Button variant="secondary" @click="closeModal">取消</Button>
                <Button variant="primary" @click="handleSave" :loading="saveLoading">保存</Button>
            </div>
        </template>
    </n-modal>

    <ImportModal
      v-model:show="showImportModal"
      @success="fetchSubscriptions"
    />

     <n-modal
      v-model:show="showNodePreviewModal"
      preset="card"
      title="节点预览"
      style="width: 800px; max-width: 95%;"
    >
        <SubscriptionNodesPreview
          v-if="currentSubscriptionForPreview"
          ref="nodePreviewRef"
          :subscription-id="currentSubscriptionForPreview.id"
          :subscription-url="currentSubscriptionForPreview.url"
          :show="showNodePreviewModal"
        />
    </n-modal>

    <UpdateLogModal
      v-model:show="showUpdateLogModal"
      :stage="updateStage"
      :progress="updateProgress"
      :log="updateLog"
      :loading="updateLogLoading"
      :settings="updateSettings"
      @start="executeSubscriptionUpdates"
      @cancel="handleCancelUpdate"
      @retry="handleRetryFailed"
      @clear-expiring="handleClearExpiring"
      @clear-failed="handleClearFailed"
    />


    <GroupFormModal
        v-model:show="showAddGroupModal"
        mode="add"
        v-model:name="newGroupName"
        v-model:description="newGroupDescription"
        :loading="addGroupLoading"
        @submit="handleSaveGroup"
    />

    <GroupFormModal
        v-model:show="showEditGroupModal"
        mode="edit"
        v-model:name="editingGroupName"
        v-model:description="editingGroupDescription"
        :loading="editGroupLoading"
        @submit="handleUpdateGroup"
    />

    <MoveToGroupModal
        v-model:show="showMoveToGroupModal"
        :loading="moveToGroupLoading"
        :groups="subscriptionGroupStore.groups"
        :sub-count="checkedRowKeys.length"
        @submit="handleMoveToGroup"
    />
    
    <SortGroupsModal
        v-model:show="showSortModal"
        :loading="sortLoading"
        :groups="subscriptionGroupStore.groups"
        @save="handleSortSave"
    />

    <ExportModal
      v-model:show="showExportModal"
      :group-name="exportData.groupName"
      :urls="exportData.urls"
      :count="exportData.count"
    />

    <BatchReplaceModal
      v-model:show="showBatchReplaceModal"
      :group-id="batchReplaceGroupId"
      :subscriptions="subscriptions"
      @success="fetchSubscriptions"
    />

    <RuleManagerModal
        v-model:show="showRulesModal"
        :type="ruleContext.type"
        :entity-id="ruleContext.id"
        :entity-name="ruleContext.name"
    />
  </div>
</template>