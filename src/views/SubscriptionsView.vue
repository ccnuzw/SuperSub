/**
 * 订阅管理主视图组件
 * 重构后的SubscriptionsView，使用组件化架构
 */

<template>
  <div class="page-container">
    <!-- 全局页面加载状态 -->
    <div v-if="pageLoading" class="page-loading">
      <n-spin size="large" />
      <p class="loading-text">加载中...</p>
    </div>

    <!-- 页面内容 -->
    <div v-else class="main-content">
      <!-- 桌面端：左侧分组和右侧表格 -->
      <!-- 移动端：上下布局 -->
      <div class="group-section">
        <SubscriptionGroupTabs
          v-model:active-tab="activeTab"
          :groups="groups"
          :loading="groupLoading"
          :total-count="subscriptions.length"
          @group-click="handleGroupClick"
          @group-context-menu="handleGroupContextMenu"
          @group-action="handleGroupAction"
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
          @manage-rules="handleManageRules"
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

    <!-- 订阅规则管理模态框 -->
    <RulesModal
      v-model:show="subscriptionRulesManagement.showRulesModal.value"
      :context="subscriptionRulesManagement.context.value"
      :loading="subscriptionRulesManagement.loading.value"
      :rules="subscriptionRulesManagement.rules.value"
      @save="subscriptionRulesManagement.saveRule"
      @delete="subscriptionRulesManagement.deleteRule"
      @update="subscriptionRulesManagement.updateRule"
      @refresh="subscriptionRulesManagement.fetchRules"
    />

    <!-- 分组规则管理模态框 -->
    <RulesModal
      v-model:show="groupRulesManagement.showRulesModal.value"
      :context="groupRulesManagement.context.value"
      :loading="groupRulesManagement.loading.value"
      :rules="groupRulesManagement.rules.value"
      @save="groupRulesManagement.saveRule"
      @delete="groupRulesManagement.deleteRule"
      @update="groupRulesManagement.updateRule"
      @refresh="groupRulesManagement.fetchRules"
    />

    <!-- 移动到分组模态框 -->
    <n-modal
      v-model:show="showMoveToGroupModal"
      preset="card"
      title="移动订阅到分组"
      style="width: 400px;"
      :mask-closable="false"
    >
      <p class="mb-4">将 {{ selectedKeys.length }} 个订阅移动到指定分组：</p>
      <n-form @submit.prevent="handleMoveToGroup">
        <n-form-item label="目标分组" required>
          <n-select
            v-model:value="moveToGroupId"
            placeholder="请选择目标分组（可清空变为未分组）"
            :options="groups.map(g => ({ label: g.name, value: g.id }))"
            clearable
          />
        </n-form-item>
        <n-space justify="end">
          <n-button @click="showMoveToGroupModal = false">取消</n-button>
          <n-button type="primary" @click="handleMoveToGroup" :loading="moveToGroupLoading">确认移动</n-button>
        </n-space>
      </n-form>
    </n-modal>

    <!-- 订阅更新模态框 -->
    <n-modal
      v-model:show="showUpdateModal"
      preset="card"
      title="订阅更新"
      style="width: 600px;"
      :mask-closable="false"
    >
      <!-- 配置阶段 -->
      <div v-if="updateStage === 'config'">
        <n-form label-placement="left" label-width="auto">
          <n-form-item label="待更新订阅数">
            <n-statistic :value="subsToUpdate.length" />
          </n-form-item>
          <n-form-item label="并发数">
            <n-input-number v-model:value="updateSettings.concurrency" :min="1" :max="20" />
            <template #feedback>同时执行的网络请求数量。较高的值可以加快速度，但可能导致请求失败。</template>
          </n-form-item>
          <n-form-item label="失败重试次数">
            <n-input-number v-model:value="updateSettings.retries" :min="0" :max="5" />
            <template #feedback>每个订阅在更新失败后自动重试的次数。</template>
          </n-form-item>
          <n-form-item label="请求间隔 (ms)">
            <n-input-number v-model:value="updateSettings.delay" :min="0" :step="100" />
            <template #feedback>同一批次内，每个并发请求之间的间隔。有助于错开请求峰值。</template>
          </n-form-item>
          <n-form-item label="批次间隔 (ms)">
            <n-input-number v-model:value="updateSettings.batchDelay" :min="0" :step="100" />
            <template #feedback>每完成一个并发批次后，等待一段时间再开始下一个批次。</template>
          </n-form-item>
          <n-form-item label="到期天数阈值">
            <n-input-number v-model:value="updateSettings.expiringDaysThreshold" :min="0" :step="1" />
            <template #feedback>当剩余天数小于此值时，将归类为"即将到期"。</template>
          </n-form-item>
          <n-form-item label="到期流量阈值 (GB)">
            <n-input-number v-model:value="updateSettings.expiringTrafficThresholdGB" :min="0" :step="1" />
            <template #feedback>当剩余流量小于此值 (GB) 时，将归类为"即将到期"。</template>
          </n-form-item>
        </n-form>
      </div>

      <!-- 进度阶段 -->
      <div v-else>
        <div class="text-center mb-4">
          <n-progress
            type="line"
            :percentage="updateProgress.total > 0 ? Math.floor((updateProgress.current / updateProgress.total) * 100) : 0"
            :indicator-placement="'inside'"
            processing
          />
          <p class="mt-2">
            <span v-if="updateLogLoading">正在更新: {{ updateProgress.current }} / {{ updateProgress.total }}</span>
            <span v-else>更新完成: {{ updateProgress.current }} / {{ updateProgress.total }}</span>
          </p>
        </div>
        <n-collapse>
          <n-collapse-item :title="`更新成功 (${updateLog.success.length})`" name="success">
            <div style="max-height: 200px; overflow-y: auto;">
              <n-tag v-for="sub in updateLog.success" :key="sub.name" type="success" class="m-1">
                {{ sub.name }}
              </n-tag>
              <n-text v-if="updateLog.success.length === 0">没有订阅成功更新。</n-text>
            </div>
          </n-collapse-item>
          <n-collapse-item :title="`即将到期 (${updateLog.expiring.length})`" name="expiring">
            <div style="max-height: 200px; overflow-y: auto;">
              <div v-if="updateLog.expiring.length > 0">
                <div v-for="sub in updateLog.expiring" :key="sub.id" class="mb-2 p-2 border rounded border-yellow-500">
                  <div class="flex justify-between items-center">
                    <n-tag type="warning">{{ sub.name }}</n-tag>
                    <n-space :size="4">
                      <n-tag v-if="sub.remaining_traffic !== null && sub.remaining_traffic !== undefined" size="small" type="warning">
                        流量: {{ formatBytes(sub.remaining_traffic) }}
                      </n-tag>
                      <n-tag v-if="sub.remaining_days !== null && sub.remaining_days !== undefined" size="small" type="warning">
                        天数: {{ sub.remaining_days }} 天
                      </n-tag>
                    </n-space>
                  </div>
                </div>
              </div>
              <n-text v-else>没有即将到期的订阅。</n-text>
            </div>
          </n-collapse-item>
          <n-collapse-item :title="`更新失败 (${updateLog.failed.length})`" name="failed">
            <div style="max-height: 200px; overflow-y: auto;">
              <div v-if="updateLog.failed.length > 0">
                <div v-for="sub in updateLog.failed" :key="sub.id" class="mb-2 p-2 border rounded">
                  <div class="flex justify-between items-center">
                    <n-tag type="error">{{ sub.name }}</n-tag>
                    <n-space :size="4">
                      <n-tag v-if="sub.remaining_traffic !== null && sub.remaining_traffic !== undefined" size="small" :type="sub.remaining_traffic === 0 ? 'error' : 'default'">
                        流量: {{ formatBytes(sub.remaining_traffic) }}
                      </n-tag>
                      <n-tag v-if="sub.remaining_days !== null && sub.remaining_days !== undefined" size="small" :type="sub.remaining_days <= 0 ? 'error' : 'default'">
                        天数: {{ sub.remaining_days }} 天
                      </n-tag>
                    </n-space>
                  </div>
                  <n-text class="text-xs text-gray-500 mt-1 block">{{ sub.error }}</n-text>
                </div>
              </div>
              <n-text v-else>没有订阅更新失败。</n-text>
            </div>
          </n-collapse-item>
        </n-collapse>
      </div>

      <template #footer>
        <n-space justify="end">
          <div v-if="updateStage === 'config'">
            <n-button @click="showUpdateModal = false">取消</n-button>
            <n-button type="primary" @click="executeSubscriptionUpdates">开始更新</n-button>
          </div>
          <div v-else>
            <n-button @click="handleCancelUpdate">{{ updateLogLoading ? '中止' : '关闭' }}</n-button>
            <n-button
              type="primary"
              ghost
              @click="handleRetryFailedForUpdate"
              :disabled="updateLog.failed.filter(s => s.error !== '已中止').length === 0 || updateLogLoading"
            >
              重试失败项
            </n-button>
            <n-button
              type="warning"
              ghost
              @click="handleClearExpiringSubscriptions"
              :disabled="updateLog.expiring.length === 0 || updateLogLoading"
            >
              清除即将到期
            </n-button>
            <n-button
              type="error"
              ghost
              @click="handleClearFailedSubscriptions"
              :disabled="updateLog.failed.filter(s => s.error !== '已中止').length === 0 || updateLogLoading"
            >
              清除失败项
            </n-button>
          </div>
        </n-space>
      </template>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, h, inject, watch, nextTick, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useMessage, useDialog, NSpin, NModal, NForm, NFormItem, NSelect, NSpace, NButton, NProgress, NCollapse, NCollapseItem, NStatistic, NInputNumber, NTag, NText } from 'naive-ui'
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
import RulesModal from '@/components/rules/RulesModal.vue'

