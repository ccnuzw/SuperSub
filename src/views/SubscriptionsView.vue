<script setup lang="ts">
import { ref, onMounted, reactive, h, computed, nextTick, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useMessage, useDialog, NButton, NSpace, NTag, NDataTable, NPageHeader, NModal, NForm, NFormItem, NInput, NTooltip, NGrid, NGi, NStatistic, NCard, NSwitch, NSelect, NDynamicTags, NRadioGroup, NRadioButton, NInputGroup, NIcon, NTabs, NTabPane, NDropdown, NProgress, NCollapse, NCollapseItem, NInputNumber, NList, NListItem, NThing, NPagination } from 'naive-ui'
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
import RuleManagerModal from '@/components/subscriptions/modals/RuleManagerModal.vue'
import UpdateLogModal from '@/components/subscriptions/modals/UpdateLogModal.vue'
import GroupFormModal from '@/components/subscriptions/modals/GroupFormModal.vue'
import MoveToGroupModal from '@/components/subscriptions/modals/MoveToGroupModal.vue'
import SortGroupsModal from '@/components/subscriptions/modals/SortGroupsModal.vue'
import SubscriptionTable from '@/components/subscriptions/SubscriptionTable.vue'
import { useSubscriptionUpdater } from '@/composables/subscriptions/useSubscriptionUpdater'
import { useSubscriptionGroups } from '@/composables/subscriptions/useSubscriptionGroups'
import { format } from 'date-fns'

const router = useRouter()
const message = useMessage()
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
// For bulk import
const showImportModal = ref(false)

// For batch actions
const checkedRowKeys = ref<string[]>([])

// For mobile pagination
interface MobilePagination {
  page: number;
  pageSize: number;
  itemCount: number;
  pageCount: number;
}

const mobilePagination: MobilePagination = reactive({
  page: 1,
  pageSize: 10,
  itemCount: 0,
  pageCount: computed(() => Math.ceil(mobilePagination.itemCount / mobilePagination.pageSize)),
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

const modalTitle = computed(() => (editingSubscription.value ? '编辑订阅' : '新增订阅'))

const filteredSubscriptions = computed(() => {
  return subscriptions.value.filter(sub => {
    if (activeTab.value === 'all') return true
    if (activeTab.value === 'ungrouped') return !sub.group_id
    return sub.group_id === activeTab.value
  })
})

const paginatedSubscriptions = computed(() => {
  const start = (mobilePagination.page - 1) * mobilePagination.pageSize;
  const end = start + mobilePagination.pageSize;
  return filteredSubscriptions.value.slice(start, end);
});

watch(filteredSubscriptions, (value) => {
  mobilePagination.itemCount = value.length;
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
      message.error(subsResponse.data.message || '获取订阅列表失败')
    }
  } catch (err) {
    message.error('请求失败，请稍后重试')
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
      message.success(editingSubscription.value ? '订阅更新成功' : '订阅新增成功')
      closeModal()
      fetchSubscriptions()
    } else {
      message.error(response.data.message || '保存失败')
    }
  } catch (err) {
    message.error('请求失败，请稍后重试')
  } finally {
    saveLoading.value = false
  }
}

const handleDelete = (row: Subscription) => {
  dialog.warning({
    title: '确认删除',
    content: `确定要删除订阅 "${row.name}" 吗？`,
    positiveText: '确定',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        const response = await subscriptionsApi.deleteSubscription(row.id)
        if (response.data.success) {
          message.success('订阅删除成功')
          fetchSubscriptions()
        } else {
          message.error(response.data.message || '删除失败')
        }
      } catch (err) {
        message.error('请求失败，请稍后重试')
      }
    },
  })
}

const handleUpdate = async (row: Subscription, silent = false, signal?: AbortSignal): Promise<{ success: boolean; data: Subscription; error?: string }> => {
  updatingId.value = row.id
  updatingIds.value.add(row.id)
  if (!silent) {
    message.info(`正在更新订阅 [${row.name}]...`)
  }
  try {
    // Delegate to composable
    const result = await handleUpdateSingle(row, silent, signal)
    return result
  } catch (err: any) {
    // Should be handled by handleUpdateSingle, but just incase
     const errorMsg = err.message || '请求失败，请稍后重试'
     if (!silent) message.error(errorMsg)
     return { success: false, data: row, error: errorMsg }
  } finally {
    updatingId.value = null
    updatingIds.value.delete(row.id)
  }
}


const openImportModal = () => {
  showImportModal.value = true
}

// A generic function to execute updates in a concurrent pool with progress
//

//

//

//

//

//

//

//



