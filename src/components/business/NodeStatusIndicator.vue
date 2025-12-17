/**
 * 节点状态指示器组件
 * 显示节点连接状态和延迟信息
 */

<template>
  <div
    class="node-status-indicator"
    :class="statusClasses"
    :title="statusText"
  >
    <!-- 状态点 -->
    <div class="status-indicator" :class="indicatorClasses">
      <div v-if="status === 'testing'" class="testing-spinner"></div>
      <svg
        v-else-if="status === 'healthy'"
        class="status-icon"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
      </svg>
      <svg
        v-else-if="status === 'unhealthy'"
        class="status-icon"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M6 18L18 6M6 6l12 12" />
      </svg>
      <svg
        v-else-if="status === 'unknown'"
        class="status-icon"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    </div>

    <!-- 延迟信息 -->
    <div v-if="showLatency && latency !== undefined" class="latency-info">
      <span class="latency-value" :class="latencyClasses">
        {{ formatLatency(latency) }}
      </span>
      <span v-if="showText" class="latency-unit">ms</span>
    </div>

    <!-- 状态文字 -->
    <div v-if="showText" class="status-text">
      {{ statusText }}
    </div>

    <!-- 趋势指示器（可选） -->
    <div v-if="showTrend && latencyTrend" class="trend-indicator">
      <svg
        v-if="latencyTrend === 'improving'"
        class="trend-icon trend-improving"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
      <svg
        v-else-if="latencyTrend === 'degrading'"
        class="trend-icon trend-degrading"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
      </svg>
      <svg
        v-else-if="latencyTrend === 'stable'"
        class="trend-icon trend-stable"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14" />
      </svg>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  status: 'healthy' | 'unhealthy' | 'testing' | 'unknown';
  latency?: number;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  showLatency?: boolean;
  showTrend?: boolean;
  latencyTrend?: 'improving' | 'degrading' | 'stable';
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  showText: false,
  showLatency: true,
  showTrend: false
});

// 计算属性
const statusClasses = computed(() => [
  `node-status-indicator--${props.size}`,
  `node-status-indicator--${props.status}`
]);

const indicatorClasses = computed(() => [
  `status-indicator--${props.status}`,
  `status-indicator--${props.size}`
]);

const latencyClasses = computed(() => {
  if (!props.latency) return '';

  if (props.latency < 100) return 'latency-excellent';
  if (props.latency < 200) return 'latency-good';
  if (props.latency < 500) return 'latency-moderate';
  return 'latency-poor';
});

const statusText = computed(() => {
  const textMap: Record<string, string> = {
    healthy: '连接正常',
    unhealthy: '连接失败',
    testing: '测试中...',
    unknown: '状态未知'
  };
  return textMap[props.status] || '状态未知';
});

// 方法
const formatLatency = (latency: number): string => {
  if (latency < 1000) {
    return Math.round(latency).toString();
  } else {
    return (latency / 1000).toFixed(1);
  }
};
</script>

<style scoped>
.node-status-indicator {
  @apply flex items-center space-x-2;
}

/* 尺寸变体 */
.node-status-indicator--sm {
  @apply space-x-1;
}

.node-status-indicator--md {
  @apply space-x-2;
}

.node-status-indicator--lg {
  @apply space-x-3;
}

/* 状态指示器 */
.status-indicator {
  @apply relative rounded-full flex items-center justify-center;
  border: 2px solid currentColor;
}

.status-indicator--sm {
  @apply w-4 h-4;
}

.status-indicator--md {
  @apply w-5 h-5;
}

.status-indicator--lg {
  @apply w-6 h-6;
}

/* 状态颜色 */
.status-indicator--healthy {
  @apply text-green-500;
}

.status-indicator--unhealthy {
  @apply text-red-500;
}

.status-indicator--testing {
  @apply text-blue-500;
}

.status-indicator--unknown {
  @apply text-gray-400;
}

/* 状态图标 */
.status-icon {
  @apply w-full h-full;
}

.status-icon--sm {
  @apply w-3 h-3;
}

.status-icon--md {
  @apply w-4 h-4;
}

.status-icon--lg {
  @apply w-5 h-5;
}

/* 测试动画 */
.testing-spinner {
  @apply w-full h-full rounded-full border-2 border-current border-t-transparent;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* 延迟信息 */
.latency-info {
  @apply flex items-baseline space-x-1;
}

.latency-value {
  @apply font-medium tabular-nums;
}

.latency-value.latency-excellent {
  @apply text-green-600;
}

.latency-value.latency-good {
  @apply text-blue-600;
}

.latency-value.latency-moderate {
  @apply text-yellow-600;
}

.latency-value.latency-poor {
  @apply text-red-600;
}

.latency-unit {
  @apply text-xs text-gray-500 font-medium;
}

/* 状态文字 */
.status-text {
  @apply text-sm font-medium;
}

.node-status-indicator--healthy .status-text {
  @apply text-green-700;
}

.node-status-indicator--unhealthy .status-text {
  @apply text-red-700;
}

.node-status-indicator--testing .status-text {
  @apply text-blue-700;
}

.node-status-indicator--unknown .status-text {
  @apply text-gray-600;
}

/* 趋势指示器 */
.trend-indicator {
  @apply flex items-center;
}

.trend-icon {
  @apply w-3 h-3;
}

.trend-improving {
  @apply text-green-500;
}

.trend-degrading {
  @apply text-red-500;
}

.trend-stable {
  @apply text-gray-400;
}

/* 脉冲动画（健康状态） */
.status-indicator--healthy {
  animation: pulse-green 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes pulse-green {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}

/* 深色模式支持 */
.dark .latency-value.latency-excellent {
  @apply text-green-400;
}

.dark .latency-value.latency-good {
  @apply text-blue-400;
}

.dark .latency-value.latency-moderate {
  @apply text-yellow-400;
}

.dark .latency-value.latency-poor {
  @apply text-red-400;
}

.dark .latency-unit {
  @apply text-gray-400;
}

.dark .status-text {
  @apply text-gray-300;
}

.dark .node-status-indicator--healthy .status-text {
  @apply text-green-400;
}

.dark .node-status-indicator--unhealthy .status-text {
  @apply text-red-400;
}

.dark .node-status-indicator--testing .status-text {
  @apply text-blue-400;
}

.dark .node-status-indicator--unknown .status-text {
  @apply text-gray-500;
}

/* 高对比度模式 */
@media (prefers-contrast: high) {
  .status-indicator {
    border-width: 3px;
  }
}

/* 减少动画模式 */
@media (prefers-reduced-motion: reduce) {
  .testing-spinner {
    animation: none;
  }

  .status-indicator--healthy {
    animation: none;
  }
}
</style>