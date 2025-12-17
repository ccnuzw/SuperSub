/**
 * 预览空状态组件
 * 显示没有预览数据时的空状态界面
 */

<template>
  <div class="empty-state">
    <div class="text-center py-8">
      <div class="text-gray-400 mb-4">
        <svg class="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      </div>
      <div class="text-lg font-medium text-gray-900 mb-2">{{ title || '暂无预览数据' }}</div>
      <div class="text-sm text-gray-500 mb-4">{{ subtitle || '请先生成配置文件预览' }}</div>
      <SsButton
        variant="primary"
        @click="handleGenerate"
        :loading="loading"
      >
        {{ buttonText || '生成预览' }}
      </SsButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { SsButton } from '@/components/base';

interface Props {
  title?: string;
  subtitle?: string;
  buttonText?: string;
  loading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  title: '暂无预览数据',
  subtitle: '请先生成配置文件预览',
  buttonText: '生成预览',
  loading: false
});

const emit = defineEmits<{
  generate: [];
}>();

const handleGenerate = () => {
  emit('generate');
};
</script>

<style scoped>
.empty-state {
  @apply bg-white p-8 rounded-lg border border-gray-200;
}
</style>