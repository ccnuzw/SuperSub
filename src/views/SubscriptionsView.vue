/**
 * 订阅管理主视图组件
 * 重构后的SubscriptionsView，使用组件化架构
 */

<template>
  <div class="subscriptions-view">
    <!-- 页面头部 -->
    <div class="page-header">
      <n-page-header
        title="订阅管理"
        subtitle="管理和配置代理订阅源"
        @back="$router.back()"
      >
        <template #extra>
          <n-space>
            <n-button
              type="primary"
              @click="showAddModal = true"
              :loading="loading"
            >
              <template #icon>
                <n-icon><AddOutline /></n-icon>
              </template>
              添加订阅
            </n-button>

            <n-dropdown
              :options="headerActions"
              placement="bottom-end"
              @select="handleHeaderAction"
            >
              <n-button circle>
                <template #icon>
                  <n-icon><EllipsisVerticalOutline /></n-icon>
                </template>
              </n-button>
            </n-dropdown>
          </n-space>
        </template>
      </n-page-header>
    </div>

    <!-- 主要内容 -->
    <div class="page-content">
      <!-- 分组标签 -->
      <SubscriptionGroupTabs
        v-model:active-tab="activeTab"
        :groups="groups"
        :loading="groupLoading"
        :total-count="subscriptions.length"
        @group-click="handleGroupClick"
        @group-context-menu="handleGroupContextMenu"
        @add-group="handleCreateGroup"
      />

      <!-- 统计信息 -->
      <SubscriptionStats
        :total="subscriptions.length"
        :healthy="healthyCount"
        :updating="updatingCount"
        :failed="failedCount"
        :selected="selectedCount"
      />

      <!-- 订阅表格 -->
      <SubscriptionTable
        :subscriptions="filteredSubscriptions"
        :selected-keys="selectedKeys"
        :updating-ids="updatingIds"
        :loading="loading"
        :pagination="pagination"
        @update:selected-keys="selectedKeys = $event"
        @retry-failed="handleRetryFailed"
        @clear-failed="handleClearFailed"
        @update-all="handleUpdateAll"
        @batch-delete="handleBatchDelete"
        @batch-update="handleBatchUpdate"
        @bulk-import="showImportModal = true"
        @edit="handleEditSubscription"
        @delete="handleDeleteSubscription"
        @update="handleUpdateSubscription"
        @preview="handlePreviewSubscription"
        @copy-url="handleCopySubscriptionUrl"
      />
    </div>

    <!-- 添加/编辑订阅模态框 -->
    <SubscriptionFormModal
      v-model:show="showAddModal"
      :subscription="editingSubscription"
      :groups="groupOptions2"
      :loading="saveLoading"
      @save="handleSaveSubscription"
    />

    <!-- 添加/编辑分组模态框 -->
    <SubscriptionGroupFormModal
      v-model:show="showGroupFormModal"
      :group="editingGroup"
      :loading="groupFormLoading"
      @save="handleSaveGroup"
    />

    <!-- 批量导入模态框 -->
    <BulkImportModal
      v-model:show="showImportModal"
      :groups="groups"
      @success="handleBulkImportSuccess"
    />

    <!-- 分组管理模态框 -->
    <!-- <GroupManagementModal
      v-model:visible="showGroupManagement"
      :groups="subscriptionGroupStore.groups"
      @updated="handleGroupUpdated"
    /> -->

    <!-- 订阅预览模态框 -->
    <SubscriptionPreviewModal
      v-model:show="showPreviewModal"
      :subscription="currentPreviewSubscription"
    />

    <!-- 移动到分组模态框 -->
    <!-- <MoveToGroupModal
      v-model:visible="showMoveToGroupModal"
      :selected-count="selectedKeys.length"
      :groups="groupOptions"
      :loading="moveToGroupLoading"
      @move="handleMoveToGroup"
    /> -->
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, h } from 'vue'
import { useRouter } from 'vue-router'
import { useMessage, useDialog, NButton, NIcon, NPageHeader, NSpace, NDropdown } from 'naive-ui'
import {
  AddOutline,
  EllipsisVerticalOutline,
  RefreshOutline,
  SettingsOutline,
  DownloadOutline
} from '@vicons/ionicons5'
import type { DropdownOption } from 'naive-ui'
import { useClipboard } from '@/composables/common/useClipboard'

