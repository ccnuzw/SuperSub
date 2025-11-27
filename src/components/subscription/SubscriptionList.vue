<template>
  <div class="subscription-list">
    <!-- 桌面端表格视图 -->
    <div v-if="!isMobile" class="desktop-view">
      <SimpleDataTable
        :columns="tableColumns"
        :data="filteredSubscriptions"
        :loading="loading"
        :searchable="true"
        :actions="tableActions"
        :selectable="true"
        @refresh="$emit('refresh')"
        @edit="handleEdit"
        @delete="handleDelete"
        @selection-change="handleSelectionChange"
        @bulk-action="handleBulkAction"
      />
    </div>

    <!-- 移动端卡片视图 -->
    <div v-else class="mobile-view">
      <!-- 搜索栏 -->
      <div class="mb-4">
        <n-input
          v-model:value="searchQuery"
          placeholder="搜索订阅..."
          clearable
          @input="handleSearch"
        >
          <template #prefix>
            <n-icon><SearchOutline /></n-icon>
          </template>
        </n-input>
      </div>

      <!-- 订阅卡片列表 -->
      <div v-if="loading" class="flex justify-center p-8">
        <n-spin size="large" />
      </div>

      <div v-else-if="paginatedSubscriptions.length === 0" class="text-center p-8 text-gray-500">
        <n-icon size="48" class="mb-2">
          <FilterOutline />
        </n-icon>
        <p>暂无订阅数据</p>
      </div>

      <div v-else class="space-y-4">
        <div
          v-for="subscription in paginatedSubscriptions"
          :key="subscription.id"
          class="subscription-card"
          :class="{ 'updating': updatingIds.has(subscription.id) }"
        >
          <div class="card-header">
            <div class="flex items-center gap-2">
              <h3 class="text-lg font-medium">{{ subscription.name }}</h3>
              <n-tag
                :type="subscription.enabled ? 'success' : 'default'"
                size="small"
              >
                {{ subscription.enabled ? '启用' : '禁用' }}
              </n-tag>
              <n-tag
                v-if="updatingIds.has(subscription.id)"
                type="warning"
                size="small"
              >
                更新中
              </n-tag>
            </div>
            <n-dropdown
              :options="mobileActionOptions"
              trigger="click"
              @select="handleMobileAction($event, subscription)"
            >
              <n-button quaternary circle size="small">
                <template #icon>
                  <n-icon><MoreIcon /></n-icon>
                </template>
              </n-button>
            </n-dropdown>
          </div>

          <div class="card-content">
            <div class="url-display">
              <n-ellipsis style="max-width: 300px">
                {{ subscription.url }}
              </n-ellipsis>
            </div>

            <div v-if="subscription.node_count !== undefined" class="stats">
              <n-statistic label="节点数" :value="subscription.node_count" />
            </div>

            <div v-if="subscription.last_updated" class="last-updated">
              <span class="text-sm text-gray-500">
                更新于: {{ formatDate(new Date(subscription.last_updated)) }}
              </span>
            </div>

            <div v-if="subscription.error" class="error-message">
              <n-alert type="error" :title="subscription.error" />
            </div>
          </div>

          <div class="card-actions">
            <n-button-group size="small">
              <n-button @click="$emit('edit', subscription)">
                <template #icon>
                  <n-icon><CreateOutline /></n-icon>
                </template>
                编辑
              </n-button>
              <n-button @click="handlePreview(subscription)">
                <template #icon>
                  <n-icon><EyeOutline /></n-icon>
                </template>
                预览
              </n-button>
              <n-button @click="handleSync(subscription)" :loading="updatingIds.has(subscription.id)">
                <template #icon>
                  <n-icon><SyncOutline /></n-icon>
                </template>
                同步
              </n-button>
            </n-button-group>
          </div>
        </div>
      </div>

      <!-- 移动端分页 -->
      <div v-if="totalPages > 1" class="mt-6 flex justify-center">
        <n-pagination
          v-model:page="currentPage"
          :page-size="pageSize"
          :item-count="filteredSubscriptions.length"
          show-size-picker
          :page-sizes="[10, 20, 50]"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, type PropType, h } from 'vue';
import {
  NInput, NIcon, NSpin, NTag, NDropdown, NButton,
  NButtonGroup, NStatistic, NEllipsis, NAlert,
  NPagination
} from 'naive-ui';
import {
  SearchOutline, FilterOutline, CreateOutline, EyeOutline,
  SyncOutline, EllipsisVertical as MoreIcon, TrashOutline
} from '@vicons/ionicons5';
import type { TableColumn, TableAction } from '@/types/common';
import type { Subscription } from '@/types/entities';
import SimpleDataTable from '@/components/common/SimpleDataTable.vue';
import { format } from 'date-fns';
import { useIsMobile } from '@/composables/useMediaQuery';

// Props
const props = defineProps({
  subscriptions: {
    type: Array as PropType<Subscription[]>,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  },
  updatingIds: {
    type: Set as PropType<Set<string>>,
    default: () => new Set()
  }
});

// Emits
const emit = defineEmits([
  'refresh',
  'edit',
  'delete',
  'preview',
  'sync',
  'selection-change',
  'bulk-action'
]);

// Composables
const isMobile = useIsMobile();