const handleBatchDelete = () => {
  if (checkedRowKeys.value.length === 0) {
    message.warning('请至少选择一个订阅');
    return;
  }
  dialog.warning({
    title: '确认批量删除',
    content: `确定要删除选中的 ${checkedRowKeys.value.length} 个订阅吗？`,
    positiveText: '确定',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        const response = await subscriptionsApi.batchDelete(checkedRowKeys.value);
        if (response.data.success) {
          message.success('批量删除成功');
          fetchSubscriptions();
          checkedRowKeys.value = [];
        } else {
          message.error(response.data.message || '批量删除失败');
        }
      } catch (err) {
        message.error('请求失败，请稍后重试');
      }
    }
  });
};

const handleClearCurrentGroup = () => {
  const tab = activeTab.value;
  let groupName = '';
  let subCount = 0;

  if (tab === 'all') {
    groupName = '全部';
    subCount = subscriptions.value.length;
  } else if (tab === 'ungrouped') {
    groupName = '未分组';
    subCount = groupCounts.value.ungrouped;
  } else {
    const group = subscriptionGroupStore.groups.find(g => g.id === tab);
    if (group) {
      groupName = group.name;
      subCount = groupCounts.value[tab] || 0;
    }
  }

  if (subCount === 0) {
    message.info(`“${groupName}”内没有可清除的订阅。`);
    return;
  }

  dialog.warning({
    title: '确认清除',
    content: `确定要删除“${groupName}”分组下的全部 ${subCount} 个订阅吗？此操作不可恢复。`,
    positiveText: '确定清除',
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
          message.success(response.data.message || '清除成功');
          fetchSubscriptions();
        } else {
          message.error(response.data.message || '清除失败');
        }
      } catch (err) {
        message.error('请求失败，请稍后重试');
      }
    }
  });
};

const handleClearAllFailed = () => {
  const tab = activeTab.value;
  const failedSubs = filteredSubscriptions.value.filter(sub => sub.error);
  
  let groupName = '';
  if (tab === 'all') {
    groupName = '全部';
  } else if (tab === 'ungrouped') {
    groupName = '未分组';
  } else {
    const group = subscriptionGroupStore.groups.find(g => g.id === tab);
    if (group) {
      groupName = group.name;
    }
  }

  if (failedSubs.length === 0) {
    message.info(`“${groupName}”分组内没有失败的订阅可清除。`);
    return;
  }

  dialog.warning({
    title: `确认清除“${groupName}”分组内的失败订阅`,
    content: `检测到 ${failedSubs.length} 个失败的订阅。确定要全部删除吗？此操作不可恢复。`,
    positiveText: '确定清除',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        const groupId = tab === 'all' ? 'all' : (tab === 'ungrouped' ? null : tab);
        const response = await subscriptionsApi.clearFailed(groupId);
        if (response.data.success) {
          message.success(response.data.message || `成功清除了 ${failedSubs.length} 个失败订阅`);
          fetchSubscriptions();
        } else {
          message.error(response.data.message || '清除失败');
        }
      } catch (err) {
        message.error('请求失败，请稍后重试');
      }
    }
  });
};







