<template>
  <div class="nodes-modern-layout-migrated">
    <!-- 顶部区域：标题 + 统计 + 操作 -->
    <div class="layout-header">
      <!-- 页面标题和面包屑 -->
      <div class="header-main">
        <div class="header-left">
          <div class="page-info">
            <h1 class="page-title">节点管理</h1>
            <div class="page-breadcrumb">
              <span class="breadcrumb-item">代理</span>
              <span class="breadcrumb-separator">/</span>
              <span class="breadcrumb-item active">节点</span>
            </div>
          </div>
        </div>

        <div class="header-right">
          <!-- 使用通用按钮组件 -->
          <ActionButtonGroup
            :actions="headerActions"
            size="medium"
            @action="handleHeaderAction"
          />
        </div>
      </div>

      <!-- 使用通用统计面板 -->
      <StatsPanel
        :stats="statsItems"
        :header-actions="statsActions"
        :context="{ activeView }"
        @headerAction="handleStatsAction"
      />
    </div>

    <!-- 主要内容区域 -->
    <div class="layout-content">
      <div class="content-container" :class="{ 'sidebar-collapsed': sidebarCollapsed }">
        <!-- 左侧：使用通用工具栏 -->
        <div class="content-main">
          <SmartToolbar
            :search-query="searchQuery"
            :search-placeholder="'搜索节点名称或服务器地址...'"
            :filters="nodeFilters"
            :filter-values="filterValues"
            :tabs="tabItems"
            :active-tab="activeView"
            :primary-actions="primaryActions"
            :smart-actions="smartActions"
            :more-actions="moreActions"
            :context="{ selectedNodes, activeView }"
            @update:searchQuery="handleSearchUpdate"
            @update:filters="handleFilterUpdate"
            @update:activeTab="handleTabChange"
            @primaryAction="handlePrimaryAction"
            @smartAction="handleSmartAction"
            @moreAction="handleMoreAction"
          />

          <!-- 使用通用数据表格 -->
          <ModernDataTable
            :columns="tableColumns"
            :data="filteredNodes"
            :loading="loading"
            :selectable="true"
            :searchable="false" <!-- 搜索已在工具栏中 -->
            :header-actions="tableHeaderActions"
            :bulk-actions="bulkActions"
            :context="{ selectedNodes }"
            @selection-change="handleSelectionChange"
            @edit="handleEditNode"
            @delete="handleDeleteNode"
            @bulk-action="handleBulkAction"
            @header-action="handleTableHeaderAction"
            @table-setting="handleTableSetting"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useMessage, useDialog } from 'naive-ui';
import {
  Add as AddIcon,
  Settings as SettingsIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  Folder as FolderIcon,
  ServerOutline as ServerIcon,
  CheckmarkCircle as CheckCircleIcon,
  CloseCircle as CloseCircleIcon,
  Warning as WarningIcon
} from '@vicons/ionicons5';

// 导入通用组件
import StatsPanel from '@/components/common/StatsPanel.vue';
import SmartToolbar from '@/components/common/SmartToolbar.vue';
import ModernDataTable from '@/components/common/ModernDataTable.vue';
import ActionButtonGroup from '@/components/common/ActionButtonGroup.vue';

// 导入业务逻辑
import { useNodeManagement } from '@/composables/useNodeManagement';
import { useNodeHealth } from '@/composables/useNodeHealth';
import { useNodeGroups } from '@/composables/useNodeGroups';
import { useNodeFilters } from '@/composables/useNodeFilters';
import type { Node, NodeGroup } from '@/types/entities';

// 业务逻辑
const message = useMessage();
const dialog = useDialog();
const sidebarCollapsed = ref(false);

// 使用现有的composables
const {
  nodes,
  loading,
  nodeStats,
  selectedNodes,
  fetchNodes,
  addNode,
  editNode,
  deleteNode,
  batchDelete,
  clearSelection
} = useNodeManagement();