// 组件导入
import SubscriptionTable from '@/components/subscriptions/SubscriptionTable.vue'
import SubscriptionFormModal from '@/components/subscriptions/SubscriptionFormModal.vue'
import SubscriptionGroupTabs from '@/components/subscriptions/SubscriptionGroupTabs.vue'
import SubscriptionStats from '@/components/subscriptions/SubscriptionStats.vue'
import SubscriptionGroupFormModal from '@/components/subscriptions/SubscriptionGroupFormModal.vue'
import BulkImportModal from '@/components/subscriptions/BulkImportModal.vue'
import SubscriptionPreviewModal from '@/components/subscriptions/SubscriptionPreviewModal.vue'

// Composables 导入
import { useSubscriptionManagement } from '@/components/subscriptions/composables/useSubscriptionManagement'
import { useSubscriptionBatchActions } from '@/components/subscriptions/composables/useSubscriptionBatchActions'
import { useSubscriptionGroupManagement } from '@/components/subscriptions/composables/useSubscriptionGroupManagement'
import { useSubscriptionGroupForm } from '@/components/subscriptions/composables/useSubscriptionGroupForm'
import { useSubscriptionPreview } from '@/components/subscriptions/composables/useSubscriptionPreview'
import { useSubscriptionGroupStore } from '@/stores/subscriptionGroups'
import type { ISubscriptionGroup, ISubscription } from '@/types'

const router = useRouter()
const message = useMessage()
const dialog = useDialog()
const { copy } = useClipboard()

// 使用 Composables
const {
  subscriptions,
  loading,
  updatingIds,
  updatingCount,
  fetchSubscriptions,
  handleSaveSubscription,
  handleDeleteSubscription,
  handleUpdateSubscription,
  handleUpdateAllSubscriptions
} = useSubscriptionManagement()

const {
  checkedRowKeys: selectedKeys,
  hasSelected,
  selectedSubscriptions,
  showImportModal,
  showMoveToGroupModal,
  moveToGroupLoading,
  handleBatchDelete,
  handleBatchUpdate,
  handleBulkImport,
  handleRetryFailed,
  handleClearFailed,
  handleMoveToGroup
} = useSubscriptionBatchActions()

const selectedCount = computed(() => selectedSubscriptions.value.length)

const subscriptionGroupStore = useSubscriptionGroupStore()

// 使用分组管理 Composable
const {
  loading: groupLoading,
  groups,
  groupOptions,
  createGroup,
  updateGroup,
  deleteGroup,
  fetchGroups: fetchGroupList
} = useSubscriptionGroupManagement()

// 使用分组表单 Composable
const {
  loading: groupFormLoading,
  showModal: showGroupFormModal,
  editingGroup,
  handleFormSubmit,
  openCreateForm,
  openEditForm,
  closeForm
} = useSubscriptionGroupForm()

// 使用订阅预览 Composable
const {
  showModal: showPreviewModal,
  openPreview,
  closePreview
} = useSubscriptionPreview()

// 当前预览的订阅
const currentPreviewSubscription = ref<ISubscription | null>(null)

// Missing properties from the old composable
const activeTab = ref('all')
const filteredSubscriptions = computed(() => {
  if (activeTab.value === 'all') {
    return subscriptions.value
  }
  return subscriptions.value.filter(sub => sub.group_id === activeTab.value)
})

const handleGroupClick = (group: any) => {
  activeTab.value = group.id
}

const handleGroupContextMenu = (group: any, event: MouseEvent) => {
  event.preventDefault()
  // 暂时禁用右键菜单，可以在头部操作菜单中管理分组
}

const handleDeleteGroup = (group: ISubscriptionGroup) => {
  dialog.warning({
    title: '删除分组',
    content: `确定要删除分组"${group.name}"吗？该分组下的订阅将移至未分组。`,
    positiveText: '删除',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        await deleteGroup(group.id)
        await fetchGroups()
      } catch (error) {
        // 错误已在 composable 中处理
      }
    }
  })
}

const fetchGroups = async () => {
  await Promise.all([
    subscriptionGroupStore.fetchGroups(),
    fetchGroupList()
  ])
}