const getDropdownOptions = (group: import('@/stores/subscriptionGroups').SubscriptionGroup): DropdownOption[] => {
  return [
    { label: '更新本组', key: 'update-group' },
    { label: '一键去重', key: 'deduplicate-group' },
    { label: '规则管理', key: 'group-rules' },
    { label: '导出订阅', key: 'export-group' },
    { type: 'divider', key: 'd1' },
    { label: '批量替换', key: 'batch-replace-group' },
    { label: '标签编辑', key: 'rename' },
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

//



const handleExportGroup = (groupId: string) => {
  const group = subscriptionGroupStore.groups.find(g => g.id === groupId)
  const subsInGroup = subscriptions.value.filter(s => s.group_id === groupId)
  if (subsInGroup.length === 0) {
    message.warning('该分组下没有订阅可导出。')
    return
  }

  exportData.urls = subsInGroup.map(s => s.url).join('\n')
  exportData.count = subsInGroup.length
  exportData.groupName = group?.name || '该分组'
  showExportModal.value = true
}



const openBatchReplaceModal = (groupId: string) => {
  const subsInGroupLinkCount = subscriptions.value.filter(s => s.group_id === groupId).length
  if (subsInGroupLinkCount === 0) {
    message.warning('该分组下没有订阅可进行批量替换。')
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
  <div class="subscriptions-view">
    <n-page-header>
        <template #title>订阅管理</template>
        <template #extra>
            <n-space>
                <n-button type="primary" @click="openModal(null)">
                    <template #icon><n-icon :component="AddOutline" /></template>
                    <template v-if="!isMobile">新增订阅</template>
                </n-button>
                <n-dropdown
                    trigger="click"
                    :options="[
                      { label: '更新全部', key: 'update-all' },
                      { label: '批量导入', key: 'import' },
                      { label: '新增分组', key: 'add-group' },
                      { label: '调整顺序', key: 'sort' },
                      { label: '移动到分组', key: 'move-to-group', disabled: checkedRowKeys.length === 0 },
                      { label: '批量删除', key: 'batch-delete', disabled: checkedRowKeys.length === 0 },
                      { label: '清除失败项', key: 'clear-failed' },
                      { label: '一键清除', key: 'clear-current-group' },
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
                    <n-button>
                         <template #icon><n-icon :component="EllipsisHorizontal" /></template>
                         <template v-if="!isMobile">批量操作</template>
                    </n-button>
                </n-dropdown>
            </n-space>
        </template>
    </n-page-header>

    <n-tabs type="card" class="mt-4" v-model:value="activeTab" @update:value="showDropdown = false">
        <n-tab-pane name="all" :tab="`全部 (${groupCounts.all})`" />
        <n-tab-pane name="ungrouped" :tab="`未分组 (${groupCounts.ungrouped})`" />
        <n-tab-pane
            v-for="group in subscriptionGroupStore.groups"
            :key="group.id"
            :name="group.id"
        >
          <template #tab>
            <div
              class="group-tab-wrapper"
              @click.prevent="handleTabClick(group, $event)"
              @contextmenu.prevent="handleContextMenu(group, $event)"
            >
              <span :style="{ color: group.is_enabled ? '' : '#999', marginRight: '8px' }">
                {{ group.name }} ({{ groupCounts[group.id] || 0 }})
              </span>
              <n-button v-if="activeTab === group.id && !isMobile" text class="group-actions-button">
                 <n-icon :component="MoreIcon" />
              </n-button>
            </div>
          </template>
        </n-tab-pane>
    </n-tabs>
    
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

    <SubscriptionTable
        v-if="!isMobile"
        v-model:checked-row-keys="checkedRowKeys"
        :subscriptions="filteredSubscriptions"
        :loading="loading"
        :updating-ids="updatingIds"
        :updating-id="updatingId"
        @edit="openModal"
        @update="handleUpdate"
        @delete="handleDelete"
        @preview="onPreviewNodes"
        @manage-rules="onManageRules"
        class="mt-4"
    />
     <n-list v-else bordered class="mt-4">
      <n-list-item v-for="sub in paginatedSubscriptions" :key="sub.id">
        <n-thing>
          <template #header>
            {{ sub.name }}
          </template>
          <template #description>
             <n-space size="small">
                <n-tag v-if="sub.last_updated" type="success" size="small" round>已更新</n-tag>
                <n-tag v-else type="default" size="small" round>待更新</n-tag>
                <n-tag v-if="sub.node_count" type="info" size="small" round>{{ sub.node_count }} 节点</n-tag>
             </n-space>
             <div class="text-xs text-gray-500 mt-1 truncate">{{ sub.url }}</div>
          </template>
        </n-thing>
        <template #suffix>
          <n-dropdown
            trigger="click"
             :options="[
              { label: '预览节点', key: 'preview' },
              { label: '编辑', key: 'edit' },
              { label: '更新', key: 'update' },
              { label: '删除', key: 'delete' },
            ]"
            @select="key => {
              if (key === 'preview') onPreviewNodes(sub);
              if (key === 'edit') openModal(sub);
              if (key === 'update') handleUpdate(sub);
              if (key === 'delete') handleDelete(sub);
            }"
          >
            <n-button text>
              <n-icon :component="MoreIcon" size="24" />
            </n-button>
          </n-dropdown>
        </template>
      </n-list-item>
    </n-list>
     <n-pagination
      v-if="isMobile && mobilePagination.pageCount > 1"
      v-model:page="mobilePagination.page"
      :page-count="mobilePagination.pageCount"
      class="mt-4"
      style="justify-content: center;"
    />


    <!-- Modals -->
    <n-modal v-model:show="showModal" preset="card" :title="modalTitle" style="width: 500px;">
        <n-form :model="formState" label-placement="left" label-width="80">
            <n-form-item label="名称" path="name">
                <n-input v-model:value="formState.name" placeholder="请输入订阅名称" />
            </n-form-item>
            <n-form-item label="链接" path="url">
                <n-input type="textarea" v-model:value="formState.url" placeholder="请输入订阅链接" />
            </n-form-item>
        </n-form>
         <template #footer>
            <n-space justify="end">
                <n-button @click="closeModal">取消</n-button>
                <n-button type="primary" @click="handleSave" :loading="saveLoading">保存</n-button>
            </n-space>
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


    <!-- Restored Modals -->
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