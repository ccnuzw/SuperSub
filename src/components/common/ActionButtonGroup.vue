<template>
  <div class="action-button-group" :class="[
    `size-${size}`,
    { vertical, compact, 'has-overflow': hasOverflow }
  ]">
    <n-button
      v-for="action in filteredActions"
      :key="action.key"
      :type="action.type || 'default'"
      :size="size"
      :disabled="action.disabled"
      :loading="action.loading"
      :circle="action.circle"
      :quaternary="action.quaternary"
      :ghost="action.ghost"
      class="action-button"
      :class="[
        `button-${action.type || 'default'}`,
        {
          'button-icon-only': action.circle || !action.label,
          'button-loading': action.loading,
          'button-disabled': action.disabled
        }
      ]"
      @click="handleAction(action)"
    >
      <template #icon v-if="action.icon">
        <n-icon :component="action.icon" />
      </template>
      {{ action.label }}
    </n-button>
  </div>
</template>

<script setup lang="ts">
import { computed, type Component } from 'vue';
import { NButton, NIcon } from 'naive-ui';
import type { ButtonProps } from 'naive-ui';

export interface ActionButton {
  key: string;
  label: string;
  icon?: Component;
  type?: ButtonProps['type'];
  disabled?: boolean;
  loading?: boolean;
  circle?: boolean;
  quaternary?: boolean;
  ghost?: boolean;
  handler?: () => void | Promise<void>;
  // 新增：条件显示
  condition?: () => boolean;
  // 新增：优先级（用于过滤和排序）
  priority?: 'high' | 'medium' | 'low';
  // 新增：排序权重
  order?: number;
}

interface Props {
  actions: ActionButton[];
  size?: 'small' | 'medium' | 'large';
  vertical?: boolean;
  compact?: boolean;
  maxVisible?: number;
  showPriority?: 'high' | 'medium' | 'low' | 'all';
}

interface Emits {
  (e: 'action', key: string): void;
}

const props = withDefaults(defineProps<Props>(), {
  size: 'medium',
  vertical: false,
  compact: false,
  maxVisible: 10,
  showPriority: 'all'
});

const emit = defineEmits<Emits>();

// 过滤和排序操作
const filteredActions = computed(() => {
  return props.actions
    // 根据条件过滤
    .filter(action => !action.condition || action.condition())
    // 根据优先级过滤
    .filter(action => {
      if (props.showPriority === 'all') return true;
      if (props.showPriority === 'high') return action.priority === 'high';
      if (props.showPriority === 'medium') return ['high', 'medium'].includes(action.priority || 'medium');
      return true; // low 显示全部
    })
    // 根据优先级和权重排序
    .sort((a, b) => {
      // 首先按优先级排序
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      const priorityDiff = priorityOrder[a.priority || 'medium'] - priorityOrder[b.priority || 'medium'];

      if (priorityDiff !== 0) return priorityDiff;

      // 如果优先级相同，按order权重排序
      return (a.order || 0) - (b.order || 0);
    })
    // 限制显示数量
    .slice(0, props.maxVisible);
});

// 检查是否有溢出
const hasOverflow = computed(() => {
  const filtered = props.actions.filter(action => !action.condition || action.condition());
  return filtered.length > props.maxVisible;
});

const handleAction = async (action: ActionButton) => {
  if (action.disabled || action.loading) return;

  // 发射action事件
  emit('action', action.key);

  // 如果有自定义处理器，执行它
  if (action.handler) {
    try {
      await action.handler();
    } catch (error) {
      console.error(`Action ${action.key} failed:`, error);
    }
  }
};

// 暴露方法给父组件
defineExpose({
  getVisibleActions: () => filteredActions.value,
  getActionByKey: (key: string) => props.actions.find(action => action.key === key),
  getFilteredCount: () => filteredActions.value.length,
  getTotalCount: () => props.actions.length
});
</script>

<style scoped>
/* 引入通用样式变量 */
@import '@/styles/common.css';

/* 现代按钮组容器 */
.action-button-group {
  display: flex;
  gap: var(--spacing-md);
  flex-wrap: wrap;
  align-items: center;
  position: relative;
}

/* 布局变体 */
.action-button-group.vertical {
  flex-direction: column;
  align-items: stretch;
  width: 100%;
}

.action-button-group.compact {
  gap: var(--spacing-sm);
}

/* 尺寸变体 */
.action-button-group.size-small {
  gap: var(--spacing-sm);
}

.action-button-group.size-large {
  gap: var(--spacing-lg);
}

/* 现代按钮样式 */
.action-button {
  position: relative;
  border-radius: var(--radius-md);
  font-weight: 500;
  transition: all var(--transition-normal) var(--ease-out-cubic);
  overflow: hidden;
  border: 1px solid transparent;
}

.action-button::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: var(--gradient-primary);
  opacity: 0;
  transition: opacity var(--transition-normal) var(--ease-out-cubic);
  border-radius: inherit;
}

.action-button:hover::before {
  opacity: 0.1;
}

.action-button:active {
  transform: scale(0.98);
}

/* 按钮类型样式 */
.action-button.button-primary {
  background: var(--gradient-primary);
  border-color: var(--primary-500);
  color: white;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
}

.action-button.button-primary:hover {
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.4);
  transform: translateY(-1px);
}

.action-button.button-success {
  background: var(--gradient-success);
  border-color: var(--success);
  color: white;
  box-shadow: 0 2px 8px rgba(82, 196, 26, 0.3);
}

.action-button.button-success:hover {
  box-shadow: 0 4px 16px rgba(82, 196, 26, 0.4);
  transform: translateY(-1px);
}

