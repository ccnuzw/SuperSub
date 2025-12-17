/**
 * 协议分布组件
 * 显示不同协议节点的分布情况
 */

<template>
  <div class="preview-section">
    <h4 class="text-md font-medium mb-3">协议分布</h4>
    <div class="flex flex-wrap gap-2">
      <span
        v-for="(count, protocol) in protocols"
        :key="protocol"
        class="protocol-badge"
      >
        {{ protocol.toUpperCase() }}: {{ count }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  protocols: Record<string, number>;
}

defineProps<Props>();
</script>

<style scoped>
.preview-section {
  @apply bg-white p-4 rounded-lg border border-gray-200;
}

/* 协议标签 */
.protocol-badge {
  @apply inline-flex items-center px-2 py-1 rounded text-xs font-medium;
}

.protocol-badge:nth-child(1) { @apply bg-blue-100 text-blue-800; }
.protocol-badge:nth-child(2) { @apply bg-success-100 text-success-800; }
.protocol-badge:nth-child(3) { @apply bg-warning-100 text-warning-800; }
.protocol-badge:nth-child(4) { @apply bg-error-100 text-error-800; }
</style>