/**
 * 订阅表格组件
 * 显示订阅列表的表格视图
 */

<template>
  <div class="subscription-table-container">
    <!-- 工具栏 -->
    <div class="table-toolbar">
      <div class="toolbar-left">
        <n-space>
          <n-button
            v-if="hasFailedSubscriptions"
            type="warning"
            size="small"
            @click="$emit('retry-failed')"
          >
            <template #icon>
              <n-icon><RefreshOutline /></n-icon>
            </template>
            重试失败 ({{ failedCount }})
          </n-button>

          <n-button
            v-if="hasFailedSubscriptions"
            type="error"
            size="small"
            @click="$emit('clear-failed')"
          >
            <template #icon>
              <n-icon><TrashOutline /></n-icon>
            </template>
            清除失败
          </n-button>

          <n-button
            type="primary"
            size="small"
            @click="$emit('update-all')"
            :loading="isUpdating"
          >
            <template #icon>
              <n-icon><SyncOutline /></n-icon>
            </template>
            全部更新
          </n-button>
        </n-space>
      </div>

      <div class="toolbar-right">
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
            批量删除 ({{ selectedCount }})
          </n-button>

          <n-button
            v-if="hasSelected"
            type="primary"
            size="small"
            @click="$emit('batch-update')"
          >
            <template #icon>
              <n-icon><SyncOutline /></n-icon>
            </template>
            批量更新
          </n-button>

          <n-button
            type="default"
            size="small"
            @click="$emit('bulk-import')"
          >
            <template #icon>
              <n-icon><AddOutline /></n-icon>
            </template>
            批量导入
          </n-button>
        </n-space>
      </div>
    </div>

    <!-- 数据表格 -->
    <n-data-table
      :columns="columns"
      :data="subscriptions"
      :loading="loading"
      :pagination="paginationConfig"
      :row-key="(row: Subscription) => row.id"
      :checked-row-keys="selectedKeys"
      @update:checked-row-keys="$emit('update:selected-keys', $event)"
      :scroll-x="1200"
    />

    <!-- 更新状态指示器 -->
    <div v-if="updatingCount > 0" class="updating-indicator">
      <n-progress
        type="line"
        :percentage="(updatedCount / totalUpdatingCount) * 100"
        :show-indicator="false"
      />
      <span class="updating-text">
        正在更新 {{ updatingCount }} 个订阅... ({{ updatedCount }}/{{ totalUpdatingCount }})
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, h } from 'vue'
import { NButton, NTag, NSpace, NIcon, NDropdown, NProgress } from 'naive-ui'
import {
  EyeOutline,
  CreateOutline,
  SyncOutline,
  TrashOutline,
  EllipsisVerticalOutline,
  RefreshOutline,
  AddOutline
} from '@vicons/ionicons5'
import type { DataTableColumns, DropdownOption } from 'naive-ui'
import type { Subscription } from '@/types'
import { businessUtils } from '@/components/business'
import type { IListComponentProps, IListComponentEmits } from '@/utils/componentApiStandards'

interface IProps extends Omit<IListComponentProps<Subscription>, 'items'> {
  subscriptions: Subscription[]
  selectedKeys: string[]
  updatingIds: Set<string>
  pagination?: {
    page: number
    pageSize: number
    itemCount: number
  }
}

const props = withDefaults(defineProps<IProps>(), {
  pagination: () => ({ page: 1, pageSize: 20, itemCount: 0 })
})

interface IEmits extends IListComponentEmits<Subscription> {
  'update:selected-keys': [keys: string[]]
  'retry-failed': []
  'clear-failed': []
  'update-all': []
  'batch-delete': []
  'batch-update': []
  'bulk-import': []
  'edit': [subscription: Subscription]
  'delete': [subscription: Subscription]
  'update': [subscription: Subscription]
  'preview': [subscription: Subscription]
  'copy-url': [subscription: Subscription]
}

const emit = defineEmits<IEmits>()

// 计算属性
const hasSelected = computed(() => props.selectedKeys.length > 0)
const selectedCount = computed(() => props.selectedKeys.length)

const failedSubscriptions = computed(() =>
  props.subscriptions.filter(s => s.status === 'error')
)
const hasFailedSubscriptions = computed(() => failedSubscriptions.value.length > 0)
const failedCount = computed(() => failedSubscriptions.value.length)

const isUpdating = computed(() => props.updatingIds.size > 0)
const updatingCount = computed(() => props.updatingIds.size)

const updatedCount = computed(() => {
  // 这里需要根据实际更新状态计算
  return 0
})

const totalUpdatingCount = computed(() => props.updatingIds.size)

