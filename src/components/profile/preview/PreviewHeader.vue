/**
 * 预览头部组件
 * 包含标题和操作按钮
 */

<template>
  <div class="flex justify-between items-center">
    <h3 class="text-lg font-semibold">{{ title || '配置预览' }}</h3>
    <div class="flex space-x-2">
      <SsButton
        variant="outline"
        size="sm"
        @click="handleRefresh"
        :loading="refreshing"
      >
        刷新
      </SsButton>
      <SsButton
        variant="primary"
        size="sm"
        @click="handleCopyUrl"
      >
        复制链接
      </SsButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { SsButton } from '@/components/base';

interface Props {
  title?: string;
  refreshing?: boolean;
}

withDefaults(defineProps<Props>(), {
  title: '配置预览',
  refreshing: false
});

const emit = defineEmits<{
  refresh: [];
  copyUrl: [];
}>();

const handleRefresh = () => {
  emit('refresh');
};

const handleCopyUrl = () => {
  emit('copyUrl');
};
</script>