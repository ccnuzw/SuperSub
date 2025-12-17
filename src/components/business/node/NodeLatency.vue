/**
 * 节点延迟组件
 * 显示节点的延迟信息和可视化进度条
 */

<template>
  <div v-if="node.latency !== undefined" class="node-card__latency">
    <div class="latency-bar">
      <div
        class="latency-fill"
        :class="latencyClass"
        :style="{ width: latencyWidth }"
      ></div>
    </div>
    <span class="latency-text">{{ formattedLatency }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { Node } from '@/types';

interface Props {
  node: Node;
}

const props = defineProps<Props>();

const latencyClass = computed(() => {
  if (!props.node.latency) return '';
  if (props.node.latency < 100) return 'latency-fill--excellent';
  if (props.node.latency < 200) return 'latency-fill--good';
  if (props.node.latency < 500) return 'latency-fill--moderate';
  return 'latency-fill--poor';
});

const latencyWidth = computed(() => {
  if (!props.node.latency) return '0%';
  // 将延迟映射到进度条宽度，最高1000ms为100%
  return Math.min((props.node.latency / 1000) * 100, 100) + '%';
});

const formattedLatency = computed(() => {
  if (!props.node.latency) return '--';
  if (props.node.latency < 1000) {
    return `${props.node.latency}ms`;
  } else {
    return `${(props.node.latency / 1000).toFixed(1)}s`;
  }
});
</script>

<style scoped>
.node-card__latency {
  @apply flex items-center space-x-3;
}

.latency-bar {
  @apply flex-1 bg-gray-200 rounded-full h-2;
}

.latency-fill {
  @apply h-2 rounded-full transition-all duration-300;
}

.latency-fill--excellent {
  @apply bg-green-500;
}

.latency-fill--good {
  @apply bg-blue-500;
}

.latency-fill--moderate {
  @apply bg-yellow-500;
}

.latency-fill--poor {
  @apply bg-red-500;
}

.latency-text {
  @apply text-xs font-medium text-gray-600 min-w-[3rem] text-right;
}
</style>