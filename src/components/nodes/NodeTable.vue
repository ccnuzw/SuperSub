/**
 * 节点表格组件
 * 显示节点列表的表格视图
 */

<template>
  <div class="node-table-container">
    <!-- 批量操作栏 - 当有选中节点时显示 -->
    <div v-if="selectedKeys.length > 0" class="batch-actions-bar">
      <div class="batch-actions-content">
        <span class="selected-count">
          已选择 {{ selectedKeys.length }} 个节点
        </span>

        <div class="batch-actions-buttons">
          <n-button
            type="primary"
            size="small"
            @click="handleBatchTest"
            :loading="batchTesting"
          >
            <template #icon>
              <n-icon><SpeedometerOutline /></n-icon>
            </template>
            批量测试
          </n-button>

          <n-button
            type="default"
            size="small"
            @click="handleBatchExport"
          >
            <template #icon>
              <n-icon><DownloadOutline /></n-icon>
            </template>
            导出选中
          </n-button>

          <n-dropdown
            :options="batchMenuOptions"
            placement="bottom-end"
            @select="handleBatchMenuAction"
          >
            <n-button size="small" quaternary>
              更多操作
              <template #icon>
                <n-icon><EllipsisVerticalOutline /></n-icon>
              </template>
            </n-button>
          </n-dropdown>
        </div>
      </div>
    </div>

    <!-- 数据表格 -->
    <n-data-table
      :columns="columns"
      :data="nodes"
      :loading="loading"
      :pagination="paginationConfig"
      :row-key="(row: INode) => row.id"
      :checked-row-keys="(selectedKeys || [])"
      @update:checked-row-keys="$emit('update:selected-keys', $event)"
      :scroll-x="1200"
    />

    <!-- 节点状态指示器 -->
    <div v-if="testingCount > 0" class="testing-indicator">
      <n-spin size="small" />
      <span class="testing-text">
        正在测试 {{ testingCount }} 个节点...
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, h, ref } from 'vue'
import {
  NButton,
  NTag,
  NSpace,
  NIcon,
  NDropdown,
  NSpin,
  NTooltip,
  type DataTableColumns,
  type DropdownOption
} from 'naive-ui'
import {
  CreateOutline,
  CopyOutline,
  SpeedometerOutline,
  TrashOutline,
  EllipsisVerticalOutline,
  DownloadOutline
} from '@vicons/ionicons5'
import type { INode } from '@/types'
import { businessUtils } from '@/components/business'

interface IProps {
  nodes: INode[]
  loading: boolean
  selectedKeys?: string[]
  testingIds?: Set<string>
  pagination?: {
    page: number
    pageSize: number
    itemCount: number
  }
}

const props = withDefaults(defineProps<IProps>(), {
  selectedKeys: () => [],
  testingIds: () => new Set(),
  pagination: () => ({ page: 1, pageSize: 20, itemCount: 0 })
})

const emit = defineEmits<{
  'update:selected-keys': [keys: string[]]
  'test-node': [node: INode]
  'edit': [node: INode]
  'delete': [node: INode]
  'copy': [node: INode]
  'move-to-group': [nodes: INode[]]
  'batch-test': []
  'batch-delete': []
  'batch-export': []
  'cleanup-invalid': []
  'test-all-nodes': []
}>()

// 计算属性
const selectedCount = computed(() => (props.selectedKeys || []).length)
const testingCount = computed(() => props.testingIds.size)
const batchTesting = ref(false)

// 批量操作菜单选项
const batchMenuOptions: DropdownOption[] = [
  {
    label: '批量删除',
    key: 'batch-delete',
    icon: () => h(NIcon, null, { default: () => h(TrashOutline) })
  },
  {
    label: '全选当前页',
    key: 'select-all-page',
    icon: () => h(NIcon, null, { default: () => h(CopyOutline) })
  },
  {
    label: '取消选择',
    key: 'deselect-all',
    icon: () => h(NIcon, null, { default: () => h(CreateOutline) })
  },
  {
    type: 'divider' as const
  },
  {
    label: '清理无效节点',
    key: 'cleanup',
    icon: () => h(NIcon, null, { default: () => h(TrashOutline) })
  },
  {
    label: '测试所有节点',
    key: 'test-all',
    icon: () => h(NIcon, null, { default: () => h(SpeedometerOutline) })
  }
]

// 表格配置
const paginationConfig = computed(() => ({
  page: props.pagination.page,
  pageSize: props.pagination.pageSize,
  itemCount: props.pagination.itemCount,
  showSizePicker: true,
  pageSizes: [10, 20, 50, 100, 200],
  showQuickJumper: true,
  // 确保表格高度自适应
  scrollX: 1200
  // 不设置 maxHeight，让表格高度自适应内容
}))

