<template>
  <div class="modern-stats-card" :class="[
    `size-${size}`,
    { 'hoverable': hoverable, 'bordered': bordered, 'clickable': !!onClick }
  ]" @click="handleClick">
    <!-- 卡片内容 -->
    <div class="stats-content">
      <!-- 主要统计值 -->
      <div class="stats-main">
        <div class="stats-value" :class="`value-${color}`">
          {{ formattedValue }}
        </div>
        <div v-if="unit" class="stats-unit">{{ unit }}</div>
      </div>

      <!-- 标题 -->
      <div class="stats-title">{{ title }}</div>

      <!-- 副标题 -->
      <div v-if="subtitle" class="stats-subtitle">{{ subtitle }}</div>

      <!-- 趋势指示器 -->
      <div v-if="trend" class="stats-trend" :class="`trend-${trend}`">
        <n-icon size="14">
          <TrendingUp v-if="trend === 'up'" />
          <TrendingDown v-else-if="trend === 'down'" />
          <RemoveOutline v-else />
        </n-icon>
        <span v-if="trendValue">{{ trendValue }}</span>
      </div>
    </div>

    <!-- 图标 -->
    <div class="stats-icon">
      <div class="icon-container" :class="`icon-${color}`">
        <n-icon :size="iconSize" :component="icon" />
      </div>
    </div>

    <!-- 装饰元素 -->
    <div class="stats-decoration" :class="`decoration-${color}`"></div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { NIcon } from 'naive-ui';
import { TrendingUp, TrendingDown, RemoveOutline } from '@vicons/ionicons5';

interface Props {
  title: string;
  value: number | string;
  unit?: string;
  subtitle?: string;
  icon?: any;
  iconColor?: string;
  iconSize?: number;
  size?: 'small' | 'medium' | 'large';
  color?: 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info';
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  formatter?: (value: number | string) => string;
  bordered?: boolean;
  hoverable?: boolean;
  onClick?: () => void;
}

const props = withDefaults(defineProps<Props>(), {
  unit: '',
  subtitle: '',
  iconColor: '#667eea',
  iconSize: 24,
  size: 'medium',
  color: 'primary',
  bordered: true,
  hoverable: true
});

const formattedValue = computed(() => {
  if (props.formatter) {
    return props.formatter(props.value);
  }

  if (typeof props.value === 'number') {
    return props.value.toLocaleString();
  }

  return props.value;
});

const handleClick = () => {
  if (props.onClick) {
    props.onClick();
  }
};
</script>

<style scoped>
/* 引入通用样式变量 */
@import '@/styles/common.css';

/* 现代统计卡片 */
.modern-stats-card {
  position: relative;
  background: var(--bg-primary);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-primary);
  padding: var(--spacing-lg);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-md);
  transition: all var(--transition-normal) var(--ease-out-cubic);
  overflow: hidden;
  cursor: default;
}

.modern-stats-card.bordered {
  border: 1px solid var(--border-primary);
}

.modern-stats-card.hoverable:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.modern-stats-card.clickable {
  cursor: pointer;
}

.modern-stats-card.clickable:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

/* 尺寸变体 */
.modern-stats-card.size-small {
  padding: var(--spacing-md);
  border-radius: var(--radius-md);
}

.modern-stats-card.size-large {
  padding: var(--spacing-xl);
  border-radius: var(--radius-xl);
}

/* 统计内容区域 */
.stats-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  min-width: 0;
}

.stats-main {
  display: flex;
  align-items: baseline;
  gap: var(--spacing-xs);
}

.stats-value {
  font-size: 2rem;
  font-weight: 700;
  line-height: 1;
  color: var(--text-primary);
}

.stats-unit {
  font-size: 0.875rem;
  color: var(--text-tertiary);
  font-weight: 400;
}

.stats-title {
  font-size: 0.875rem;
  color: var(--text-tertiary);
  font-weight: 500;
  line-height: 1.4;
}

.stats-subtitle {
  font-size: 0.75rem;
  color: var(--text-quaternary);
  line-height: 1.3;
}

/* 趋势指示器 */
.stats-trend {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  font-size: 0.75rem;
  font-weight: 500;
  margin-top: var(--spacing-xs);
}

