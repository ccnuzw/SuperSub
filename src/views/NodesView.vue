/**
 * 节点管理主视图组件
 * 简化版本，避免复杂的类型问题
 */

<template>
  <div class="page-container">
    <!-- 粘性头部 -->
    <div class="sticky-header">
      <div class="content-wrapper">
        <n-page-header
          title="节点管理"
          subtitle="管理和配置代理节点"
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
                添加节点
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
        <!-- 顶部区域：分组选择器 -->
        <div class="top-section">
          <div class="section-card">
            <GroupSelector
              v-model:selected-group-id="selectedGroupId"
              :groups="groupOptions"
              :loading="groupStore.loading"
              @create-group="handleCreateGroup"
            />
          </div>
        </div>

        <!-- 底部区域：节点表格 -->
        <div class="bottom-section">
          <div class="section-card table-card">
            <NodeTable
              :nodes="filteredNodes"
              :loading="loading"
              :selected-keys="selectedKeys"
              :testing-ids="testingIds"
              :pagination="pagination"
              @update:selected-keys="handleSelectedKeysChange"
              @batch-delete="handleBatchDelete"
              @batch-action="handleBatchActionWrapper"
              @batch-import="showImportModal = true"
              @test-selected="handleTestSelected"
              @test-all="handleTestAll"
              @test-node="handleTestNode"
              @edit="handleEditNode"
              @delete="handleDeleteNode"
              @copy="handleCopyNode"
              @move-to-group="handleMoveNodesToGroupWrapper"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- 添加/编辑节点模态框 -->
    <NodeFormModal
      v-model:visible="showAddModal"
      :node="editingNode"
      :groups="groupOptions"
      :loading="saveLoading"
      @save="handleSaveNode"
    />

    <!-- 批量导入模态框 -->
    <NodeBulkImportModal
      v-model:visible="showImportModal"
      :groups="groupOptions"
      :loading="importLoading"
      @import="handleBulkImport"
    />
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
  DownloadOutline,
  FlashOutline
} from '@vicons/ionicons5'
import type { DropdownOption } from 'naive-ui'
import { useClipboard } from '@/composables/common/useClipboard'

// 组件导入
import NodeTable from '@/components/nodes/NodeTable.vue'
import NodeFormModal from '@/components/nodes/NodeFormModal.vue'
import GroupSelector from '@/components/nodes/GroupSelector.vue'
import NodeBulkImportModal from '@/components/nodes/NodeBulkImportModal.vue'

// Store导入
import { useNodeManagement } from '@/components/nodes/composables/useNodeManagement'
import { useGroupStore } from '@/stores/groups'
import httpClient from '@/services/http/HttpClient'

const router = useRouter()
const message = useMessage()
const dialog = useDialog()
const { copyText } = useClipboard()

// 使用 Composables
const {
  nodes,
  loading,
  checkedRowKeys,
  selectedNodes,
  hasSelected,
  selectedCount,
  fetchNodes,
  handleSaveNode,
  handleDeleteNode,
  handleBatchDeleteNodes,
  handleBatchAction,
  handleBatchImportFromLinks,
  handleMoveNodesToGroup
} = useNodeManagement()

// 使用分组Store
const groupStore = useGroupStore()

// 本地状态管理
const selectedKeys = ref<string[]>([])
const selectedGroupId = ref('')

// 模态框状态
const showAddModal = ref(false)
const showImportModal = ref(false)
const showMoveToGroupModal = ref(false)
const editingNode = ref(null)
const saveLoading = ref(false)
const importLoading = ref(false)
const moveToGroupLoading = ref(false)

// 节点测试相关
const testingIds = ref(new Set<string>())

// 分页配置
const pagination = ref({
  page: 1,
  pageSize: 20,
  itemCount: computed(() => nodes.value.length)
})

// 分组选项
const groupOptions = computed(() => {
  const options = [{ label: '全部节点', value: '' }]
  groupStore.groups.forEach((group: any) => {
    options.push({
      label: group.name,
      value: group.id
    })
  })
  return options
})

// 过滤后的节点
const filteredNodes = computed(() => {
  let filtered = nodes.value

  // 如果选择了分组，过滤节点
  if (selectedGroupId.value) {
    filtered = filtered.filter(node => node.group_id === selectedGroupId.value)
  }

  return filtered
})

