/**
 * 节点管理主视图组件
 * 简化版本，避免复杂的类型问题
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
        <NodeGroupTabs
          v-model:active-tab="selectedGroupId"
          :groups="groupsWithCount"
          :loading="groupStore.loading"
          :total-count="nodes.length"
          @group-click="handleGroupClick"
          @group-context-menu="handleGroupContextMenu"
          @group-menu-click="handleGroupMenuClick"
          @add-group="handleCreateGroup"
        />
      </div>

      <!-- 分组右键菜单 -->
      <n-dropdown
        placement="bottom-start"
        trigger="manual"
        :x="dropdownX"
        :y="dropdownY"
        :options="activeDropdownGroup ? getGroupDropdownOptions(activeDropdownGroup) : []"
        :show="showDropdown"
        @select="handleGroupAction"
        @clickoutside="showDropdown = false"
      />

      <!-- 桌面端：表格或可排序表格 -->
      <!-- 移动端：列表视图 -->
      <div class="table-section">
        <!-- 排序模式：使用可排序表格 -->
        <SortableNodeTable
          v-if="isSorting && !isMobile"
          :nodes="nodes"
          :loading="loading"
          @save-order="handleSaveOrder"
          @cancel="handleCancelSort"
        />

        <!-- 桌面端：普通表格 -->
        <NodeTable
          v-else-if="!isMobile"
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

        <!-- 移动端：列表视图 -->
        <div v-else class="mobile-list-view">
          <div class="mobile-node-list">
            <div
              v-for="node in paginatedNodes"
              :key="node.id"
              class="mobile-node-item"
            >
              <div class="node-item-header">
                <div class="node-status-indicator">
                  <div
                    v-if="nodeStatusStore.getStatusByNodeId(node.id)?.status === 'healthy'"
                    class="status-dot status-healthy"
                  ></div>
                  <div
                    v-else-if="nodeStatusStore.getStatusByNodeId(node.id)?.status === 'unhealthy'"
                    class="status-dot status-unhealthy"
                  ></div>
                  <div
                    v-else-if="testingIds.has(node.id)"
                    class="status-dot status-testing"
                  >
                    <n-spin size="small" />
                  </div>
                  <div v-else class="status-dot status-unknown"></div>
                </div>
                <span class="node-name">{{ node.name }}</span>
              </div>
              <div class="node-item-body">
                <div class="node-info-row">
                  <span class="node-label">服务器:</span>
                  <span class="node-value">{{ node.server }}</span>
                </div>
                <div class="node-info-row">
                  <span class="node-label">端口:</span>
                  <span class="node-value">{{ node.port }}</span>
                </div>
                <div class="node-info-row" v-if="nodeStatusStore.getStatusByNodeId(node.id)?.latency">
                  <span class="node-label">延迟:</span>
                  <span
                    class="node-value"
                    :class="getLatencyColorClass(nodeStatusStore.getStatusByNodeId(node.id)!.latency!)"
                  >
                    {{ nodeStatusStore.getStatusByNodeId(node.id)!.latency }}ms
                  </span>
                </div>
              </div>
              <div class="node-item-actions">
                <n-button
                  size="small"
                  type="primary"
                  :loading="testingIds.has(node.id)"
                  @click="handleTestNode(node)"
                >
                  测试
                </n-button>
                <n-button
                  size="small"
                  @click="handleEditNode(node)"
                >
                  编辑
                </n-button>
                <n-button
                  size="small"
                  type="error"
                  ghost
                  @click="handleDeleteNode(node)"
                >
                  删除
                </n-button>
              </div>
            </div>
          </div>

          <!-- 移动端分页 -->
          <n-pagination
            v-if="mobilePagination.itemCount > mobilePagination.pageSize"
            v-model:page="mobilePagination.page"
            :page-count="Math.ceil(mobilePagination.itemCount / mobilePagination.pageSize)"
            :show-quick-jumper="false"
            :page-size="mobilePagination.pageSize"
            class="mobile-pagination"
          />
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
import { ref, computed, onMounted, onUnmounted, h, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useMessage, useDialog, NSpin, NSelect, NPagination, NDropdown } from 'naive-ui'
import { useClipboard } from '@/composables/common/useClipboard'
import { useIsMobile } from '@/composables/useMediaQuery'

// 组件导入
import NodeTable from '@/components/nodes/NodeTable.vue'
import NodeFormModal from '@/components/nodes/NodeFormModal.vue'
import NodeGroupTabs from '@/components/nodes/NodeGroupTabs.vue'
import NodeBulkImportModal from '@/components/nodes/NodeBulkImportModal.vue'
import SortableNodeTable from '@/components/nodes/SortableNodeTable.vue'

// 图标导入
import {
  CreateOutline,
  TrashOutline,
  CloseOutline,
  CheckmarkOutline,
  PencilOutline
} from '@vicons/ionicons5'

// Store导入
import { useNodeManagement } from '@/components/nodes/composables/useNodeManagement'
import { useGroupStore } from '@/stores/groups'
import { useNodeStatusStore } from '@/stores/nodeStatus'
import httpClient from '@/services/http/HttpClient'

const router = useRouter()
const message = useMessage()
const dialog = useDialog()
const { copyText } = useClipboard()
const isMobile = useIsMobile()

// 页面级别的loading状态
const pageLoading = ref(true)

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

// 使用节点状态Store
const nodeStatusStore = useNodeStatusStore()

// 本地状态管理
const selectedKeys = ref<string[]>([])
const selectedGroupId = ref('all')

// 排序模式状态
const isSorting = ref(false)
const orderChanged = ref(false)
const saveOrderLoading = ref(false)

// 分组下拉菜单状态
const showDropdown = ref(false)
const dropdownX = ref(0)
const dropdownY = ref(0)
const activeDropdownGroup = ref<any>(null)

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

// 移动端分页
interface IMobilePagination {
  page: number
  pageSize: number
  itemCount: number
}

const mobilePagination = ref<IMobilePagination>({
  page: 1,
  pageSize: 15,
  itemCount: 0
})

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

// 移动端分页后的节点
const paginatedNodes = computed(() => {
  const start = (mobilePagination.value.page - 1) * mobilePagination.value.pageSize
  const end = start + mobilePagination.value.pageSize
  return filteredNodes.value.slice(start, end)
})

// 监听过滤节点变化，更新移动端分页
watch(filteredNodes, (value) => {
  mobilePagination.value.itemCount = value.length
  mobilePagination.value.page = 1
}, { immediate: true })

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
    const result = await nodeStatusStore.checkNodesHealth([node.id])
    if (result.success) {
      message.success(result.message || '节点测试完成')
    } else {
      message.error(result.message || '节点测试失败')
    }
  } catch (error: any) {
    message.error(error.message || '节点测试失败')
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
    const nodeStatus = nodeStatusStore.getStatusByNodeId(node.id)
    return nodeStatus?.status === 'unhealthy' ||
           node.latency === 0 || // No latency recorded
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

// ==================== 排序相关处理 ====================

const handleSaveOrder = async (nodeIds: string[]) => {
  saveOrderLoading.value = true
  try {
    const response = await httpClient.post('/nodes/update-order', { nodeIds })
    if (response.success) {
      message.success('节点顺序已保存')
      orderChanged.value = false
      isSorting.value = false
      await fetchNodes()
    } else {
      message.error(response.message || '保存顺序失败')
    }
  } catch (err: any) {
    message.error(err.message || '请求失败，请稍后重试')
  } finally {
    saveOrderLoading.value = false
  }
}

const handleCancelSort = () => {
  orderChanged.value = false
  isSorting.value = false
}

const handleStartSorting = () => {
  isSorting.value = true
  orderChanged.value = false
}

// ==================== 辅助函数 ====================

// 获取延迟颜色类名
const getLatencyColorClass = (latency: number): string => {
  if (latency < 200) return 'text-green-600'
  if (latency < 500) return 'text-blue-600'
  if (latency < 1000) return 'text-yellow-600'
  return 'text-red-600'
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
  const name = ref('')

  dialog.create({
    title: '创建新分组',
    content: () => {
      return h('div', { class: 'py-2' }, [
        h('p', { class: 'text-gray-600 mb-4' }, '请输入分组名称'),
        h('input', {
          type: 'text',
          placeholder: '分组名称',
          value: name.value,
          onInput: (e: any) => {
            name.value = e.target.value
          },
          onKeydown: (e: KeyboardEvent) => {
            if (e.key === 'Enter') {
              dialog.destroyAll()
              if (name.value.trim()) {
                createGroup(name.value.trim())
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
      if (name.value.trim()) {
        createGroup(name.value.trim())
        return true
      } else {
        message.warning('分组名称不能为空')
        return false
      }
    }
  })
}

const createGroup = async (name: string) => {
  try {
    const response = await groupStore.createGroup(name)

    if (response.success) {
      message.success('分组创建成功')
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

const handleGroupMenuClick = (group: any, event: MouseEvent) => {
  event.preventDefault()
  event.stopPropagation()
  showDropdown.value = true
  dropdownX.value = event.clientX
  dropdownY.value = event.clientY + 30 // Offset by button height
  activeDropdownGroup.value = group
}

const handleGroupContextMenu = (group: any, event: MouseEvent) => {
  event.preventDefault()
  showDropdown.value = true
  dropdownX.value = event.clientX
  dropdownY.value = event.clientY
  activeDropdownGroup.value = group
}

// 获取分组操作菜单选项
const getGroupDropdownOptions = (group: any) => {
  return [
    {
      label: '重命名',
      key: 'rename',
      icon: () => h('i', { class: 'i-carbon-edit' }, '✏️')
    },
    {
      label: group.is_enabled !== false ? '禁用' : '启用',
      key: 'toggle',
      icon: () => h('i', {}, group.is_enabled !== false ? '🚫' : '✅')
    },
    {
      type: 'divider' as const
    },
    {
      label: '删除',
      key: 'delete',
      icon: () => h('i', { class: 'text-red-500' }, '🗑️')
    }
  ]
}

// 处理分组菜单操作
const handleGroupAction = async (key: string) => {
  showDropdown.value = false
  const group = activeDropdownGroup.value
  if (!group) return

  switch (key) {
    case 'rename':
      handleRenameGroup(group)
      break
    case 'toggle':
      await handleToggleGroup(group)
      break
    case 'delete':
      await handleDeleteGroup(group)
      break
  }
}

// 重命名分组
const handleRenameGroup = (group: any) => {
  const newName = ref(group.name || '')

  dialog.create({
    title: '重命名分组',
    content: () => {
      return h('div', { class: 'py-2' }, [
        h('p', { class: 'text-gray-600 mb-4' }, '请输入新的分组名称'),
        h('input', {
          type: 'text',
          placeholder: '分组名称',
          value: newName.value,
          onInput: (e: any) => {
            newName.value = e.target.value
          },
          onKeydown: (e: KeyboardEvent) => {
            if (e.key === 'Enter') {
              dialog.destroyAll()
              if (newName.value.trim() && newName.value.trim() !== group.name) {
                renameGroupWithConfirm(group, newName.value.trim())
              }
            }
          },
          class: 'w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
          autofocus: true
        })
      ])
    },
    positiveText: '保存',
    negativeText: '取消',
    onPositiveClick: async () => {
      if (newName.value.trim()) {
        if (newName.value.trim() === group.name) {
          message.info('分组名称未修改')
          return true
        }
        await renameGroupWithConfirm(group, newName.value.trim())
        return true
      } else {
        message.warning('分组名称不能为空')
        return false
      }
    }
  })
}

// 确认并执行重命名
const renameGroupWithConfirm = async (group: any, name: string) => {
  try {
    const response = await groupStore.renameGroup(group.id, name)
    if (response.success) {
      message.success('分组重命名成功')
    } else {
      message.error(response.message || '重命名失败')
    }
  } catch (error: any) {
    console.error('Rename group failed:', error)
    message.error(error.message || '重命名失败')
  }
}

// 切换分组启用状态
const handleToggleGroup = async (group: any) => {
  try {
    const response = await groupStore.toggleGroupEnabled(group.id)
    if (response.success) {
      message.success(`分组已${group.is_enabled !== false ? '禁用' : '启用'}`)
    } else {
      message.error(response.message || '操作失败')
    }
  } catch (error: any) {
    console.error('Toggle group failed:', error)
    message.error(error.message || '操作失败')
  }
}

// 删除分组
const handleDeleteGroup = async (group: any) => {
  dialog.warning({
    title: '确认删除',
    content: `确定要删除分组 "${group.name}" 吗？分组下的节点将变为"未分组"。`,
    positiveText: '确定删除',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        const response = await groupStore.deleteGroupApi(group.id)
        if (response.success) {
          message.success('分组删除成功')
          if (selectedGroupId.value === group.id) {
            selectedGroupId.value = 'all'
          }
        } else {
          message.error(response.message || '删除失败')
        }
      } catch (error: any) {
        console.error('Delete group failed:', error)
        message.error(error.message || '删除失败')
      }
    }
  })
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
  try {
    await Promise.all([
      handleRefresh(),
      groupStore.fetchGroups()
    ])
  } finally {
    // 确保无论数据加载是否成功，都隐藏loading
    pageLoading.value = false
  }

  // 添加顶部栏事件监听
  window.addEventListener('header-action', handleHeaderAction as unknown as EventListener)
})

// 组件卸载时移除事件监听
onUnmounted(() => {
  window.removeEventListener('header-action', handleHeaderAction as unknown as EventListener)
})

// 顶部栏事件处理
const handleHeaderAction = async (event: Event) => {
  const customEvent = event as CustomEvent<{ type: string; action: string }>
  const { type, action } = customEvent.detail

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
      case 'manual-sort':
        handleStartSorting()
        break
      case 'auto-sort':
        handleBatchActionWrapper('sort')
        break
      case 'deduplicate':
        handleBatchActionWrapper('deduplicate')
        break
      case 'clear':
        handleBatchActionWrapper('clear')
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

/* ==================== 移动端列表视图样式 ==================== */
.mobile-list-view {
  @apply bg-white rounded-lg shadow-sm;
  border: 1px solid rgba(0, 0, 0, 0.06);
  overflow: visible;
}

