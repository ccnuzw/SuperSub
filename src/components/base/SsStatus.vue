/**
 * 状态指示器组件
 * 用于显示节点、订阅等的状态
 */

<template>
  <div :class="statusClasses" class="ss-status">
    <!-- 状态点 -->
    <span :class="dotClasses" class="ss-status__dot"></span>

    <!-- 状态文本 -->
    <span v-if="showText" class="ss-status__text">
      <slot>{{ statusText }}</slot>
    </span>

    <!-- 延迟信息 -->
    <span v-if="showLatency && latency" class="ss-status__latency">
      {{ formatLatency(latency) }}
    </span>

    <!-- 最后检查时间 -->
    <span v-if="showLastChecked && lastChecked" class="ss-status__last-checked">
      {{ formatLastChecked(lastChecked) }}
    </span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { IStandardProps, IStandardEmits } from '@/utils/componentApiStandards';

export type StatusType = 'healthy' | 'unhealthy' | 'pending' | 'testing' | 'unknown';

interface Props extends IStandardProps {
  // 状态类型
  status: StatusType;

  // 延迟时间（毫秒）
  latency?: number | null;

  // 最后检查时间
  lastChecked?: string | null;

  // 显示文本
  showText?: boolean;

  // 显示延迟
  showLatency?: boolean;

  // 显示最后检查时间
  showLastChecked?: boolean;

  // 状态文本映射
  statusTexts?: {
    healthy: string;
    unhealthy: string;
    pending: string;
    testing: string;
    unknown: string;
  };

  // 尺寸（覆盖IStandardProps，提供更具体的选项）
  size?: 'sm' | 'md' | 'lg';

  // 变体
  variant?: 'dot' | 'badge' | 'text';
}

const props = withDefaults(defineProps<Props>(), {
  showText: true,
  showLatency: false,
  showLastChecked: false,
  size: 'md',
  variant: 'badge',
  statusTexts: () => ({
    healthy: '健康',
    unhealthy: '异常',
    pending: '等待',
    testing: '测试中',
    unknown: '未知'
  })
});

// 计算状态样式类
const statusClasses = computed(() => {
  return [
    'ss-status',
    'ss-status--' + props.status,
    'ss-status--' + props.size,
    'ss-status--' + props.variant,
    {
      'ss-status--has-latency': props.showLatency && props.latency,
      'ss-status--has-last-checked': props.showLastChecked && props.lastChecked
    }
  ];
});

// 计算状态点样式类
const dotClasses = computed(() => {
  return [
    'ss-status__dot',
    'ss-status__dot--' + props.status,
    'ss-status__dot--' + props.size
  ];
});

// 获取状态文本
const statusText = computed(() => {
  return props.statusTexts[props.status];
});

// 格式化延迟时间
const formatLatency = (ms: number): string => {
  if (ms < 1000) {
    return `${ms}ms`;
  }
  return `${(ms / 1000).toFixed(1)}s`;
};

// 格式化最后检查时间
const formatLastChecked = (dateStr: string): string => {
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));

    if (diffMins < 1) {
      return '刚刚';
    } else if (diffMins < 60) {
      return `${diffMins}分钟前`;
    } else if (diffMins < 1440) {
      const hours = Math.floor(diffMins / 60);
      return `${hours}小时前`;
    } else {
      const days = Math.floor(diffMins / 1440);
      return `${days}天前`;
    }
  } catch {
    return '未知';
  }
};
</script>

<style scoped>
/* 状态指示器基础样式 */
.ss-status {
  @apply inline-flex items-center;
}

.ss-status--sm {
  @apply text-xs;
}

.ss-status--md {
  @apply text-sm;
}

.ss-status--lg {
  @apply text-base;
}

/* 变体样式 */
.ss-status--dot {
  @apply items-center;
}

.ss-status--badge {
  @apply inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium;
}

.ss-status--text {
  @apply text-current;
}

/* 状态样式 */
.ss-status--healthy {
  @apply text-success-600;
}

.ss-status--unhealthy {
  @apply text-error-600;
}

.ss-status--pending {
  @apply text-warning-600;
}

.ss-status--testing {
  @apply text-primary-600;
}

.ss-status--unknown {
  @apply text-gray-600;
}

