<template>
  <n-space>
    <!-- 根据上下文显示智能推荐操作 -->
    <n-button
      v-for="action in smartActions"
      :key="action.key"
      :type="action.type"
      :disabled="action.disabled"
      @click="handleAction(action)"
      :loading="action.loading"
      class="smart-action-button"
    >
      <template #icon v-if="action.icon">
        <n-icon :component="action.icon" />
      </template>
      {{ action.label }}
    </n-button>
  </n-space>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { h } from 'vue';
import {
  Flash as FlashIcon,
  Folder as FolderIcon,
  Trash as TrashIcon,
  Refresh as RefreshIcon,
  CheckmarkCircle as SuccessIcon,
  Warning as WarningIcon,
  CloseCircle as ErrorIcon,
  CloudUpload as ImportIcon
} from '@vicons/ionicons5';
import type { Node } from '@/types/entities';

// 智能操作接口
interface SmartAction {
  key: string;
  label: string;
  icon?: any;
  type?: 'primary' | 'success' | 'warning' | 'error' | 'default';
  action: () => void | Promise<void>;
  loading?: boolean;
  disabled?: boolean;
  priority?: 'high' | 'medium' | 'low';
}

// Props
interface Props {
  selectedNodes: Node[];
  context: {
    hasFailedNodes?: boolean;
    recentlyImported?: boolean;
    hasDuplicates?: boolean;
    activeGroupId?: string;
  };
  activeTab: string;
}

const props = defineProps<Props>();

// Emits
const emit = defineEmits<{
  'action': [action: SmartAction, params?: any];
  'testNodes': [nodeIds: string[]];
  'moveToGroup': [nodeIds: string[], groupId?: string];
  'batchDelete': [nodeIds: string[]];
  'clearFailed': [];
  'testAll': [];
  'importNodes': [];
}>();

// 获取智能推荐操作
const smartActions = computed((): SmartAction[] => {
  const actions: SmartAction[] = [];

  // 基于选中节点的推荐操作
  if (props.selectedNodes.length > 0) {
    const offlineNodes = props.selectedNodes.filter(n => n.status === 'offline');
    const ungroupedNodes = props.selectedNodes.filter(n => !n.group_id);
    const failedNodes = props.selectedNodes.filter(n => n.error);
    const onlineNodes = props.selectedNodes.filter(n => n.status === 'online');

    // 测试离线节点（高优先级）
    if (offlineNodes.length > 0) {
      actions.push({
        key: 'test-offline',
        label: `测试离线 (${offlineNodes.length})`,
        icon: FlashIcon,
        type: 'warning',
        priority: 'high',
        action: () => {
          emit('testNodes', offlineNodes.map(n => n.id));
        }
      });
    }

    // 重新测试失败的节点
    if (failedNodes.length > 0) {
      actions.push({
        key: 'retest-failed',
        label: `重试失败 (${failedNodes.length})`,
        icon: RefreshIcon,
        type: 'error',
        priority: 'high',
        action: () => {
          emit('testNodes', failedNodes.map(n => n.id));
        }
      });
    }

    // 移动未分组节点
    if (ungroupedNodes.length > 0) {
      actions.push({
        key: 'move-to-group',
        label: `移动到分组 (${ungroupedNodes.length})`,
        icon: FolderIcon,
        type: 'primary',
        priority: 'medium',
        action: () => {
          emit('moveToGroup', ungroupedNodes.map(n => n.id));
        }
      });
    }

    // 批量删除（仅在有问题节点时显示）
    if (offlineNodes.length + failedNodes.length > 0 && props.selectedNodes.length > 1) {
      actions.push({
        key: 'batch-delete-problematic',
        label: `删除问题节点 (${offlineNodes.length + failedNodes.length})`,
        icon: TrashIcon,
        type: 'error',
        priority: 'high',
        action: () => {
          const problematicNodes = [...offlineNodes, ...failedNodes].map(n => n.id);
          emit('batchDelete', problematicNodes);
        }
      });
    }

    // 选择性复制（如果所有都是在线节点）
    if (onlineNodes.length === props.selectedNodes.length && props.selectedNodes.length > 0) {
      actions.push({
        key: 'copy-successful',
        label: `复制成功节点 (${onlineNodes.length})`,
        icon: SuccessIcon,
        type: 'success',
        priority: 'low',
        action: () => {
          // 这里可以实现复制功能
          console.log('Copy successful nodes:', onlineNodes.map(n => n.id));
        }
      });
    }
  }

  // 基于当前状态的推荐操作
  if (props.context.hasFailedNodes) {
    actions.push({
      key: 'clear-all-failed',
      label: '清空所有失败项',
      icon: RefreshIcon,
      type: 'warning',
      priority: 'medium',
      action: () => {
        emit('clearFailed');
      }
    });
  }

  if (props.context.recentlyImported) {
    actions.push({
      key: 'test-imported',
      label: '测试导入的节点',
      icon: FlashIcon,
      type: 'success',
      priority: 'high',
      action: () => {
        emit('testAll');
      }
    });
  }

  if (props.context.hasDuplicates) {
    actions.push({
      key: 'remove-duplicates',
      label: '移除重复项',
      icon: RefreshIcon,
      type: 'warning',
      priority: 'medium',
      action: () => {
        // 这里可以实现去重逻辑
        console.log('Remove duplicates action triggered');
      }
    });
  }

  // 根据活跃分组推荐操作
  if (props.activeTab && props.activeTab !== 'all' && props.activeTab !== 'ungrouped') {
    const currentGroup = props.context.activeGroupId;
    // 这里可以添加分组相关的智能操作
  }

  // 如果没有选中节点，推荐常用操作
  if (props.selectedNodes.length === 0) {
    actions.push({
      key: 'import-batch',
      label: '批量导入',
      icon: ImportIcon,
      type: 'primary',
      priority: 'medium',
      action: () => {
        emit('importNodes');
      }
    });

    if (props.context.recentlyImported) {
      actions.push({
        key: 'organize-imported',
        label: '整理导入的节点',
        icon: FolderIcon,
        type: 'default',
        priority: 'low',
        action: () => {
          // 这里可以推荐整理操作
          console.log('Organize imported nodes');
        }
      });
    }
  }

  // 按优先级排序，最多显示4个操作
  return actions
    .sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority || 'low'] - priorityOrder[b.priority || 'low'];
    })
    .slice(0, 4);
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