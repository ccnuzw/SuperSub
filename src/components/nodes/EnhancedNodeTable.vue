/**
 * 增强版节点表格组件
 * 提供完整的节点管理功能
 */

<template>
  <div class="enhanced-node-table">
    <!-- 工具栏 -->
    <div class="table-toolbar">
      <div class="toolbar-left">
        <n-space>
          <!-- 批量操作按钮 -->
          <n-button
            v-if="hasSelection"
            type="error"
            size="small"
            :disabled="!hasSelection"
            @click="handleBatchDelete"
          >
            <template #icon>
              <n-icon><TrashOutline /></n-icon>
            </template>
            删除 ({{ selectionCount }})
          </n-button>

          <n-button
            v-if="hasSelection"
            type="primary"
            size="small"
            :disabled="!hasSelection"
            @click="handleBatchTest"
          >
            <template #icon>
              <n-icon><FlashOutline /></n-icon>
            </template>
            批量测试 ({{ selectionCount }})
          </n-button>

          <n-dropdown
            v-if="hasSelection"
            :options="batchActions"
            placement="bottom-start"
            @select="handleBatchAction"
          >
            <n-button size="small">
              批量操作
              <template #icon>
                <n-icon><EllipsisVerticalOutline /></n-icon>
              </template>
            </n-button>
          </n-dropdown>

          <n-divider v-if="hasSelection" vertical />

          <!-- 单独操作按钮 -->
          <n-button
            type="default"
            size="small"
            @click="handleImportNodes"
          >
            <template #icon>
              <n-icon><AddOutline /></n-icon>
            </template>
            导入节点
          </n-button>

          <n-button
            type="default"
            size="small"
            @click="handleExportNodes"
            :disabled="nodes.length === 0"
          >
            <template #icon>
              <n-icon><DownloadOutline /></n-icon>
            </template>
            导出节点
          </n-button>
        </n-space>
      </div>

      <div class="toolbar-right">
        <n-space>
          <!-- 全选/取消全选 -->
          <n-button
            size="small"
            quaternary
            @click="toggleAllSelection"
          >
            {{ isAllSelected ? '取消全选' : '全选' }}
          </n-button>

          <!-- 刷新 -->
          <n-button
            size="small"
            quaternary
            :loading="loading"
            @click="handleRefresh"
          >
            <template #icon>
              <n-icon><RefreshOutline /></n-icon>
            </template>
          </n-button>
        </n-space>
      </div>
    </div>

    <!-- 搜索和筛选栏 -->
    <div class="table-filters">
      <div class="filters-left">
        <n-input
          v-model:value="searchQuery"
          placeholder="搜索节点名称、服务器地址..."
          clearable
          class="search-input"
          @input="handleSearch"
        >
          <template #prefix>
            <n-icon><SearchOutline /></n-icon>
          </template>
        </n-input>
      </div>

      <div class="filters-right">
        <n-space>
          <!-- 协议筛选 -->
          <n-select
            v-model:value="protocolFilters"
            :options="protocolOptions"
            placeholder="协议筛选"
            multiple
            clearable
            size="small"
            style="min-width: 120px"
            @update:value="handleFilterChange"
          />

          <!-- 状态筛选 -->
          <n-select
            v-model:value="statusFilters"
            :options="statusOptions"
            placeholder="状态筛选"
            multiple
            clearable
            size="small"
            style="min-width: 120px"
            @update:value="handleFilterChange"
          />

          <!-- 清除筛选 -->
          <n-button
            v-if="hasActiveFilters"
            size="small"
            quaternary
            @click="clearFilters"
          >
            清除筛选
          </n-button>
        </n-space>
      </div>
    </div>

    <!-- 节点表格 -->
    <div class="table-container">
      <n-data-table
        :columns="columns"
        :data="filteredNodes"
        :loading="loading"
        :pagination="paginationConfig"
        :row-key="(row: INode) => row.id"
        :checked-row-keys="selectedNodeIds"
        :striped="true"
        size="small"
        virtual-scroll
        :scroll-x="1400"
        @update:checked-row-keys="handleSelectionChange"
        @update:page="handlePageChange"
        @update:page-size="handlePageSizeChange"
      />
    </div>

    <!-- 测试状态指示器 -->
    <div v-if="testingNodes.size > 0" class="testing-indicator">
      <n-space align="center">
        <n-spin size="small" />
        <span class="testing-text">
          正在测试 {{ testingNodes.size }} 个节点...
        </span>
        <n-button size="tiny" quaternary @click="stopAllTests">
          停止测试
        </n-button>
      </n-space>
    </div>

    <!-- 统计信息 -->
    <div v-if="showStats" class="table-stats">
      <n-space size="small">
        <n-tag size="small" type="info">
          共 {{ totalNodes }} 个节点
        </n-tag>
        <n-tag v-if="filteredNodes.length !== totalNodes" size="small" type="primary">
          筛选显示 {{ filteredNodes.length }} 个
        </n-tag>
        <n-tag v-if="healthyNodes > 0" size="small" type="success">
          正常 {{ healthyNodes }}
        </n-tag>
        <n-tag v-if="unhealthyNodes > 0" size="small" type="error">
          异常 {{ unhealthyNodes }}
        </n-tag>
      </n-space>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, h, onBeforeUnmount, watch } from 'vue'
