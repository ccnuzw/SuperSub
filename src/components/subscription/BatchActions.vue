<template>
  <div class="batch-actions">
    <!-- 批量操作工具栏 -->
    <div v-if="selectedItems.length > 0" class="batch-toolbar p-4 bg-blue-50 border-b">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-4">
          <span class="text-sm font-medium text-blue-900">
            已选择 {{ selectedItems.length }} 项
          </span>
          <n-button size="small" @click="handleClearSelection">
            清除选择
          </n-button>
        </div>

        <div class="flex items-center gap-2 flex-wrap">
          <!-- 批量更新 -->
          <n-button
            type="primary"
            size="small"
            :loading="loading.update"
            @click="handleBatchUpdate"
          >
            <template #icon>
              <n-icon><SyncOutline /></n-icon>
            </template>
            批量更新
          </n-button>

          <!-- 批量启用/禁用 -->
          <n-dropdown
            :options="toggleOptions"
            trigger="click"
            @select="handleBatchToggle"
          >
            <n-button size="small">
              <template #icon>
                <n-icon><SettingsOutline /></n-icon>
              </template>
              批量启用/禁用
            </n-button>
          </n-dropdown>

          <!-- 移动到分组 -->
          <n-button
            size="small"
            @click="showMoveToGroupModal = true"
          >
            <template #icon>
              <n-icon><ReorderFourOutline /></n-icon>
            </template>
            移动到分组
          </n-button>

          <!-- 批量删除 -->
          <n-button
            type="error"
            size="small"
            :loading="loading.delete"
            @click="handleBatchDelete"
          >
            <template #icon>
              <n-icon><TrashOutline /></n-icon>
            </template>
            批量删除
          </n-button>

          <!-- 批量替换 -->
          <n-button
            size="small"
            @click="showBatchReplaceModal = true"
          >
            批量替换
          </n-button>
        </div>
      </div>
    </div>

    <!-- 批量导入模态框 -->
    <n-modal
      v-model:show="showImportModal"
      preset="dialog"
      style="width: 600px"
    >
      <template #header>
        <div class="flex items-center gap-2">
          <n-icon><AddOutline /></n-icon>
          <span>批量导入订阅</span>
        </div>
      </template>

      <div class="space-y-4">
        <n-form-item label="订阅链接">
          <n-input
            v-model:value="importUrls"
            type="textarea"
            placeholder="请输入订阅链接，每行一个"
            :rows="6"
          />
          <div class="text-sm text-gray-500 mt-1">
            支持多个URL，每行一个
          </div>
        </n-form-item>

        <n-form-item label="目标分组">
          <n-select
            v-model:value="importGroupId"
            :options="groupOptions"
            placeholder="选择分组（可选）"
            clearable
          />
        </n-form-item>
      </div>

      <template #action>
        <div class="flex justify-end gap-2">
          <n-button @click="showImportModal = false">取消</n-button>
          <n-button
            type="primary"
            :loading="loading.import"
            @click="handleBatchImport"
          >
            导入
          </n-button>
        </div>
      </template>
    </n-modal>

    <!-- 移动到分组模态框 -->
    <n-modal
      v-model:show="showMoveToGroupModal"
      preset="dialog"
      style="width: 400px"
    >
      <template #header>
        <div class="flex items-center gap-2">
          <n-icon><ReorderFourOutline /></n-icon>
          <span>移动到分组</span>
        </div>
      </template>

      <div class="space-y-4">
        <p class="text-sm text-gray-600">
          将选中的 {{ selectedItems.length }} 个订阅移动到指定分组：
        </p>

        <n-form-item label="目标分组">
          <n-select
            v-model:value="moveToGroupId"
            :options="groupOptions"
            placeholder="选择目标分组"
          />
        </n-form-item>
      </div>

      <template #action>
        <div class="flex justify-end gap-2">
          <n-button @click="showMoveToGroupModal = false">取消</n-button>
          <n-button
            type="primary"
            :loading="loading.moveToGroup"
            @click="handleMoveToGroup"
          >
            移动
          </n-button>
        </div>
      </template>
    </n-modal>

    <!-- 批量替换模态框 -->
    <n-modal
      v-model:show="showBatchReplaceModal"
      preset="dialog"
      style="width: 500px"
    >
      <template #header>
        <div class="flex items-center gap-2">
          <n-icon><SettingsOutline /></n-icon>
          <span>批量替换</span>
        </div>
      </template>

      <div class="space-y-4">
        <p class="text-sm text-gray-600">
          在选中的订阅链接中查找并替换文本：
        </p>

        <n-form-item label="查找内容">
          <n-input
            v-model:value="batchReplaceData.find"
            placeholder="要查找的文本"
          />
        </n-form-item>

        <n-form-item label="替换为">
          <n-input
            v-model:value="batchReplaceData.replace"
            placeholder="替换为的文本"
          />
        </n-form-item>

        <n-alert type="warning" title="注意">
          此操作将永久修改订阅链接，请谨慎操作。
        </n-alert>
      </div>

      <template #action>
        <div class="flex justify-end gap-2">
          <n-button @click="showBatchReplaceModal = false">取消</n-button>
          <n-button
            type="warning"
            :loading="loading.batchReplace"
            @click="handleBatchReplace"
          >
            替换
          </n-button>
        </div>
      </template>
    </n-modal>

    <!-- 批量操作进度模态框 -->
    <n-modal
      v-model:show="showProgressModal"
      :mask-closable="false"
      preset="dialog"
      style="width: 500px"
    >
      <template #header>
        <div class="flex items-center gap-2">
          <n-icon><SyncOutline /></n-icon>
          <span>{{ progressTitle }}</span>
        </div>
      </template>

      <div class="space-y-4">
        <div class="text-sm text-gray-600">
          {{ progressDescription }}
        </div>

        <n-progress
          type="line"
          :percentage="progressPercentage"
          :status="progressStatus"
        />

        <div class="text-sm">
          <span class="text-gray-600">进度: </span>
          <span class="font-medium">{{ progress.completed }}/{{ progress.total }}</span>
        </div>

        <!-- 操作日志 -->
        <div v-if="progress.logs.length > 0" class="bg-gray-50 rounded p-3 max-h-40 overflow-y-auto">
          <div class="text-xs space-y-1">
            <div
              v-for="(log, index) in progress.logs"
              :key="index"
              class="flex items-start gap-2"
              :class="log.type === 'error' ? 'text-red-600' : log.type === 'success' ? 'text-green-600' : 'text-gray-600'"
            >
              <span class="flex-shrink-0">{{ log.timestamp }}</span>
              <span>{{ log.message }}</span>
            </div>
          </div>
        </div>
      </div>

      <template #action>
        <div class="flex justify-end">
          <n-button
            :disabled="!progress.completed || progress.completed < progress.total"
            @click="showProgressModal = false"
          >
            {{ progress.completed === progress.total ? '完成' : '关闭' }}
          </n-button>
        </div>
      </template>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, type PropType } from 'vue';
