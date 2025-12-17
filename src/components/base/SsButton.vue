/**
 * 基础按钮组件
 * 提供统一的按钮样式和行为
 */

<template>
  <button
    :class="buttonClasses"
    :disabled="disabled || loading"
    :type="type"
    v-bind="$attrs"
    @click="handleClick"
  >
    <!-- 加载状态 -->
    <div v-if="loading" class="ss-button__loading">
      <svg class="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
        <circle
          class="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          stroke-width="4"
        />
        <path
          class="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
      <span>{{ loadingText }}</span>
    </div>

    <!-- 正常状态 -->
    <template v-else>
      <!-- 左侧图标 -->
      <div v-if="leftIcon" class="ss-button__icon ss-button__icon--left">
        <component :is="leftIcon" />
      </div>

      <!-- 按钮内容 -->
      <span v-if="$slots.default" class="ss-button__content">
        <slot />
      </span>

      <!-- 右侧图标 -->
      <div v-if="rightIcon" class="ss-button__icon ss-button__icon--right">
        <component :is="rightIcon" />
      </div>
    </template>
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { IStandardProps, IStandardEmits } from '@/utils/componentApiStandards';

interface Props extends IStandardProps {
  // 按钮类型
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';

  // 按钮大小
  size?: 'sm' | 'md' | 'lg' | 'xl';

  // 按钮形状
  shape?: 'rounded' | 'square' | 'pill';

  // 禁用状态
  disabled?: boolean;

  // 加载状态
  loading?: boolean;

  // 加载文本
  loadingText?: string;

  // 按钮类型
  type?: 'button' | 'submit' | 'reset';

  // 左侧图标
  leftIcon?: any;

  // 右侧图标
  rightIcon?: any;

  // 块级按钮
  block?: boolean;

  // 危险操作
  danger?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'md',
  shape: 'rounded',
  disabled: false,
  loading: false,
  loadingText: 'Loading...',
  type: 'button',
  block: false,
  danger: false
});

const emit = defineEmits<IStandardEmits>();

// 计算按钮样式类
const buttonClasses = computed(() => {
  const classes = [
    'ss-button',
    'ss-button--' + props.variant,
    'ss-button--' + props.size,
    'ss-button--' + props.shape,
    'inline-flex',
    'items-center',
    'justify-center',
    'font-medium',
    'transition-all',
    'duration-150',
    'ease-in-out',
    'focus:outline-none',
    'focus:ring-2',
    'focus:ring-offset-2'
  ];

  // 危险样式覆盖
  if (props.danger && props.variant !== 'danger') {
    classes.push('ss-button--danger-override');
  }

  // 块级按钮
  if (props.block) {
    classes.push('w-full');
  }

  // 禁用状态
  if (props.disabled) {
    classes.push('opacity-50', 'cursor-not-allowed');
  }

  return classes;
});

// 处理点击事件
const handleClick = (event: MouseEvent) => {
  if (!props.disabled && !props.loading) {
    emit('click', event);
  }
};
</script>

<style scoped>
/* 基础按钮样式 */
.ss-button {
  position: relative;
  border: 1px solid transparent;
}

/* 按钮变体样式 */
.ss-button--primary {
  @apply bg-primary-600 text-white border-primary-600 hover:bg-primary-700 focus:ring-primary-500;
}

.ss-button--secondary {
  @apply bg-gray-600 text-white border-gray-600 hover:bg-gray-700 focus:ring-gray-500;
}

.ss-button--outline {
  @apply bg-transparent border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-primary-500;
}

.ss-button--ghost {
  @apply bg-transparent border-transparent text-gray-700 hover:bg-gray-100 focus:ring-primary-500;
}

.ss-button--danger {
  @apply bg-error-600 text-white border-error-600 hover:bg-error-700 focus:ring-error-500;
}

.ss-button--success {
  @apply bg-success-600 text-white border-success-600 hover:bg-success-700 focus:ring-success-500;
}

/* 危险覆盖样式 */
.ss-button--danger-override {
  @apply bg-error-600 text-white border-error-600 hover:bg-error-700 focus:ring-error-500;
}

/* 按钮大小样式 */
.ss-button--sm {
  @apply px-3 py-1.5 text-xs;
}

.ss-button--md {
  @apply px-4 py-2 text-sm;
}

.ss-button--lg {
  @apply px-6 py-3 text-base;
}

.ss-button--xl {
  @apply px-8 py-4 text-lg;
}

/* 按钮形状样式 */
.ss-button--rounded {
  @apply rounded-md;
}

.ss-button--square {
  @apply rounded-none;
}

.ss-button--pill {
  @apply rounded-full;
}

/* 加载状态样式 */
.ss-button__loading {
  @apply flex items-center;
}

/* 图标样式 */
.ss-button__icon {
  @apply flex-shrink-0;
}

.ss-button__icon--left {
  @apply -ml-1 mr-2;
}

.ss-button__icon--right {
  @apply ml-2 -mr-1;
}

/* 按钮内容样式 */
.ss-button__content {
  @apply text-center;
}

/* 禁用状态优化 */
.ss-button:disabled {
  @apply cursor-not-allowed opacity-50;
}

.ss-button:disabled:hover {
  @apply transform-none;
}

/* 加载状态下禁用hover效果 */
.ss-button[aria-busy="true"] {
  @apply cursor-wait;
}

/* 按钮动画 */
.ss-button:not(:disabled):not(.ss-button[aria-busy="true"]) {
  @apply transform active:scale-95;
}

/* 焦点样式增强 */
.ss-button:focus-visible {
  @apply ring-2 ring-offset-2;
}

.ss-button--primary:focus-visible {
  @apply ring-primary-500;
}

.ss-button--secondary:focus-visible {
  @apply ring-gray-500;
}

.ss-button--outline:focus-visible,
.ss-button--ghost:focus-visible {
  @apply ring-primary-500;
}

.ss-button--danger:focus-visible {
  @apply ring-error-500;
}

.ss-button--success:focus-visible {
  @apply ring-success-500;
}

/* 暗色模式适配 */
@media (prefers-color-scheme: dark) {
  .ss-button--outline {
    @apply border-gray-600 text-gray-300 hover:bg-gray-800;
  }

  .ss-button--ghost {
    @apply text-gray-300 hover:bg-gray-800;
  }
}
</style>