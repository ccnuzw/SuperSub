<template>
  <n-space>
    <!-- 根据上下文显示智能推荐操作 -->
    <n-button
      v-for="action in filteredActions"
      :key="action.key"
      :type="action.type"
      :disabled="action.disabled"
      @click="handleAction(action)"
      :loading="action.loading"
      class="smart-action-button"
      size="small"
    >
      <template #icon v-if="action.icon">
        <n-icon :component="action.icon" />
      </template>
      {{ action.label }}
    </n-button>
  </n-space>
</template>

<script setup lang="ts">
import { computed, type Component } from 'vue';
import type { ButtonProps } from 'naive-ui';

// 智能操作接口
export interface SmartAction {
  key: string;
  label: string;
  icon?: Component;
  type?: 'primary' | 'success' | 'warning' | 'error' | 'default';
  action?: () => void | Promise<void>;
  loading?: boolean;
  disabled?: boolean;
  priority?: 'high' | 'medium' | 'low';
  // 条件显示函数
  condition?: (context: any) => boolean;
  // 排序权重
  weight?: number;
}

// Props
interface Props {
  actions: SmartAction[];
  context?: any;
  maxVisible?: number;
}

const props = withDefaults(defineProps<Props>(), {
  context: () => ({}),
  maxVisible: 4
});

// Emits
const emit = defineEmits<{
  'action': [action: SmartAction, params?: any];
}>();

// 过滤和排序操作
const filteredActions = computed(() => {
  return props.actions
    // 根据条件过滤
    .filter(action => !action.condition || action.condition(props.context))
    // 根据优先级和权重排序
    .sort((a, b) => {
      // 首先按优先级排序
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      const priorityDiff = priorityOrder[a.priority || 'low'] - priorityOrder[b.priority || 'low'];

      if (priorityDiff !== 0) return priorityDiff;

      // 如果优先级相同，按权重排序
      return (b.weight || 0) - (a.weight || 0);
    })
    // 限制显示数量
    .slice(0, props.maxVisible);
});

// 处理智能操作点击
const handleAction = async (action: SmartAction) => {
  try {
    // 发射通用操作事件
    emit('action', action);

    // 执行具体操作
    if (action.action) {
      await action.action();
    }
  } catch (error) {
    console.error('Error executing smart action:', error);
    // 这里可以添加错误处理，比如显示错误消息
  }
};

// 暴露方法给父组件
defineExpose({
  getVisibleActions: () => filteredActions.value,
  getActionByKey: (key: string) => props.actions.find(action => action.key === key)
});
</script>

<style scoped>
.smart-action-button {
  transition: all 0.2s ease;
}

.smart-action-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* 按钮类型特定样式 */
.smart-action-button.n-button--warning {
  border-color: #f0a020;
  background: #fff7e6;
}

.smart-action-button.n-button--error {
  border-color: #f5222d;
  background: #fff1f0;
}

.smart-action-button.n-button--success {
  border-color: #52c41a;
  background: #f6ffed;
}

/* 加载状态 */
.smart-action-button.n-button--loading {
  opacity: 0.7;
  cursor: not-allowed;
}

/* 禁用状态 */
.smart-action-button.n-button--disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 响应式 */
@media (max-width: 768px) {
  .smart-action-button {
    font-size: 12px;
    padding: 0 12px;
  }
}

/* 暗色主题支持 */
.dark .smart-action-button.n-button--warning {
  background: #2a1f1e;
  border-color: #f5222d;
}

.dark .smart-action-button.n-button--error {
  background: #2a1f1e;
  border-color: #ff4d4f;
}

.dark .smart-action-button.n-button--success {
  background: #2a1f1e;
  border-color: #52c41a;
}
</style>