/**
 * 订阅表格组件
 * 显示订阅列表的表格视图
 */

<template>
  <div class="subscription-table-container">
    <!-- 批量操作栏 - 当有选中订阅时显示 -->
    <div v-if="selectedKeys.length > 0" class="batch-actions-bar">
      <div class="batch-actions-content">
        <span class="selected-count">
          已选择 {{ selectedKeys.length }} 个订阅
        </span>

        <div class="batch-actions-buttons">
          <n-button
            type="primary"
            size="small"
            @click="$emit('batch-update')"
            :loading="batchUpdating"
          >
            <template #icon>
              <n-icon><SyncOutline /></n-icon>
            </template>
            批量更新
          </n-button>

          <n-button
            type="default"
            size="small"
            @click="$emit('batch-delete')"
          >
            <template #icon>
              <n-icon><TrashOutline /></n-icon>
            </template>
            批量删除
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
      :data="subscriptions"
      :loading="loading"
      :pagination="paginationConfig"
      :row-key="(row: Subscription) => row.id"
      :checked-row-keys="selectedKeys"
      @update:checked-row-keys="$emit('update:selected-keys', $event)"
    />

    <!-- 更新状态指示器 -->
    <div v-if="updatingCount > 0" class="updating-indicator">
      <n-spin size="small" />
      <span class="updating-text">
        正在更新 {{ updatingCount }} 个订阅...
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, h, ref } from 'vue'
import { NButton, NTag, NSpace, NIcon, NDropdown, NSpin, NTooltip, type DataTableColumns, type DropdownOption } from 'naive-ui'
import {
  EyeOutline,
  CreateOutline,
  SyncOutline,
  TrashOutline,
  EllipsisVerticalOutline,
  RefreshOutline,
  CopyOutline
} from '@vicons/ionicons5'
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
  'batch-delete': []
  'batch-update': []
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
const batchUpdating = ref(false)

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

// 批量操作菜单选项
const batchMenuOptions: DropdownOption[] = [
  {
    label: '重试失败',
    key: 'retry-failed',
    icon: () => h(NIcon, null, { default: () => h(RefreshOutline) })
  },
  {
    label: '清除失败',
    key: 'clear-failed',
    icon: () => h(NIcon, null, { default: () => h(TrashOutline) })
  },
  {
    type: 'divider' as const
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
  }
]

// 表格配置
const paginationConfig = computed(() => ({
  page: props.pagination.page,
  pageSize: props.pagination.pageSize,
  itemCount: props.pagination.itemCount,
  showSizePicker: true,
  pageSizes: [10, 20, 50, 100, 200],
  showQuickJumper: true
}))

// 表格配置 - 添加响应式滚动设置
const tableConfig = computed(() => {
  // 根据屏幕宽度决定是否需要滚动
  const width = window.innerWidth || 1200

  if (width < 768) {
    // 移动端 - 需要水平滚动
    return {
      scrollX: 1200, // 设置一个固定的滚动宽度
      maxWidth: '100vw'
    }
  } else if (width < 1200) {
    // 平板端 - 可能需要滚动
    return {
      scrollX: 1000,
      maxWidth: '100%'
    }
  } else {
    // 桌面端 - 不需要滚动
    return {
      scrollX: undefined,
      maxWidth: '100%'
    }
  }
})

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
      style: {
        marginRight: '2px',
        marginBottom: '2px',
        fontSize: '11px',
        padding: '2px 6px',
        lineHeight: '1.2'
      }
    }, {
      default: () => `${protocol.toUpperCase()}(${count})`
    })
  })

  return h('div', {
    style: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '2px',
      maxWidth: '160px',
      lineHeight: '1.2'
    }
  }, protocols)
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

// 批量操作处理函数
const handleBatchMenuAction = (key: string) => {
  switch (key) {
    case 'retry-failed':
      emit('retry-failed')
      break
    case 'clear-failed':
      emit('clear-failed')
      break
    case 'select-all-page':
      // 选择当前页所有订阅
      const currentPageSubscriptionIds = props.subscriptions.map(sub => sub.id)
      emit('update:selected-keys', currentPageSubscriptionIds)
      break
    case 'deselect-all':
      // 取消所有选择
      emit('update:selected-keys', [])
      break
  }
}

// 表格列定义
const columns: DataTableColumns<Subscription> = [
  {
    type: 'selection'
  },
  {
    title: '名称',
    key: 'name',
    width: 200,  /* 设置固定宽度，保证名称列不会太宽 */
    ellipsis: {
      tooltip: true
    }
  },
  {
    title: '状态',
    key: 'status',
    width: 80,  /* 减小状态列宽度 */
    render: (row) => renderStatus(row.status)
  },
  {
    title: '节点数',
    key: 'node_count',
    width: 80,  /* 减小节点数列宽度 */
    render: (row) => row.node_count || 0
  },
  {
    title: '可用节点',
    key: 'healthy_node_count',
    width: 90,  /* 减小可用节点列宽度 */
    render: (row) => row.healthy_node_count || 0
  },
  {
    title: '协议',
    key: 'protocols',
    width: 180,  /* 设置协议列固定宽度，避免过宽 */
    ellipsis: {
      tooltip: true
    },
    render: (row) => renderProtocols(row)
  },
  {
    title: '最后更新',
    key: 'last_update',
    width: 120,  /* 减小最后更新列宽度 */
    render: (row) => businessUtils.formatRelativeTime(row.last_update || '')
  },
  {
    title: '自动更新',
    key: 'is_auto_update',
    width: 100,  /* 增加自动更新列宽度，避免标题换行 */
    align: 'center',  /* 居中对齐 */
    render: (row) => row.is_auto_update ? '是' : '否'
  },
  {
    title: '操作',
    key: 'actions',
    width: 240,  /* 增加操作列宽度以适应所有按钮 */
    minWidth: 220,  /* 添加最小宽度保证 */
    fixed: 'right',
    render: (row) => renderActions(row)
  }
]
</script>

