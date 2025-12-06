<template>
  <header
    class="modern-page-header"
    :class="headerClasses"
  >
    <!-- 左侧区域：标题和面包屑 -->
    <div class="modern-page-header-left">
      <!-- 面包屑导航 -->
      <nav
        v-if="breadcrumb && breadcrumb.length > 0"
        class="modern-breadcrumb"
        aria-label="面包屑导航"
      >
        <ol class="breadcrumb-list">
          <li
            v-for="(item, index) in breadcrumb"
            :key="index"
            class="breadcrumb-item"
          >
            <component
              :is="item.href ? 'a' : 'span'"
              :href="item.href"
              class="breadcrumb-link"
              :class="{
                'breadcrumb-link--active': item.active,
                'breadcrumb-link--clickable': item.href && !item.active
              }"
              @click="handleBreadcrumbClick(item)"
            >
              {{ item.label }}
            </component>
            <span
              v-if="index < breadcrumb.length - 1"
              class="breadcrumb-separator"
              aria-hidden="true"
            >
              /
            </span>
          </li>
        </ol>
      </nav>

      <!-- 页面标题 -->
      <h1 class="modern-page-title">
        {{ title }}
      </h1>

      <!-- 页面副标题 -->
      <p
        v-if="subtitle"
        class="modern-page-subtitle"
      >
        {{ subtitle }}
      </p>
    </div>

    <!-- 右侧区域：统计和操作 -->
    <div class="modern-page-header-right">
      <!-- 统计卡片 -->
      <div
        v-if="showStats && stats && stats.length > 0"
        class="modern-header-stats"
      >
        <div
          v-for="(stat, index) in stats"
          :key="stat.key"
          class="modern-stat-card compact"
          :class="`stat-card--${stat.type || 'default'}`"
          @click="handleStatClick(stat, index)"
        >
          <div class="modern-stat-content">
            <div class="modern-stat-info">
              <h3 class="modern-stat-label">{{ stat.label }}</h3>
              <p class="modern-stat-value">
                {{ stat.value }}{{ stat.unit || '' }}
              </p>
            </div>
            <div
              v-if="stat.icon"
              class="modern-stat-icon"
            >
              <component :is="stat.icon" />
            </div>
          </div>

          <!-- 趋势指示器 -->
          <div
            v-if="stat.trend"
            class="modern-stat-trend"
            :class="{
              'trend--up': stat.trend.direction === 'up',
              'trend--down': stat.trend.direction === 'down'
            }"
          >
            <span class="trend-value">{{ stat.trend.value }}%</span>
            <component
              :is="stat.trend.direction === 'up' ? 'TrendingUpIcon' : 'TrendingDownIcon'"
              class="trend-icon"
            />
          </div>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div
        v-if="actions && actions.length > 0"
        class="modern-header-actions"
      >
        <n-space :size="12">
          <n-button
            v-for="action in actions"
            :key="action.key"
            :type="action.type || 'default'"
            size="medium"
            :loading="action.loading"
            :disabled="action.disabled"
            class="modern-action-button"
            @click="handleActionClick(action)"
          >
            <template
              v-if="action.icon"
              #icon
            >
              <component :is="action.icon" />
            </template>
            {{ action.label }}
          </n-button>
        </n-space>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon
} from '@vicons/ionicons5';
import type { StatItem, BreadcrumbItem } from '@/types/layout';

// 组件属性
interface Props {
  /** 页面标题 */
  title?: string;
  /** 页面副标题 */
  subtitle?: string;
  /** 面包屑导航 */
  breadcrumb?: BreadcrumbItem[];
  /** 是否显示统计信息 */
  showStats?: boolean;
  /** 统计数据 */
  stats?: StatItem[];
  /** 操作按钮 */
  actions?: Array<{
    key: string;
    label: string;
    icon?: any;
    type?: 'primary' | 'default' | 'success' | 'warning' | 'error';
    onClick: () => void;
    loading?: boolean;
    disabled?: boolean;
  }>;
  /** 自定义类名 */
  class?: string;
  /** 紧凑模式 */
  compact?: boolean;
  /** 统计卡片最大显示数量 */
  maxStats?: number;
}

