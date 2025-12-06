<template>
  <div
    class="modern-content-card"
    :class="cardClasses"
    :style="cardStyles"
    @click="handleCardClick"
  >
    <!-- 装饰性顶部线条 -->
    <div
      v-if="showTopLine"
      class="modern-card-top-line"
      :style="topLineStyle"
    ></div>

    <!-- 加载状态 -->
    <div
      v-if="loading"
      class="modern-card-loading"
    >
      <div class="loading-spinner">
        <n-spin size="medium" />
      </div>
      <div class="loading-overlay"></div>
    </div>

    <!-- 卡片头部 -->
    <header
      v-if="hasHeader"
      class="modern-card-header"
      :class="headerClasses"
    >
      <div class="modern-card-header-left">
        <!-- 图标 -->
        <div
          v-if="icon"
          class="modern-card-icon"
          :class="iconClasses"
        >
          <component :is="icon" />
        </div>

        <!-- 标题和副标题 -->
        <div class="modern-card-title-section">
          <h3
            v-if="title"
            class="modern-card-title"
          >
            {{ title }}
          </h3>
          <p
            v-if="subtitle"
            class="modern-card-subtitle"
          >
            {{ subtitle }}
          </p>
        </div>
      </div>

      <!-- 头部操作按钮 -->
      <div
        v-if="headerActions && headerActions.length > 0"
        class="modern-card-header-actions"
      >
        <n-space :size="8">
          <n-button
            v-for="action in headerActions"
            :key="action.key"
            text
            size="small"
            :type="action.type"
            :loading="action.loading"
            @click="handleHeaderAction(action)"
          >
            <template
              v-if="action.icon"
              #icon
            >
              <component :is="action.icon" />
            </template>
          </n-button>
        </n-space>
      </div>
    </header>

    <!-- 卡片内容 -->
    <main
      class="modern-card-content"
      :class="contentClasses"
      :style="contentStyles"
    >
      <slot />
    </main>

    <!-- 卡片底部 -->
    <footer
      v-if="hasFooter"
      class="modern-card-footer"
      :class="footerClasses"
    >
      <div
        v-if="footerContent"
        class="modern-card-footer-text"
      >
        {{ footerContent }}
      </div>

      <div
        v-if="footerActions && footerActions.length > 0"
        class="modern-card-footer-actions"
        :class="{
          'footer-actions--left': footerAlign === 'left',
          'footer-actions--center': footerAlign === 'center',
          'footer-actions--right': footerAlign === 'right',
          'footer-actions--space-between': footerAlign === 'space-between'
        }"
      >
        <n-space :size="12">
          <n-button
            v-for="action in footerActions"
            :key="action.key"
            :type="action.type || 'default'"
            :size="action.size || 'medium'"
            :loading="action.loading"
            :disabled="action.disabled"
            @click="handleFooterAction(action)"
          >
            {{ action.label }}
          </n-button>
        </n-space>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { computed, type CSSProperties } from 'vue';
import type { ContentCardConfig } from '@/types/layout';

// 组件属性
interface Props {
  /** 卡片标题 */
  title?: string;
  /** 卡片副标题 */
  subtitle?: string;
  /** 卡片图标 */
  icon?: any;
  /** 内容区域样式变体 */
  variant?: 'default' | 'elevated' | 'outlined' | 'glass';
  /** 内边距大小 */
  padding?: 'sm' | 'md' | 'lg' | 'xl';
  /** 是否可悬停 */
  hoverable?: boolean;
  /** 是否可点击 */
  clickable?: boolean;
  /** 是否显示加载状态 */
  loading?: boolean;
  /** 头部操作按钮 */
  headerActions?: Array<{
    key: string;
    label?: string;
    icon?: any;
    type?: 'primary' | 'default' | 'success' | 'warning' | 'error';
    onClick: () => void;
    loading?: boolean;
  }>;
  /** 底部内容文本 */
  footerContent?: string;
  /** 底部操作按钮 */
  footerActions?: Array<{
    key: string;
    label: string;
    type?: 'primary' | 'default' | 'success' | 'warning' | 'error';
    size?: 'small' | 'medium' | 'large';
    loading?: boolean;
    disabled?: boolean;
    onClick: () => void;
  }>;
  /** 底部对齐方式 */
  footerAlign?: 'left' | 'center' | 'right' | 'space-between';
  /** 是否显示顶部装饰线 */
  showTopLine?: boolean;
  /** 顶部线条颜色 */
  topLineColor?: string;
  /** 自定义类名 */
  class?: string;
  /** 内容自定义类名 */
  contentClass?: string;
  /** 头部自定义类名 */
  headerClass?: string;
  /** 底部自定义类名 */
  footerClass?: string;
  /** 卡片高度 */
  height?: string;
  /** 卡片最大高度 */
  maxHeight?: string;
  /** 自定义背景色 */
  backgroundColor?: string;
  /** 图标背景色 */
  iconBackground?: string;
  /** 圆角大小 */
  borderRadius?: 'sm' | 'md' | 'lg' | 'xl';
}