.stats-trend.trend-up {
  color: var(--success);
}

.stats-trend.trend-down {
  color: var(--error);
}

.stats-trend.trend-neutral {
  color: var(--text-tertiary);
}

/* 图标容器 */
.stats-icon {
  position: relative;
  z-index: 2;
}

.icon-container {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-normal) var(--ease-out-cubic);
}

.icon-container.icon-primary {
  background: var(--gradient-primary);
  color: white;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.icon-container.icon-success {
  background: var(--gradient-success);
  color: white;
  box-shadow: 0 4px 12px rgba(82, 196, 26, 0.3);
}

.icon-container.icon-warning {
  background: var(--gradient-warning);
  color: white;
  box-shadow: 0 4px 12px rgba(250, 173, 20, 0.3);
}

.icon-container.icon-error {
  background: var(--gradient-error);
  color: white;
  box-shadow: 0 4px 12px rgba(255, 77, 79, 0.3);
}

.icon-container.icon-info {
  background: linear-gradient(135deg, #1890ff 0%, #40a9ff 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(24, 144, 255, 0.3);
}

.icon-container.icon-default {
  background: var(--gradient-neutral);
  color: white;
  box-shadow: 0 4px 12px rgba(134, 142, 156, 0.3);
}

/* 装饰元素 */
.stats-decoration {
  position: absolute;
  top: -50%;
  right: -20%;
  width: 100px;
  height: 100px;
  border-radius: 50%;
  opacity: 0.1;
  transition: all var(--transition-slow) var(--ease-out-cubic);
}

.modern-stats-card:hover .stats-decoration {
  opacity: 0.2;
  transform: scale(1.1);
}

.stats-decoration.decoration-primary {
  background: var(--gradient-primary);
}

.stats-decoration.decoration-success {
  background: var(--gradient-success);
}

.stats-decoration.decoration-warning {
  background: var(--gradient-warning);
}

.stats-decoration.decoration-error {
  background: var(--gradient-error);
}

.stats-decoration.decoration-info {
  background: linear-gradient(135deg, #1890ff 0%, #40a9ff 100%);
}

.stats-decoration.decoration-default {
  background: var(--gradient-neutral);
}

/* 数值颜色 */
.stats-value.value-primary { color: var(--primary-600); }
.stats-value.value-success { color: var(--success); }
.stats-value.value-warning { color: var(--warning); }
.stats-value.value-error { color: var(--error); }
.stats-value.value-info { color: var(--info); }
.stats-value.value-default { color: var(--text-primary); }

/* 尺寸变体 - 数值大小 */
.modern-stats-card.size-small .stats-value {
  font-size: 1.5rem;
}

.modern-stats-card.size-large .stats-value {
  font-size: 2.5rem;
}

/* 尺寸变体 - 图标大小 */
.modern-stats-card.size-small .icon-container {
  width: 40px;
  height: 40px;
}

.modern-stats-card.size-large .icon-container {
  width: 56px;
  height: 56px;
}

/* 深色主题适配 */
.dark .modern-stats-card {
  background: var(--bg-primary);
  border-color: var(--border-primary);
}

.dark .stats-title {
  color: var(--text-tertiary);
}

.dark .stats-subtitle {
  color: var(--text-quaternary);
}

.dark .stats-unit {
  color: var(--text-tertiary);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .modern-stats-card {
    padding: var(--spacing-md);
    gap: var(--spacing-sm);
  }

  .stats-value {
    font-size: 1.75rem;
  }

  .stats-title {
    font-size: 0.8rem;
  }

  .stats-subtitle {
    font-size: 0.7rem;
  }

  .icon-container {
    width: 40px;
    height: 40px;
  }

  .stats-decoration {
    display: none;
  }
}

/* 焦点样式 */
.modern-stats-card.focus-visible {
  outline: 2px solid var(--border-focus);
  outline-offset: 2px;
}

/* 加载状态 */
.modern-stats-card.loading {
  pointer-events: none;
  opacity: 0.7;
}

.modern-stats-card.loading .stats-value::after {
  content: '';
  display: inline-block;
  width: 1em;
  height: 1em;
  margin-left: var(--spacing-xs);
  border: 2px solid currentColor;
  border-radius: 50%;
  border-top-color: transparent;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>