import {
  NButton, NIcon, NDropdown, NModal, NForm, NFormItem,
  NInput, NSelect, NAlert, NProgress
} from 'naive-ui';
import {
  SyncOutline, SettingsOutline, AddOutline, TrashOutline,
  ReorderFourOutline
} from '@vicons/ionicons5';
import type { Subscription, SubscriptionGroup } from '@/types/entities';
import { useSubscriptionGroupStore } from '@/stores/newSubscriptionGroups';

// Props
const props = defineProps({
  selectedItems: {
    type: Array as PropType<Subscription[]>,
    default: () => []
  }
});

// Emits
const emit = defineEmits([
  'clear-selection',
  'batch-update',
  'batch-toggle',
  'batch-delete',
  'batch-import',
  'move-to-group',
  'batch-replace'
]);

// Stores
const subscriptionGroupStore = useSubscriptionGroupStore();

// 响应式状态
const loading = ref({
  update: false,
  delete: false,
  import: false,
  moveToGroup: false,
  batchReplace: false
});

// 模态框状态
const showImportModal = ref(false);
const showMoveToGroupModal = ref(false);
const showBatchReplaceModal = ref(false);
const showProgressModal = ref(false);

// 表单数据
const importUrls = ref('');
const importGroupId = ref<string | null>(null);
const moveToGroupId = ref<string | null>(null);

