/**
 * 地区分布组件
 * 显示节点按地区的分布情况
 */

<template>
  <div class="preview-section">
    <h4 class="text-md font-medium mb-3">地区分布</h4>
    <div class="grid grid-cols-2 md:grid-cols-4 gap-2">
      <span
        v-for="(count, region) in regions"
        :key="region"
        class="region-badge"
      >
        {{ region }}: {{ count }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  regions: Record<string, number>;
}

defineProps<Props>();
</script>

<style scoped>
.preview-section {
  @apply bg-white p-4 rounded-lg border border-gray-200;
}

/* 地区标签 */
.region-badge {
  @apply inline-flex items-center px-2 py-1 rounded text-xs bg-gray-100 text-gray-700 font-medium;
}
</style>