import {
  NDataTable,
  NButton,
  NSpace,
  NIcon,
  NDropdown,
  NInput,
  NSelect,
  NTag,
  NSpin,
  NDivider,
  useMessage,
  useDialog,
  type DataTableColumns,
  type DropdownOption
} from 'naive-ui'
import {
  TrashOutline,
  FlashOutline,
  AddOutline,
  DownloadOutline,
  EllipsisVerticalOutline,
  RefreshOutline,
  SearchOutline,
  CreateOutline,
  CopyOutline,
  SpeedometerOutline,
  CheckmarkOutline,
  CloseOutline,
  WarningOutline,
  TimeOutline
} from '@vicons/ionicons5'
import type { INode } from '@/types'
import { useNodeManagement } from '@/composables/useNodeManagementLogic'
import { businessUtils } from '@/components/business'

interface IProps {
  nodes: INode[]
  loading?: boolean
  selectedNodeIds?: string[]
  testingNodes?: Set<string>
  showStats?: boolean
  pagination?: {
    page: number
    pageSize: number
    itemCount: number
  }
}

const props = withDefaults(defineProps<IProps>(), {
  loading: false,
  selectedNodeIds: () => [],
  testingNodes: () => new Set(),
  showStats: true,
  pagination: () => ({ page: 1, pageSize: 20, itemCount: 0 })
})

const emit = defineEmits<{
  'update:selectedNodeIds': [ids: string[]]
  'test-node': [node: INode]
  'edit-node': [node: INode]
  'delete-node': [node: INode]
  'copy-node': [node: INode]
  'move-to-group': [nodes: INode[]]
  'refresh': []
  'import-nodes': []
  'export-nodes': [nodes: INode[]]
  'batch-test': [nodes: INode[]]
  'batch-delete': [nodes: INode[]]
  'batch-move': [nodes: INode[], groupId: string | null]
}>()

const message = useMessage()
const dialog = useDialog()

// 本地状态
const searchQuery = ref('')
const protocolFilters = ref<string[]>([])
const statusFilters = ref<string[]>([])

// 使用节点管理逻辑
const {
  testNode,
  deleteNode,
  healthCheck,
  moveToGroup,
  stopStatusPolling
} = useNodeManagement()

// 计算属性
const selectedNodeIds = computed(() => props.selectedNodeIds)
const testingNodes = computed(() => props.testingNodes)

const hasSelection = computed(() => selectedNodeIds.value.length > 0)
const selectionCount = computed(() => selectedNodeIds.value.length)
const isAllSelected = computed(() =>
  filteredNodes.value.length > 0 &&
  selectedNodeIds.value.length === filteredNodes.value.length
)

