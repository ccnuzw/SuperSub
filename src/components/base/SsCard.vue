/**
 * 基础卡片组件
 * 提供统一的卡片容器和样式
 */

<template>
  <div
    :class="cardClasses"
    :style="cardStyles"
    v-bind="$attrs"
    @click="handleClick"
  >
    <!-- 卡片头部 -->
    <div v-if="$slots.header || title || subtitle" class="ss-card__header">
      <slot name="header">
        <div class="ss-card__header-content">
          <!-- 标题 -->
          <h3 v-if="title" class="ss-card__title">{{ title }}</h3>

          <!-- 副标题 -->
          <p v-if="subtitle" class="ss-card__subtitle">{{ subtitle }}</p>
        </div>

        <!-- 头部操作 -->
        <div v-if="$slots.actions" class="ss-card__actions">
          <slot name="actions" />
        </div>
      </slot>
    </div>

    <!-- 卡片内容 -->
    <div class="ss-card__body" :class="bodyClasses">
      <slot />
    </div>

    <!-- 卡片底部 -->
    <div v-if="$slots.footer" class="ss-card__footer">
      <slot name="footer" />
    </div>

    <!-- 加载遮罩 -->
    <div v-if="loading" class="ss-card__loading">
      <div class="ss-card__loading-spinner">
        <svg class="animate-spin h-8 w-8 text-primary-600" fill="none" viewBox="0 0 24 24">
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
      </div>
    </div>

    <!-- 悬浮效果 -->
    <div v-if="hoverable && isHovered" class="ss-card__hover-effect"></div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, useSlots } from 'vue';
import type { IStandardProps, IStandardEmits } from '@/utils/componentApiStandards';

interface Props extends IStandardProps {
  // 标题
  title?: string;

  // 副标题
  subtitle?: string;

  // 卡片变体
  variant?: 'default' | 'outlined' | 'elevated' | 'filled';

  // 尺寸（覆盖IStandardProps的size，提供更具体的选项）
  size?: 'sm' | 'md' | 'lg' | 'xl';

  // 是否可点击（覆盖IStandardProps）
  clickable?: boolean;

  // 是否可悬浮
  hoverable?: boolean;

  // 加载状态（覆盖IStandardProps）
  loading?: boolean;

  // 阴影级别
  shadow?: 'none' | 'sm' | 'md' | 'lg' | 'xl';

  // 边框半径
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full';

  // 内边距
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';

  // 背景色变体
  background?: 'default' | 'muted' | 'primary' | 'success' | 'warning' | 'error';

  // 自定义样式（避免使用，优先使用CSS类）
  customStyles?: Record<string, string | number>;
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'default',
  size: 'md',
  clickable: false,
  hoverable: false,
  loading: false,
  shadow: 'md',
  rounded: 'lg',
  padding: 'md',
  background: 'default'
});

const emit = defineEmits<IStandardEmits & {
  // 继承标准事件
  click: [event: MouseEvent];
  focus: [event: FocusEvent];
  blur: [event: FocusEvent];
}>();

const slots = useSlots();
const isHovered = ref(false);

// 计算卡片样式类
const cardClasses = computed(() => {
  return [
    'ss-card',
    'ss-card--' + props.variant,
    'ss-card--' + props.size,
    'ss-card--' + props.shadow,
    'ss-card--' + props.rounded,
    'ss-card--' + props.padding,
    'ss-card--' + props.background,
    {
      'ss-card--clickable': props.clickable,
      'ss-card--hoverable': props.hoverable,
      'ss-card--loading': props.loading
    }
  ];
});

// 计算主体样式类
const bodyClasses = computed(() => {
  return {
    'ss-card__body--no-header': !slots.header && !props.title && !props.subtitle,
    'ss-card__body--no-footer': !slots.footer
  };
});

// 计算内联样式
const cardStyles = computed(() => {
  return props.customStyles || {};
});

// 处理点击事件
const handleClick = (event: MouseEvent) => {
  if (props.clickable) {
    emit('click', event);
  }
};
</script>

<style scoped>
/* 基础卡片样式 */
.ss-card {
  @apply relative bg-white border border-gray-200 transition-all duration-300;
}

/* 卡片变体 */
.ss-card--default {
  @apply border-gray-200;
}

.ss-card--outlined {
  @apply border-2 border-gray-300 bg-white;
}

.ss-card--elevated {
  @apply border-gray-100 shadow-md;
}

.ss-card--filled {
  @apply bg-gray-50 border-gray-200;
}

/* 卡片尺寸 */
.ss-card--sm {
  @apply p-3;
}

.ss-card--md {
  @apply p-4;
}

.ss-card--lg {
  @apply p-6;
}

.ss-card--xl {
  @apply p-8;
}

/* 阴影级别 */
.ss-card--none {
  @apply shadow-none;
}

.ss-card--sm {
  @apply shadow-sm;
}

.ss-card--md {
  @apply shadow-md;
}

.ss-card--lg {
  @apply shadow-lg;
}