// 默认属性
const props = withDefaults(defineProps<Props>(), {
  showStats: false,
  compact: false,
  maxStats: 4
});

// 计算属性
const headerClasses = computed(() => [
  props.class,
  {
    'modern-page-header--compact': props.compact,
    'modern-page-header--with-stats': props.showStats && props.stats && props.stats.length > 0,
    'modern-page-header--with-actions': props.actions && props.actions.length > 0
  }
]);

// 过滤后的统计数据（根据maxStats限制）
const displayStats = computed(() => {
  if (!props.stats) return [];
  return props.stats.slice(0, props.maxStats);
});

// 事件处理
const emit = defineEmits<{
  statClick: [stat: StatItem, index: number];
  actionClick: [action: NonNullable<Props['actions']>[0]];
  breadcrumbClick: [item: BreadcrumbItem];
}>();

const handleStatClick = (stat: StatItem, index: number) => {
  if (stat.onClick) {
    stat.onClick();
  }
  emit('statClick', stat, index);
};

const handleActionClick = (action: NonNullable<Props['actions']>[0]) => {
  if (action.onClick) {
    action.onClick();
  }
  emit('actionClick', action);
};

const handleBreadcrumbClick = (item: BreadcrumbItem) => {
  if (item.href && !item.active) {
    emit('breadcrumbClick', item);
  }
};
</script>

<style scoped>
/* ===== 页面头部样式 ===== */
.modern-page-header {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-radius: var(--radius-lg);
  padding: var(--spacing-xl);
  margin-bottom: var(--spacing-xl);
  border: 1px solid rgba(255, 255, 255, 0.15);
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: var(--spacing-lg);
  transition: all var(--transition-normal) var(--ease-out-cubic);
  position: relative;
  overflow: hidden;
}

.modern-page-header::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, var(--gradient-primary));
  opacity: 0.8;
}

/* 左侧区域 */
.modern-page-header-left {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  min-width: 0;
  flex: 1;
}

/* 面包屑导航 */
.modern-breadcrumb {
  margin-bottom: var(--spacing-xs);
}

.breadcrumb-list {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  list-style: none;
  margin: 0;
  padding: 0;
}

.breadcrumb-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.breadcrumb-link {
  color: inherit;
  text-decoration: none;
  transition: color var(--transition-fast) var(--ease-out-cubic);
  outline: none;
}

.breadcrumb-link:hover,
.breadcrumb-link:focus {
  color: var(--text-primary);
}

.breadcrumb-link--active {
  color: var(--text-primary);
  font-weight: 500;
}

.breadcrumb-link--clickable {
  cursor: pointer;
}

.breadcrumb-separator {
  opacity: 0.5;
  user-select: none;
}

/* 页面标题 */
.modern-page-title {
  font-size: 2rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
  line-height: 1.2;
  word-break: break-word;
}

/* 页面副标题 */
.modern-page-subtitle {
  font-size: 1rem;
  color: var(--text-secondary);
  margin: 0;
  opacity: 0.8;
  line-height: 1.5;
  word-break: break-word;
}

/* 右侧区域 */
.modern-page-header-right {
  display: flex;
  align-items: center;
  gap: var(--spacing-lg);
  flex-shrink: 0;
}

/* 头部统计卡片 */
.modern-header-stats {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  flex-wrap: wrap;
}

.modern-stat-card.compact {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border-radius: var(--radius-lg);
  padding: var(--spacing-md) var(--spacing-lg);
  border: 1px solid var(--border-primary);
  transition: all var(--transition-normal) var(--ease-out-cubic);
  cursor: pointer;
  position: relative;
  min-width: 120px;
  max-width: 180px;
}

.modern-stat-card.compact:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.modern-stat-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-md);
}

.modern-stat-info {
  flex: 1;
  min-width: 0;
}

