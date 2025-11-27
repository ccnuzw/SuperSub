<template>
  <div class="data-table-container">
    <!-- 搜索栏 -->
    <div v-if="searchable" class="mb-4 flex items-center gap-4">
      <n-input
        v-model:value="localSearchQuery"
        placeholder="搜索..."
        clearable
        class="max-w-md"
        @input="handleSearchInput"
      >
        <template #prefix>
          <n-icon><SearchIcon /></n-icon>
        </template>
      </n-input>

      <slot name="actions"></slot>
    </div>

    <!-- 表格主体 -->
    <n-data-table
      :columns="tableColumns"
      :data="paginatedItems"
      :loading="loading"
      :pagination="paginationConfig"
      :row-key="(record: any) => record.id || JSON.stringify(record)"
      :checked-row-keys="selectedRowKeys"
      @update:checked-row-keys="handleSelectionChange"
      @update:page="handlePageChange"
      @update:page-size="handlePageSizeChange"
      flex-height
      style="height: 400px"
    />

    <!-- 批量操作 -->
    <div v-if="selectable && selectedRowKeys.length > 0" class="mt-4 flex items-center gap-2">
      <span class="text-sm text-gray-600">
        已选择 {{ selectedRowKeys.length }} 项
      </span>
      <slot name="bulk-actions" :selected-keys="selectedRowKeys" :items="selectedItems"></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, type PropType, h } from 'vue';
import { NDataTable, NInput, NIcon } from 'naive-ui';
import { Search as SearchIcon } from '@vicons/ionicons5';
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
  actions: {
    type: Array as PropType<TableAction[]>,
    default: () => []
  },
  pageSize: {
    type: Number,
    default: 20
  },
  maxHeight: {
    type: Number,
    default: 400
  }
});

// Emits
const emit = defineEmits([
  'refresh',
  'edit',
  'delete',
  'selection-change',
  'bulk-delete',
  'bulk-action'
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
    prefix: (info: any) => `共 ${info.itemCount} 项`
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
        render: (value: any, record: BaseEntity) => {
          return h('div', { class: 'flex gap-2' },
            props.actions
              .filter(action => !action.show || action.show(record))
              .map(action =>
                h('n-button', {
                  key: action.key,
                  type: action.type || 'default',
                  size: 'small',
                  disabled: action.disabled?.(record),
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

const refresh = () => {
  emit('refresh');
};

const clearSelection = () => {
  selectedRowKeys.value = [];
};

// 暴露方法给父组件
defineExpose({
  refresh,
  clearSelection,
  getSelectedItems: () => selectedItems.value,
  getSelectedKeys: () => selectedRowKeys.value
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
.data-table-container {
  @apply w-full;
}

:deep(.n-data-table .n-data-table-th) {
  @apply font-semibold text-gray-700;
}

:deep(.n-data-table .n-data-table-td) {
  @apply text-gray-600;
}
</style>