.action-button.button-warning {
  background: var(--gradient-warning);
  border-color: var(--warning);
  color: white;
  box-shadow: 0 2px 8px rgba(250, 173, 20, 0.3);
}

.action-button.button-warning:hover {
  box-shadow: 0 4px 16px rgba(250, 173, 20, 0.4);
  transform: translateY(-1px);
}

.action-button.button-error {
  background: var(--gradient-error);
  border-color: var(--error);
  color: white;
  box-shadow: 0 2px 8px rgba(255, 77, 79, 0.3);
}

.action-button.button-error:hover {
  box-shadow: 0 4px 16px rgba(255, 77, 79, 0.4);
  transform: translateY(-1px);
}

.action-button.button-info {
  background: linear-gradient(135deg, #1890ff 0%, #40a9ff 100%);
  border-color: #1890ff;
  color: white;
  box-shadow: 0 2px 8px rgba(24, 144, 255, 0.3);
}

.action-button.button-info:hover {
  box-shadow: 0 4px 16px rgba(24, 144, 255, 0.4);
  transform: translateY(-1px);
}

.action-button.button-default {
  background: var(--bg-primary);
  border-color: var(--border-primary);
  color: var(--text-primary);
  box-shadow: var(--shadow-sm);
}

.action-button.button-default:hover {
  background: var(--bg-secondary);
  border-color: var(--border-secondary);
  box-shadow: var(--shadow-md);
  transform: translateY(-1px);
}

/* 图标按钮样式 */
.action-button.button-icon-only {
  width: 40px;
  height: 40px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-full);
}

.action-button.button-icon-only.button-primary {
  background: var(--gradient-primary);
  color: white;
  border: none;
}

/* 状态样式 */
.action-button.button-loading {
  pointer-events: none;
  opacity: 0.7;
}

.action-button.button-disabled {
  pointer-events: none;
  opacity: 0.5;
  cursor: not-allowed;
}

.action-button.button-disabled:hover {
  transform: none;
  box-shadow: none;
}

/* 溢出指示器 */
.action-button-group.has-overflow::after {
  content: '⋯';
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-md);
  color: var(--text-tertiary);
  font-size: 14px;
  cursor: pointer;
  transition: all var(--transition-normal) var(--ease-out-cubic);
}

.action-button-group.has-overflow::after:hover {
  background: var(--bg-tertiary);
  border-color: var(--border-secondary);
  color: var(--text-primary);
}

/* 尺寸变体调整 */
.action-button-group.size-small .action-button {
  padding: var(--spacing-xs) var(--spacing-md);
  font-size: 0.875rem;
}

.action-button-group.size-small .action-button.button-icon-only {
  width: 32px;
  height: 32px;
}

.action-button-group.size-large .action-button {
  padding: var(--spacing-md) var(--spacing-lg);
  font-size: 1rem;
}

.action-button-group.size-large .action-button.button-icon-only {
  width: 48px;
  height: 48px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .action-button-group:not(.vertical) {
    gap: var(--spacing-sm);
  }

  .action-button-group:not(.vertical) .action-button {
    min-width: auto;
    padding: var(--spacing-xs) var(--spacing-sm);
    font-size: 0.875rem;
  }

  .action-button-group:not(.vertical) .action-button.button-icon-only {
    width: 36px;
    height: 36px;
  }

  .action-button-group.has-overflow::after {
    width: 36px;
    height: 36px;
    font-size: 12px;
  }
}

@media (max-width: 480px) {
  .action-button-group:not(.vertical) {
    flex-wrap: nowrap;
    overflow-x: auto;
    padding-bottom: var(--spacing-sm);
    scrollbar-width: none;
    -ms-overflow-style: none;
  }

  .action-button-group:not(.vertical)::-webkit-scrollbar {
    display: none;
  }

  .action-button-group:not(.vertical) .action-button {
    flex-shrink: 0;
  }
}

/* 深色主题支持 */
.dark .action-button.button-default {
  background: var(--bg-primary);
  border-color: var(--border-primary);
  color: var(--text-primary);
}

.dark .action-button.button-default:hover {
  background: var(--bg-secondary);
  border-color: var(--border-secondary);
}

.dark .action-button-group.has-overflow::after {
  background: var(--bg-secondary);
  border-color: var(--border-primary);
  color: var(--text-tertiary);
}

.dark .action-button-group.has-overflow::after:hover {
  background: var(--bg-tertiary);
  border-color: var(--border-secondary);
  color: var(--text-primary);
}

/* 焦点样式 */
.action-button.focus-visible {
  outline: 2px solid var(--border-focus);
  outline-offset: 2px;
}

/* 动画效果 */
.action-button-group .action-button {
  animation: buttonAppear var(--transition-normal) var(--ease-out-cubic);
}

@keyframes buttonAppear {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 加载动画 */
.action-button.button-loading :deep(.n-button__loading) {
  color: currentColor;
}

/* 分组按钮连接效果 */
.action-button-group:not(.vertical) .action-button + .action-button {
  margin-left: -1px;
  border-radius: 0;
}

.action-button-group:not(.vertical) .action-button:first-child {
  border-top-left-radius: var(--radius-md);
  border-bottom-left-radius: var(--radius-md);
}

.action-button-group:not(.vertical) .action-button:last-child {
  border-top-right-radius: var(--radius-md);
  border-bottom-right-radius: var(--radius-md);
  margin-right: 0;
}

.action-button-group:not(.vertical) .action-button:hover {
  z-index: 1;
}
</style>