// 响应式状态
const searchQuery = ref('');
const currentPage = ref(1);
const pageSize = ref(10);

// 计算属性
const filteredSubscriptions = computed(() => {
  if (!searchQuery.value) {
    return props.subscriptions;
  }

  const query = searchQuery.value.toLowerCase().trim();
  return props.subscriptions.filter(subscription =>
    subscription.name.toLowerCase().includes(query) ||
    subscription.url.toLowerCase().includes(query) ||
    (subscription.include_keywords && subscription.include_keywords.toLowerCase().includes(query))
  );
});

const paginatedSubscriptions = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  const end = start + pageSize.value;
  return filteredSubscriptions.value.slice(start, end);
});

const totalPages = computed(() => {
  return Math.ceil(filteredSubscriptions.value.length / pageSize.value);
});

// 桌面端表格列定义
const tableColumns: TableColumn[] = [
  {
    key: 'name',
    title: '订阅名称',
    width: 200,
    render: (value: string, record: Subscription) => {
      return h('div', { class: 'flex items-center gap-2' }, [
        h('span', { class: 'font-medium' }, value),
        record.enabled ?
          h(NTag, { type: 'success', size: 'small' }, () => '启用') :
          h(NTag, { type: 'default', size: 'small' }, () => '禁用')
      ]);
    }
  },
  {
    key: 'url',
    title: '订阅链接',
    render: (value: string) => {
      return h(NEllipsis, { style: 'max-width: 300px' }, () => value);
    }
  },
  {
    key: 'node_count',
    title: '节点数',
    width: 100
  },
  {
    key: 'last_updated',
    title: '最后更新',
    width: 150,
    render: (value: string) => value ? formatDate(new Date(value)) : '-'
  },
  {
    key: 'error',
    title: '状态',
    width: 120,
    render: (value: string) => {
      return value ?
        h(NTag, { type: 'error', size: 'small' }, () => '错误') :
        h(NTag, { type: 'success', size: 'small' }, () => '正常');
    }
  }
];

// 桌面端表格操作按钮
const tableActions: TableAction[] = [
  {
    key: 'edit',
    label: '编辑',
    type: 'default',
    handler: (record: Subscription) => handleEdit(record)
  },
  {
    key: 'preview',
    label: '预览',
    handler: (record: Subscription) => handlePreview(record)
  },
  {
    key: 'sync',
    label: '同步',
    handler: (record: Subscription) => handleSync(record)
  },
  {
    key: 'delete',
    label: '删除',
    type: 'error',
    handler: (record: Subscription) => handleDelete(record)
  }
];

// 移动端操作选项
const mobileActionOptions = [
  {
    label: '编辑',
    key: 'edit'
  },
  {
    label: '预览',
    key: 'preview'
  },
  {
    label: '同步',
    key: 'sync'
  },
  {
    label: '删除',
    key: 'delete'
  }
];

// 方法
const formatDate = (date: Date) => {
  return format(date, 'yyyy-MM-dd HH:mm');
};

const handleSearch = () => {
  currentPage.value = 1; // 重置到第一页
  emit('refresh', { search: searchQuery.value });
};

const handleEdit = (subscription: Subscription) => {
  emit('edit', subscription);
};

const handleDelete = (subscription: Subscription) => {
  emit('delete', subscription);
};

const handlePreview = (subscription: Subscription) => {
  emit('preview', subscription);
};

const handleSync = (subscription: Subscription) => {
  emit('sync', subscription);
};

const handleSelectionChange = (selectedKeys: string[], selectedItems: Subscription[]) => {
  emit('selection-change', selectedKeys, selectedItems);
};

const handleBulkAction = (action: string, items: Subscription[]) => {
  emit('bulk-action', action, items);
};

const handleMobileAction = (key: string, subscription: Subscription) => {
  switch (key) {
    case 'edit':
      handleEdit(subscription);
      break;
    case 'preview':
      handlePreview(subscription);
      break;
    case 'sync':
      handleSync(subscription);
      break;
    case 'delete':
      handleDelete(subscription);
      break;
  }
};

// 监听器
watch([currentPage, pageSize], () => {
  // 分页变化时的处理逻辑
});

watch(() => filteredSubscriptions.value.length, (newLength) => {
  if (currentPage.value > totalPages.value) {
    currentPage.value = Math.max(1, totalPages.value);
  }
});
</script>

<style scoped>
.subscription-list {
  @apply w-full;
}

.subscription-card {
  @apply bg-white border rounded-lg p-4 transition-all duration-200;
}

.subscription-card:hover {
  @apply shadow-md;
}

.subscription-card.updating {
  @apply border-yellow-300 bg-yellow-50;
}

.card-header {
  @apply flex items-center justify-between mb-3;
}

.card-content {
  @apply space-y-3 mb-4;
}

.url-display {
  @apply text-sm text-gray-600 break-all;
}

.stats {
  @apply flex items-center gap-4;
}

.last-updated {
  @apply text-xs;
}

.error-message {
  @apply text-xs;
}

.card-actions {
  @apply flex justify-end;
}

:deep(.n-statistic .n-statistic-value) {
  @apply text-base;
}

:deep(.n-statistic .n-statistic-label) {
  @apply text-xs;
}
</style>