// 模态框状态
const showAddModal = ref(false)
const showGroupManagement = ref(false)
const editingSubscription = ref(null)
const saveLoading = ref(false)
const importLoading = ref(false)

// 分页配置
const pagination = ref({
  page: 1,
  pageSize: 20,
  itemCount: computed(() => filteredSubscriptions.value.length)
})

// 计算属性
const healthyCount = computed(() =>
  subscriptions.value.filter(s => s.status === 'healthy').length
)

const failedCount = computed(() =>
  subscriptions.value.filter(s => s.status === 'error').length
)

const groupOptions2 = computed(() => [
  { label: '未分组', value: null },
  ...groups.value.map((group: ISubscriptionGroup) => ({
    label: group.name,
    value: group.id
  }))
])

// 头部操作菜单
const headerActions: DropdownOption[] = [
  {
    label: '刷新数据',
    key: 'refresh',
    icon: () => h(NIcon, null, () => h(RefreshOutline))
  },
  {
    label: '批量导入',
    key: 'bulk-import',
    icon: () => h(NIcon, null, () => h(AddOutline))
  },
  {
    label: '导出订阅',
    key: 'export',
    icon: () => h(NIcon, null, () => h(DownloadOutline))
  },
  {
    type: 'divider'
  },
  {
    label: '新建分组',
    key: 'create-group',
    icon: () => h(NIcon, null, () => h(SettingsOutline))
  },
  {
    label: '分组管理',
    key: 'group-management',
    icon: () => h(NIcon, null, () => h(SettingsOutline))
  }
]

// 事件处理
const handleHeaderAction = (key: string) => {
  switch (key) {
    case 'refresh':
      handleRefresh()
      break
    case 'bulk-import':
      showImportModal.value = true
      break
    case 'export':
      handleExportSubscriptions()
      break
    case 'create-group':
      handleCreateGroup()
      break
    case 'group-management':
      showGroupManagement.value = true
      break
  }
}

const handleRefresh = async () => {
  await Promise.all([
    fetchSubscriptions(),
    fetchGroups()
  ])
  message.success('数据刷新完成')
}

const handleEditSubscription = (subscription: any) => {
  editingSubscription.value = subscription
  showAddModal.value = true
}

const handlePreviewSubscription = (subscription: any) => {
  currentPreviewSubscription.value = subscription
  showPreviewModal.value = true
  openPreview(subscription)
}

const handleCopySubscriptionUrl = async (subscription: any) => {
  await copy(subscription.url)
}

const handleUpdateAll = async () => {
  await handleUpdateAllSubscriptions()
}

const handleExportSubscriptions = () => {
  const urls = subscriptions.value.map(s => s.url).join('\n')
  const blob = new Blob([urls], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'subscriptions.txt'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
  message.success('订阅列表已导出')
}

const handleGroupUpdated = () => {
  fetchGroups()
}

// 批量导入成功处理
const handleBulkImportSuccess = async (result: any) => {
  message.success(`成功导入 ${result.success} 个订阅`)
  showImportModal.value = false

  // 刷新订阅列表
  await fetchSubscriptions()

  // 刷新分组数据（因为可能创建了新分组）
  await fetchGroups()
}

// 分组管理事件处理（简化版，委托给Composable）
const handleCreateGroup = () => {
  openCreateForm()
}

const handleEditGroup = (group: ISubscriptionGroup) => {
  openEditForm(group)
}

const handleSaveGroup = async (groupData: Partial<ISubscriptionGroup>) => {
  try {
    const result = await handleFormSubmit(groupData)

    if (result.success) {
      // 刷新分组数据
      await fetchGroups()
    }
  } catch (error) {
    // 错误已在Composable中处理
  }
}

// 生命周期
onMounted(async () => {
  await handleRefresh()
})
</script>

<style scoped>
.subscriptions-view {
  @apply min-h-screen bg-gray-50;
}

.page-header {
  @apply bg-white border-b border-gray-200 px-6 py-4;
}

.page-content {
  @apply p-6 space-y-6;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .page-header {
    @apply px-4 py-3;
  }

  .page-content {
    @apply p-4 space-y-4;
  }
}

/* 深色模式 */
.dark .subscriptions-view {
  @apply bg-gray-900;
}

.dark .page-header {
  @apply bg-gray-800 border-gray-700;
}
</style>