// 表格配置
const paginationConfig = computed(() => ({
  page: props.pagination.page,
  pageSize: props.pagination.pageSize,
  itemCount: props.pagination.itemCount,
  showSizePicker: true,
  pageSizes: [20, 50, 100, 200],
  showQuickJumper: true
}))

// 状态标签渲染
const renderStatus = (status: string) => {
  const statusConfig: Record<string, { type: 'info' | 'success' | 'warning' | 'error', text: string }> = {
    healthy: { type: 'success', text: '正常' },
    updating: { type: 'info', text: '更新中' },
    error: { type: 'error', text: '错误' },
    expired: { type: 'warning', text: '过期' },
    unknown: { type: 'info', text: '未知' }
  }

  const config = statusConfig[status] || statusConfig.unknown

  return h(NTag, {
    type: config.type,
    size: 'small'
  }, {
    default: () => config.text
  })
}

// 协议标签渲染
const renderProtocols = (subscription: Subscription) => {
  if (!subscription.protocol_distribution) return '-'

  const protocols = Object.keys(subscription.protocol_distribution).map(protocol => {
    const count = subscription.protocol_distribution![protocol]
    const color = businessUtils.getProtocolVariant(protocol)

    return h(NTag, {
      key: protocol,
      type: color as any,
      size: 'small',
      style: { marginRight: '4px' }
    }, {
      default: () => `${protocol.toUpperCase()}(${count})`
    })
  })

  return h('div', { style: { display: 'flex', flexWrap: 'wrap', gap: '4px' } }, protocols)
}

// 操作按钮渲染
const renderActions = (subscription: Subscription) => {
  const isUpdating = props.updatingIds.has(subscription.id)

  const options: DropdownOption[] = [
    {
      label: '预览节点',
      key: 'preview',
      icon: () => h(NIcon, null, () => h(EyeOutline))
    },
    {
      label: '复制链接',
      key: 'copy-url',
      icon: () => h(NIcon, null, () => h(CreateOutline))
    },
    {
      type: 'divider'
    },
    {
      label: '删除',
      key: 'delete',
      icon: () => h(NIcon, null, () => h(TrashOutline)),
      props: {
        style: { color: 'var(--n-error-color)' }
      }
    }
  ]

  const handleSelect = (key: string) => {
    switch (key) {
      case 'preview':
        emit('preview', subscription)
        break
      case 'copy-url':
        emit('copy-url', subscription)
        break
      case 'delete':
        emit('delete', subscription)
        break
    }
  }

  return h(NSpace, { size: 'small' }, {
    default: () => [
      h(NButton, {
        size: 'small',
        type: 'primary',
        loading: isUpdating,
        onClick: () => emit('update', subscription)
      }, {
        default: () => '更新'
      }),

      h(NButton, {
        size: 'small',
        onClick: () => emit('edit', subscription)
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

// 表格列定义
const columns: DataTableColumns<Subscription> = [
  {
    type: 'selection'
  },
  {
    title: '名称',
    key: 'name',
    width: 200,
    ellipsis: {
      tooltip: true
    }
  },
  {
    title: '状态',
    key: 'status',
    width: 100,
    render: (row) => renderStatus(row.status)
  },
  {
    title: '节点数',
    key: 'node_count',
    width: 100,
    render: (row) => row.node_count || 0
  },
  {
    title: '可用节点',
    key: 'healthy_node_count',
    width: 100,
    render: (row) => row.healthy_node_count || 0
  },
  {
    title: '协议',
    key: 'protocols',
    width: 200,
    render: (row) => renderProtocols(row)
  },
  {
    title: '最后更新',
    key: 'last_update',
    width: 150,
    render: (row) => businessUtils.formatRelativeTime(row.last_update || '')
  },
  {
    title: '自动更新',
    key: 'is_auto_update',
    width: 100,
    render: (row) => row.is_auto_update ? '是' : '否'
  },
  {
    title: '操作',
    key: 'actions',
    width: 200,
    fixed: 'right',
    render: (row) => renderActions(row)
  }
]
</script>

<style scoped>
.subscription-table-container {
  @apply bg-white rounded-lg shadow-sm;
}

.table-toolbar {
  @apply flex justify-between items-center p-4 border-b border-gray-200;
}

.toolbar-left,
.toolbar-right {
  @apply flex items-center space-x-3;
}

.updating-indicator {
  @apply flex items-center space-x-3 px-4 py-3 bg-blue-50 border-t border-blue-200;
}

.updating-text {
  @apply text-sm text-blue-700 font-medium;
}

/* 深色模式 */
.dark .subscription-table-container {
  @apply bg-gray-800;
}

.dark .table-toolbar {
  @apply border-gray-700;
}

.dark .updating-indicator {
  @apply bg-blue-900/20 border-blue-800;
}

.dark .updating-text {
  @apply text-blue-400;
}
</style>