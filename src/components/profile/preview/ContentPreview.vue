/**
 * 配置内容预览组件
 * 显示生成的配置文件内容
 */

<template>
  <div class="preview-section">
    <div class="flex justify-between items-center mb-3">
      <h4 class="text-md font-medium">配置内容预览</h4>
      <SsButton
        variant="ghost"
        size="sm"
        @click="toggleShow"
      >
        {{ showContent ? '隐藏' : '显示' }}
      </SsButton>
    </div>

    <div v-if="showContent" class="content-preview">
      <pre class="bg-gray-50 p-4 rounded-lg text-sm overflow-x-auto">{{
        formatContent(content || '')
      }}</pre>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { SsButton } from '@/components/base';

interface Props {
  content?: string;
}

const props = withDefaults(defineProps<Props>(), {
  content: ''
});

const showContent = ref(false);

const toggleShow = () => {
  showContent.value = !showContent.value;
};

const formatContent = (content: string): string => {
  if (!content) return '';

  try {
    // 尝试格式化JSON/YAML内容
    const parsed = JSON.parse(content);
    return JSON.stringify(parsed, null, 2);
  } catch {
    // 如果不是JSON，返回原内容
    return content;
  }
};
</script>

<style scoped>
.preview-section {
  @apply bg-white p-4 rounded-lg border border-gray-200;
}

.content-preview {
  @apply bg-gray-50 p-4 rounded-lg;
}

.content-preview pre {
  @apply text-sm leading-relaxed whitespace-pre-wrap font-mono;
  max-height: 400px;
  overflow-y: auto;
}
</style>