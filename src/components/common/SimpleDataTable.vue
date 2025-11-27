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

    <!-- 简化的表格实现 -->
    <div v-if="loading" class="flex justify-center p-8">
      <n-spin size="large" />
    </div>

    <div v-else-if="hasError" class="text-center p-8 text-red-500">
      {{ error }}
    </div>

    <div v-else-if="paginatedItems.length === 0" class="text-center p-8 text-gray-500">
      暂无数据
    </div>

    <div v-else>
      <table class="w-full border-collapse">
        <thead>
          <tr class="bg-gray-50">
            <th
              v-for="column in columns"
              :key="String(column.key)"
              class="px-4 py-2 text-left text-sm font-medium text-gray-700 border-b"
            >
              {{ column.title }}
            </th>
            <th v-if="actions.length > 0" class="px-4 py-2 text-left text-sm font-medium text-gray-700 border-b">
              操作
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="item in paginatedItems"
            :key="getRowKey(item)"
            class="hover:bg-gray-50 border-b"
          >
            <td
              v-for="column in columns"
              :key="String(column.key)"
              class="px-4 py-2 text-sm text-gray-900"
            >
              {{ getColumnValue(item, column) }}
            </td>
            <td v-if="actions.length > 0" class="px-4 py-2 text-sm">
              <div class="flex gap-2">
                <n-button
                  v-for="action in getActions(item)"
                  :key="action.key"
                  :type="action.type || 'default'"
                  size="small"
                  :disabled="action.disabled"
                  @click="action.handler"
                >
                  {{ action.label }}
                </n-button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- 分页 -->
      <div v-if="totalPages > 1" class="mt-4 flex justify-center">
        <n-pagination
          v-model:page="currentPage"
          v-model:page-size="pageSize"
          :item-count="filteredItems.length"
          :page-sizes="[10, 20, 50, 100]"
          show-size-picker
          show-quick-jumper
        />
      </div>
    </div>

    <!-- 批量操作 -->
    <div v-if="selectable && selectedIds.length > 0" class="mt-4 flex items-center gap-2">
      <span class="text-sm text-gray-600">
        已选择 {{ selectedIds.length }} 项
      </span>
      <slot name="bulk-actions" :selected-keys="selectedIds" :items="selectedItems"></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, type PropType } from 'vue';
import { NInput, NIcon, NSpin, NPagination, NButton } from 'naive-ui';
import { Search as SearchIcon } from '@vicons/ionicons5';
import type { TableColumn, TableAction } from '@/types/common';

// Props
const props = defineProps({
  columns: {
    type: Array as PropType<TableColumn[]>,
    required: true
  },
  data: {
    type: Array,
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
const selectedIds = ref<string[]>([]);

// 计算属性
const filteredItems = computed(() => {
  if (!localSearchQuery.value) {
    return props.data;
  }

  const query = localSearchQuery.value.toLowerCase();
  return props.data.filter((item: any) =>
    Object.values(item).some((value: any) =>
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
  return props.data.filter((item: any) => selectedIds.value.includes(getRowKey(item)));
});

const totalPages = computed(() => {
  return Math.ceil(filteredItems.value.length / pageSize.value);
});

const hasError = computed(() => {
  return false; // 简化版本暂时不处理错误状态
});

const error = computed(() => {
  return ''; // 简化版本暂时不处理错误状态
});

// 方法
const getRowKey = (item: any): string => {
  if (typeof props.rowKey === 'function') {
    return props.rowKey(item);
  }
  return item[props.rowKey] || item.id;
};

const getColumnValue = (item: any, column: TableColumn): string => {
  const value = item[column.key as string];
  if (column.render) {
    return String(column.render(value, item));
  }
  return String(value || '');
};

const getActions = (item: any) => {
  return props.actions
    .filter(action => !action.show || action.show(item))
    .map(action => ({
      ...action,
      disabled: action.disabled?.(item) || false,
      handler: () => handleAction(action.key, item)
    }));
};

const handleSearchInput = (value: string) => {
  currentPage.value = 1; // 重置到第一页
  emit('refresh', { search: value });
};

const handleAction = (actionKey: string, record: any) => {
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
  selectedIds.value = [];
};

// 暴露方法给父组件
defineExpose({
  refresh,
  clearSelection,
  getSelectedItems: () => selectedItems.value,
  getSelectedKeys: () => selectedIds.value
});

// 监听分页变化
watch([currentPage, pageSize], () => {
  // 分页变化时的处理逻辑
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

table {
  @apply bg-white shadow-sm rounded-lg overflow-hidden;
}

th {
  @apply font-semibold text-gray-700;
}

td {
  @apply text-gray-600;
}

:deep(.n-pagination) {
  @apply mt-4;
}
</style>