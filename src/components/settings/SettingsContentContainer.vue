/**
 * 设置内容容器组件
 * 提供统一的设置模块容器样式和布局
 * 遵循单一职责原则，专注于内容展示
 */

<template>
  <div class="settings-content-container">
    <div class="content-header" v-if="title || description">
      <h2 class="content-title" v-if="title">{{ title }}</h2>
      <p class="content-description" v-if="description">{{ description }}</p>
    </div>

    <div class="content-body">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 设置内容容器属性接口
 */
interface IProps {
  title?: string
  description?: string
  loading?: boolean
}

const props = withDefaults(defineProps<IProps>(), {
  loading: false
})
</script>

<style scoped>
/* 内容容器样式 */
.settings-content-container {
  @apply w-full bg-white rounded-lg shadow-sm;
  border: 1px solid rgba(0, 0, 0, 0.06);
  overflow: hidden;
}

/* 内容头部样式 */
.content-header {
  @apply px-6 py-4 border-b border-gray-200;
  background: linear-gradient(135deg, rgba(249, 250, 251, 0.8) 0%, rgba(243, 244, 246, 0.8) 100%);
}

.content-title {
  @apply text-lg font-semibold text-gray-900 mb-1;
  font-feature-settings: 'cv02', 'cv03', 'cv04', 'cv11';
}

.content-description {
  @apply text-sm text-gray-600 leading-relaxed;
}

/* 内容主体样式 */
.content-body {
  @apply p-6;
}

/* 响应式设计 */
@media (max-width: 640px) {
  .content-header {
    @apply px-4 py-3;
  }

  .content-title {
    @apply text-base;
  }

  .content-description {
    @apply text-xs;
  }

  .content-body {
    @apply p-4;
  }
}

@media (min-width: 1024px) {
  .content-header {
    @apply px-8 py-5;
  }

  .content-body {
    @apply p-8;
  }
}

/* 深色模式适配 */
.dark .settings-content-container {
  @apply bg-gray-800/90;
  border-color: rgba(75, 85, 99, 0.3);
}

.dark .content-header {
  @apply border-gray-700;
  background: linear-gradient(135deg, rgba(31, 41, 55, 0.8) 0%, rgba(17, 24, 39, 0.8) 100%);
}

.dark .content-title {
  @apply text-gray-100;
}

.dark .content-description {
  @apply text-gray-400;
}

/* 加载状态样式 */
.settings-content-container.loading {
  @apply opacity-60 pointer-events-none;
}

/* 动画效果 */
.settings-content-container {
  animation: fadeInUp 0.3s ease-out;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>