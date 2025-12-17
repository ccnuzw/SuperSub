/**
 * 徽章组件
 * 用于显示小型的状态或信息标识
 */

<template>
  <span :class="badgeClasses" class="ss-badge">
    <slot>{{ text }}</slot>
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { IStandardProps } from '@/utils/componentApiStandards';

interface Props extends IStandardProps {
  // 徽章文本
  text?: string;

  // 徽章类型
  type?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'error';

  // 徽章大小
  size?: 'xs' | 'sm' | 'md' | 'lg';

  // 是否为圆角
  rounded?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  type: 'default',
  size: 'sm',
  rounded: true
});

// 计算徽章样式类
const badgeClasses = computed(() => {
  return [
    'ss-badge',
    `ss-badge--${props.type}`,
    `ss-badge--${props.size}`,
    {
      'ss-badge--rounded': props.rounded
    }
  ];
});
</script>

<style scoped>
/* 徽章基础样式 */
.ss-badge {
  @apply inline-flex items-center justify-center font-medium;
  white-space: nowrap;
}

/* 徽章类型 */
.ss-badge--default {
  @apply bg-gray-100 text-gray-800;
}

.ss-badge--primary {
  @apply bg-primary-100 text-primary-800;
}

.ss-badge--secondary {
  @apply bg-gray-200 text-gray-700;
}

.ss-badge--success {
  @apply bg-green-100 text-green-800;
}

.ss-badge--warning {
  @apply bg-yellow-100 text-yellow-800;
}

.ss-badge--error {
  @apply bg-red-100 text-red-800;
}

/* 徽章尺寸 */
.ss-badge--xs {
  @apply px-1.5 py-0.5 text-xs;
}

.ss-badge--sm {
  @apply px-2 py-1 text-xs;
}

.ss-badge--md {
  @apply px-2.5 py-1 text-sm;
}

.ss-badge--lg {
  @apply px-3 py-1.5 text-sm;
}

/* 圆角样式 */
.ss-badge--rounded {
  @apply rounded-full;
}

/* 深色模式适配 */
@media (prefers-color-scheme: dark) {
  .ss-badge--default {
    @apply bg-gray-700 text-gray-200;
  }

  .ss-badge--primary {
    @apply bg-primary-900 text-primary-300;
  }

  .ss-badge--secondary {
    @apply bg-gray-600 text-gray-300;
  }

  .ss-badge--success {
    @apply bg-green-900 text-green-300;
  }

  .ss-badge--warning {
    @apply bg-yellow-900 text-yellow-300;
  }

  .ss-badge--error {
    @apply bg-red-900 text-red-300;
  }
}
</style>