const { getNodeHealthStatus } = useNodeHealth();
const { groups, fetchGroups } = useNodeGroups();
const { activeView, searchQuery, filterValues, filteredNodes, setActiveView, updateSearch, updateFilters } = useNodeFilters();

// 响应式状态
const activeView = ref('all');

// 统计面板数据
const statsItems = computed(() => [
  {
    key: 'total',
    title: '全部节点',
    value: nodeStats.value.totalCount,
    icon: ServerIcon,
    color: 'primary',
    order: 1,
    onClick: () => setActiveView('all')
  },
  {
    key: 'online',
    title: '在线节点',
    value: nodeStats.value.onlineCount,
    icon: CheckCircleIcon,
    color: 'success',
    order: 2,
    onClick: () => setActiveView('online')
  },
  {
    key: 'offline',
    title: '离线节点',
    value: nodeStats.value.offlineCount,
    icon: CloseCircleIcon,
    color: 'error',
    order: 3,
    onClick: () => setActiveView('offline')
  },
  {
    key: 'error',
    title: '异常节点',
    value: nodeStats.value.errorCount,
    icon: WarningIcon,
    color: 'warning',
    order: 4,
    onClick: () => setActiveView('error')
  }
]);

// 筛选器配置
const nodeFilters = computed(() => [
  {
    key: 'protocol',
    type: 'select',
    placeholder: '协议类型',
    options: [
      { label: '全部', value: '' },
      { label: 'VMess', value: 'vmess' },
      { label: 'VLESS', value: 'vless' },
      { label: 'Trojan', value: 'trojan' },
      { label: 'Shadowsocks', value: 'ss' }
    ]
  },
  {
    key: 'status',
    type: 'select',
    placeholder: '节点状态',
    options: [
      { label: '全部', value: '' },
      { label: '在线', value: 'online' },
      { label: '离线', value: 'offline' },
      { label: '异常', value: 'error' }
    ]
  }
]);

// 标签页配置
const tabItems = computed(() => [
  { key: 'all', label: `全部 (${nodeStats.value.totalCount})` },
  { key: 'online', label: `在线 (${nodeStats.value.onlineCount})` },
  { key: 'offline', label: `离线 (${nodeStats.value.offlineCount})` },
  { key: 'error', label: `异常 (${nodeStats.value.errorCount})` },
  ...groups.value.map(group => ({
    key: group.id,
    label: group.name
  }))
]);

// 头部操作按钮
const headerActions = computed(() => [
  {
    key: 'add',
    label: '添加节点',
    type: 'primary',
    icon: AddIcon,
    priority: 'high',
    handler: () => handleAddNode()
  },
  {
    key: 'import',
    label: '批量导入',
    type: 'default',
    icon: DownloadIcon,
    priority: 'medium',
    handler: () => handleImportNodes()
  }
]);

// 工具栏主要操作
const primaryActions = computed(() => []);

// 智能操作推荐
const smartActions = computed(() => [
  {
    key: 'test-offline',
    label: `测试离线节点 (${offlineNodes.value.length})`,
    type: 'warning',
    icon: RefreshIcon,
    priority: 'high',
    condition: () => offlineNodes.value.length > 0,
    action: () => testOfflineNodes()
  }
]);

// 更多操作
const moreActions = computed(() => [
  {
    key: 'refresh',
    label: '刷新数据',
    icon: RefreshIcon,
    action: () => fetchNodes()
  },
  {
    key: 'settings',
    label: '设置',
    icon: SettingsIcon,
    action: () => openSettings()
  }
]);

// 表格列定义
const tableColumns = computed(() => [
  {
    key: 'name',
    title: '节点名称',
    width: 200,
    render: (row: Node) => row.name
  },
  {
    key: 'server',
    title: '服务器',
    width: 150,
    render: (row: Node) => row.server
  },
  {
    key: 'status',
    title: '状态',
    width: 100,
    render: (row: Node) => {
      const health = getNodeHealthStatus(row);
      return health.status;
    }
  }
]);