.modern-stat-label {
  font-size: 0.75rem;
  color: var(--text-secondary);
  margin: 0 0 var(--spacing-xs) 0;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.modern-stat-value {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
  white-space: nowrap;
}

.modern-stat-icon {
  width: 32px;
  height: 32px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  background: var(--gradient-primary);
  color: white;
  flex-shrink: 0;
}

/* 统计卡片类型变体 */
.stat-card--primary .modern-stat-icon {
  background: var(--gradient-primary);
}

.stat-card--success .modern-stat-icon {
  background: var(--gradient-success);
}

.stat-card--warning .modern-stat-icon {
  background: var(--gradient-warning);
}

.stat-card--error .modern-stat-icon {
  background: var(--gradient-error);
}

.stat-card--info .modern-stat-icon {
  background: var(--gradient-neutral);
}

/* 趋势指示器 */
.modern-stat-trend {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  margin-top: var(--spacing-xs);
  font-size: 0.75rem;
  font-weight: 500;
}

.trend--up {
  color: var(--success);
}

.trend--down {
  color: var(--error);
}

.trend-value {
  font-weight: 600;
}

.trend-icon {
  width: 12px;
  height: 12px;
}

/* 操作按钮 */
.modern-header-actions {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.modern-action-button {
  transition: all var(--transition-normal) var(--ease-out-cubic);
}

.modern-action-button:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

/* 紧凑模式 */
.modern-page-header--compact {
  padding: var(--spacing-lg) var(--spacing-xl);
  gap: var(--spacing-md);
}

.modern-page-header--compact .modern-page-title {
  font-size: 1.5rem;
}

.modern-page-header--compact .modern-stat-card.compact {
  padding: var(--spacing-sm) var(--spacing-md);
  min-width: 100px;
  max-width: 150px;
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .modern-page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-lg);
    padding: var(--spacing-lg);
  }

  .modern-page-header-right {
    width: 100%;
    justify-content: space-between;
  }

  .modern-header-stats {
    justify-content: flex-start;
  }

  .modern-header-actions {
    justify-content: flex-end;
  }
}

@media (max-width: 768px) {
  .modern-page-header {
    padding: var(--spacing-md);
    gap: var(--spacing-md);
  }

  .modern-page-title {
    font-size: 1.5rem;
  }

  .modern-page-subtitle {
    font-size: 0.875rem;
  }

  .modern-header-stats {
    width: 100%;
    overflow-x: auto;
    padding-bottom: var(--spacing-sm);
    gap: var(--spacing-sm);
  }

  .modern-stat-card.compact {
    min-width: 100px;
    max-width: 120px;
    padding: var(--spacing-sm);
  }

  .modern-stat-value {
    font-size: 1.125rem;
  }

  .modern-stat-icon {
    width: 28px;
    height: 28px;
    font-size: 0.875rem;
  }
}

@media (max-width: 480px) {
  .modern-page-header {
    padding: var(--spacing-sm);
  }

  .modern-page-title {
    font-size: 1.25rem;
  }

  .modern-header-stats {
    gap: var(--spacing-xs);
  }

  .modern-stat-card.compact {
    min-width: 80px;
    max-width: 100px;
    padding: var(--spacing-xs) var(--spacing-sm);
  }

  .modern-stat-label {
    font-size: 0.625rem;
  }

  .modern-stat-value {
    font-size: 1rem;
  }

  .modern-stat-icon {
    width: 24px;
    height: 24px;
    font-size: 0.75rem;
  }

  .modern-header-actions {
    width: 100%;
    justify-content: center;
  }
}

/* 深色主题 */
.dark .modern-page-header {
  background: rgba(0, 0, 0, 0.2);
  border-color: rgba(255, 255, 255, 0.1);
}

.dark .modern-stat-card.compact {
  background: rgba(24, 24, 28, 0.8);
  border-color: var(--border-primary);
}

/* 无障碍支持 */
@media (prefers-reduced-motion: reduce) {
  .modern-page-header {
    backdrop-filter: none;
    -webkit-backdrop-filter: none;
  }

  .modern-stat-card.compact {
    backdrop-filter: none;
    -webkit-backdrop-filter: none;
  }

  .modern-action-button {
    transform: none;
  }
}

/* 高对比度模式 */
@media (prefers-contrast: high) {
  .modern-page-header {
    border: 2px solid var(--border-primary);
  }

  .modern-stat-card.compact {
    border: 1px solid var(--border-primary);
  }
}
</style>