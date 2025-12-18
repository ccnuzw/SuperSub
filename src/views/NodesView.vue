/**
 * 节点管理主视图组件
 * 简化版本，避免复杂的类型问题
 */

<template>
  <div class="page-container">
    <!-- 桌面端：左侧分组和右侧表格 -->
    <!-- 移动端：上下布局 -->
    <div class="main-content">
      <!-- 分组选择区域 -->
      <div class="group-section">
        <NodeGroupTabs
          v-model:active-tab="selectedGroupId"
          :groups="groupsWithCount"
          :loading="groupStore.loading"
          :total-count="nodes.length"
          @group-click="handleGroupClick"
          @group-context-menu="handleGroupContextMenu"
          @add-group="handleCreateGroup"
        />
      </div>

      <!-- 节点表格区域 -->
      <div class="table-section">
        <NodeTable
          :nodes="filteredNodes"
          :loading="loading"
          :selected-keys="selectedKeys"
          :testing-ids="testingIds"
          :pagination="pagination"
          @update:selected-keys="handleSelectedKeysChange"
          @test-node="handleTestNode"
          @edit="handleEditNode"
          @delete="handleDeleteNode"
          @copy="handleCopyNode"
          @move-to-group="handleMoveToGroup"
          @batch-test="handleBatchTest"
          @batch-delete="handleBatchDelete"
          @batch-export="handleBatchExport"
          @cleanup-invalid="handleCleanupInvalid"
          @test-all-nodes="handleTestAllNodes"
        />
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
import { ref, computed, onMounted, onUnmounted, h } from 'vue'
import { useRouter } from 'vue-router'
import { useMessage, useDialog } from 'naive-ui'
import { useClipboard } from '@/composables/common/useClipboard'

// 组件导入
import NodeTable from '@/components/nodes/NodeTable.vue'
import NodeFormModal from '@/components/nodes/NodeFormModal.vue'
import NodeGroupTabs from '@/components/nodes/NodeGroupTabs.vue'
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
const selectedGroupId = ref('all')

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
  pageSize: 10,
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

// 带节点数量的分组列表
const groupsWithCount = computed(() => {
  return groupStore.groups.map((group: any) => ({
    ...group,
    node_count: nodes.value.filter(node => node.group_id === group.id).length
  }))
})

// 过滤后的节点
const filteredNodes = computed(() => {
  let filtered = nodes.value

  // 如果选择了分组，过滤节点
  if (selectedGroupId.value && selectedGroupId.value !== 'all') {
    filtered = filtered.filter(node => node.group_id === selectedGroupId.value)
  }

  return filtered
})

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

const handleBatchExport = () => {
  const selectedNodes = nodes.value.filter(node => selectedKeys.value.includes(node.id))
  if (selectedNodes.length === 0) {
    message.warning('请先选择要导出的节点')
    return
  }

  const nodeLinks = selectedNodes.map(node => node.link || '').filter(Boolean)
  const blob = new Blob([nodeLinks.join('\n')], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `nodes_${new Date().toISOString().split('T')[0]}.txt`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
  message.success(`已导出 ${selectedNodes.length} 个节点`)
}

const handleCleanupInvalid = () => {
  // 查找状态为异常或延迟过高的节点
  const invalidNodes = nodes.value.filter(node => {
    return node.status === 'unhealthy' ||
           node.status === 'error' ||
           (node.latency && node.latency > 5000) // 延迟超过5秒
  })

  if (invalidNodes.length === 0) {
    message.info('没有发现无效节点')
    return
  }

  dialog.warning({
    title: '清理无效节点',
    content: `发现 ${invalidNodes.length} 个无效节点（状态异常或延迟过高）。确定要删除这些节点吗？此操作不可撤销。`,
    positiveText: '清理',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        const invalidNodeIds = invalidNodes.map(node => node.id)
        await handleBatchDeleteNodes(invalidNodeIds)
        message.success(`已清理 ${invalidNodes.length} 个无效节点`)
      } catch (error) {
        console.error('Cleanup failed:', error)
        message.error('清理无效节点失败')
      }
    }
  })
}

