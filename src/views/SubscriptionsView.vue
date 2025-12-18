/**
 * 订阅管理主视图组件
 * 重构后的SubscriptionsView，使用组件化架构
 */

<template>
  <div class="page-container">
    <!-- 粘性头部 -->
    <div class="sticky-header">
      <div class="content-wrapper">
        <n-page-header
          title="订阅管理"
          subtitle="管理和配置代理订阅源"
          @back="$router.back()"
        >
          <template #extra>
            <n-space size="medium">
              <n-button
                type="primary"
                size="medium"
                @click="showAddModal = true"
                :loading="loading"
                class="action-button"
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
                <n-button circle size="medium" class="action-button">
                  <template #icon>
                    <n-icon><EllipsisVerticalOutline /></n-icon>
                  </template>
                </n-button>
              </n-dropdown>
            </n-space>
          </template>
        </n-page-header>
      </div>
    </div>

    <!-- 主要内容区域 -->
    <div class="content-wrapper">
      <div class="content-grid">
        <!-- 顶部区域：统计信息 -->
        <div class="top-section">
          <SubscriptionStats
            :total="subscriptions.length"
            :healthy="healthyCount"
            :updating="updatingCount"
            :failed="failedCount"
            :selected="selectedCount"
          />
        </div>

        <!-- 中间区域：分组标签 -->
        <div class="middle-section">
          <div class="section-card">
            <SubscriptionGroupTabs
              v-model:active-tab="activeTab"
              :groups="groups"
              :loading="groupLoading"
              :total-count="subscriptions.length"
              @group-click="handleGroupClick"
              @group-context-menu="handleGroupContextMenu"
              @add-group="handleCreateGroup"
            />
          </div>
        </div>

        <!-- 底部区域：订阅表格 -->
        <div class="bottom-section">
          <div class="section-card table-card">
            <SubscriptionTable
              :subscriptions="filteredSubscriptions"
              :selected-keys="selectedKeys"
              :updating-ids="updatingIds"
              :loading="loading"
              :pagination="pagination"
              @update:selected-keys="selectedKeys = $event"
              @retry-failed="handleRetryFailed"
              @clear-failed="handleClearFailed"
              @batch-delete="handleBatchDelete"
              @batch-update="handleBatchUpdate"
              @edit="handleEditSubscription"
              @delete="handleDeleteSubscription"
              @update="handleUpdateSubscription"
              @preview="handlePreviewSubscription"
              @copy-url="handleCopySubscriptionUrl"
            />
          </div>
        </div>
      </div>
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
/* 页面容器 */
.page-container {
  @apply min-h-screen;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
}

/* 内容包装器 - 使用更宽的容器 */
.content-wrapper {
  @apply max-w-full mx-auto px-1 sm:px-2 md:px-3 lg:px-4 xl:px-6;
  width: 100%;
}

/* 粘性头部 */
.sticky-header {
  @apply sticky top-0 z-40;
  backdrop-filter: blur(12px);
  background: rgba(255, 255, 255, 0.8);
  border-bottom: 1px solid rgba(229, 231, 235, 0.3);
}

/* 内容网格布局 - 减少间距 */
.content-grid {
  @apply space-y-4 py-4;
}

/* 区域划分 */
.top-section {
  @apply transition-all duration-300;
}

.middle-section {
  @apply transition-all duration-300;
}

.bottom-section {
  @apply transition-all duration-300;
}

/* 统一卡片样式 - 减少内边距 */
.section-card {
  @apply bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-white/20;
  @apply transition-all duration-300 hover:shadow-xl;
  padding: 1rem;
}

.table-card {
  @apply p-0 overflow-hidden;
}

.table-card :deep(.n-data-table) {
  border-radius: 0.75rem;
}

.table-card :deep(.n-data-table .n-data-table-base-table) {
  border-radius: 0.75rem;
}

/* 按钮样式优化 */
.action-button {
  @apply transition-all duration-200 hover:scale-105;
}

/* 响应式设计 - 优化不同屏幕尺寸 */
@media (max-width: 640px) {
  .content-wrapper {
    @apply px-1;
  }

  .content-grid {
    @apply space-y-3 py-3;
  }

  .section-card {
    padding: 0.5rem;
  }
}

@media (min-width: 641px) and (max-width: 1024px) {
  .content-wrapper {
    @apply px-2;
  }

  .content-grid {
    @apply space-y-4;
  }

  .section-card {
    padding: 0.75rem;
  }
}

@media (min-width: 1280px) {
  .content-wrapper {
    @apply px-4;
  }
}

/* 深色模式适配 */
.dark .page-container {
  background: linear-gradient(135deg, #1f2937 0%, #111827 100%);
}

.dark .sticky-header {
  background: rgba(31, 41, 55, 0.8);
  border-bottom-color: rgba(75, 85, 99, 0.3);
}

.dark .section-card {
  @apply bg-gray-800/80 border-gray-700/20;
  background: rgba(31, 41, 55, 0.8);
}

/* 加载动画 */
.page-container {
  animation: fadeIn 0.5s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>