// 批量操作
const bulkActions = computed(() => [
  {
    key: 'batch-test',
    label: '批量测试',
    type: 'primary',
    condition: () => selectedNodes.value.length > 0,
    handler: () => batchTestNodes()
  },
  {
    key: 'batch-delete',
    label: '批量删除',
    type: 'error',
    condition: () => selectedNodes.value.length > 0,
    handler: () => batchDeleteNodes()
  }
]);

// 计算属性
const offlineNodes = computed(() =>
  filteredNodes.value.filter(node => getNodeHealthStatus(node).status === 'offline')
);

// 事件处理
const handleHeaderAction = (key: string) => {
  // 处理头部按钮操作
};

const handleStatsAction = (key: string) => {
  // 处理统计面板操作
};

const handleSearchUpdate = (query: string) => {
  updateSearch(query);
};

const handleFilterUpdate = (filters: any) => {
  updateFilters(filters);
};

const handleTabChange = (tab: string) => {
  setActiveView(tab);
};

const handlePrimaryAction = (action: string) => {
  // 处理主要操作
};

const handleSmartAction = (action: string, params?: any) => {
  // 处理智能操作
};

const handleMoreAction = (action: string) => {
  // 处理更多操作
};

const handleSelectionChange = (keys: string[], items: Node[]) => {
  // 处理选择变化
};

const handleEditNode = (node: Node) => {
  editNode(node);
};

const handleDeleteNode = (node: Node) => {
  deleteNode(node.id);
};

const handleBulkAction = (action: string, items: Node[]) => {
  // 处理批量操作
};

const handleTableHeaderAction = (action: string) => {
  // 处理表格头部操作
};

const handleTableSetting = (setting: string) => {
  // 处理表格设置
};

// 业务方法
const handleAddNode = () => {
  // 添加节点逻辑
};

const handleImportNodes = () => {
  // 批量导入逻辑
};

const testOfflineNodes = () => {
  // 测试离线节点逻辑
};

const batchTestNodes = () => {
  // 批量测试逻辑
};

const batchDeleteNodes = () => {
  // 批量删除逻辑
};

const openSettings = () => {
  // 打开设置逻辑
};

const handleViewChange = (view: string) => {
  setActiveView(view);
};

// 生命周期
onMounted(() => {
  fetchNodes();
  fetchGroups();
});
</script>

<style scoped>
/* 引入通用样式 */
@import '@/styles/common.css';

/* 页面布局样式 */
.nodes-modern-layout-migrated {
  min-height: 100vh;
  background: var(--bg-secondary);
}

.layout-header {
  padding: var(--spacing-xl);
  background: var(--bg-primary);
  border-bottom: 1px solid var(--border-primary);
}

.header-main {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--spacing-xl);
}

.page-info {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.page-title {
  font-size: 1.875rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.page-breadcrumb {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-size: 0.875rem;
}

.breadcrumb-item {
  color: var(--text-tertiary);
}

.breadcrumb-item.active {
  color: var(--text-primary);
  font-weight: 500;
}

.breadcrumb-separator {
  color: var(--text-quaternary);
}

.layout-content {
  padding: var(--spacing-xl);
}

.content-container {
  display: flex;
  gap: var(--spacing-xl);
  transition: all var(--transition-normal) var(--ease-out-cubic);
}

.content-main {
  flex: 1;
  min-width: 0;
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .content-container {
    flex-direction: column;
  }
}

@media (max-width: 768px) {
  .layout-header {
    padding: var(--spacing-lg);
  }

  .header-main {
    flex-direction: column;
    align-items: stretch;
    gap: var(--spacing-lg);
  }

  .page-title {
    font-size: 1.5rem;
  }

  .layout-content {
    padding: var(--spacing-lg);
  }
}
</style>