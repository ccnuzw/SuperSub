/**
 * 预览生成状态组件
 * 显示预览生成过程中的加载状态
 */

<template>
  <div class="flex items-center justify-center py-8">
    <div class="text-center">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
      <div class="text-lg font-medium">{{ message || '正在生成配置...' }}</div>
      <div class="text-sm text-gray-500 mt-2">{{ subMessage || '这可能需要几秒钟时间' }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  message?: string;
  subMessage?: string;
}

withDefaults(defineProps<Props>(), {
  message: '正在生成配置...',
  subMessage: '这可能需要几秒钟时间'
});
</script>