// Composables 导入
import { useSubscriptionManagement } from '@/components/subscriptions/composables/useSubscriptionManagement'
import { useSubscriptionBatchActions } from '@/components/subscriptions/composables/useSubscriptionBatchActions'
import { useSubscriptionGroupManagement } from '@/components/subscriptions/composables/useSubscriptionGroupManagement'
import { useSubscriptionGroupForm } from '@/components/subscriptions/composables/useSubscriptionGroupForm'
import { useSubscriptionPreview } from '@/components/subscriptions/composables/useSubscriptionPreview'
import { useSubscriptionGroupStore } from '@/stores/subscriptionGroups'
import { useRulesManagement } from '@/components/rules/composables/useRulesManagement'
import type { ISubscriptionGroup, ISubscription } from '@/types'

const router = useRouter()
const message = useMessage()
const dialog = useDialog()
const { copy } = useClipboard()

// 页面级别的loading状态
const pageLoading = ref(true)

// 注入更新顶部栏统计信息的方法
const updateHeaderStats = inject<((stats: Record<string, any>) => void) | null>('updateHeaderStats', null)

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
  moveToGroupId,
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

// 使用订阅规则管理 Composable
const subscriptionRulesManagement = useRulesManagement('subscription')

// 使用分组规则管理 Composable
const groupRulesManagement = useRulesManagement('subscription-group')