const totalNodes = computed(() => props.nodes.length)

const hasActiveFilters = computed(() =>
  searchQuery.value.trim() ||
  protocolFilters.value.length > 0 ||
  statusFilters.value.length > 0
)

// 过滤后的节点
const filteredNodes = computed(() => {
  let filtered = props.nodes

  // 搜索过滤
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(node =>
      node.name.toLowerCase().includes(query) ||
      node.server.toLowerCase().includes(query) ||
      (node.region && node.region.toLowerCase().includes(query))
    )
  }

  // 协议过滤
  if (protocolFilters.value.length > 0) {
    filtered = filtered.filter(node =>
      protocolFilters.value.includes(node.protocol)
    )
  }

  // 状态过滤
  if (statusFilters.value.length > 0) {
    filtered = filtered.filter(node =>
      node.status && statusFilters.value.includes(node.status)
    )
  }

  return filtered
})

// 节点统计
const healthyNodes = computed(() =>
  filteredNodes.value.filter(node => node.status === 'healthy').length
)

const unhealthyNodes = computed(() =>
  filteredNodes.value.filter(node => node.status === 'unhealthy').length
)

// 协议选项
const protocolOptions = computed(() => {
  const protocols = [...new Set(props.nodes.map(node => node.protocol))]
  return protocols.map(protocol => ({
    label: protocol.toUpperCase(),
    value: protocol
  }))
})

// 状态选项
const statusOptions = [
  { label: '正常', value: 'healthy' },
  { label: '异常', value: 'unhealthy' },
  { label: '测试中', value: 'testing' },
  { label: '未知', value: 'unknown' }
]

// 分页配置
const paginationConfig = computed(() => ({
  page: props.pagination.page,
  pageSize: props.pagination.pageSize,
  itemCount: filteredNodes.value.length,
  showSizePicker: true,
  pageSizes: [20, 50, 100, 200],
  showQuickJumper: true
}))

// 批量操作选项
const batchActions: DropdownOption[] = [
  {
    label: '移动到分组',
    key: 'move-to-group',
    icon: () => h(NIcon, null, { default: () => h(SpeedometerOutline) })
  },
  {
    label: '复制节点链接',
    key: 'copy-links',
    icon: () => h(NIcon, null, { default: () => h(CopyOutline) })
  },
  {
    type: 'divider'
  },
  {
    label: '按延迟排序',
    key: 'sort-by-latency',
    icon: () => h(NIcon, null, { default: () => h(TimeOutline) })
  },
  {
    label: '按名称排序',
    key: 'sort-by-name',
    icon: () => h(NIcon, null, { default: () => h(RefreshOutline) })
  }
]

// 表格列定义
const columns: DataTableColumns<INode> = [
  {
    type: 'selection',
    width: 50
  },
  {
    title: '节点名称',
    key: 'name',
    width: 200,
    ellipsis: {
      tooltip: true
    },
    sorter: (a, b) => a.name.localeCompare(b.name)
  },
  {
    title: '服务器',
    key: 'server',
    width: 150,
    ellipsis: {
      tooltip: true
    }
  },
  {
    title: '端口',
    key: 'port',
    width: 80,
    sorter: (a, b) => a.port - b.port
  },
  {
    title: '协议',
    key: 'protocol',
    width: 100,
    render: (row) => renderProtocol(row.protocol)
  },
  {
    title: '地区',
    key: 'region',
    width: 100,
    render: (row) => row.region || '-'
  },
  {
    title: '状态',
    key: 'status',
    width: 100,
    render: (row) => renderStatus(row)
  },
  {
    title: '延迟',
    key: 'latency',
    width: 100,
    sorter: (a, b) => (a.latency || 9999) - (b.latency || 9999),
    render: (row) => renderLatency(row)
  },
  {
    title: '操作',
    key: 'actions',
    width: 200,
    fixed: 'right',
    render: (row) => renderActions(row)
  }
]