/* 徽章变体背景色 */
.ss-status--badge.ss-status--healthy {
  @apply bg-success-100;
}

.ss-status--badge.ss-status--unhealthy {
  @apply bg-error-100;
}

.ss-status--badge.ss-status--pending {
  @apply bg-warning-100;
}

.ss-status--badge.ss-status--testing {
  @apply bg-primary-100;
}

.ss-status--badge.ss-status--unknown {
  @apply bg-gray-100;
}

/* 状态点样式 */
.ss-status__dot {
  @apply rounded-full;
}

.ss-status__dot--sm {
  @apply w-2 h-2;
}

.ss-status__dot--md {
  @apply w-2.5 h-2.5;
}

.ss-status__dot--lg {
  @apply w-3 h-3;
}

.ss-status__dot--healthy {
  @apply bg-success-500;
}

.ss-status__dot--unhealthy {
  @apply bg-error-500;
}

.ss-status__dot--pending {
  @apply bg-warning-500;
}

.ss-status__dot--testing {
  @apply bg-primary-500;
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

.ss-status__dot--unknown {
  @apply bg-gray-500;
}

/* 状态文本 */
.ss-status__text {
  @apply ml-2;
}

/* 延迟信息 */
.ss-status__latency {
  @apply ml-2 text-gray-500 font-mono text-xs;
}

/* 最后检查时间 */
.ss-status__last-checked {
  @apply ml-2 text-gray-400 text-xs;
}

/* 测试状态动画 */
@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

/* 状态组合布局 */
.ss-status--has-latency .ss-status__text {
  @apply mr-2;
}

.ss-status--has-last-checked .ss-status__latency {
  @apply mr-2;
}

/* 悬浮效果 */
.ss-status--badge {
  transition: all 0.2s ease;
}

.ss-status--badge:hover {
  transform: scale(1.05);
}

/* 深色模式适配 */
@media (prefers-color-scheme: dark) {
  .ss-status--healthy {
    @apply text-success-400;
  }

  .ss-status--unhealthy {
    @apply text-error-400;
  }

  .ss-status--pending {
    @apply text-warning-400;
  }

  .ss-status--testing {
    @apply text-primary-400;
  }

  .ss-status--unknown {
    @apply text-gray-400;
  }

  .ss-status__latency {
    @apply text-gray-400;
  }

  .ss-status__last-checked {
    @apply text-gray-500;
  }

  /* 徽章背景 */
  .ss-status--badge.ss-status--healthy {
    @apply bg-success-900 text-success-300;
  }

  .ss-status--badge.ss-status--unhealthy {
    @apply bg-error-900 text-error-300;
  }

  .ss-status--badge.ss-status--pending {
    @apply bg-warning-900 text-warning-300;
  }

  .ss-status--badge.ss-status--testing {
    @apply bg-primary-900 text-primary-300;
  }

  .ss-status--badge.ss-status--unknown {
    @apply bg-gray-700 text-gray-300;
  }
}

/* 紧凑模式 */
.ss-status--compact {
  @apply space-x-1;
}

.ss-status--compact .ss-status__text {
  @apply ml-1;
}

.ss-status--compact .ss-status__latency,
.ss-status--compact .ss-status__last-checked {
  @apply ml-1;
}

/* 垂直布局 */
.ss-status--vertical {
  @apply flex-col items-start space-y-1;
}

.ss-status--vertical .ss-status__dot {
  @apply mb-1;
}

.ss-status--vertical .ss-status__text,
.ss-status--vertical .ss-status__latency,
.ss-status--vertical .ss-status__last-checked {
  @apply ml-0;
}

/* 大屏幕优化 */
@media (min-width: 768px) {
  .ss-status--responsive {
    @apply flex-row items-center;
  }

  .ss-status--responsive .ss-status__latency,
  .ss-status--responsive .ss-status__last-checked {
    @apply inline-block;
  }
}

/* 小屏幕适配 */
@media (max-width: 640px) {
  .ss-status--mobile-hide-latency .ss-status__latency,
  .ss-status--mobile-hide-time .ss-status__last-checked {
    @apply hidden;
  }

  .ss-status--mobile-compact {
    @apply space-x-1;
  }
}
</style>