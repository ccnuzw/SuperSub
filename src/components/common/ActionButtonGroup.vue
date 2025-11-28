<template>
  <div class="action-button-group" :class="{ vertical, compact }">
    <n-button
      v-for="action in actions"
      :key="action.key"
      :type="action.type || 'default'"
      :size="size"
      :disabled="action.disabled"
      :loading="action.loading"
      :circle="action.circle"
      :quaternary="action.quaternary"
      :ghost="action.ghost"
      @click="handleAction(action)"
    >
      <template #icon v-if="action.icon">
        <n-icon><component :is="action.icon" /></n-icon>
      </template>
      {{ action.label }}
    </n-button>
  </div>
</template>

<script setup lang="ts">
import { NButton, NIcon } from 'naive-ui';
import type { ButtonProps } from 'naive-ui';

interface ActionButton {
  key: string;
  label: string;
  icon?: any;
  type?: ButtonProps['type'];
  disabled?: boolean;
  loading?: boolean;
  circle?: boolean;
  quaternary?: boolean;
  ghost?: boolean;
  handler?: () => void | Promise<void>;
}

interface Props {
  actions: ActionButton[];
  size?: 'small' | 'medium' | 'large';
  vertical?: boolean;
  compact?: boolean;
}

interface Emits {
  (e: 'action', key: string): void;
}

const props = withDefaults(defineProps<Props>(), {
  size: 'medium',
  vertical: false,
  compact: false
});

const emit = defineEmits<Emits>();

const handleAction = async (action: ActionButton) => {
  if (action.disabled || action.loading) return;

  // 发出action事件
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
</script>

<style scoped>
.action-button-group {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  align-items: center;
}

.action-button-group.vertical {
  flex-direction: column;
}

.action-button-group.compact {
  gap: 4px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .action-button-group:not(.vertical) {
    gap: 4px;
  }

  .action-button-group:not(.vertical) .n-button {
    min-width: auto;
    padding: 0 8px;
  }

  /* 在移动端，对于没有文本的按钮，减小尺寸 */
  .action-button-group:not(.vertical) .n-button:not(:has(span)) {
    width: 32px;
    height: 32px;
  }
}
</style>