// 渲染函数
const renderStatus = (node: INode) => {
  const statusConfig: Record<string, { type: 'info' | 'success' | 'warning' | 'error', text: string, icon: any }> = {
    healthy: { type: 'success', text: '正常', icon: CheckmarkOutline },
    unhealthy: { type: 'error', text: '异常', icon: CloseOutline },
    testing: { type: 'info', text: '测试中', icon: TimeOutline },
    unknown: { type: 'warning', text: '未知', icon: WarningOutline }
  }

  const isTesting = testingNodes.value.has(node.id)
  const config = statusConfig[node.status] || statusConfig.unknown
  const IconComponent = isTesting ? TimeOutline : config.icon

  return h(NTag, {
    type: isTesting ? 'info' : config.type,
    size: 'small'
  }, {
    default: () => h(NSpace, { size: 'small', align: 'center' }, {
      default: () => [
        h(NIcon, { class: 'text-xs' }, { default: () => h(IconComponent) }),
        h('span', isTesting ? '测试中' : config.text)
      ]
    })
  })
}

const renderLatency = (node: INode) => {
  if (!node.latency || testingNodes.value.has(node.id)) {
    return '-'
  }

  const latency = node.latency
  const grade = businessUtils.getLatencyGrade(latency)
  const gradeColors: Record<string, string> = {
    excellent: 'text-green-600',
    good: 'text-blue-600',
    moderate: 'text-yellow-600',
    poor: 'text-red-600'
  }

  return h('span', {
    class: gradeColors[grade] || 'text-gray-600'
  }, `${latency}ms`)
}

const renderProtocol = (protocol: string) => {
  const variant = businessUtils.getProtocolVariant(protocol)
  return h(NTag, {
    type: variant as any,
    size: 'small'
  }, {
    default: () => protocol.toUpperCase()
  })
}

const renderActions = (node: INode) => {
  const isTesting = testingNodes.value.has(node.id)

  const options: DropdownOption[] = [
    {
      label: '编辑节点',
      key: 'edit',
      icon: () => h(NIcon, null, { default: () => h(CreateOutline) })
    },
    {
      label: '复制链接',
      key: 'copy',
      icon: () => h(NIcon, null, { default: () => h(CopyOutline) })
    },
    {
      label: '移动到分组',
      key: 'move-to-group',
      icon: () => h(NIcon, null, { default: () => h(SpeedometerOutline) })
    },
    {
      type: 'divider'
    },
    {
      label: '删除',
      key: 'delete',
      icon: () => h(NIcon, null, { default: () => h(TrashOutline) }),
      props: {
        style: { color: 'var(--n-error-color)' }
      }
    }
  ]

  const handleSelect = (key: string) => {
    switch (key) {
      case 'edit':
        emit('edit-node', node)
        break
      case 'copy':
        emit('copy-node', node)
        break
      case 'move-to-group':
        emit('move-to-group', [node])
        break
      case 'delete':
        emit('delete-node', node)
        break
    }
  }

  return h(NSpace, { size: 'small' }, {
    default: () => [
      h(NButton, {
        size: 'small',
        type: 'primary',
        loading: isTesting,
        onClick: () => emit('test-node', node)
      }, {
        default: () => '测试'
      }),

      h(NDropdown, {
        options,
        onSelect: handleSelect,
        trigger: 'click'
      }, {
        default: () => h(NButton, {
          size: 'small',
          quaternary
        }, {
          default: () => h(NIcon, null, { default: () => h(EllipsisVerticalOutline) })
        })
      })
    ]
  })
}

// 事件处理
const handleSelectionChange = (keys: (string | number)[]) => {
  emit('update:selectedNodeIds', keys as string[])
}

const handleSearch = () => {
  // 搜索逻辑已在计算属性中处理
}

const handleFilterChange = () => {
  // 筛选逻辑已在计算属性中处理
}

const handlePageChange = (page: number) => {
  // 由父组件处理
}

