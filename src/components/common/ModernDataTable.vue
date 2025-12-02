<template>
  <div class="modern-data-table">
    <!-- 搜索栏 -->
    <div v-if="searchable" class="table-header">
      <div class="header-left">
        <n-input
          v-model:value="localSearchQuery"
          :placeholder="searchPlaceholder"
          clearable
          class="search-input"
          @input="handleSearchInput"
        >
          <template #prefix>
            <n-icon><SearchIcon /></n-icon>
          </template>
        </n-input>
      </div>

      <div class="header-right">
        <slot name="actions">
          <!-- 默认操作按钮 -->
          <ActionButtonGroup
            v-if="headerActions.length > 0"
            :actions="headerActions"
            size="small"
            @action="handleHeaderAction"
          />
        </slot>

        <!-- 表格设置按钮 -->
        <SmartDropdown
          :items="tableSettingsItems"
          placement="bottom-right"
          @select="handleTableSetting"
        >
          <template #trigger>
            <n-button circle size="small" quaternary>
              <template #icon>
                <n-icon><SettingsIcon /></n-icon>
              </template>
            </n-button>
          </template>
        </SmartDropdown>
      </div>
    </div>

    <!-- 表格主体 -->
    <div class="table-container" :class="{ 'loading': loading }">
      <n-data-table
        :columns="tableColumns"
        :data="paginatedItems"
        :loading="loading"
        :pagination="paginationConfig"
        :row-key="(record: any) => record.id || JSON.stringify(record)"
        :checked-row-keys="selectedRowKeys"
        :scroll-x="tableWidth"
        flex-height
        :style="{ height: tableHeight }"
        class="data-table"
        @update:checked-row-keys="handleSelectionChange"
        @update:page="handlePageChange"
        @update:page-size="handlePageSizeChange"
      />
    </div>

    <!-- 批量操作栏 -->
    <transition name="slide-up">
      <div v-if="selectable && selectedRowKeys.length > 0" class="bulk-actions">
        <div class="bulk-actions-content">
          <div class="selection-info">
            <n-text class="selection-text">
              已选择 <span class="selection-count">{{ selectedRowKeys.length }}</span> 项
            </n-text>
            <n-button text size="small" @click="clearSelection">
              清除选择
            </n-button>
          </div>

          <div class="bulk-actions-buttons">
            <slot name="bulk-actions" :selected-keys="selectedRowKeys" :items="selectedItems">
              <!-- 默认批量操作 -->
              <ActionButtonGroup
                :actions="bulkActions"
                size="small"
                compact
                @action="handleBulkAction"
              />
            </slot>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, h, type PropType } from 'vue';
import { NDataTable, NInput, NIcon, NButton, NText } from 'naive-ui';
import { Search as SearchIcon, Settings as SettingsIcon, Refresh as RefreshIcon, Download as DownloadIcon } from '@vicons/ionicons5';
import ActionButtonGroup from './ActionButtonGroup.vue';
import SmartDropdown from './SmartDropdown.vue';
import type { TableColumn, TableAction } from '@/types/common';
import type { BaseEntity } from '@/types/entities';

// Props
const props = defineProps({
  columns: {
    type: Array as PropType<TableColumn[]>,
    required: true
  },
  data: {
    type: Array as PropType<BaseEntity[]>,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  },
  rowKey: {
    type: [String, Function] as PropType<string | ((row: any) => string)>,
    default: 'id'
  },
  selectable: {
    type: Boolean,
    default: true
  },
  searchable: {
    type: Boolean,
    default: true
  },
  searchPlaceholder: {
    type: String,
    default: '搜索...'
  },
  actions: {
    type: Array as PropType<TableAction[]>,
    default: () => []
  },
  headerActions: {
    type: Array as PropType<any[]>,
    default: () => []
  },
  bulkActions: {
    type: Array as PropType<any[]>,
    default: () => []
  },
  pageSize: {
    type: Number,
    default: 20
  },
  maxHeight: {
    type: Number,
    default: 400
  },
  tableHeight: {
    type: String,
    default: '400px'
  },
  tableWidth: {
    type: Number,
    default: 1200
  }
});

// Emits
const emit = defineEmits([
  'refresh',
  'edit',
  'delete',
  'selection-change',
  'bulk-action',
  'header-action',
  'table-setting'
]);

// 响应式状态
const localSearchQuery = ref('');
const currentPage = ref(1);
const pageSize = ref(props.pageSize);
const selectedRowKeys = ref<string[]>([]);

// 计算属性
const filteredItems = computed(() => {
  if (!localSearchQuery.value) {
    return props.data;
  }

  const query = localSearchQuery.value.toLowerCase();
  return props.data.filter(item =>
    Object.values(item).some(value =>
      String(value).toLowerCase().includes(query)
    )
  );
});

