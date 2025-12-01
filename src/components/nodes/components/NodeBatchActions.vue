<template>
  <div class="node-batch-actions">
    <n-dropdown
      :disabled="checkedCount === 0"
      :options="actionOptions"
      placement="bottom-end"
      @select="handleAction"
    >
      <n-button
        :disabled="checkedCount === 0"
        type="primary"
        :loading="isCheckingHealth"
      >
        <template #icon>
          <n-icon><SettingsOutline /></n-icon>
        </template>
        批量操作 ({{ checkedCount }})
      </n-button>
    </n-dropdown>

    <!-- 快速操作按钮组 -->
    <n-space v-if="checkedCount > 0" size="small">
      <n-button
        size="small"
        :loading="isCheckingHealth"
        @click="handleBatchTest"
      >
        测试选中
      </n-button>
      <n-button
        size="small"
        type="error"
        @click="handleBatchDelete"
      >
        删除选中
      </n-button>
    </n-space>

    <!-- 分组操作 -->
    <n-dropdown
      v-if="checkedCount > 0"
      :options="groupOptions"
      placement="bottom-end"
      @select="handleMoveToGroup"
    >
      <n-button size="small">
        移动到分组
      </n-button>
    </n-dropdown>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useMessage, useDialog } from 'naive-ui';
import { SettingsOutline } from '@vicons/ionicons5';

// Props
interface Props {
  checkedCount: number;
  groupOptions: Array<{ label: string; value: string }>;
  isCheckingHealth: boolean;
}

const props = defineProps<Props>();

// Emits
const emit = defineEmits<{
  batchDelete: [];
  batchTest: [];
  batchMoveToGroup: [groupId: string];
  sortByHealth: [];
  sortByLatency: [];
  deduplicate: [];
  clearGroup: [];
}>();

const message = useMessage();
const dialog = useDialog();

// 批量操作选项
const actionOptions = computed(() => [
  {
    label: '测试选中节点',
    key: 'test',
    disabled: props.checkedCount === 0 || props.isCheckingHealth,
  },
  {
    label: '删除选中节点',
    key: 'delete',
    disabled: props.checkedCount === 0,
  },
  {
    type: 'divider',
  },
  {
    label: '按健康状态排序',
    key: 'sortByHealth',
  },
  {
    label: '按延迟排序',
    key: 'sortByLatency',
  },
  {
    label: '去重',
    key: 'deduplicate',
  },
  {
    label: '清空当前分组',
    key: 'clearGroup',
  },
]);

// 方法
const handleAction = (key: string) => {
  switch (key) {
    case 'test':
      handleBatchTest();
      break;
    case 'delete':
      handleBatchDelete();
      break;
    case 'sortByHealth':
      handleSortByHealth();
      break;
    case 'sortByLatency':
      handleSortByLatency();
      break;
    case 'deduplicate':
      handleDeduplicate();
      break;
    case 'clearGroup':
      handleClearGroup();
      break;
  }
};

const handleBatchTest = () => {
  if (props.checkedCount === 0) {
    message.warning('请先选择要测试的节点');
    return;
  }
  emit('batchTest');
};

const handleBatchDelete = () => {
  if (props.checkedCount === 0) {
    message.warning('请先选择要删除的节点');
    return;
  }

  dialog.warning({
    title: '确认批量删除',
    content: `确定要删除选中的 ${props.checkedCount} 个节点吗？此操作不可撤销。`,
    positiveText: '删除',
    negativeText: '取消',
    onPositiveClick: () => {
      emit('batchDelete');
    },
  });
};

const handleMoveToGroup = (groupId: string) => {
  if (props.checkedCount === 0) {
    message.warning('请先选择要移动的节点');
    return;
  }
  emit('batchMoveToGroup', groupId);
};

const handleSortByHealth = () => {
  emit('sortByHealth');
};

const handleSortByLatency = () => {
  emit('sortByLatency');
};

const handleDeduplicate = () => {
  dialog.warning({
    title: '确认去重',
    content: '确定要删除重复的节点吗？系统将保留第一个出现的节点。',
    positiveText: '去重',
    negativeText: '取消',
    onPositiveClick: () => {
      emit('deduplicate');
    },
  });
};

const handleClearGroup = () => {
  dialog.warning({
    title: '确认清空分组',
    content: '确定要清空当前分组的所有节点吗？此操作不可撤销。',
    positiveText: '清空',
    negativeText: '取消',
    onPositiveClick: () => {
      emit('clearGroup');
    },
  });
};
</script>

<style scoped>
.node-batch-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .node-batch-actions {
    flex-wrap: wrap;
    gap: 8px;
  }
}
</style>