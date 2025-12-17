/**
 * 节点操作按钮组件
 * 提供测试和更多操作功能
 */

<template>
  <div class="node-card__actions">
    <SsButton
      variant="ghost"
      size="sm"
      @click="handleTest"
      :loading="testing"
      title="测试连接"
    >
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    </SsButton>

    <NDropdown
      :options="actionOptions"
      placement="bottom-end"
      trigger="click"
      @select="handleAction"
    >
      <SsButton variant="ghost" size="sm">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12h.01M12 19h.01M16 7h.01M8 7h.01M16 17h.01M8 17h.01" />
        </svg>
      </SsButton>
    </NDropdown>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, h } from 'vue';
import { useMessage } from 'naive-ui';
import { NDropdown } from 'naive-ui';
import { SsButton } from '@/components/base';
import type { Node } from '@/types';

interface Props {
  node: Node;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  test: [node: Node];
  edit: [node: Node];
  copy: [node: Node];
  delete: [node: Node];
  duplicate: [node: Node];
  export: [node: Node];
}>();

const message = useMessage();
const testing = ref(false);

const actionOptions = computed(() => [
  {
    label: '编辑节点',
    key: 'edit',
    icon: () => h('span', '✏️')
  },
  {
    label: '复制节点',
    key: 'copy',
    icon: () => h('span', '📋')
  },
  {
    label: '复制配置',
    key: 'export',
    icon: () => h('span', '⬇️')
  },
  {
    label: '复制节点',
    key: 'duplicate',
    icon: () => h('span', '📄')
  },
  {
    type: 'divider'
  },
  {
    label: '删除节点',
    key: 'delete',
    icon: () => h('span', '🗑️')
  }
]);

const handleTest = async () => {
  testing.value = true;
  try {
    emit('test', props.node);
    message.success('节点测试完成');
  } finally {
    testing.value = false;
  }
};

const handleAction = (key: string) => {
  switch (key) {
    case 'edit':
      emit('edit', props.node);
      break;
    case 'copy':
      emit('copy', props.node);
      break;
    case 'export':
      emit('export', props.node);
      break;
    case 'duplicate':
      emit('duplicate', props.node);
      break;
    case 'delete':
      emit('delete', props.node);
      break;
  }
};
</script>

<style scoped>
.node-card__actions {
  @apply absolute top-4 right-4 flex space-x-2;
}
</style>