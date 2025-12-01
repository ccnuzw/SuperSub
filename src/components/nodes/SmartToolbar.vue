<template>
  <div class="smart-toolbar">
    <!-- 左侧：搜索和筛选 -->
    <div class="toolbar-section toolbar-left">
      <n-input
        v-model:value="localSearchQuery"
        placeholder="搜索节点名称或服务器..."
        class="search-input"
        clearable
        @update:value="handleSearchUpdate"
      >
        <template #prefix>
          <n-icon :component="SearchIcon" />
        </template>
      </n-input>

      <n-select
        v-model:value="localFilters.protocol"
        placeholder="协议类型"
        :options="protocolOptions"
        clearable
        class="filter-select"
        @update:value="handleFilterUpdate"
      />

      <n-select
        v-model:value="localFilters.status"
        placeholder="状态筛选"
        :options="statusOptions"
        clearable
        class="filter-select"
        @update:value="handleFilterUpdate"
      />
    </div>

    <!-- 中间：分组导航 -->
    <div class="toolbar-section toolbar-center">
      <n-tabs
        v-model:value="localActiveTab"
        type="segment"
        @update:value="handleTabChange"
        class="group-tabs"
        scrollable
      >
        <n-tab-pane name="all" :tab="`全部 (${counts?.all || 0})`" />
        <n-tab-pane name="ungrouped" :tab="`未分组 (${counts?.ungrouped || 0})`" />
        <n-tab-pane
          v-for="group in groups"
          :key="group.id"
          :name="group.id"
          :tab="group.name"
        />
      </n-tabs>
    </div>

    <!-- 右侧：智能操作区 -->
    <div class="toolbar-section toolbar-right">
      <!-- 常用操作按钮 -->
      <n-button type="primary" @click="handleAdd">
        <template #icon>
          <n-icon :component="AddIcon" />
        </template>
        新增节点
      </n-button>

      <!-- 智能推荐操作 -->
      <SmartActions
        :selected-nodes="selectedNodes"
        :context="context"
        :active-tab="localActiveTab"
        @action="handleSmartAction"
      />

      <!-- 更多操作下拉 -->
      <PerfectDropdown
        :items="moreActions"
        @select="handleMoreAction"
        placement="bottom-right"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import {
  Search as SearchIcon,
  Add as AddIcon,
  EllipsisHorizontal as MoreIcon,
  Folder as FolderIcon,
  Download as ImportIcon,
  Refresh as RefreshIcon,
  Flash as FlashIcon,
  Trash as TrashIcon
} from '@vicons/ionicons5';
import SmartActions from './SmartActions.vue';
import PerfectDropdown from '../PerfectDropdown.vue';
import type { Node, NodeGroup } from '@/types/entities';

// Props
interface Props {
  searchQuery: string;
  filters: {
    protocol: string;
    status: string[];
    groupId: string;
  };
  activeTab: string;
  selectedNodes: Node[];
  context: any;
  groups: NodeGroup[];
  counts: {
    all: number;
    ungrouped: number;
  };
}

const props = defineProps<Props>();

// Emits
const emit = defineEmits<{
  'update:searchQuery': [value: string];
  'update:filters': [value: Props['filters']];
  'update:activeTab': [value: string];
  'add': [];
  'batchAction': [action: string, params?: any];
  'smartAction': [action: string, params?: any];
}>();

// 本地响应式数据
const localSearchQuery = ref(props.searchQuery);
const localFilters = ref({ ...props.filters });
const localActiveTab = ref(props.activeTab);

// 协议选项
const protocolOptions = [
  { label: '全部协议', value: '' },
  { label: 'VMess', value: 'vmess' },
  { label: 'VLESS', value: 'vless' },
  { label: 'Trojan', value: 'trojan' },
  { label: 'Shadowsocks', value: 'ss' },
  {label: 'ShadowsocksR', value: 'ssr' },
  { label: 'Hysteria2', value: 'hysteria2' },
  { label: 'TUIC', value: 'tuic' },
  { label: 'AnyTLS', value: 'anytls' },
];

// 状态选项
const statusOptions = [
  { label: '全部状态', value: '' },
  { label: '在线', value: 'online' },
  { label: '离线', value: 'offline' },
  { label: '错误', value: 'error' },
  { label: '测试中', value: 'testing' },
  { label: '未测试', value: 'pending' },
];

// 更多操作选项
const moreActions = computed(() => {
  const actions = [
    {
      label: '导入节点',
      key: 'import',
      icon: ImportIcon,
      description: '从订阅或链接批量导入节点',
    },
    {
      label: '刷新数据',
      key: 'refresh',
      icon: RefreshIcon,
      description: '重新获取所有节点数据',
    },
    {
      label: '清空选中',
      key: 'clear-selection',
      disabled: props.selectedNodes.length === 0,
      icon: TrashIcon,
      description: props.selectedNodes.length === 0 ? '没有选中的节点' : '取消所有选中的节点',
    },
  ];

  // 根据上下文添加智能选项
  if (props.context.hasFailedNodes) {
    actions.push({
      label: '清空失败项',
      key: 'clear-failed',
      icon: RefreshIcon,
      description: '移除所有测试失败的节点',
    });
  }

  if (props.context.recentlyImported) {
    actions.push({
      label: '测试全部',
      key: 'test-all',
      icon: FlashIcon,
      description: '对所有节点进行连通性测试',
    });
  }

  return actions;
});