const paginatedItems = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  const end = start + pageSize.value;
  return filteredItems.value.slice(start, end);
});

const selectedItems = computed(() => {
  return props.data.filter(item => selectedRowKeys.value.includes(item.id));
});

const totalPages = computed(() => {
  return Math.ceil(filteredItems.value.length / pageSize.value);
});

const paginationConfig = computed(() => ({
  page: currentPage.value,
  pageSize: pageSize.value,
  itemCount: filteredItems.value.length,
  showSizePicker: true,
  pageSizes: [10, 20, 50, 100],
  showQuickJumper: true,
  prefix: (info: any) => `共 ${info.itemCount} 项`,
  slotName: 'pagination'
}));

const tableColumns = computed(() => {
  const columns = props.columns.map(col => ({
    ...col,
    key: String(col.key)
  }));

  // 添加操作列
  if (props.actions.length > 0) {
    columns.push({
      key: 'actions',
      title: '操作',
      width: 150,
      fixed: 'right',
      render: (value: any, record: BaseEntity) => {
        return h('div', { class: 'table-actions' },
          props.actions
            .filter(action => !action.show || action.show(record))
            .map(action =>
              h('n-button', {
                key: action.key,
                type: action.type || 'default',
                size: 'small',
                disabled: action.disabled?.(record),
                quaternary: true,
                onClick: () => handleAction(action.key, record)
              }, {
                default: () => action.label,
                icon: () => action.icon ? h('i', { class: action.icon }) : null
              })
            )
        );
      }
    });
  }

  return columns;
});

// 表格设置项
const tableSettingsItems = computed(() => [
  {
    key: 'refresh',
    label: '刷新数据',
    icon: RefreshIcon,
    action: () => emit('refresh')
  },
  {
    key: 'export',
    label: '导出数据',
    icon: DownloadIcon,
    action: () => emit('table-setting', 'export')
  },
  {
    key: 'divider',
    type: 'divider' as const
  },
  {
    key: 'density-compact',
    label: '紧凑模式',
    action: () => emit('table-setting', 'density-compact')
  },
  {
    key: 'density-default',
    label: '默认模式',
    action: () => emit('table-setting', 'density-default')
  },
  {
    key: 'density-comfortable',
    label: '舒适模式',
    action: () => emit('table-setting', 'density-comfortable')
  }
]);

// 方法
const handleSearchInput = (value: string) => {
  currentPage.value = 1; // 重置到第一页
  emit('refresh', { search: value });
};

const handlePageChange = (page: number) => {
  currentPage.value = page;
};

const handlePageSizeChange = (size: number) => {
  pageSize.value = size;
  currentPage.value = 1;
};

const handleSelectionChange = (keys: (string | number)[]) => {
  selectedRowKeys.value = keys as string[];
  emit('selection-change', keys as string[], selectedItems.value);
};

const handleAction = (actionKey: string, record: BaseEntity) => {
  switch (actionKey) {
    case 'edit':
      emit('edit', record);
      break;
    case 'delete':
      emit('delete', record);
      break;
    default:
      emit('bulk-action', actionKey, [record]);
  }
};

const handleBulkAction = (actionKey: string) => {
  emit('bulk-action', actionKey, selectedItems.value);
};

const handleHeaderAction = (actionKey: string) => {
  emit('header-action', actionKey);
};

const handleTableSetting = (key: string, item: any) => {
  emit('table-setting', key);
};

const clearSelection = () => {
  selectedRowKeys.value = [];
  emit('selection-change', [], []);
};

const refresh = () => {
  emit('refresh');
};

// 暴露方法给父组件
defineExpose({
  refresh,
  clearSelection,
  getSelectedItems: () => selectedItems.value,
  getSelectedKeys: () => selectedRowKeys.value,
  getFilteredItems: () => filteredItems.value,
  setCurrentPage: (page: number) => { currentPage.value = page; },
  setPageSize: (size: number) => { pageSize.value = size; }
});

// 监听数据变化
watch(() => props.data, () => {
  if (currentPage.value > totalPages.value) {
    currentPage.value = Math.max(1, totalPages.value);
  }
});

watch(() => props.pageSize, (newSize) => {
  pageSize.value = newSize;
});
</script>

<style scoped>
/* 引入通用样式变量 */
@import '@/styles/common.css';

/* 现代数据表格容器 */
.modern-data-table {
  background: var(--bg-primary);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-primary);
  overflow: hidden;
  box-shadow: var(--shadow-md);
  transition: all var(--transition-normal) var(--ease-out-cubic);
}

.modern-data-table:hover {
  box-shadow: var(--shadow-lg);
}

/* 表格头部 */
.table-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-lg) var(--spacing-xl);
  border-bottom: 1px solid var(--border-primary);
  background: var(--bg-secondary);
}