.ss-card--xl {
  @apply shadow-xl;
}

/* 圆角 */
.ss-card--none {
  @apply rounded-none;
}

.ss-card--sm {
  @apply rounded-sm;
}

.ss-card--md {
  @apply rounded-md;
}

.ss-card--lg {
  @apply rounded-lg;
}

.ss-card--xl {
  @apply rounded-xl;
}

.ss-card--full {
  @apply rounded-full;
}

/* 内边距覆盖 */
.ss-card--padding-none {
  @apply p-0;
}

.ss-card--padding-sm {
  @apply p-3;
}

.ss-card--padding-md {
  @apply p-4;
}

.ss-card--padding-lg {
  @apply p-6;
}

.ss-card--padding-xl {
  @apply p-8;
}

/* 背景色 */
.ss-card--background-default {
  @apply bg-white;
}

.ss-card--background-muted {
  @apply bg-gray-50;
}

.ss-card--background-primary {
  @apply bg-primary-50;
}

.ss-card--background-success {
  @apply bg-success-50;
}

.ss-card--background-warning {
  @apply bg-warning-50;
}

.ss-card--background-error {
  @apply bg-error-50;
}

/* 可点击状态 */
.ss-card--clickable {
  @apply cursor-pointer;
}

.ss-card--clickable:hover {
  @apply shadow-lg transform -translate-y-1;
}

/* 可悬浮状态 */
.ss-card--hoverable {
  @apply transition-all duration-300;
}

.ss-card--hoverable:hover {
  @apply shadow-lg;
}

/* 加载状态 */
.ss-card--loading {
  @apply pointer-events-none opacity-75;
}

/* 卡片头部 */
.ss-card__header {
  @apply flex items-start justify-between mb-4 pb-4 border-b border-gray-200;
}

.ss-card__header-content {
  @apply flex-1 min-w-0;
}

.ss-card__title {
  @apply text-lg font-semibold text-gray-900 truncate;
}

.ss-card__subtitle {
  @apply mt-1 text-sm text-gray-500;
}

.ss-card__actions {
  @apply flex-shrink-0 ml-4;
}

/* 卡片主体 */
.ss-card__body {
  @apply flex-1;
}

.ss-card__body--no-header {
  @apply mt-0;
}

.ss-card__body--no-footer {
  @apply mb-0;
}

/* 卡片底部 */
.ss-card__footer {
  @apply mt-4 pt-4 border-t border-gray-200;
}

/* 加载遮罩 */
.ss-card__loading {
  @apply absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 rounded-lg z-10;
}

.ss-card__loading-spinner {
  @apply flex items-center justify-center;
}

/* 悬浮效果 */
.ss-card__hover-effect {
  @apply absolute inset-0 rounded-lg pointer-events-none;
  background: linear-gradient(135deg, transparent 0%, rgba(59, 130, 246, 0.1) 100%);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.ss-card--hoverable:hover .ss-card__hover-effect {
  opacity: 1;
}

/* 动画效果 */
.ss-card {
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 暗色模式适配 */
@media (prefers-color-scheme: dark) {
  .ss-card {
    @apply bg-gray-800 border-gray-700;
  }

  .ss-card--default {
    @apply border-gray-700;
  }

  .ss-card--outlined {
    @apply border-gray-600;
  }

  .ss-card--filled {
    @apply bg-gray-700;
  }

  .ss-card--background-default {
    @apply bg-gray-800;
  }

  .ss-card--background-muted {
    @apply bg-gray-700;
  }

  .ss-card__title {
    @apply text-gray-100;
  }

  .ss-card__subtitle {
    @apply text-gray-400;
  }

  .ss-card__header,
  .ss-card__footer {
    @apply border-gray-700;
  }

  .ss-card__loading {
    @apply bg-gray-800 bg-opacity-75;
  }
}

/* 响应式适配 */
@media (max-width: 640px) {
  .ss-card--lg {
    @apply p-4;
  }

  .ss-card--xl {
    @apply p-6;
  }

  .ss-card__header {
    @apply flex-col items-start space-y-2;
  }

  .ss-card__actions {
    @apply ml-0 mt-2;
  }
}

/* 特殊效果 */
.ss-card--glass {
  @apply bg-white bg-opacity-80 backdrop-blur-sm border-gray-200;
}

.ss-card--gradient {
  background: linear-gradient(135deg, theme('colors.primary.500'), theme('colors.primary.600'));
  @apply text-white border-transparent;
}

.ss-card--gradient .ss-card__title {
  @apply text-white;
}

.ss-card--gradient .ss-card__subtitle {
  @apply text-primary-100;
}

/* 卡片组样式 */
.ss-card-group {
  @apply grid gap-4;
}

.ss-card-group--cols-2 {
  @apply grid-cols-1 md:grid-cols-2;
}

.ss-card-group--cols-3 {
  @apply grid-cols-1 md:grid-cols-2 lg:grid-cols-3;
}

.ss-card-group--cols-4 {
  @apply grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4;
}
</style>