<style scoped>
.subscription-table-container {
  @apply bg-white rounded-lg shadow-sm;
  border: 1px solid rgba(0, 0, 0, 0.06);
  overflow: visible;
  /* 确保容器高度自适应内容 */
  height: auto;
  min-height: auto;
  /* 减少底部间距，让布局更紧凑 */
  margin-bottom: 8px;
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

.updating-indicator {
  @apply flex items-center space-x-2 px-4 py-3 bg-blue-50 border-t border-blue-200 rounded-b-lg;
}

.updating-text {
  @apply text-sm text-blue-700 font-medium;
}

/* 深色模式 */
.dark .subscription-table-container {
  @apply bg-gray-800;
  border-color: rgba(75, 85, 99, 0.3);
}

/* 通用分页器间距 - 减少不必要的间距 */
.subscription-table-container :deep(.n-data-table .n-data-table-pagination) {
  padding-right: 12px;
  padding-bottom: 6px;
  padding-top: 6px;
}

.dark .batch-actions-bar {
  @apply border-gray-700 bg-blue-900/20;
}

.dark .selected-count {
  @apply text-blue-400;
}

.dark .updating-indicator {
  @apply bg-blue-900/20 border-blue-800 rounded-b-lg;
}

.dark .updating-text {
  @apply text-blue-400;
}

/* 桌面端大屏幕优化 */
@media (min-width: 1200px) {
  .subscription-table-container {
    @apply bg-white rounded-lg shadow-sm;
    border: 1px solid rgba(0, 0, 0, 0.06);
    overflow: visible;
    /* 移除高度限制，让内容自然展示 */
  }

  .subscription-table-container :deep(.n-data-table) {
    overflow: visible;
  }

  /* 添加分页器间距 */
  .subscription-table-container :deep(.n-data-table .n-data-table-pagination) {
    padding-right: 16px;
    padding-bottom: 12px;
    padding-top: 12px;
  }

  :deep(.n-data-table .n-data-table-base-table) {
    @apply text-sm;
  }

  :deep(.n-data-table .n-data-table-th) {
    @apply font-semibold;
  }
}

/* 超宽屏优化 */
@media (min-width: 1600px) {
  .subscription-table-container {
    @apply bg-white rounded-lg shadow-sm;
    border: 1px solid rgba(0, 0, 0, 0.06);
    overflow: visible;
  }

  .subscription-table-container :deep(.n-data-table) {
    overflow: visible;
  }

  /* 添加分页器间距 */
  .subscription-table-container :deep(.n-data-table .n-data-table-pagination) {
    padding-right: 20px;
    padding-bottom: 16px;
    padding-top: 16px;
  }

  :deep(.n-data-table .n-data-table-base-table) {
    @apply text-base;
  }

  .table-toolbar {
    @apply px-6 py-5;
  }
}

/* 4K屏幕优化 */
@media (min-width: 1921px) {
  .subscription-table-container {
    @apply bg-white rounded-lg shadow-sm;
    border: 1px solid rgba(0, 0, 0, 0.06);
    overflow: visible;
  }

  .subscription-table-container :deep(.n-data-table) {
    overflow: visible;
  }

  /* 添加分页器间距 */
  .subscription-table-container :deep(.n-data-table .n-data-table-pagination) {
    padding-right: 24px;
    padding-bottom: 18px;
    padding-top: 18px;
  }

  :deep(.n-data-table .n-data-table-base-table) {
    @apply text-lg;
  }

  .table-toolbar {
    @apply px-8 py-6;
  }

  .toolbar-left,
  .toolbar-right {
    @apply space-x-4;
  }
}

/* 响应式设计 */
/* 小屏幕手机端 - 最大640px */
@media (max-width: 640px) {
  .subscription-table-container {
    @apply shadow-sm;
  }

  .batch-actions-content {
    @apply flex-col space-y-3;
  }

  .batch-actions-buttons {
    @apply w-full justify-center;
  }

  /* 移动端隐藏部分列，保留核心信息 */
  .subscription-table-container :deep(.n-data-table) {
    font-size: 12px;
  }

  /* 移动端协议标签优化显示 */
  .subscription-table-container :deep(.n-data-table td[data-col-key="protocols"] .n-tag) {
    font-size: 10px;
    padding: 2px 4px;
    margin-right: 2px;
  }
}

/* 中等屏幕 - 平板端 641px到968px */
@media (min-width: 641px) and (max-width: 968px) {
  .subscription-table-container {
    @apply shadow-sm;
  }

  .batch-actions-content {
    @apply flex-col space-y-2;
  }

  .batch-actions-buttons {
    @apply w-full justify-center flex-wrap;
  }

  /* 平板端优化表格间距 */
  .subscription-table-container :deep(.n-data-table) {
    font-size: 13px;
  }

  .subscription-table-container :deep(.n-data-table .n-data-table-pagination) {
    padding-right: 8px;
    padding-bottom: 8px;
    padding-top: 8px;
  }
}

/* 大屏幕手机 - 968px到1200px */
@media (min-width: 969px) and (max-width: 1200px) {
  .subscription-table-container {
    @apply shadow-sm;
  }

  /* 操作按钮优化 */
  .subscription-table-container :deep(.n-data-table td[data-col-key="actions"] .n-space) {
    gap: 4px !important;
  }

  .subscription-table-container :deep(.n-data-table td[data-col-key="actions"] .n-button) {
    padding: 4px 8px;
    font-size: 12px;
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