// 状态渲染
const renderStatus = (node: INode) => {
  const statusConfig: Record<string, { type: 'info' | 'success' | 'warning' | 'error', text: string }> = {
    healthy: { type: 'success', text: '正常' },
    unhealthy: { type: 'error', text: '异常' },
    testing: { type: 'info', text: '测试中' },
    unknown: { type: 'warning', text: '未知' }
  }

  const config = statusConfig[node.status] || statusConfig.unknown
  const isTesting = props.testingIds.has(node.id)

  return h(NTag, {
    type: isTesting ? 'info' : config.type,
    size: 'small'
  }, {
    default: () => isTesting ? '测试中' : config.text
  })
}

// 延迟渲染
const renderLatency = (node: INode) => {
  if (!node.latency || props.testingIds.has(node.id)) {
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

// 协议渲染
const renderProtocol = (protocol: string) => {
  const variant = businessUtils.getProtocolVariant(protocol)
  return h(NTag, {
    type: variant as any,
    size: 'small'
  }, {
    default: () => protocol.toUpperCase()
  })
}

// 操作按钮渲染
const renderActions = (node: INode) => {
  const isTesting = props.testingIds.has(node.id)

  const options: DropdownOption[] = [
    {
      label: '复制节点',
      key: 'copy',
      icon: () => h(NIcon, null, { default: () => h(CopyOutline) })
    },
    {
      label: '测试连接',
      key: 'test',
      icon: () => h(NIcon, null, { default: () => h(SpeedometerOutline) })
    },
    {
      label: '编辑节点',
      key: 'edit',
      icon: () => h(NIcon, null, { default: () => h(CreateOutline) })
    },
    {
      label: '移动到分组',
      key: 'move-to-group',
      icon: () => h(NIcon, null, { default: () => h(SpeedometerOutline) })
    },
    {
      type: 'divider' as const
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
      case 'copy':
        emit('copy', node)
        break
      case 'test':
        emit('test-node', node)
        break
      case 'edit':
        emit('edit', node)
        break
      case 'move-to-group':
        emit('move-to-group', [node])
        break
      case 'delete':
        emit('delete', node)
        break
    }
  }

  return h(NSpace, { size: 'small' }, {
    default: () => [
      // 测试按钮
      h(NTooltip, {}, {
        trigger: () => h(NButton, {
          size: 'small',
          type: 'primary',
          loading: isTesting,
          onClick: () => emit('test-node', node)
        }, {
          default: () => '测试'
        }),
        default: () => '测试连接'
      }),

      // 编辑按钮
      h(NButton, {
        size: 'small',
        type: 'default',
        onClick: () => emit('edit', node)
      }, {
        default: () => '编辑'
      }),

      // 更多操作下拉菜单
      h(NDropdown, {
        options,
        onSelect: handleSelect,
        trigger: 'click',
        placement: 'bottom-end'
      }, {
        default: () => h(NButton, {
          size: 'small',
          type: 'default',
          circle: true,
          style: { marginLeft: '4px' }
        }, {
          default: () => h(NIcon, null, {
            default: () => h(EllipsisVerticalOutline)
          })
        })
      })
    ]
  })
}

// 批量操作处理函数
const handleBatchTest = () => {
  emit('batch-test')
}

const handleBatchExport = () => {
  emit('batch-export')
}

const handleBatchMenuAction = (key: string) => {
  switch (key) {
    case 'batch-delete':
      emit('batch-delete')
      break
    case 'select-all-page':
      // 选择当前页所有节点
      const currentPageNodeIds = nodes.value.map(node => node.id)
      emit('update:selected-keys', currentPageNodeIds)
      break
    case 'deselect-all':
      // 取消所有选择
      emit('update:selected-keys', [])
      break
    case 'cleanup':
      emit('cleanup-invalid')
      break
    case 'test-all':
      emit('test-all-nodes')
      break
  }
}

// 表格列定义
const columns: DataTableColumns<INode> = [
  {
    type: 'selection'
  },
  {
    title: '节点名称',
    key: 'name',
    width: 200,
    ellipsis: {
      tooltip: true
    }
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
    width: 80
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
    render: (row) => renderLatency(row)
  },
  {
    title: '操作',
    key: 'actions',
    width: 250,
    minWidth: 200,
    fixed: 'right',
    render: (row) => renderActions(row)
  }
]
</script>

<style scoped>
.node-table-container {
  @apply bg-white rounded-lg shadow-sm;
  border: 1px solid rgba(0, 0, 0, 0.06);
  overflow: visible;
  /* 确保容器高度自适应内容 */
  height: auto;
  min-height: auto;
  /* 减少底部间距 */
  margin-bottom: 12px;
}

/* 批量操作栏 */
.batch-actions-bar {
  @apply border-b border-gray-200 bg-blue-50 px-4 py-3 rounded-t-lg;
  animation: slideDown 0.2s ease-out;
}

.batch-actions-content {
  @apply flex items-center justify-between;
}

.selected-count {
  @apply text-sm text-blue-700 font-medium;
}

.batch-actions-buttons {
  @apply flex items-center space-x-2;
}

/* 表格容器样式 */
.node-table-container :deep(.n-data-table) {
  @apply rounded-none;
  border: none;
}

.node-table-container :deep(.n-data-table .n-data-table-base-table) {
  border-radius: 0;
}

/* 调试样式 - 确保操作列可见 */
:deep(.n-data-table .n-data-table-td[data-col-key="actions"]) {
  min-width: 250px !important;
  width: 250px !important;
}

:deep(.n-data-table .n-data-table-th[data-col-key="actions"]) {
  min-width: 250px !important;
  width: 250px !important;
}

.testing-indicator {
  @apply flex items-center space-x-2 px-4 py-3 bg-blue-50 border-t border-blue-200 rounded-b-lg;
}

.testing-text {
  @apply text-sm text-blue-700 font-medium;
}

/* 深色模式 */
.dark .node-table-container {
  @apply bg-gray-800;
  border-color: rgba(75, 85, 99, 0.3);
}

/* 通用分页器间距 - 减少不必要的间距 */
.node-table-container :deep(.n-data-table .n-data-table-pagination) {
  padding-right: 16px;
  padding-bottom: 8px;
  padding-top: 8px;
}

.dark .batch-actions-bar {
  @apply border-gray-700 bg-blue-900/20;
}

.dark .selected-count {
  @apply text-blue-400;
}

.dark .testing-indicator {
  @apply bg-blue-900/20 border-blue-800 rounded-b-lg;
}

.dark .testing-text {
  @apply text-blue-400;
}

/* 桌面端大屏幕优化 */
@media (min-width: 1200px) {
  .node-table-container {
    @apply bg-white rounded-lg shadow-sm;
    border: 1px solid rgba(0, 0, 0, 0.06);
    overflow: visible;
    /* 移除高度限制，让内容自然展示 */
  }

  /* 确保表格不会被截断 */
  .node-table-container :deep(.n-data-table) {
    overflow: visible;
  }

  /* 添加分页器间距 */
  .node-table-container :deep(.n-data-table .n-data-table-pagination) {
    padding-right: 24px;
    padding-bottom: 16px;
    padding-top: 16px;
  }

  :deep(.n-data-table .n-data-table-base-table) {
    @apply text-sm;
  }

  :deep(.n-data-table .n-data-table-th) {
    @apply font-semibold;
  }

  .batch-actions-buttons {
    @apply space-x-3;
  }
}

/* 超宽屏优化 */
@media (min-width: 1600px) {
  .node-table-container {
    @apply bg-white rounded-lg shadow-sm;
    border: 1px solid rgba(0, 0, 0, 0.06);
    overflow: visible;
  }

  .node-table-container :deep(.n-data-table) {
    overflow: visible;
  }

  /* 添加分页器间距 */
  .node-table-container :deep(.n-data-table .n-data-table-pagination) {
    padding-right: 32px;
    padding-bottom: 20px;
    padding-top: 20px;
  }

  :deep(.n-data-table .n-data-table-base-table) {
    @apply text-base;
  }

  .batch-actions-bar {
    @apply px-6 py-4;
  }
}

/* 4K屏幕优化 */
@media (min-width: 1921px) {
  .node-table-container {
    @apply bg-white rounded-lg shadow-sm;
    border: 1px solid rgba(0, 0, 0, 0.06);
    overflow: visible;
  }

  .node-table-container :deep(.n-data-table) {
    overflow: visible;
  }

  /* 添加分页器间距 */
  .node-table-container :deep(.n-data-table .n-data-table-pagination) {
    padding-right: 40px;
    padding-bottom: 24px;
    padding-top: 24px;
  }

  :deep(.n-data-table .n-data-table-base-table) {
    @apply text-lg;
  }

  .batch-actions-bar {
    @apply px-8 py-5;
  }

  .batch-actions-buttons {
    @apply space-x-4;
  }

  .testing-indicator {
    @apply px-8 py-4;
  }
}

/* 动画效果 */
@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>