const handleTestAllNodes = async () => {
  if (nodes.value.length === 0) {
    message.warning('没有节点可测试')
    return
  }

  message.info(`开始测试所有 ${nodes.value.length} 个节点...`)
  await handleTestAll()
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

const handleMoveToGroup = (nodes: any[]) => {
  handleMoveNodesToGroupWrapper(nodes)
}

const handleMoveNodesToGroupWrapper = (nodes: any[]) => {
  const nodeIds = nodes.map((node: any) => node.id)
  const groupId = selectedGroupId.value || ''
  handleMoveNodesToGroup(nodeIds, groupId)
}

const handleCreateGroup = () => {
  dialog.create({
    title: '创建新分组',
    content: () => {
      return h('div', { class: 'py-2' }, [
        h('p', { class: 'text-gray-600 mb-4' }, '请输入分组名称'),
        h('input', {
          ref: 'inputRef',
          type: 'text',
          placeholder: '分组名称',
          onInput: (e: any) => {
            groupName = e.target.value
          },
          onKeydown: (e: KeyboardEvent) => {
            if (e.key === 'Enter') {
              dialog.destroyAll()
              if (groupName.trim()) {
                createGroup(groupName.trim())
              }
            }
          },
          class: 'w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
          autofocus: true
        })
      ])
    },
    positiveText: '创建',
    negativeText: '取消',
    onPositiveClick: () => {
      if (groupName.trim()) {
        createGroup(groupName.trim())
        return true
      } else {
        message.warning('分组名称不能为空')
        return false
      }
    }
  })
}

let groupName = ''

const createGroup = async (name: string) => {
  try {
    const response = await httpClient.post('/groups', { name })

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

const handleGroupClick = (group: any) => {
  selectedGroupId.value = group.id
}

const handleGroupContextMenu = (group: any, event: MouseEvent) => {
  event.preventDefault()
  // 暂时禁用右键菜单，可以在头部操作菜单中管理分组
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
      case 'add-node':
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
        handleExportNodes()
        break
      case 'batch-test':
        handleBatchTest()
        break
      case 'cleanup':
        // 清理无效节点功能
        message.info('清理功能开发中')
        break
    }
  }
}

// 监听选择变化
const handleSelectedKeysChange = (keys: string[]) => {
  selectedKeys.value = keys
  // 同步到 composable
  checkedRowKeys.value = keys
}
</script>

<style scoped>
/* 内容包装器 - 直接在页面容器中 */
.page-container {
  @apply flex flex-col;
  background: #ffffff;
  width: 100%;
  max-width: none;
  margin: 0;
  /* 减少垂直间距，紧贴布局 */
  padding-top: 16px;
  padding-bottom: 16px;
  /* 与顶部栏的 px-6 保持一致 */
  padding-left: 24px;
  padding-right: 24px;
  /* 移除 min-h-screen，让容器高度自适应内容 */
  min-height: auto;
  height: auto;
}

/* 主要内容区域 */
.main-content {
  @apply transition-all duration-300;
  display: flex;
  flex-direction: column;
  /* 移除 flex: 1，让容器高度自适应内容 */
  gap: 1rem;
  height: auto;
  min-height: auto;
}

/* 响应式设计 - 优化不同屏幕尺寸 */
@media (max-width: 640px) {
  .page-container {
    @apply py-3;
    padding-left: 16px;
    padding-right: 16px;
  }

  .main-content {
    @apply space-y-2;
  }
}

@media (min-width: 641px) and (max-width: 1024px) {
  .page-container {
    @apply py-4;
    padding-left: 20px;
    padding-right: 20px;
  }

  .main-content {
    @apply space-y-4;
  }
}

@media (min-width: 1025px) and (max-width: 1440px) {
  .page-container {
    @apply py-4;
    width: 100%;
    max-width: none;
    margin: 0;
    padding-left: 24px;
    padding-right: 24px;
  }

  .main-content {
    @apply space-y-4;
  }
}

@media (min-width: 1441px) and (max-width: 1920px) {
  .page-container {
    @apply py-6;
    width: 100%;
    max-width: none;
    margin: 0;
    padding-left: 24px;
    padding-right: 24px;
  }

  .main-content {
    @apply space-y-6;
  }
}

@media (min-width: 1921px) {
  .page-container {
    @apply py-8;
    width: 100%;
    max-width: none;
    margin: 0;
    padding-left: 24px;
    padding-right: 24px;
  }

  .main-content {
    @apply space-y-8;
  }
}

/* 桌面端响应式布局 */
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