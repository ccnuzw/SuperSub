/**
 * 节点快捷操作组件
 * 悬停时显示的快捷操作按钮
 */

<template>
  <div class="node-card__quick-actions">
    <SsButton
      variant="ghost"
      size="sm"
      @click="handleEdit"
      title="编辑节点"
    >
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    </SsButton>

    <SsButton
      variant="ghost"
      size="sm"
      @click="handleCopy"
      title="复制节点"
    >
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
      </svg>
    </SsButton>
  </div>
</template>

<script setup lang="ts">
import { SsButton } from '@/components/base';
import type { Node } from '@/types';

interface Props {
  node: Node;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  edit: [node: Node];
  copy: [node: Node];
}>();

const handleEdit = () => {
  emit('edit', props.node);
};

const handleCopy = () => {
  emit('copy', props.node);
};
</script>

<style scoped>
.node-card__quick-actions {
  @apply absolute bottom-4 right-4 opacity-0 bg-white rounded-md shadow-lg p-1 space-x-1 transition-opacity duration-200;
}

.node-card__quick-actions .ss-button {
  @apply text-gray-500 hover:text-gray-700;
}
</style>