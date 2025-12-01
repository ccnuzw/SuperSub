<template>
  <!-- 右键菜单 -->
  <n-dropdown
    :show="showContextMenu"
    :x="contextMenuX"
    :y="contextMenuY"
    :options="contextMenuOptions"
    placement="bottom-start"
    @clickoutside="closeContextMenu"
    @select="handleContextMenuAction"
  />

  <!-- 分组右键菜单 -->
  <n-dropdown
    :show="showGroupContextMenu"
    :x="groupContextMenuX"
    :y="groupContextMenuY"
    :options="groupContextMenuOptions"
    placement="bottom-start"
    @clickoutside="closeGroupContextMenu"
    @select="handleGroupContextMenuAction"
  />
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { h } from 'vue';
import {
  Flash as FlashIcon,
  Create as EditIcon,
  Trash as TrashIcon,
  Copy as CopyIcon,
  Refresh as RefreshIcon,
  CloudDownload as DownloadIcon,
  Eye as ViewIcon,
  Checkmark as CheckIcon,
  Warning as WarningIcon,
  Close as CloseIcon,
  Settings as SettingsIcon,
  FolderOpen as FolderOpenIcon,
  Menu as MenuIcon,
  ShieldCheckmark as ShieldIcon
} from '@vicons/ionicons5';
import type { Node, NodeGroup } from '@/types/entities';

// Props
interface Props {
  selectedNode?: Node | null;
  selectedGroup?: NodeGroup | null;
  selectedNodes?: Node[];
  context?: any;
}

const props = defineProps<Props>();

// Emits
const emit = defineEmits<{
  'testNode': [node: Node];
  'editNode': [node: Node];
  'deleteNode': [node: Node];
  'deleteNodes': [nodes: Node[]];
  'copyNode': [node: Node];
  'copyNodes': [nodes: Node[]];
  'refreshNode': [node: Node];
  'viewNode': [node: Node];
  'duplicateNode': [node: Node];
  'moveNode': [node: Node];
  'enableNode': [node: Node];
  'disableNode': [node: Node];
  'editGroup': [group: NodeGroup];
  'deleteGroup': [group: NodeGroup];
  'clearGroup': [group: NodeGroup];
  'exportGroup': [group: NodeGroup];
  'refreshGroup': [group: NodeGroup];
  'testGroup': [group: NodeGroup];
  'batchAction': [action: string, params?: any];
  'select-node': [node: Node];
  'select-group': [group: NodeGroup];
}>();

// 菜单状态
const showContextMenu = ref(false);
const showGroupContextMenu = ref(false);
const contextMenuX = ref(0);
const contextMenuY = ref(0);
const groupContextMenuX = ref(0);
const groupContextMenuY = ref(0);