const handlePageSizeChange = (pageSize: number) => {
  // 由父组件处理
}

const toggleAllSelection = () => {
  if (isAllSelected.value) {
    emit('update:selectedNodeIds', [])
  } else {
    emit('update:selectedNodeIds', filteredNodes.value.map(node => node.id))
  }
}

const clearFilters = () => {
  searchQuery.value = ''
  protocolFilters.value = []
  statusFilters.value = []
}

const handleBatchTest = () => {
  const nodes = props.nodes.filter(node => selectedNodeIds.value.includes(node.id))
  emit('batch-test', nodes)
}

const handleBatchDelete = () => {
  const nodes = props.nodes.filter(node => selectedNodeIds.value.includes(node.id))
  emit('batch-delete', nodes)
}

const handleBatchAction = (key: string) => {
  const nodes = props.nodes.filter(node => selectedNodeIds.value.includes(node.id))

  switch (key) {
    case 'move-to-group':
      // 这里可以显示分组选择对话框
      emit('batch-move', nodes, null)
      break
    case 'copy-links':
      copyNodeLinks(nodes)
      break
    case 'sort-by-latency':
      // 由父组件处理排序
      break
    case 'sort-by-name':
      // 由父组件处理排序
      break
  }
}

const copyNodeLinks = async (nodes: INode[]) => {
  const links = nodes
    .map(node => node.link)
    .filter(Boolean)
    .join('\n')

  if (links) {
    try {
      await navigator.clipboard.writeText(links)
      message.success(`已复制 ${nodes.length} 个节点链接到剪贴板`)
    } catch (error) {
      message.error('复制失败')
    }
  }
}

const handleImportNodes = () => {
  emit('import-nodes')
}

const handleExportNodes = () => {
  emit('export-nodes', props.nodes)
}

const handleRefresh = () => {
  emit('refresh')
}

const stopAllTests = () => {
  stopStatusPolling()
  message.info('已停止所有测试')
}

// 组件卸载时清理
onBeforeUnmount(() => {
  stopStatusPolling()
})
</script>

<style scoped>
.enhanced-node-table {
  @apply bg-white rounded-lg shadow-sm overflow-hidden;
}

.table-toolbar {
  @apply flex justify-between items-center p-4 border-b border-gray-200 bg-gray-50;
}

.toolbar-left,
.toolbar-right {
  @apply flex items-center space-x-3;
}

.table-filters {
  @apply flex justify-between items-center p-4 border-b border-gray-200 bg-white;
}

.filters-left {
  @apply flex-1 max-w-md;
}

.filters-right {
  @apply flex-1 flex justify-end;
}

.search-input {
  @apply w-full;
}

.table-container {
  @apply min-h-[400px];
}

.testing-indicator {
  @apply flex items-center justify-between p-3 bg-blue-50 border-t border-blue-200;
}

.testing-text {
  @apply text-sm text-blue-700 font-medium flex-1;
}

.table-stats {
  @apply flex justify-between items-center p-4 border-t border-gray-200 bg-gray-50;
}

/* 深色模式 */
.dark .enhanced-node-table {
  @apply bg-gray-800;
}

.dark .table-toolbar {
  @apply border-gray-700 bg-gray-700;
}

.dark .table-filters {
  @apply border-gray-700 bg-gray-800;
}

.dark .table-container {
  @apply bg-gray-800;
}

.dark .testing-indicator {
  @apply bg-blue-900/20 border-blue-800;
}

.dark .testing-text {
  @apply text-blue-400;
}

.dark .table-stats {
  @apply border-gray-700 bg-gray-700;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .table-toolbar {
    @apply flex-col space-y-3;
  }

  .toolbar-left,
  .toolbar-right {
    @apply w-full justify-center;
  }

  .table-filters {
    @apply flex-col space-y-3;
  }

  .filters-left,
  .filters-right {
    @apply w-full;
  }

  .filters-right {
    @apply justify-start;
  }
}
</style>