// 当前预览的订阅
const currentPreviewSubscription = ref<ISubscription | null>(null)

// 更新设置相关状态
const showUpdateModal = ref(false)
const updateStage = ref<'config' | 'progress'>('config')
const updateLogLoading = ref(false)
const updateProgress = reactive({ current: 0, total: 0 })
const updateLog = reactive<{
  success: { name: string }[]
  failed: ISubscription[]
  expiring: ISubscription[]
}>({ success: [], failed: [], expiring: [] })
const subsToUpdate = ref<ISubscription[]>([])
let updateAbortController: AbortController | null = null

// 更新设置
const updateSettings = reactive({
  concurrency: 5,
  retries: 2,
  delay: 500,
  batchDelay: 1000,
  expiringDaysThreshold: 2,
  expiringTrafficThresholdGB: 1,
})

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

/**
 * 处理分组右键菜单事件
 */
const handleGroupContextMenu = (group: any, event: MouseEvent) => {
  // 右键菜单功能已移至SubscriptionGroupTabs组件内部处理
}

/**
 * 处理分组操作事件
 */
const handleGroupAction = async (action: string, group: any) => {
  switch (action) {
    case 'update-group':
      await handleClickOnUpdateGroup(group.id)
      break
    case 'deduplicate-group':
      await handleClickOnDeduplicateGroup(group.id)
      break
    case 'export-group':
      await handleClickOnExportGroup(group.id)
      break
    case 'group-rules':
      await handleClickOnGroupRules(group)
      break
    case 'batch-replace-group':
      await handleClickOnBatchReplaceGroup(group.id)
      break
    case 'rename':
      handleEditGroup(group)
      break
    case 'toggle':
      await handleClickOnToggleGroup(group)
      break
    case 'delete':
      await handleClickOnDeleteGroup(group)
      break
    default:
      console.warn(`Unknown group action: ${action}`)
  }
}

