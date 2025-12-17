/**
 * 预览统计组件
 * 显示配置文件的统计信息
 */

<template>
  <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
    <div class="stat-card">
      <div class="text-2xl font-bold text-primary-600">
        {{ previewData?.analysis.total || 0 }}
      </div>
      <div class="text-sm text-gray-500">总节点数</div>
    </div>

    <div class="stat-card">
      <div class="text-2xl font-bold text-success-600">
        {{ Object.keys(previewData?.analysis.protocols || {}).length }}
      </div>
      <div class="text-sm text-gray-500">协议类型</div>
    </div>

    <div class="stat-card">
      <div class="text-2xl font-bold text-warning-600">
        {{ Object.keys(previewData?.analysis.regions || {}).length }}
      </div>
      <div class="text-sm text-gray-500">地区分布</div>
    </div>

    <div class="stat-card">
      <div class="text-2xl font-bold text-info-600">
        {{ previewData?.mode || 'local' }}
      </div>
      <div class="text-sm text-gray-500">生成模式</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { PreviewData } from './types';

interface Props {
  previewData: PreviewData | null;
}

defineProps<Props>();
</script>

<style scoped>
/* 统计卡片 */
.stat-card {
  @apply bg-white p-4 rounded-lg border border-gray-200 text-center;
}
</style>