// 节点右键菜单选项
const contextMenuOptions = computed(() => {
  if (!props.selectedNode) return [];

  const node = props.selectedNode;
  const options = [];

  // 基本操作组
  const basicActions = [
    {
      label: '基础操作',
      key: 'basic',
      type: 'group',
      children: [
        {
          label: '测试节点',
          key: 'test',
          icon: () => h(FlashIcon),
        },
        {
          label: '编辑节点',
          key: 'edit',
          icon: () => h(EditIcon),
        },
        {
          label: '查看详情',
          key: 'view',
          icon: () => h(ViewIcon),
        },
      ],
    },
  ];

  options.push(...basicActions);

  // 状态相关操作组
  const statusActions = [];
  if (node.status === 'offline') {
    statusActions.push({
      label: '重新测试',
      key: 'retest',
      icon: () => h(RefreshIcon),
    });
  } else if (node.status === 'online') {
    statusActions.push({
      label: '复制配置',
      key: 'copy-config',
      icon: () => h(CopyIcon),
    });
  }

  if (node.status === 'error' || node.error) {
    statusActions.push({
      label: node.error ? '查看错误' : '清除错误',
      key: node.error ? 'view-error' : 'clear-error',
      icon: () => node.error ? WarningIcon : RefreshIcon,
      type: node.error ? 'warning' : 'default',
    });
  }

  if (statusActions.length > 0) {
    options.push({
      label: '状态操作',
      key: 'status',
      type: 'group',
      children: statusActions,
    });
  }

  // 管理操作组
  const managementActions = [
    {
      label: '移动到分组',
      key: 'move-to-group',
      icon: () => h(FolderOpenIcon),
    },
    {
      label: '复制节点',
      key: 'copy',
      icon: () => h(CopyIcon),
    },
    {
      label: '删除节点',
      key: 'delete',
      icon: () => h(TrashIcon),
      type: 'error',
    },
  ];

  options.push({
    label: '管理操作',
    key: 'management',
    type: 'group',
    children: managementActions,
  });

  // 高级操作组
  const advancedActions = [];
  if (node.protocol) {
    advancedActions.push({
      label: '导出配置',
      key: 'export-config',
      icon: () => h(DownloadIcon),
    });
  }

  if (node.status === 'online') {
    advancedActions.push({
      label: '添加到收藏',
      key: 'add-to-favorites',
      icon: () => h(CheckIcon),
    });
  }

  advancedActions.push({
    label: '节点设置',
    key: 'settings',
    icon: () => h(SettingsIcon),
  });

  if (advancedActions.length > 0) {
    options.push({
      label: '高级操作',
      key: 'advanced',
      type: 'group',
      children: advancedActions,
    });
  }

  return options;
});

// 分组右键菜单选项
const groupContextMenuOptions = computed(() => {
  if (!props.selectedGroup) return [];

  const group = props.selectedGroup;
  const options = [];

  // 基本操作
  options.push(
    {
      label: '基础操作',
      key: 'group-basic',
      type: 'group',
      children: [
        {
          label: '编辑分组',
          key: 'edit',
          icon: () => h(EditIcon),
        },
        {
          label: '测试分组',
          key: 'test',
          icon: () => h(FlashIcon),
        },
      ],
    }
  );

  // 智能操作
  const smartActions = [];

  // 如果分组有失败节点（暂时简化，后续可从props传入统计信息）
  const failedNodes = 0; // TODO: 计算失败节点数
  if (failedNodes > 0) {
    smartActions.push({
      label: `清空失败项 (${failedNodes})`,
      key: 'clear-failed',
      icon: () => h(RefreshIcon),
      type: 'warning',
    });
  }

  // 如果分组节点过多（暂时简化，后续可从props传入统计信息）
  const totalNodes = 0; // TODO: 计算总节点数
  if (totalNodes > 10) {
    smartActions.push({
      label: '批量操作',
      key: 'batch-operations',
      icon: () => h(MenuIcon),
    });
  }

  // 如果分组有特殊状态（使用正确的属性名）
  if (!group.is_enabled) {
    smartActions.push({
      label: '启用分组',
      key: 'enable',
      icon: () => h(CheckIcon),
      type: 'success',
    });
  } else {
    smartActions.push({
      label: '禁用分组',
      key: 'disable',
      icon: () => h(CloseIcon),
      type: 'warning',
    });
  }

  if (smartActions.length > 0) {
    options.push({
      label: '智能操作',
      key: 'smart-actions',
      type: 'group',
      children: smartActions,
    });
  }

  // 危险操作
  options.push(
    {
      label: '危险操作',
      key: 'danger',
      type: 'group',
      children: [
        {
          label: '清空分组',
          key: 'clear',
          icon: () => h(TrashIcon),
          type: 'error',
        },
        {
          label: '删除分组',
          key: 'delete',
          icon: () => h(TrashIcon),
          type: 'error',
        },
        {
          label: '导出分组',
          key: 'export',
          icon: () => h(DownloadIcon),
        },
      ],
    }
  );

  return options;
});