/**
 * 处理更新本组订阅
 */
const handleClickOnUpdateGroup = async (groupId: string) => {
  const subsInGroup = subscriptions.value.filter(s => s.group_id === groupId && s.enabled)
  if (subsInGroup.length === 0) {
    message.info('该分组下没有启用的订阅')
    return
  }

  message.info(`正在更新分组下的 ${subsInGroup.length} 个订阅...`)

  // 逐个更新订阅
  const promises = subsInGroup.map(sub => handleUpdateSubscription(sub))
  await Promise.allSettled(promises)

  message.success(`分组订阅更新完成`)
}

/**
 * 处理一键去重
 */
const handleClickOnDeduplicateGroup = (groupId: string) => {
  const subsInGroup = subscriptions.value.filter(s => s.group_id === groupId)
  const urlMap = new Map<string, ISubscription[]>()

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
      // Keep the first one, delete the rest
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
      const chunkSize = 50
      const chunks = []
      for (let i = 0; i < idsToDelete.length; i += chunkSize) {
        chunks.push(idsToDelete.slice(i, i + chunkSize))
      }

      try {
        let successCount = 0
        let hasError = false

        for (const chunk of chunks) {
          await Promise.all(
            chunk.map(async (id) => {
              try {
                await handleDeleteSubscription({ id } as ISubscription)
                successCount++
              } catch (error) {
                hasError = true
                console.error(`Failed to delete subscription ${id}:`, error)
              }
            })
          )
        }

        if (hasError) {
          message.warning(`去重完成，成功删除 ${successCount}/${duplicatesCount} 条订阅。`)
        } else {
          message.success(`去重完成，成功删除 ${successCount} 条重复订阅。`)
        }

        // 刷新订阅列表
        await fetchSubscriptions()
      } catch (error: any) {
        message.error(`删除失败: ${error.message || '未知错误'}`)
      }
    }
  })
}

/**
 * 处理导出分组订阅
 */