.mobile-node-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.mobile-node-item {
  @apply border-b border-gray-100 px-4 py-3;
  transition: background-color 0.2s;
}

.mobile-node-item:last-child {
  border-bottom: none;
}

.mobile-node-item:hover {
  background-color: rgba(0, 0, 0, 0.02);
}

.node-item-header {
  @apply flex items-center space-x-3 mb-2;
}

.node-status-indicator {
  flex-shrink: 0;
}

.status-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

.status-healthy {
  background-color: #63e2b7;
}

.status-unhealthy {
  background-color: #e88080;
}

.status-unknown {
  background-color: #cccccc;
}

.status-testing {
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.node-name {
  @apply font-medium text-gray-900;
  word-break: break-word;
}

.node-item-body {
  @apply flex flex-col gap-1 mb-3 pl-5;
}

.node-info-row {
  @apply flex items-center text-sm;
}

.node-label {
  @apply text-gray-500 mr-2;
  min-width: 60px;
}

.node-value {
  @apply text-gray-700;
}

.text-green-600 {
  color: #16a34a;
}

.text-blue-600 {
  color: #2563eb;
}

.text-yellow-600 {
  color: #ca8a04;
}

.text-red-600 {
  color: #dc2626;
}

.node-item-actions {
  @apply flex items-center space-x-2 pl-5;
}

.mobile-pagination {
  @apply flex justify-center pt-4 pb-2;
}

/* 深色模式 - 移动端列表 */
.dark .mobile-list-view {
  @apply bg-gray-800;
  border-color: rgba(75, 85, 99, 0.3);
}

.dark .mobile-node-item {
  @apply border-b border-gray-700;
}

.dark .mobile-node-item:hover {
  background-color: rgba(255, 255, 255, 0.05);
}

.dark .node-name {
  @apply text-gray-100;
}

.dark .node-label {
  @apply text-gray-400;
}

.dark .node-value {
  @apply text-gray-300;
}
</style>