// 默认属性
const props = withDefaults(defineProps<Props>(), {
  variant: 'default',
  padding: 'lg',
  hoverable: true,
  clickable: false,
  loading: false,
  showTopLine: false,
  footerAlign: 'right',
  borderRadius: 'lg'
});

// 计算属性
const cardClasses = computed(() => [
  props.class,
  `modern-content-card--${props.variant}`,
  `modern-content-card--${props.padding}`,
  {
    'modern-content-card--hoverable': props.hoverable,
    'modern-content-card--clickable': props.clickable,
    'modern-content-card--loading': props.loading,
    'modern-content-card--has-header': hasHeader.value,
    'modern-content-card--has-footer': hasFooter.value
  }
]);

const headerClasses = computed(() => [
  props.headerClass,
  {
    'modern-card-header--with-icon': props.icon,
    'modern-card-header--with-actions': props.headerActions && props.headerActions.length > 0
  }
]);

const contentClasses = computed(() => [
  props.contentClass
]);

const footerClasses = computed(() => [
  props.footerClass,
  `modern-card-footer--${props.footerAlign}`
]);

const iconClasses = computed(() => ({
  'modern-card-icon--colored': props.iconBackground
}));

// 检查是否有头部和底部
const hasHeader = computed(() => !!(props.title || props.subtitle || props.icon ||
  (props.headerActions && props.headerActions.length > 0)));

const hasFooter = computed(() => !!(props.footerContent ||
  (props.footerActions && props.footerActions.length > 0)));

// 样式计算
const cardStyles = computed<CSSProperties>(() => ({
  height: props.height,
  maxHeight: props.maxHeight,
  backgroundColor: props.backgroundColor,
  borderRadius: `var(--radius-${props.borderRadius})`
}));

const contentStyles = computed<CSSProperties>(() => ({
  maxHeight: props.maxHeight ? `calc(${props.maxHeight} - ${hasHeader.value ? '80px' : '0px'} - ${hasFooter.value ? '80px' : '0px'})` : undefined
}));

const topLineStyle = computed<CSSProperties>(() => ({
  background: props.topLineColor || 'var(--gradient-primary)'
}));

// 事件处理
const emit = defineEmits<{
  cardClick: [event: MouseEvent];
  headerAction: [action: NonNullable<Props['headerActions']>[0]];
  footerAction: [action: NonNullable<Props['footerActions']>[0]];
}>();

const handleCardClick = (event: MouseEvent) => {
  if (props.clickable) {
    emit('cardClick', event);
  }
};

const handleHeaderAction = (action: NonNullable<Props['headerActions']>[0]) => {
  if (action.onClick) {
    action.onClick();
  }
  emit('headerAction', action);
};

const handleFooterAction = (action: NonNullable<Props['footerActions']>[0]) => {
  if (action.onClick) {
    action.onClick();
  }
  emit('footerAction', action);
};
</script>

<style scoped>
/* ===== 内容卡片样式 ===== */
.modern-content-card {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-primary);
  transition: all var(--transition-normal) var(--ease-out-cubic);
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* 装饰性顶部线条 */
.modern-card-top-line {
  height: 3px;
  width: 100%;
  background: var(--gradient-primary);
  position: relative;
}

.modern-card-top-line::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.6), transparent);
  animation: shimmer 2s infinite;
}

@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

/* 样式变体 */
.modern-content-card--default {
  background: rgba(255, 255, 255, 0.9);
  box-shadow: var(--shadow-md);
}

.modern-content-card--elevated {
  background: rgba(255, 255, 255, 0.95);
  box-shadow: var(--shadow-lg);
}

.modern-content-card--outlined {
  background: rgba(255, 255, 255, 0.8);
  border-width: 2px;
  box-shadow: none;
}

.modern-content-card--glass {
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(15px);
  -webkit-backdrop-filter: blur(15px);
  border: 1px solid rgba(255, 255, 255, 0.3);
}

/* 交互状态 */
.modern-content-card--hoverable:hover,
.modern-content-card--clickable:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-xl);
  border-color: rgba(102, 126, 234, 0.3);
}

.modern-content-card--clickable {
  cursor: pointer;
}

/* 加载状态 */
.modern-card-loading {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(2px);
  -webkit-backdrop-filter: blur(2px);
}

.loading-spinner {
  position: relative;
  z-index: 1;
}

/* 内边距变体 */
.modern-content-card--sm {
  padding: var(--spacing-md);
}

