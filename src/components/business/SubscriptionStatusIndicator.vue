/**
 * 订阅状态指示器组件
 * 显示订阅源的状态和更新信息
 */

<template>
  <div
    class="subscription-status-indicator"
    :class="statusClasses"
  >
    <!-- 状态图标和圆环 -->
    <div class="status-wrapper">
      <!-- 背景圆环 -->
      <svg class="progress-ring" :width="ringSize" :height="ringSize">
        <circle
          class="progress-ring__circle-bg"
          :cx="ringCenter"
          :cy="ringCenter"
          :r="ringRadius"
          fill="transparent"
        />
        <circle
          class="progress-ring__circle"
          :class="progressClass"
          :cx="ringCenter"
          :cy="ringCenter"
          :r="ringRadius"
          fill="transparent"
          :stroke-dasharray="circumference"
          :stroke-dashoffset="progressOffset"
        />
      </svg>

      <!-- 状态图标 -->
      <div class="status-icon" :class="iconClasses">
        <!-- 健康状态 -->
        <svg
          v-if="status === 'healthy'"
          class="icon-svg"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>

        <!-- 更新状态 -->
        <svg
          v-else-if="status === 'updating'"
          class="icon-svg updating-icon"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>

        <!-- 错误状态 -->
        <svg
          v-else-if="status === 'error'"
          class="icon-svg"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>

        <!-- 过期状态 -->
        <svg
          v-else-if="status === 'expired'"
          class="icon-svg"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>

        <!-- 未知状态 -->
        <svg
          v-else
          class="icon-svg"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
    </div>

    <!-- 状态文本 -->
    <div v-if="showText" class="status-content">
      <div class="status-title">{{ statusTitle }}</div>
      <div v-if="statusDescription" class="status-description">
        {{ statusDescription }}
      </div>
      <div v-if="showProgress && status === 'updating'" class="progress-info">
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: `${progress}%` }"></div>
        </div>
        <span class="progress-text">{{ progress }}%</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  status: 'healthy' | 'updating' | 'error' | 'expired' | 'unknown';
  lastUpdate?: string;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  showProgress?: boolean;
  progress?: number;
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  showText: true,
  showProgress: false,
  progress: 0
});

// 计算属性
const statusClasses = computed(() => [
  `subscription-status-indicator--${props.size}`,
  `subscription-status-indicator--${props.status}`
]);

const iconClasses = computed(() => [
  `status-icon--${props.status}`,
  `status-icon--${props.size}`
]);

const progressClass = computed(() => `progress-ring__circle--${props.status}`);

// 尺寸计算
const ringSize = computed(() => {
  const sizeMap = {
    sm: 40,
    md: 48,
    lg: 56
  };
  return sizeMap[props.size];
});

const ringCenter = computed(() => ringSize.value / 2);
const ringRadius = computed(() => ringCenter.value - 3);
const circumference = computed(() => ringRadius.value * 2 * Math.PI);
const progressOffset = computed(() => {
  if (props.showProgress && props.status === 'updating') {
    return circumference.value - (props.progress / 100) * circumference.value;
  }
  return 0;
});

// 状态文本
const statusTitle = computed(() => {
  const titleMap: Record<string, string> = {
    healthy: '订阅正常',
    updating: '更新中...',
    error: '更新失败',
    expired: '订阅过期',
    unknown: '状态未知'
  };
  return titleMap[props.status] || '状态未知';
});

const statusDescription = computed(() => {
  if (!props.lastUpdate) return '';

  try {
    const updateTime = new Date(props.lastUpdate);
    const now = new Date();
    const diff = now.getTime() - updateTime.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days > 0) {
      return `${days}天前更新`;
    } else if (hours > 0) {
      return `${hours}小时前更新`;
    } else {
      return '刚刚更新';
    }
  } catch {
    return '';
  }
});
</script>

<style scoped>
.subscription-status-indicator {
  @apply flex items-center space-x-3;
}

/* 尺寸变体 */
.subscription-status-indicator--sm {
  @apply space-x-2;
}