// 显示节点右键菜单
const showNodeContextMenu = (event: MouseEvent, node: Node) => {
  event.preventDefault();

  // 触发事件让父组件知道当前选中的节点
  emit('select-node', node);

  contextMenuX.value = event.clientX;
  contextMenuY.value = event.clientY;
  showContextMenu.value = true;
};

// 显示分组右键菜单
const handleGroupContextMenu = (event: MouseEvent, group: NodeGroup) => {
  event.preventDefault();

  // 触发事件让父组件知道当前选中的分组
  emit('select-group', group);

  groupContextMenuX.value = event.clientX;
  groupContextMenuY.value = event.clientY;
  showGroupContextMenu.value = true;
};

// 关闭节点右键菜单
const closeContextMenu = () => {
  showContextMenu.value = false;
};

// 关闭分组右键菜单
const closeGroupContextMenu = () => {
  showGroupContextMenu.value = false;
};

// 处理节点右键菜单操作
const handleContextMenuAction = (key: string, option: any) => {
  const node = props.selectedNode;
  if (!node) return;

  switch (key) {
    case 'test':
      emit('testNode', node);
      break;
    case 'edit':
      emit('editNode', node);
      break;
    case 'view':
      emit('viewNode', node);
      break;
    case 'retest':
      emit('refreshNode', node);
      break;
    case 'copy-config':
    case 'copy':
      emit('copyNode', node);
      break;
    case 'clear-error':
      // 清除错误状态的逻辑
      break;
    case 'view-error':
      // 查看错误详情的逻辑
      break;
    case 'move-to-group':
      emit('moveNode', node);
      break;
    case 'delete':
      emit('deleteNode', node);
      break;
    case 'export-config':
      // 导出配置的逻辑
      break;
    case 'add-to-favorites':
      // 添加到收藏的逻辑
      break;
    case 'settings':
      // 节点设置的逻辑
      break;
  }

  closeContextMenu();
};

// 处理分组右键菜单操作
const handleGroupContextMenuAction = (key: string, option: any) => {
  const group = props.selectedGroup;
  if (!group) return;

  switch (key) {
    case 'edit':
      emit('editGroup', group);
      break;
    case 'test':
      emit('testGroup', group);
      break;
    case 'clear-failed':
      emit('clearGroup', group);
      break;
    case 'batch-operations':
      // 显示批量操作面板
      emit('batchAction', 'show-batch-panel', { groupId: group.id });
      break;
    case 'enable':
      // 启用分组
      break;
    case 'disable':
      // 禁用分组
      break;
    case 'clear':
      emit('clearGroup', group);
      break;
    case 'delete':
      emit('deleteGroup', group);
      break;
    case 'export':
      emit('exportGroup', group);
      break;
  }

  closeGroupContextMenu();
};

// 暴露方法给父组件使用
defineExpose({
  showNodeContextMenu,
  showGroupContextMenu,
  closeContextMenu,
  closeGroupContextMenu,
});
</script>

<style scoped>
/* 右键菜单样式优化 */
:deep(.n-dropdown-menu) {
  min-width: 180px;
}

/* 图标样式 */
:deep(.n-dropdown-option .n-dropdown-option-content) {
  display: flex;
  align-items: center;
  gap: 8px;
}

:deep(.n-dropdown-option .n-dropdown-option-icon) {
  font-size: 16px;
}

/* 分组标题样式 */
:deep(.n-dropdown-option-group .n-dropdown-option-content) {
  font-weight: 500;
  color: var(--text-color-3);
}

/* 危险操作警告样式 */
:deep(.n-dropdown-option .n-dropdown-option-content[data-type="error"]) {
  color: var(--error-color);
}

/* 警告样式 */
:deep(.n-dropdown-option .n-dropdown-option-content[data-type="warning"]) {
  color: var(--warning-color);
}

/* 成功样式 */
:deep(.n-dropdown-option .n-dropdown-option-content[data-type="success"]) {
  color: var(--success-color);
}

/* 响应式优化 */
@media (max-width: 768px) {
  :deep(.n-dropdown-menu) {
    min-width: 160px;
  }
}
</style>