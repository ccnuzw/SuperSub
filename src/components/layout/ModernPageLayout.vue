<template>
  <div
    class="modern-page"
    :class="pageClasses"
    :style="pageStyles"
  >
    <!-- 装饰性背景元素 -->
    <div class="modern-page-bg-elements">
      <div class="bg-element bg-element-1"></div>
      <div class="bg-element bg-element-2"></div>
      <div class="bg-element bg-element-3"></div>
    </div>

    <!-- 页面内容容器 -->
    <div
      class="modern-page-content animate-fade-in-up"
      :style="contentStyles"
    >
      <!-- 页面头部 -->
      <ModernPageHeader
        v-if="showHeader"
        :title="title"
        :subtitle="subtitle"
        :breadcrumb="breadcrumb"
        :stats="stats"
        :actions="actions"
        :class="headerClasses?.join(' ')"
      />

      <!-- 主要内容区域 -->
      <div
        class="modern-page-main"
        :class="mainClasses"
      >
        <slot />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, type CSSProperties } from 'vue';
import ModernPageHeader from './ModernPageHeader.vue';
import type { PageLayoutConfig, BreadcrumbItem, StatItem } from '@/types/layout';

// 组件属性
interface Props {
  /** 页面标题 */
  title?: string;
  /** 页面副标题 */
  subtitle?: string;
  /** 面包屑导航 */
  breadcrumb?: BreadcrumbItem[];
  /** 是否显示头部 */
  showHeader?: boolean;
  /** 是否显示统计信息 */
  showStats?: boolean;
  /** 统计数据 */
  stats?: StatItem[];
  /** 操作按钮 */
  actions?: PageLayoutConfig['actions'];
  /** 背景类型 */
  background?: 'gradient' | 'solid' | 'glass';
  /** 最大宽度 */
  maxWidth?: string;
  /** 内边距 */
  padding?: string;
  /** 主题模式 */
  theme?: 'light' | 'dark' | 'auto';
  /** 自定义类名 */
  class?: string;
  /** 头部自定义类名 */
  headerClass?: string;
  /** 主内容自定义类名 */
  mainClass?: string;
  /** 动画配置 */
  animation?: boolean;
  /** 响应式配置 */
  responsive?: boolean;
}

// 默认属性
const props = withDefaults(defineProps<Props>(), {
  showHeader: true,
  showStats: false,
  background: 'gradient',
  maxWidth: '1200px',
  padding: 'var(--spacing-xl)',
  theme: 'auto',
  animation: true,
  responsive: true
});

// 计算属性
const pageClasses = computed(() => [
  props.class,
  {
    'modern-page--solid': props.background === 'solid',
    'modern-page--glass': props.background === 'glass',
    'modern-page--gradient': props.background === 'gradient',
    'modern-page--dark': props.theme === 'dark',
    'modern-page--responsive': props.responsive
  }
]);

const headerClasses = computed(() => [
  props.headerClass
]);

const mainClasses = computed(() => [
  props.mainClass,
  {
    'modern-page-main--with-header': props.showHeader,
    'modern-page-main--full': !props.showHeader
  }
]);

const pageStyles = computed<CSSProperties>(() => ({
  '--page-max-width': props.maxWidth,
  '--page-padding': props.padding
}));

const contentStyles = computed<CSSProperties>(() => ({
  maxWidth: props.maxWidth,
  padding: props.padding
}));

// 事件处理
defineEmits<{
  // 统计项点击事件
  statClick: [stat: StatItem, index: number];
  // 操作按钮点击事件
  actionClick: [action: Exclude<PageLayoutConfig['actions'], undefined>[0]];
  // 面包屑点击事件
  breadcrumbClick: [item: BreadcrumbItem];
}>();
</script>

<style scoped>
/* ===== 页面布局样式 ===== */
.modern-page {
  min-height: 100vh;
  background: var(--gradient-primary);
  padding: var(--spacing-xl);
  position: relative;
  overflow-x: hidden;
  transition: all var(--transition-normal) var(--ease-out-cubic);
}

/* 背景类型变体 */
.modern-page--gradient {
  background: var(--gradient-primary);
}

.modern-page--solid {
  background: var(--bg-secondary);
}

.modern-page--glass {
  background: linear-gradient(135deg,
    rgba(102, 126, 234, 0.1) 0%,
    rgba(118, 75, 162, 0.1) 100%
  ),
  var(--bg-secondary);
}

