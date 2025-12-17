/**
 * 重构后的节点卡片组件
 * 使用小组件组合，职责分离，提高可维护性
 */

<template>
  <div
    class="node-card"
    :class="cardClasses"
  >
    <!-- 选择框（多选模式） -->
    <NodeSelection
      :selected="selected"
      :selectable="selectable"
      :disabled="disabled"
      :node-id="node.id"
      @select="handleSelect"
    />

    <!-- 节点状态指示器 -->
    <div class="node-card__status">
      <NodeStatusIndicator
        :status="node.status"
        :latency="node.latency"
        :show-text="false"
        size="md"
      />
    </div>

    <!-- 节点信息 -->
    <NodeInfo :node="node" />

    <!-- 延迟信息 -->
    <NodeLatency :node="node" />

    <!-- 操作按钮 -->
    <NodeActions
      :node="node"
      @test="handleTest"
      @edit="handleEdit"
      @copy="handleCopy"
      @delete="handleDelete"
      @duplicate="handleDuplicate"
      @export="handleExport"
    />

    <!-- 快捷操作（悬停显示） -->
    <NodeQuickActions
      :node="node"
      @edit="handleEdit"
      @copy="handleCopy"
    />
  </div>
</template>

<script setup lang="ts">
import { SsCard } from '@/components/base';
import NodeStatusIndicator from './NodeStatusIndicator.vue';
import {
  NodeSelection,
  NodeInfo,
  NodeLatency,
  NodeActions,
  NodeQuickActions
} from './node';
import { useNodeCard } from '@/composables/useNodeCard';
import type { Node } from '@/types';

interface Props {
  node: Node;
  selected?: boolean;
  selectable?: boolean;
  disabled?: boolean;
  showActions?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  selected: false,
  selectable: false,
  disabled: false,
  showActions: true
});

const emit = defineEmits<{
  select: [nodeId: string, selected: boolean];
  test: [node: Node];
  edit: [node: Node];
  copy: [node: Node];
  delete: [node: Node];
  duplicate: [node: Node];
  export: [node: Node];
}>();

// 使用节点卡片组合式函数
const { cardClasses } = useNodeCard({
  node: props.node,
  selectable: props.selectable,
  selected: props.selected,
  disabled: props.disabled
});

// 方法
const handleSelect = (nodeId: string, selected: boolean) => {
  emit('select', nodeId, selected);
};

const handleTest = (node: Node) => {
  emit('test', node);
};

const handleEdit = (node: Node) => {
  emit('edit', node);
};

const handleCopy = (node: Node) => {
  emit('copy', node);
};

const handleDelete = (node: Node) => {
  emit('delete', node);
};

const handleDuplicate = (node: Node) => {
  emit('duplicate', node);
};

const handleExport = (node: Node) => {
  emit('export', node);
};
</script>

<style scoped>
.node-card {
  @apply relative bg-white border border-gray-200 rounded-lg p-4 transition-all duration-200 hover:shadow-md;
}

.node-card--selected {
  @apply border-primary-300 bg-primary-50;
}

.node-card--disabled {
  @apply opacity-60 cursor-not-allowed;
}

.node-card:hover .node-card__quick-actions {
  @apply opacity-100;
}

.node-card__status {
  @apply flex justify-center mb-3;
}

/* 响应式设计 */
@media (max-width: 640px) {
  .node-card__header {
    @apply flex-col items-start space-y-2;
  }

  .node-card__badges {
    @apply space-x-0 space-y-1 flex-col;
  }

  .node-card__actions {
    @apply top-2 right-2;
  }

  .node-card__quick-actions {
    @apply static right-auto top-auto transform-none opacity-100 mt-3 flex justify-end;
  }
}

/* 深色模式支持 */
.dark .node-card {
  @apply bg-gray-800 border-gray-700;
}

.dark .node-card--selected {
  @apply border-primary-600 bg-primary-900/20;
}

.dark .node-card__name {
  @apply text-gray-100;
}

.dark .node-location,
.dark .node-server {
  @apply text-gray-400;
}

.dark .latency-bar {
  @apply bg-gray-600;
}

.dark .latency-text {
  @apply text-gray-400;
}

.dark .node-card__quick-actions {
  @apply bg-gray-700;
}

.dark .node-card__quick-actions .ss-button {
  @apply text-gray-400 hover:text-gray-200;
}
</style>