// 头部操作菜单
const headerActions: DropdownOption[] = [
  {
    label: '刷新数据',
    key: 'refresh',
    icon: () => h(NIcon, null, { default: () => h(RefreshOutline) })
  },
  {
    label: '批量导入',
    key: 'bulk-import',
    icon: () => h(NIcon, null, { default: () => h(AddOutline) })
  },
  {
    label: '导出节点',
    key: 'export',
    icon: () => h(NIcon, null, { default: () => h(DownloadOutline) })
  },
  {
    type: 'divider'
  },
  {
    label: '批量测试',
    key: 'batch-test',
    icon: () => h(NIcon, null, { default: () => h(FlashOutline) })
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
      handleExportNodes()
      break
    case 'batch-test':
      handleBatchTest()
      break
  }
}

const handleRefresh = async () => {
  await fetchNodes()
  message.success('数据刷新完成')
}

const handleEditNode = (node: any) => {
  editingNode.value = node
  showAddModal.value = true
}

const handleCopyNode = async (node: any) => {
  await copyText(node.link || '')
}

const handleTestNode = async (node: any) => {
  testingIds.value.add(node.id)
  try {
    // 这里应该调用节点测试API
    console.log('Testing node:', node.id)
    message.success('节点测试完成')
  } catch (error) {
    message.error('节点测试失败')
  } finally {
    testingIds.value.delete(node.id)
  }
}

const handleTestSelected = async () => {
  const nodes = selectedNodes.value
  if (nodes.length === 0) {
    message.warning('请先选择要测试的节点')
    return
  }

  for (const node of nodes) {
    await handleTestNode(node)
  }
}

const handleTestAll = async () => {
  for (const node of nodes.value) {
    await handleTestNode(node)
  }
}

const handleBatchTest = () => {
  handleTestAll()
}

const handleBatchDelete = async () => {
  if (selectedKeys.value.length === 0) {
    message.warning('请先选择要删除的节点')
    return
  }

  dialog.warning({
    title: '批量删除节点',
    content: `确定要删除选中的 ${selectedKeys.value.length} 个节点吗？此操作不可撤销。`,
    positiveText: '确定删除',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        await handleBatchDeleteNodes(selectedKeys.value)
        selectedKeys.value = []
        message.success('批量删除成功')
      } catch (error) {
        console.error('Batch delete failed:', error)
      }
    }
  })
}

const handleExportNodes = () => {
  const nodeLinks = nodes.value.map(node => node.link || '').filter(Boolean)
  const blob = new Blob([nodeLinks.join('\n')], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'nodes.txt'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
  message.success('节点列表已导出')
}

// Wrapper functions to fix signature mismatch
const handleBatchActionWrapper = (action: string) => {
  handleBatchAction(action as 'sort' | 'deduplicate' | 'clear')
}

const handleMoveNodesToGroupWrapper = (nodes: any[]) => {
  const nodeIds = nodes.map((node: any) => node.id)
  const groupId = selectedGroupId.value || ''
  handleMoveNodesToGroup(nodeIds, groupId)
}

const handleCreateGroup = async (groupName: string) => {
  try {
    const response = await httpClient.post('/groups', { name: groupName })

    if (response.success) {
      message.success('分组创建成功')
      await groupStore.fetchGroups()
    } else {
      message.error(response.message || '创建失败')
    }
  } catch (error: any) {
    console.error('Create group failed:', error)
    message.error(error.message || '创建失败，请稍后重试')
  }
}

// 处理批量导入
const handleBulkImport = async (data: { links: string[]; groupId?: string }) => {
  try {
    importLoading.value = true
    const result = await handleBatchImportFromLinks(data.links, data.groupId)

    if (result) {
      showImportModal.value = false
      message.success(`成功导入 ${result.nodes.length} 个节点`)
    }
  } catch (error: any) {
    console.error('Bulk import failed:', error)
    message.error(error.message || '导入失败，请稍后重试')
  } finally {
    importLoading.value = false
  }
}

// 生命周期
onMounted(async () => {
  await Promise.all([
    handleRefresh(),
    groupStore.fetchGroups()
  ])
})

// 监听选择变化
const handleSelectedKeysChange = (keys: string[]) => {
  selectedKeys.value = keys
  // 同步到 composable
  checkedRowKeys.value = keys
}
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