.header-left {
  flex: 1;
  max-width: 400px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.search-input {
  max-width: 100%;
}

/* 表格容器 */
.table-container {
  position: relative;
  background: var(--bg-primary);
}

.table-container.loading {
  opacity: 0.7;
  pointer-events: none;
}

.data-table {
  --n-td-color: var(--text-primary);
  --n-th-color: var(--text-primary);
  --n-border-color: var(--border-primary);
  --n-td-color-hover: var(--bg-secondary);
}

.data-table :deep(.n-data-table-th) {
  background: var(--bg-tertiary);
  font-weight: 600;
  color: var(--text-primary);
  border-bottom: 2px solid var(--border-primary);
}

.data-table :deep(.n-data-table-td) {
  color: var(--text-primary);
  transition: background-color var(--transition-fast) var(--ease-out-cubic);
}

.data-table :deep(.n-data-table-tr:hover .n-data-table-td) {
  background: var(--bg-secondary);
}

/* 表格操作按钮 */
.table-actions {
  display: flex;
  gap: var(--spacing-xs);
  align-items: center;
}

.table-actions :deep(.n-button) {
  border-radius: var(--radius-sm);
  transition: all var(--transition-fast) var(--ease-out-cubic);
}

.table-actions :deep(.n-button:hover) {
  transform: scale(1.05);
  box-shadow: var(--shadow-sm);
}

/* 批量操作栏 */
.bulk-actions {
  position: sticky;
  bottom: 0;
  background: var(--bg-primary);
  border-top: 2px solid var(--border-focus);
  box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.1);
  z-index: 10;
}

.bulk-actions-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-md) var(--spacing-xl);
  gap: var(--spacing-lg);
}

.selection-info {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.selection-text {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.selection-count {
  font-weight: 600;
  color: var(--primary-600);
  font-size: 1rem;
}

.bulk-actions-buttons {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

/* 动画 */
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all var(--transition-normal) var(--ease-out-cubic);
}

.slide-up-enter-from,
.slide-up-leave-to {
  opacity: 0;
  transform: translateY(20px);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .table-header {
    flex-direction: column;
    gap: var(--spacing-md);
    align-items: stretch;
    padding: var(--spacing-md);
  }

  .header-left {
    max-width: none;
  }

  .header-right {
    justify-content: space-between;
  }

  .bulk-actions-content {
    flex-direction: column;
    align-items: stretch;
    gap: var(--spacing-md);
    padding: var(--spacing-md);
  }

  .selection-info {
    justify-content: center;
  }

  .bulk-actions-buttons {
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .table-actions {
    flex-direction: column;
    gap: var(--spacing-xs);
  }

  .selection-text {
    font-size: 0.75rem;
  }

  .selection-count {
    font-size: 0.875rem;
  }
}

/* 深色主题支持 */
.dark .modern-data-table {
  background: var(--bg-primary);
  border-color: var(--border-primary);
}

.dark .table-header {
  background: var(--bg-secondary);
  border-color: var(--border-primary);
}

.dark .data-table :deep(.n-data-table-th) {
  background: var(--bg-tertiary);
  border-color: var(--border-primary);
}

.dark .data-table :deep(.n-data-table-tr:hover .n-data-table-td) {
  background: var(--bg-secondary);
}

.dark .bulk-actions {
  background: var(--bg-primary);
  border-color: var(--border-focus);
}

/* 加载状态 */
.table-container.loading::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(2px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 5;
}

.dark .table-container.loading::after {
  background: rgba(0, 0, 0, 0.6);
}

/* 空状态样式 */
.modern-data-table :deep(.n-data-table-empty) {
  padding: var(--spacing-3xl) var(--spacing-xl);
  color: var(--text-tertiary);
}

/* 自定义滚动条 */
.data-table :deep(.n-scrollbar-container) {
  border-radius: 0;
}

.data-table :deep(.n-scrollbar-rail) {
  background: transparent;
}

.data-table :deep(.n-scrollbar-rail--horizontal) {
  height: 8px;
}

.data-table :deep(.n-scrollbar-bar) {
  background: var(--text-quaternary);
  border-radius: var(--radius-full);
  opacity: 0.5;
  transition: opacity var(--transition-fast) var(--ease-out-cubic);
}

.data-table :deep(.n-scrollbar-bar:hover) {
  opacity: 0.8;
}

/* 分页样式 */
.data-table :deep(.n-pagination) {
  justify-content: center;
  padding: var(--spacing-md) 0;
}

.data-table :deep(.n-pagination-item) {
  border-radius: var(--radius-sm);
  transition: all var(--transition-fast) var(--ease-out-cubic);
}

.data-table :deep(.n-pagination-item:hover) {
  transform: translateY(-1px);
  box-shadow: var(--shadow-sm);
}
</style>