const handleClickOnExportGroup = (groupId: string) => {
  const group = groups.value.find(g => g.id === groupId)
  const subsInGroup = subscriptions.value.filter(s => s.group_id === groupId)
  if (subsInGroup.length === 0) {
    message.warning('该分组下没有订阅可导出。')
    return
  }

  const urls = subsInGroup.map(s => s.url).join('\n')
  const blob = new Blob([urls], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${group?.name || 'group'}_subscriptions.txt`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)

  // 同时复制到剪贴板
  copy(urls).then(() => {
    message.success(`已导出 ${subsInGroup.length} 条订阅，并复制到剪贴板`)
  }).catch(() => {
    message.success(`已导出 ${subsInGroup.length} 条订阅`)
  })
}

/**
 * 处理分组规则
 */
const handleClickOnGroupRules = (group: any) => {
  groupRulesManagement.openRulesModal(group)
}

/**
 * 处理批量替换分组订阅
 */
const handleClickOnBatchReplaceGroup = (groupId: string) => {
  const subsInGroup = subscriptions.value.filter(s => s.group_id === groupId)
  if (subsInGroup.length === 0) {
    message.warning('该分组下没有订阅可进行批量替换。')
    return
  }
  // TODO: 实现批量替换模态框
  message.info('批量替换功能开发中...')
}

/**
 * 处理切换分组启用状态
 */
const handleClickOnToggleGroup = async (group: any) => {
  try {
    await subscriptionGroupStore.toggleGroup(group.id)
    await fetchGroupList()
    message.success(group.is_enabled ? '分组已禁用' : '分组已启用')
  } catch (error: any) {
    message.error(error.message || '操作失败')
  }
}

/**
 * 处理删除分组
 */
const handleClickOnDeleteGroup = (group: any) => {
  dialog.warning({
    title: '确认删除',
    content: `确定要删除分组 "${group.name}" 吗？分组下的订阅将变为"未分组"。`,
    positiveText: '确定',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        await deleteGroup(group.id)
        // 如果当前正处于被删除的分组，切换到全部订阅
        if (activeTab.value === group.id) {
          activeTab.value = 'all'
        }
        // 刷新订阅列表以更新其分组状态
        await fetchSubscriptions()
      } catch (error: any) {
        message.error(error.message || '删除失败')
      }
    }
  })
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
  pageSize: 10,
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
watch([subscriptions, selectedKeys, updatingIds], async () => {
  await nextTick()
  if (updateHeaderStats && typeof updateHeaderStats === 'function') {
    try {
      updateHeaderStats({
        total: subscriptions.value.length,
        healthy: healthyCount.value,
        failed: failedCount.value
      })
    } catch (error) {
      console.warn('Failed to update header stats:', error)
    }
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

/**
 * 处理管理订阅规则
 */
const handleManageRules = (subscription: any) => {
  subscriptionRulesManagement.openRulesModal(subscription)
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
  try {
    await handleRefresh()
  } finally {
    // 确保无论数据加载是否成功，都隐藏loading
    pageLoading.value = false
  }

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
      case 'update-all':
        await handleClickOnUpdateAll()
        break
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
      case 'sort-groups':
        handleClickOnSortGroups()
        break
      case 'move-to-group':
        showMoveToGroupModal.value = true
        break
      case 'batch-delete':
        await handleClickOnBatchDelete()
        break
      case 'clear-failed':
        await handleClearFailed()
        break
      case 'clear-current-group':
        await handleClickOnClearCurrentGroup()
        break
      case 'group-management':
        showGroupManagement.value = true
        break
    }
  }
}

/**
 * 处理更新全部订阅 - 显示更新设置模态框
 */
const handleClickOnUpdateAll = async () => {
  // 确定要更新的订阅列表
  const subs = selectedKeys.value.length > 0
    ? subscriptions.value.filter(s => selectedKeys.value.includes(s.id))
    : subscriptions.value.filter(s => s.enabled)

  if (subs.length === 0) {
    message.info('没有需要更新的订阅')
    return
  }

  // 准备并显示更新模态框
  subsToUpdate.value = subs
  updateLog.success = []
  updateLog.failed = []
  updateLog.expiring = []
  updateProgress.current = 0
  updateProgress.total = subs.length
  updateStage.value = 'config'
  showUpdateModal.value = true
}

/**
 * 处理调整分组顺序
 */
const handleClickOnSortGroups = () => {
  // TODO: 实现分组顺序调整模态框
  message.info('分组顺序调整功能开发中...')
}

/**
 * 处理批量删除（来自顶部菜单）
 */
const handleClickOnBatchDelete = async () => {
  if (selectedKeys.value.length === 0) {
    message.warning('请先选择要删除的订阅')
    return
  }
  await handleBatchDelete()
}

/**
 * 处理一键清除当前分组
 */
const handleClickOnClearCurrentGroup = async () => {
  if (activeTab.value === 'all') {
    message.warning('请先选择一个分组')
    return
  }

  const subsInGroup = subscriptions.value.filter(s => s.group_id === activeTab.value)
  if (subsInGroup.length === 0) {
    message.info('当前分组没有订阅')
    return
  }

  dialog.warning({
    title: '确认清除',
    content: `确定要清除当前分组下的 ${subsInGroup.length} 个订阅吗？`,
    positiveText: '确定',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        // 批量删除
        for (const sub of subsInGroup) {
          await handleDeleteSubscription(sub as ISubscription)
        }
        message.success(`成功清除 ${subsInGroup.length} 个订阅`)
        await fetchSubscriptions()
      } catch (error: any) {
        message.error(`清除失败: ${error.message || '未知错误'}`)
      }
    }
  })
}

/**
 * 格式化字节数
 */
const formatBytes = (bytes: number, decimals = 2): string => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}

/**
 * 执行订阅更新
 */
const executeSubscriptionUpdates = async () => {
  if (subsToUpdate.value.length === 0) {
    message.info('没有需要更新的订阅')
    return
  }

  updateStage.value = 'progress'
  updateLogLoading.value = true
  message.info(`开始更新 ${subsToUpdate.value.length} 个订阅...`)

  updateAbortController = new AbortController()
  const signal = updateAbortController.signal

  const { concurrency, retries, delay } = updateSettings

  const tasks = subsToUpdate.value.map(sub => async () => {
    for (let i = 0; i <= retries; i++) {
      if (signal.aborted) return { success: false, data: sub, error: '已中止' }
      if (i > 0) {
        await new Promise(resolve => setTimeout(resolve, 1000 * i))
      }
      const result = await handleUpdateSubscription(sub as ISubscription)
      if (result) {
        return { success: true, data: sub }
      }
      if (i === retries) {
        return { success: false, data: sub, error: '更新失败' }
      }
    }
    return { success: false, data: sub, error: '未知重试错误' }
  })

  const results = []
  const executing = new Set<Promise<void>>()

  try {
    const updatePromises = tasks.map(task => async () => {
      const result = await task()
      updateProgress.current++
      if (result.success) {
        const sub = result.data
        const trafficThreshold = updateSettings.expiringTrafficThresholdGB * 1024 * 1024 * 1024
        const isExpiring = (sub.remaining_days !== null && sub.remaining_days !== undefined && sub.remaining_days < updateSettings.expiringDaysThreshold) ||
                           (sub.remaining_traffic !== null && sub.remaining_traffic !== undefined && sub.remaining_traffic < trafficThreshold)

        if (isExpiring) {
          updateLog.expiring.push(sub)
        } else {
          updateLog.success.push({ name: sub.name })
        }
      } else {
        const failedSub = { ...result.data, error: result.error || '未知错误' }
        updateLog.failed.push(failedSub)
      }
      results.push(result)
    })

    for (const promiseFn of updatePromises) {
      if (signal.aborted) break

      const p = promiseFn()
      executing.add(p)

      if (delay > 0) {
        await new Promise(resolve => setTimeout(resolve, delay))
      }

      if (executing.size >= concurrency) {
        await Promise.race(executing)
      }

      p.finally(() => executing.delete(p))
    }

    await Promise.allSettled(executing)

  } catch (error) {
    console.error('An unexpected error occurred during update execution:', error)
  } finally {
    updateAbortController = null
  }
}

/**
 * 取消更新
 */
const handleCancelUpdate = () => {
  if (updateLogLoading.value && updateAbortController) {
    updateAbortController.abort()
  }
  showUpdateModal.value = false
  updateLogLoading.value = false
}

/**
 * 重试失败的订阅（本地版本，用于更新流程）
 */
const handleRetryFailedForUpdate = () => {
  const failedSubsInfo = [...updateLog.failed].filter(s => s.error !== '已中止')
  if (failedSubsInfo.length === 0) {
    message.info('没有需要重试的订阅')
    return
  }

  subsToUpdate.value = failedSubsInfo
  updateLog.success = []
  updateLog.failed = []
  updateLog.expiring = []
  updateProgress.current = 0
  updateProgress.total = failedSubsInfo.length
  updateStage.value = 'config'
}

/**
 * 清除失败的订阅
 */
const handleClearFailedSubscriptions = () => {
  const subsToClear = updateLog.failed.filter(sub => sub.error !== '已中止')

  if (subsToClear.length === 0) {
    message.info('没有更新失败的订阅可以清除')
    return
  }

  dialog.warning({
    title: '确认清除失败订阅',
    content: `即将删除 ${subsToClear.length} 个更新失败的订阅，此操作不可恢复。确定要继续吗？`,
    positiveText: '确定清除',
    negativeText: '取消',
    onPositiveClick: async () => {
      for (const sub of subsToClear) {
        await handleDeleteSubscription(sub as ISubscription)
      }
      message.success(`成功清除了 ${subsToClear.length} 个失败订阅`)
      updateLog.failed = updateLog.failed.filter(sub => !subsToClear.includes(sub))
      await fetchSubscriptions()
    }
  })
}

/**
 * 清除即将到期的订阅
 */
const handleClearExpiringSubscriptions = () => {
  const subsToClear = updateLog.expiring

  if (subsToClear.length === 0) {
    message.info('没有即将到期的订阅可以清除')
    return
  }

  dialog.warning({
    title: '确认清除即将到期的订阅',
    content: `即将删除 ${subsToClear.length} 个即将到期的订阅，此操作不可恢复。确定要继续吗？`,
    positiveText: '确定清除',
    negativeText: '取消',
    onPositiveClick: async () => {
      for (const sub of subsToClear) {
        await handleDeleteSubscription(sub as ISubscription)
      }
      message.success(`成功清除了 ${subsToClear.length} 个即将到期的订阅`)
      updateLog.expiring = []
      await fetchSubscriptions()
    }
  })
}

// 监听进度完成
watch(updateProgress, (progress) => {
  if (progress.total > 0 && progress.current === progress.total) {
    nextTick(() => {
      if (updateLogLoading.value) {
        message.success('订阅更新任务完成！')
        selectedKeys.value = []
        fetchSubscriptions()
        updateLogLoading.value = false
      }
    })
  }
}, { deep: true })

// 从localStorage加载更新设置
onMounted(() => {
  const savedSettings = localStorage.getItem('subscriptionUpdateSettings')
  if (savedSettings) {
    try {
      Object.assign(updateSettings, JSON.parse(savedSettings))
    } catch (e) {
      console.error('Failed to parse update settings from localStorage:', e)
    }
  }
})

// 监听设置变化并保存到localStorage
watch(updateSettings, (newSettings) => {
  localStorage.setItem('subscriptionUpdateSettings', JSON.stringify(newSettings))
}, { deep: true })

</script>

<style scoped>
/* 内容包装器 - 直接在页面容器中 */
.page-container {
  @apply flex flex-col;
  background: #ffffff;
  width: 100%;
  max-width: none;
  margin: 0;
  /* 减少垂直间距，避免出现滚动条 */
  padding-top: 12px;
  padding-bottom: 12px;
  /* 减少水平间距，增加可用空间 */
  padding-left: 16px;
  padding-right: 16px;
  /* 完全自适应内容高度 */
  min-height: auto;
  height: auto;
  box-sizing: border-box;
}

/* 主要内容区域 */
.main-content {
  @apply transition-all duration-300;
  display: flex;
  flex-direction: column;
  /* 减少间距，避免出现滚动条 */
  gap: 0.75rem;
  height: auto;
  min-height: auto;
  /* 确保宽度完全自适应 */
  width: 100%;
  box-sizing: border-box;
}

/* 响应式设计 - 优化不同屏幕尺寸 */
@media (max-width: 640px) {
  .page-container {
    padding-top: 8px;
    padding-bottom: 8px;
    padding-left: 12px;
    padding-right: 12px;
  }

  .main-content {
    gap: 0.5rem;
  }
}

@media (min-width: 641px) and (max-width: 1024px) {
  .page-container {
    padding-top: 10px;
    padding-bottom: 10px;
    padding-left: 14px;
    padding-right: 14px;
  }

  .main-content {
    gap: 0.6rem;
  }
}

@media (min-width: 1025px) and (max-width: 1440px) {
  .page-container {
    padding-top: 12px;
    padding-bottom: 12px;
    padding-left: 16px;
    padding-right: 16px;
  }

  .main-content {
    gap: 0.75rem;
  }
}

@media (min-width: 1441px) and (max-width: 1920px) {
  .page-container {
    padding-top: 14px;
    padding-bottom: 14px;
    padding-left: 18px;
    padding-right: 18px;
  }

  .main-content {
    gap: 1rem;
  }
}

@media (min-width: 1921px) {
  .page-container {
    padding-top: 16px;
    padding-bottom: 16px;
    padding-left: 20px;
    padding-right: 20px;
  }

  .main-content {
    gap: 1.2rem;
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

/* 页面加载状态 */
.page-loading {
  @apply flex flex-col items-center justify-center;
  min-height: 400px;
  gap: 1rem;
}

.loading-text {
  @apply text-gray-600 text-sm;
  font-family: 'Inter', sans-serif;
}
</style>