/* 装饰性背景元素 */
.modern-page-bg-elements {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: 1;
  overflow: hidden;
}

.bg-element {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.6;
  animation: float 6s ease-in-out infinite;
}

.bg-element-1 {
  top: 10%;
  left: 15%;
  width: 300px;
  height: 300px;
  background: radial-gradient(circle, rgba(102, 126, 234, 0.4) 0%, transparent 70%);
  animation-delay: 0s;
}

.bg-element-2 {
  top: 60%;
  right: 10%;
  width: 250px;
  height: 250px;
  background: radial-gradient(circle, rgba(118, 75, 162, 0.3) 0%, transparent 70%);
  animation-delay: 2s;
}

.bg-element-3 {
  bottom: 20%;
  left: 60%;
  width: 200px;
  height: 200px;
  background: radial-gradient(circle, rgba(255, 182, 193, 0.2) 0%, transparent 70%);
  animation-delay: 4s;
}

/* 浮动动画 */
@keyframes float {
  0%, 100% {
    transform: translateY(0px) rotate(0deg);
  }
  33% {
    transform: translateY(-20px) rotate(1deg);
  }
  66% {
    transform: translateY(10px) rotate(-1deg);
  }
}

/* 页面内容容器 */
.modern-page-content {
  background: var(--bg-overlay);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-xl);
  margin: 0 auto;
  position: relative;
  z-index: 2;
  border: 1px solid rgba(255, 255, 255, 0.15);
  min-height: calc(100vh - 2 * var(--spacing-xl));
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* 主内容区域 */
.modern-page-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 100%;
  position: relative;
}

.modern-page-main--with-header {
  padding: 0 var(--spacing-2xl) var(--spacing-2xl);
}

.modern-page-main--full {
  padding: var(--spacing-2xl);
}

/* 深色主题 */
.modern-page--dark {
  --bg-overlay: rgba(24, 24, 28, 0.95);
  --text-primary: #ffffff;
  --text-secondary: #e5e7eb;
  --border-primary: #303030;
}

.modern-page--dark .modern-page-content {
  border-color: rgba(255, 255, 255, 0.1);
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .modern-page {
    padding: var(--spacing-lg);
  }

  .modern-page-main--with-header {
    padding: 0 var(--spacing-xl) var(--spacing-xl);
  }

  .modern-page-main--full {
    padding: var(--spacing-xl);
  }

  .bg-element {
    filter: blur(60px);
  }

  .bg-element-1 {
    width: 200px;
    height: 200px;
  }

  .bg-element-2 {
    width: 180px;
    height: 180px;
  }

  .bg-element-3 {
    width: 150px;
    height: 150px;
  }
}

@media (max-width: 768px) {
  .modern-page {
    padding: var(--spacing-md);
  }

  .modern-page-content {
    border-radius: var(--radius-lg);
    min-height: calc(100vh - 2 * var(--spacing-md));
  }

  .modern-page-main--with-header {
    padding: 0 var(--spacing-lg) var(--spacing-lg);
  }

  .modern-page-main--full {
    padding: var(--spacing-lg);
  }

  .bg-element {
    filter: blur(40px);
    opacity: 0.4;
  }

  .bg-element-1 {
    width: 150px;
    height: 150px;
  }

  .bg-element-2 {
    width: 120px;
    height: 120px;
  }

  .bg-element-3 {
    width: 100px;
    height: 100px;
  }
}

@media (max-width: 480px) {
  .modern-page {
    padding: var(--spacing-sm);
  }

  .modern-page-content {
    border-radius: var(--radius-md);
    min-height: calc(100vh - 2 * var(--spacing-sm));
  }

  .modern-page-main--with-header {
    padding: 0 var(--spacing-md) var(--spacing-md);
  }

  .modern-page-main--full {
    padding: var(--spacing-md);
  }
}

/* 无障碍支持 */
@media (prefers-reduced-motion: reduce) {
  .bg-element {
    animation: none;
  }

  .modern-page-content {
    backdrop-filter: none;
    -webkit-backdrop-filter: none;
  }
}

/* 高对比度模式 */
@media (prefers-contrast: high) {
  .modern-page-content {
    border: 2px solid var(--border-primary);
  }

  .bg-element {
    opacity: 0.2;
  }
}
</style>