// 事件处理方法
const handleSearchUpdate = (value: string) => {
  localSearchQuery.value = value;
  emit('update:searchQuery', value);
};

const handleFilterUpdate = () => {
  emit('update:filters', localFilters.value);
};

const handleTabChange = (value: string) => {
  localActiveTab.value = value;
  emit('update:activeTab', value);
};

const handleAdd = () => {
  emit('add');
};

const handleSmartAction = async (action: any, params?: any) => {
  emit('smartAction', action, params);
};

const handleMoreAction = (key: string) => {
  switch (key) {
    case 'import':
      emit('batchAction', 'import');
      break;
    case 'refresh':
      emit('batchAction', 'refresh');
      break;
    case 'clear-selection':
      emit('batchAction', 'clear-selection');
      break;
    case 'clear-failed':
      emit('batchAction', 'clear-failed');
      break;
    case 'test-all':
      emit('batchAction', 'test-all');
      break;
    default:
      console.warn('Unknown action:', key);
  }
};

// 监听外部props变化
watch(() => props.searchQuery, (newValue) => {
  localSearchQuery.value = newValue;
});

watch(() => props.filters, (newFilters) => {
  localFilters.value = { ...newFilters };
}, { deep: true });

watch(() => props.activeTab, (newTab) => {
  localActiveTab.value = newTab;
});
</script>

<style scoped>
.smart-toolbar {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 16px 20px;
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  border: 1px solid #f0f0f0;
  margin-bottom: 20px;
}

.toolbar-section {
  display: flex;
  align-items: center;
  gap: 12px;
}

.toolbar-left {
  flex: 1;
  flex-shrink: 0;
}

.toolbar-center {
  flex: 2;
  justify-content: center;
  flex-shrink: 0;
  min-width: 0;
  max-width: 60%; /* 限制最大宽度，避免标签过多时占据过多空间 */
  overflow: hidden; /* 隐藏溢出内容 */
}

.group-tabs {
  width: 100%;
  min-width: 0;
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

.search-input {
  width: 300px;
  max-width: 100%;
}

.filter-select {
  width: 140px;
  min-width: 120px;
}

/* 响应式调整 */
@media (max-width: 1200px) {
  .smart-toolbar {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }

  .toolbar-section {
    justify-content: flex-start;
  }

  .toolbar-left {
    width: 100%;
  }

  .toolbar-center {
    width: 100%;
    max-width: 100%; /* 在中等屏幕上允许使用更多空间 */
    justify-content: flex-start;
  }

  .toolbar-right {
    width: 100%;
    justify-content: flex-end;
  }

  .search-input {
    width: 250px;
  }

  .filter-select {
    width: 120px;
  }
}

@media (max-width: 768px) {
  .smart-toolbar {
    padding: 12px 16px;
    gap: 12px;
    flex-direction: column;
    align-items: stretch;
  }

  .toolbar-section {
    width: 100%;
    justify-content: flex-start;
  }

  .toolbar-left {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }

  .search-input {
    width: 100%;
  }

  .filter-select {
    width: 100%;
  }

  .toolbar-center {
    order: -1; /* 将分组标签移到顶部 */
    width: 100%;
    max-width: 100%;
    overflow-x: auto;
    scrollbar-width: none;
    -ms-overflow-style: none;
    padding: 8px 0;
  }

  .toolbar-center::-webkit-scrollbar {
    display: none;
  }

  .group-tabs :deep(.n-tabs-nav) {
    flex-wrap: nowrap;
    overflow-x: auto;
    scrollbar-width: none;
    -ms-overflow-style: none;
    padding: 4px 0;
    justify-content: flex-start;
  }

  .group-tabs :deep(.n-tabs-nav::-webkit-scrollbar) {
    display: none;
  }

  .group-tabs :deep(.n-tabs-tab) {
    flex-shrink: 0;
    white-space: nowrap;
    min-width: auto;
    padding: 6px 12px;
    font-size: 13px;
    border-radius: 6px;
    margin-right: 4px;
    transition: all 0.2s ease;
  }

  .group-tabs :deep(.n-tabs-tab:hover) {
    background-color: #f5f5f5;
  }

  .group-tabs :deep(.n-tabs-tab--active) {
    font-weight: 600;
    background-color: #2080f0;
    color: white;
    box-shadow: 0 2px 4px rgba(32, 128, 240, 0.2);
  }

  .toolbar-right {
    flex-wrap: wrap;
    gap: 8px;
    justify-content: flex-end;
  }
}

/* 深色主题支持 */
.dark .smart-toolbar {
  background: #18181c;
  border-color: #303030;
}

/* 焦点样式 */
.smart-toolbar:focus-within {
  outline: 2px solid #2080f0;
  outline-offset: 2px;
}

/* 动画效果 */
.smart-toolbar {
  transition: all 0.2s ease-in-out;
}

.smart-toolbar:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
}
</style>