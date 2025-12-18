/**
 * 订阅管理主视图组件
 * 重构后的SubscriptionsView，使用组件化架构
 */

<template>
  <div class="page-container">
    <!-- 桌面端：左侧分组和右侧表格 -->
    <!-- 移动端：上下布局 -->
    <div class="main-content">
      <!-- 分组选择区域 -->
      <div class="group-section">
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

      <!-- 订阅表格区域 -->
      <div class="table-section">
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
import { ref, computed, onMounted, onUnmounted, h, inject, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useMessage, useDialog } from 'naive-ui'
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

// 注入更新顶部栏统计信息的方法
const updateHeaderStats = inject<((stats: Record<string, any>) => void) | null>('updateHeaderStats')

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
  { label: '未分组', value: '' },
  ...groups.value.map((group: ISubscriptionGroup) => ({
    label: group.name,
    value: group.id
  }))
])

// 监听数据变化，更新顶部栏统计信息
watch([subscriptions, selectedKeys, updatingIds], () => {
  if (updateHeaderStats) {
    updateHeaderStats({
      total: subscriptions.value.length,
      healthy: healthyCount.value,
      failed: failedCount.value
    })
  }
}, { immediate: true })

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

  // 添加顶部栏事件监听
  window.addEventListener('header-action', handleHeaderAction as EventListener)
})

// 组件卸载时移除事件监听
onUnmounted(() => {
  window.removeEventListener('header-action', handleHeaderAction as EventListener)
})

// 顶部栏事件处理
const handleHeaderAction = async (event: CustomEvent) => {
  const { type, action } = event.detail

  if (type === 'primary') {
    switch (action) {
      case 'add-subscription':
        showAddModal.value = true
        break
    }
  } else if (type === 'menu') {
    switch (action) {
      case 'bulk-import':
        showImportModal.value = true
        break
      case 'refresh':
        await handleRefresh()
        message.success('数据刷新完成')
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
      case 'retry-failed':
        await handleRetryFailed()
        break
      case 'clear-failed':
        await handleClearFailed()
        break
    }
  }
}
</script>

<style scoped>
/* 内容包装器 - 直接在页面容器中 */
.page-container {
  @apply min-h-screen flex flex-col px-1 sm:px-2 md:px-3 lg:px-4 xl:px-6 py-4;
  background: #ffffff;
  width: 100%;
  max-width: none;
  margin: 0;
}

/* 主要内容区域 */
.main-content {
  @apply transition-all duration-300;
  display: flex;
  flex-direction: column;
  flex: 1;
  gap: 1rem;
}

/* 响应式设计 - 优化不同屏幕尺寸 */
@media (max-width: 640px) {
  .page-container {
    @apply px-1 py-3;
  }

  .main-content {
    @apply space-y-3;
  }
}

@media (min-width: 641px) and (max-width: 1024px) {
  .page-container {
    @apply px-2 py-4;
  }
}

@media (min-width: 1025px) and (max-width: 1440px) {
  .page-container {
    @apply px-6 py-6;
    width: 100%;
    max-width: none;
    margin: 0;
  }

  .main-content {
    @apply space-y-6;
  }
}

@media (min-width: 1441px) and (max-width: 1920px) {
  .page-container {
    @apply px-8 py-8;
    width: 100%;
    max-width: none;
    margin: 0;
  }

  .main-content {
    @apply space-y-8;
  }
}

@media (min-width: 1921px) {
  .page-container {
    @apply px-12 py-10;
    width: 100%;
    max-width: none;
    margin: 0;
  }

  .main-content {
    @apply space-y-10;
  }
}

/* 响应式设计 - 真正的响应式，使用相对单位 */
@media (min-width: 1200px) {
  .page-container {
    @apply block;
  }

  .main-content {
    @apply flex-col space-x-0 space-y-2;
  }

  .group-section {
    @apply w-full;
    height: auto;
  }

  .table-section {
    @apply w-full;
  }
}

/* 更大屏幕，比例调整 */
@media (min-width: 1600px) {
  .page-container {
    @apply block;
  }

  .main-content {
    @apply space-y-3;
  }
}

/* 超大屏幕，进一步优化比例 */
@media (min-width: 1920px) {
  .page-container {
    @apply block;
  }

  .main-content {
    @apply space-y-3;
  }
}

/* 深色模式适配 */
.dark .page-container {
  background: linear-gradient(135deg, #1f2937 0%, #111827 100%);
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