.subscription-status-indicator--md {
  @apply space-x-3;
}

.subscription-status-indicator--lg {
  @apply space-x-4;
}

/* 状态包装器 */
.status-wrapper {
  @apply relative;
}

/* 进度环 */
.progress-ring {
  @apply transform -rotate-90;
}

.progress-ring__circle-bg {
  @apply stroke-gray-200;
}

.progress-ring__circle {
  @apply transition-all duration-300 ease-in-out;
}

.progress-ring__circle--healthy {
  @apply stroke-green-500;
}

.progress-ring__circle--updating {
  @apply stroke-blue-500;
  animation: progress-pulse 1.5s ease-in-out infinite;
}

.progress-ring__circle--error {
  @apply stroke-red-500;
}

.progress-ring__circle--expired {
  @apply stroke-yellow-500;
}

.progress-ring__circle--unknown {
  @apply stroke-gray-400;
}

/* 状态图标 */
.status-icon {
  @apply absolute inset-0 flex items-center justify-center rounded-full;
}

.status-icon--sm {
  @apply text-sm;
}

.status-icon--md {
  @apply text-base;
}

.status-icon--lg {
  @apply text-lg;
}

.status-icon--healthy {
  @apply text-green-600 bg-green-50;
}

.status-icon--updating {
  @apply text-blue-600 bg-blue-50;
}

.status-icon--error {
  @apply text-red-600 bg-red-50;
}

.status-icon--expired {
  @apply text-yellow-600 bg-yellow-50;
}

.status-icon--unknown {
  @apply text-gray-600 bg-gray-50;
}

.icon-svg {
  @apply w-5 h-5;
}

.icon-svg--sm {
  @apply w-4 h-4;
}

.icon-svg--lg {
  @apply w-6 h-6;
}

/* 更新动画 */
.updating-icon {
  animation: rotate 1s linear infinite;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@keyframes progress-pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}

/* 状态内容 */
.status-content {
  @apply flex-1 min-w-0;
}

.status-title {
  @apply font-medium text-gray-900;
}

.status-description {
  @apply text-sm text-gray-500 mt-1;
}

/* 进度信息 */
.progress-info {
  @apply flex items-center space-x-2 mt-2;
}

.progress-bar {
  @apply flex-1 bg-gray-200 rounded-full h-1.5;
}

.progress-fill {
  @apply bg-blue-500 h-1.5 rounded-full transition-all duration-300;
}

.progress-text {
  @apply text-xs font-medium text-gray-600 min-w-[3rem] text-right;
}

/* 深色模式支持 */
.dark .progress-ring__circle-bg {
  @apply stroke-gray-600;
}

.dark .status-icon--healthy {
  @apply text-green-400 bg-green-900/20;
}

.dark .status-icon--updating {
  @apply text-blue-400 bg-blue-900/20;
}

.dark .status-icon--error {
  @apply text-red-400 bg-red-900/20;
}

.dark .status-icon--expired {
  @apply text-yellow-400 bg-yellow-900/20;
}

.dark .status-icon--unknown {
  @apply text-gray-400 bg-gray-700/50;
}

.dark .status-title {
  @apply text-gray-100;
}

.dark .status-description {
  @apply text-gray-400;
}

.dark .progress-bar {
  @apply bg-gray-600;
}

.dark .progress-text {
  @apply text-gray-400;
}

/* 响应式设计 */
@media (max-width: 640px) {
  .subscription-status-indicator {
    @apply flex-col items-start space-x-0 space-y-2;
  }

  .status-wrapper {
    @apply self-center;
  }

  .status-content {
    @apply text-center;
  }
}

/* 高对比度模式 */
@media (prefers-contrast: high) {
  .progress-ring__circle {
    stroke-width: 3;
  }
}

/* 减少动画模式 */
@media (prefers-reduced-motion: reduce) {
  .updating-icon {
    animation: none;
  }

  .progress-ring__circle {
    transition: none;
  }

  .progress-fill {
    transition: none;
  }

  .progress-ring__circle--updating {
    animation: none;
  }
}
</style>