// 批量替换数据
const batchReplaceData = ref({
  find: '',
  replace: ''
});

// 进度数据
const progress = ref({
  total: 0,
  completed: 0,
  percentage: 0,
  logs: [] as Array<{
    timestamp: string;
    message: string;
    type: 'success' | 'error' | 'info';
  }>
});

const progressTitle = ref('');
const progressDescription = ref('');
const progressStatus = ref<'default' | 'success' | 'error' | 'warning'>('default');

// 计算属性
const progressPercentage = computed(() => {
  if (progress.value.total === 0) return 0;
  return Math.round((progress.value.completed / progress.value.total) * 100);
});

const groupOptions = computed(() => {
  const groups = subscriptionGroupStore.groups;
  return groups.map(group => ({
    label: group.name,
    value: group.id
  }));
});

const toggleOptions = [
  {
    label: '批量启用',
    key: 'enable'
  },
  {
    label: '批量禁用',
    key: 'disable'
  }
];

// 方法
const handleClearSelection = () => {
  emit('clear-selection');
};

const handleBatchUpdate = async () => {
  loading.value.update = true;
  try {
    await emit('batch-update');
  } finally {
    loading.value.update = false;
  }
};

const handleBatchToggle = async (key: string) => {
  const enabled = key === 'enable';
  emit('batch-toggle', { enabled, items: props.selectedItems });
};

const handleBatchDelete = async () => {
  loading.value.delete = true;
  try {
    await emit('batch-delete');
  } finally {
    loading.value.delete = false;
  }
};

const handleBatchImport = async () => {
  if (!importUrls.value.trim()) {
    return;
  }

  loading.value.import = true;
  try {
    const urls = importUrls.value.split('\n').filter(url => url.trim());
    await emit('batch-import', {
      urls,
      groupId: importGroupId.value
    });
    showImportModal.value = false;
    importUrls.value = '';
    importGroupId.value = null;
  } finally {
    loading.value.import = false;
  }
};

const handleMoveToGroup = async () => {
  if (!moveToGroupId.value) {
    return;
  }

  loading.value.moveToGroup = true;
  try {
    await emit('move-to-group', {
      groupId: moveToGroupId.value,
      items: props.selectedItems
    });
    showMoveToGroupModal.value = false;
    moveToGroupId.value = null;
  } finally {
    loading.value.moveToGroup = false;
  }
};

const handleBatchReplace = async () => {
  if (!batchReplaceData.value.find.trim()) {
    return;
  }

  loading.value.batchReplace = true;
  try {
    await emit('batch-replace', {
      find: batchReplaceData.value.find,
      replace: batchReplaceData.value.replace,
      items: props.selectedItems
    });
    showBatchReplaceModal.value = false;
    batchReplaceData.value = { find: '', replace: '' };
  } finally {
    loading.value.batchReplace = false;
  }
};

// 暴露给父组件的方法
defineExpose({
  showImport: () => { showImportModal.value = true; },
  showProgress: (title: string, description: string) => {
    progressTitle.value = title;
    progressDescription.value = description;
    showProgressModal.value = true;
  },
  updateProgress: (completed: number, total: number, log?: { message: string; type: 'success' | 'error' | 'info' }) => {
    progress.value.completed = completed;
    progress.value.total = total;
    if (log) {
      progress.value.logs.push({
        timestamp: new Date().toLocaleTimeString(),
        ...log
      });
    }
  },
  completeProgress: () => {
    progressStatus.value = 'success';
  }
});
</script>

<style scoped>
.batch-actions {
  @apply w-full;
}

.batch-toolbar {
  @apply bg-blue-50 dark:bg-blue-900/20;
}

:deep(.n-progress .n-progress-graph-line-fill) {
  @apply transition-all duration-300;
}
</style>