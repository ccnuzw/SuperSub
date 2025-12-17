/**
 * 节点表格组件
 * 显示节点列表的表格视图
 */

<template>
  <div class="node-table-container">
    <!-- 工具栏 -->
    <div class="table-toolbar">
      <div class="toolbar-left">
        <n-space>
          <n-button
            v-if="hasSelected"
            type="error"
            size="small"
            @click="$emit('batch-delete')"
          >
            <template #icon>
              <n-icon><TrashOutline /></n-icon>
            </template>
            删除 ({{ selectedCount }})
          </n-button>

          <n-button
            v-if="hasSelected"
            type="primary"
            size="small"
            @click="$emit('test-selected')"
          >
            <template #icon>
              <n-icon><FlashOutline /></n-icon>
            </template>
            批量测试
          </n-button>

          <n-button
            type="default"
            size="small"
            @click="$emit('batch-import')"
          >
            <template #icon>
              <n-icon><AddOutline /></n-icon>
            </template>
            批量导入
          </n-button>
        </n-space>
      </div>

      <div class="toolbar-right">
        <n-space>
          <n-button
            size="small"
            @click="$emit('test-all')"
            :loading="testingAll"
          >
            <template #icon>
              <n-icon><FlashOutline /></n-icon>
            </template>
            全部测试
          </n-button>

          <n-dropdown
            :options="batchActions"
            placement="bottom-end"
            @select="$emit('batch-action', $event)"
          >
            <n-button size="small">
              批量操作
              <template #icon>
                <n-icon><EllipsisVerticalOutline /></n-icon>
              </template>
            </n-button>
          </n-dropdown>
        </n-space>
      </div>
    </div>

    <!-- 搜索和筛选 -->
    <div class="table-filters">
      <n-input
        v-model:value="searchKeyword"
        placeholder="搜索节点名称、服务器..."
        clearable
        class="max-w-[300px]"
      >
        <template #prefix>
          <n-icon><SearchOutline /></n-icon>
        </template>
      </n-input>
    </div>

    <!-- 数据表格 -->
    <n-data-table
      :columns="columns"
      :data="filteredNodes"
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
import { computed, h, ref, onBeforeUnmount } from 'vue'
import {
  NButton,
  NTag,
  NSpace,
  NIcon,
  NDropdown,
  NInput,
  NSpin,
  NTooltip,
  type DataTableColumns,
  type DropdownOption
} from 'naive-ui'
import {
  TrashOutline,
  FlashOutline,
  AddOutline,
  EllipsisVerticalOutline,
  CreateOutline,
  CopyOutline,
  SpeedometerOutline,
  SearchOutline
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
  'batch-delete': []
  'batch-action': [action: string]
  'batch-import': []
  'test-selected': []
  'test-all': []
  'test-node': [node: INode]
  'edit': [node: INode]
  'delete': [node: INode]
  'copy': [node: INode]
  'move-to-group': [nodes: INode[]]
}>()

// 搜索关键词
const searchKeyword = ref('')

// 计算属性
const hasSelected = computed(() => (props.selectedKeys || []).length > 0)
const selectedCount = computed(() => (props.selectedKeys || []).length)
const testingCount = computed(() => props.testingIds.size)
const testingAll = ref(false)

// 过滤后的节点
const filteredNodes = computed(() => {
  if (!searchKeyword.value.trim()) {
    return props.nodes
  }

  const keyword = searchKeyword.value.toLowerCase()
  return props.nodes.filter(node =>
    node.name.toLowerCase().includes(keyword) ||
    node.server.toLowerCase().includes(keyword) ||
    (node.region && node.region.toLowerCase().includes(keyword))
  )
})

// 表格配置
const paginationConfig = computed(() => ({
  page: props.pagination.page,
  pageSize: props.pagination.pageSize,
  itemCount: filteredNodes.value.length,
  showSizePicker: true,
  pageSizes: [20, 50, 100, 200],
  showQuickJumper: true
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
      case 'copy':
        emit('copy', node)
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

      h(NButton, {
        size: 'small',
        onClick: () => emit('edit', node)
      }, {
        default: () => '编辑'
      }),

      h(NDropdown, {
        options,
        onSelect: handleSelect,
        trigger: 'click'
      }, {
        default: () => h(NButton, {
          size: 'small',
          circle: true
        }, {
          default: () => h(NIcon, null, {
            default: () => h(EllipsisVerticalOutline)
          })
        })
      })
    ]
  })
}

// 批量操作菜单
const batchActions: DropdownOption[] = [
  {
    label: '排序',
    key: 'sort'
  },
  {
    label: '去重',
    key: 'deduplicate'
  },
  {
    type: 'divider'
  },
  {
    label: '清空当前分组',
    key: 'clear'
  }
]

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
    width: 200,
    fixed: 'right',
    render: (row) => renderActions(row)
  }
]

// 组件卸载时清理
onBeforeUnmount(() => {
  // 停止所有正在进行的测试操作
  testingAll.value = false
})
</script>

<style scoped>
.node-table-container {
  @apply bg-white rounded-lg shadow-sm;
}

.table-toolbar {
  @apply flex justify-between items-center p-4 border-b border-gray-200;
}

.toolbar-left,
.toolbar-right {
  @apply flex items-center space-x-3;
}

.table-filters {
  @apply px-4 py-3 border-b border-gray-200 bg-gray-50;
}

.testing-indicator {
  @apply flex items-center space-x-2 px-4 py-3 bg-blue-50 border-t border-blue-200;
}

.testing-text {
  @apply text-sm text-blue-700 font-medium;
}

/* 深色模式 */
.dark .node-table-container {
  @apply bg-gray-800;
}

.dark .table-toolbar {
  @apply border-gray-700;
}

.dark .table-filters {
  @apply border-gray-700 bg-gray-700/50;
}

.dark .testing-indicator {
  @apply bg-blue-900/20 border-blue-800;
}

.dark .testing-text {
  @apply text-blue-400;
}
</style>