.modern-content-card--md {
  padding: var(--spacing-lg);
}

.modern-content-card--lg {
  padding: var(--spacing-xl);
}

.modern-content-card--xl {
  padding: var(--spacing-2xl);
}

/* 卡片头部 */
.modern-card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: var(--spacing-lg);
  padding-bottom: var(--spacing-md);
  border-bottom: 1px solid var(--border-secondary);
}

.modern-card-header-left {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-md);
  min-width: 0;
  flex: 1;
}

/* 卡片图标 */
.modern-card-icon {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  background: var(--gradient-primary);
  color: white;
  flex-shrink: 0;
  transition: all var(--transition-normal) var(--ease-out-cubic);
}

.modern-card-icon--colored {
  background: v-bind(iconBackground || 'var(--gradient-primary)');
}

/* 标题区域 */
.modern-card-title-section {
  min-width: 0;
  flex: 1;
}

.modern-card-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
  line-height: 1.3;
  word-break: break-word;
}

.modern-card-subtitle {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin: var(--spacing-xs) 0 0 0;
  line-height: 1.4;
  word-break: break-word;
}

/* 头部操作 */
.modern-card-header-actions {
  flex-shrink: 0;
  margin-left: var(--spacing-md);
}

/* 卡片内容 */
.modern-card-content {
  flex: 1;
  min-width: 0;
  overflow: hidden;
}

/* 卡片底部 */
.modern-card-footer {
  display: flex;
  align-items: center;
  margin-top: var(--spacing-lg);
  padding-top: var(--spacing-md);
  border-top: 1px solid var(--border-secondary);
  gap: var(--spacing-md);
}

.modern-card-footer-text {
  font-size: 0.875rem;
  color: var(--text-secondary);
  flex: 1;
  min-width: 0;
}

.modern-card-footer-actions {
  flex-shrink: 0;
}

.footer-actions--left {
  justify-content: flex-start;
}

.footer-actions--center {
  justify-content: center;
}

.footer-actions--right {
  justify-content: flex-end;
}

.footer-actions--space-between {
  justify-content: space-between;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .modern-card-header {
    flex-direction: column;
    align-items: stretch;
    gap: var(--spacing-md);
    margin-bottom: var(--spacing-md);
  }

  .modern-card-header-left {
    gap: var(--spacing-sm);
  }

  .modern-card-icon {
    width: 36px;
    height: 36px;
    font-size: 1.125rem;
  }

  .modern-card-title {
    font-size: 1.125rem;
  }

  .modern-card-header-actions {
    margin-left: 0;
    align-self: flex-end;
  }

  .modern-card-footer {
    flex-direction: column;
    align-items: stretch;
    gap: var(--spacing-md);
  }

  .modern-card-footer-actions {
    align-self: stretch;
  }

  .footer-actions--left,
  .footer-actions--center,
  .footer-actions--right,
  .footer-actions--space-between {
    justify-content: stretch;
  }
}

@media (max-width: 480px) {
  .modern-content-card--sm {
    padding: var(--spacing-sm);
  }

  .modern-content-card--md {
    padding: var(--spacing-md);
  }

  .modern-content-card--lg {
    padding: var(--spacing-md);
  }

  .modern-content-card--xl {
    padding: var(--spacing-lg);
  }

  .modern-card-icon {
    width: 32px;
    height: 32px;
    font-size: 1rem;
  }

  .modern-card-title {
    font-size: 1rem;
  }

  .modern-card-subtitle {
    font-size: 0.8125rem;
  }
}

/* 深色主题 */
.dark .modern-content-card--default {
  background: rgba(24, 24, 28, 0.9);
  border-color: var(--border-primary);
}

.dark .modern-content-card--elevated {
  background: rgba(24, 24, 28, 0.95);
  border-color: var(--border-primary);
}

.dark .modern-content-card--outlined {
  background: rgba(24, 24, 28, 0.8);
  border-color: var(--border-primary);
}

.dark .modern-content-card--glass {
  background: rgba(24, 24, 28, 0.6);
  border-color: rgba(255, 255, 255, 0.1);
}

.dark .loading-overlay {
  background: rgba(24, 24, 28, 0.8);
}

/* 无障碍支持 */
@media (prefers-reduced-motion: reduce) {
  .modern-content-card {
    transition: none;
  }

  .modern-content-card--hoverable:hover,
  .modern-content-card--clickable:hover {
    transform: none;
  }

  .modern-card-top-line::after {
    animation: none;
  }
}

/* 高对比度模式 */
@media (prefers-contrast: high) {
  .modern-content-card {
    border-width: 2px;
  }

  .modern-content-card--outlined {
    border-width: 3px;
  }
}
</style>