<template>
  <div class="nodes-modern-layout">
    <!-- 顶部区域：标题 + 统计 + 操作 -->
    <NodesHeader
      :node-stats="nodeStats"
      :header-smart-actions="headerSmartActions"
      @add-node="() => handleAddNode({} as any)"
      @header-action="handleHeaderMoreAction"
      @stats-click="(stat: any, index?: number) => handleStatsCardClick(stat, index || 0)"
    />

    <!-- 主要内容区域 -->
    <div class="layout-content">
      <div class="content-container" :class="{ 'sidebar-collapsed': sidebarCollapsed }">
        <!-- 左侧：搜索和筛选 -->
        <NodesSearchSidebar
          :sidebar-collapsed="sidebarCollapsed"
          :search-query="searchQuery"
          :selected-protocols="selectedProtocols"
          :selected-statuses="selectedStatuses"
          :latency-filter="latencyFilter"
          :has-filters="hasFilters"
          :protocol-options="protocolOptions"
          :active-view="activeView"
          :quick-filter-options="quickFilterOptions"
          @toggle-sidebar="toggleSidebar"
          @update:search-query="searchQuery = $event"
          @update:selected-protocols="selectedProtocols = $event"
          @update:selected-statuses="selectedStatuses = $event"
          @update:latency-filter="latencyFilter = $event"
          @clear-filters="clearFilters"
        />

        <!-- 中间：主内容区域 -->
        <div class="content-main">
          <!-- 智能操作栏 -->
          <NodesSmartActions
            :smart-actions="smartActions"
            @smart-action="handleSmartAction"
          />

          <!-- 分组标签页 -->
          <div class="group-tabs-section">
            <SmartGroupTabs
              :groups="smartGroups.map(g => ({ ...g, count: smartGroupCounts[g.id as keyof typeof smartGroupCounts] || 0 }))"
              :group-counts="smartGroupCounts"
              v-model:active-tab="activeGroupId"
              tab-type="segment"
              size="medium"
              :show-add-button="true"
              :enable-context-menu="true"
              :enable-inline-actions="true"
              @tab-click="handleGroupChange"
              @group-tab-click="handleGroupTabClick"
              @group-context-menu="handleGroupContextMenu"
              @group-action="handleGroupAction"
              @add-action="handleAddAction"
            />
          </div>

          <!-- 选中节点操作栏 -->
          <NodesSelectionBar
            :selected-nodes-count="selectedNodes.length"
            :testing-selected="testingSelected"
            :selected-nodes-summary="selectedNodesSummary"
            :test-dropdown-options="testDropdownOptions"
            :export-dropdown-options="exportDropdownOptions"
            :more-dropdown-options="moreDropdownOptions"
            @test-action="handleTestAction"
            @batch-move="showBatchMoveModal = true"
            @export-action="handleExportAction"
            @more-action="handleMoreAction"
          />

          <!-- 表格区域 -->
          <NodesDataTable
            :nodes-data="paginatedNodes"
            :loading="loading"
            :selected-row-keys="selectedNodes"
            :current-page="paginationState.page"
            :page-size="paginationState.pageSize"
            :pagination-info="paginationInfo"
            :groups="groups"
            :get-node-health-status="nodeHealth.getNodeHealthStatus"
            :get-status-text="getStatusTextWrapper"
            @selection-change="handleSelectionChange"
            @page-change="handlePageChange"
            @page-size-change="handlePageSizeChange"
            @edit-node="editNode"
          />
        </div>
      </div>
    </div>

    <!-- 模态框 -->
    <NodeModal
      :show="showAddModal"
      :node="null"
      :groups="groups"
      @update:show="showAddModal = $event"
      @save="handleAddNode"
    />

    <NodeModal
      :show="showEditModal"
      :node="editingNode"
      :groups="groups"
      @update:show="showEditModal = $event"
      @save="handleEditNode"
    />

    <ImportModal
      :show="showImportModal"
      :groups="groups"
      @update:show="showImportModal = $event"
      @import="handleImport"
    />

    <BatchMoveModal
      :show="showBatchMoveModal"
      :groups="groups"
      :selected-count="selectedNodes.length"
      :group-node-counts="groupCounts"
      @update:show="showBatchMoveModal = $event"
      @move="handleBatchMove"
    />

    <!-- 节点管理模态框系统 -->
    <NodeFormAndImport
      :modal-states="nodeManagement.modalStates.value"
      :modal-title="nodeManagement.modalTitle.value"
      :node-form-state="nodeManagement.nodeFormState.value"
      :editing-node="nodeManagement.editingNode.value"
      :add-link="nodeManagement.addLink.value"
      :import-preview="nodeManagement.importPreview.value"
      :import-group-id="nodeManagement.importGroupId.value"
      :editing-group="nodeManagement.editingGroup.value"
      :editing-group-name="nodeManagement.editingGroupName.value"
      :new-group-name="nodeManagement.newGroupName.value"
      :move-to-group-id="nodeManagement.moveToGroupId.value"
      :groups="smartGroups"
      @close-modal="(modal: string) => nodeManagement.closeModal(modal as any)"
      @save-node="nodeManagement.handleSaveNode"
      @batch-import="nodeManagement.handleBatchImport"
      @save-group="handleSaveGroup"
      @save-move-to-group="handleSaveMoveToGroup"
      @update:node-form-state="(value) => { if (typeof value === 'object') nodeManagement.nodeFormState = value as any }"
      @update:add-link="(value) => { if (typeof value === 'string') nodeManagement.addLink = value as any }"
      @update:import-preview="(value) => { if (Array.isArray(value)) nodeManagement.importPreview = value as any }"
      @update:import-group-id="(value) => { if (typeof value === 'string') nodeManagement.importGroupId = value as any }"
      @update:editing-group-name="(value) => { if (typeof value === 'string') nodeManagement.editingGroupName = value as any }"
      @update:new-group-name="(value) => { if (typeof value === 'string') nodeManagement.newGroupName = value as any }"
      @update:move-to-group-id="(value) => { if (typeof value === 'string') nodeManagement.moveToGroupId = value as any }"
    />

    <!-- 分组右键菜单 -->
    <n-dropdown
      :show="showContextMenu"
      :x="contextMenuX"
      :y="contextMenuY"
      :options="contextMenuGroup ? getGroupDropdownOptions(contextMenuGroup) : []"
      placement="bottom-start"
      @clickoutside="closeContextMenu"
      @select="handleContextMenuAction"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useMessage, useDialog } from 'naive-ui';
import {
  Add as AddIcon,
  Search as SearchIcon,
  EllipsisVertical as MoreIcon,
  Folder as FolderIcon,
  Download as DownloadIcon,
  Trash as TrashIcon,
  Flash as FlashIcon,
  Refresh as RefreshIcon,
  CloudUpload as ImportIcon,
  Bulb as BulbIcon,
  CheckmarkCircle as CheckCircleIcon,
  CloseCircle as CloseCircleIcon,
  Warning as WarningIcon,
  Settings as SettingsIcon,
  Copy as CopyIcon,
  Server as NodesIcon,
  Menu as SidebarIcon,
  Create as EditIcon,
  Link as LinkIcon,
  InformationCircle as DetailsIcon,
  ChevronBack as ChevronBackIcon,
  ChevronForward as ChevronForwardIcon,
  Filter as FilterIcon,
  Close as CloseIcon
} from '@vicons/ionicons5';
import { useNodeManagement } from '@/composables/useNodeManagement';
import { useNodeHealth } from '@/composables/useNodeHealth';
import { useNodeGroups } from '@/composables/useNodeGroups';
import { useNodeFilters } from '@/composables/useNodeFilters';
import { useGroupStore } from '@/stores/groups';
import NodeSmartActions from './NodeSmartActions.vue';
import SmartHeaderActions from '../common/SmartHeaderActions.vue';
import SmartGroupTabs from '../common/SmartGroupTabs.vue';
import PerfectDropdown from '../PerfectDropdown.vue';
import NodeModal from '@/views/components/NodeModal.vue';
import ImportModal from '@/views/components/ImportModal.vue';
import BatchMoveModal from '@/views/components/BatchMoveModal.vue';
import NodeFormAndImport from './components/NodeFormAndImport.vue';

// 导入新的组件
import NodesHeader from './components/NodesHeader.vue';
import NodesSearchSidebar from './components/NodesSearchSidebar.vue';
import NodesSmartActions from './components/NodesSmartActions.vue';
import NodesSelectionBar from './components/NodesSelectionBar.vue';
import NodesDataTable from './components/NodesDataTable.vue';

import type { Node, NodeGroup } from '@/types/entities';

// 初始化
const message = useMessage();
const dialog = useDialog();
const groupStore = useGroupStore();

// 分页状态
const paginationState = ref({ page: 1, pageSize: 20 });

// Composables
const nodeManagement = useNodeManagement();
const nodeHealth = useNodeHealth(nodeManagement.nodes);
const nodeGroups = useNodeGroups(nodeManagement.nodes);
const nodeFilters = useNodeFilters(
  nodeManagement.nodes,
  ref('all'), // activeTab
  paginationState
);

// 基础状态
const loading = ref(false);
const testingSelected = ref(false);
const deleting = ref(false); // 防止重复删除的标志
const sidebarCollapsed = ref(true); // 默认为折叠状态

// 搜索和筛选状态
const searchQuery = ref('');
const selectedProtocols = ref<string[]>([]);
const selectedStatuses = ref<string[]>([]);
const latencyFilter = ref('');
const activeView = ref('all');
const activeGroupId = ref('all');

// 选择状态
const selectedNodes = ref<string[]>([]);

// UI状态
const showAddModal = ref(false);
const showEditModal = ref(false);
const showImportModal = ref(false);
const showBatchMoveModal = ref(false);
const editingNode = ref<Node | null>(null);

// 计算属性：统计数据 - 直接返回nodeStats格式
const nodeStats = computed(() => {
  const nodes = nodeManagement.nodes.value;
  const healthStatuses = nodes.map(node => nodeHealth.getNodeHealthStatus(node));

  return {
    totalCount: nodes.length,
    onlineCount: healthStatuses.filter(h => h.status === 'online').length,
    offlineCount: healthStatuses.filter(h => h.status === 'offline').length,
    errorCount: healthStatuses.filter(h => h.status === 'error').length,
  };
});

// 删除原来复杂的nodeStatsCards计算属性，因为现在在NodesHeader组件内部处理

// 分组数据 - 直接使用groupStore的数据
const groups = computed(() => {
  return groupStore.groups || [];
});

// 转换为SmartGroupTabs的GroupItem格式
const smartGroups = computed(() => {
  const counts = smartGroupCounts.value;
  return groups.value.map(group => ({
    id: group.id,
    name: group.name,
    description: group.description || undefined,
    is_enabled: group.is_enabled,
    disabled: !group.is_enabled,
    count: counts[group.id as keyof typeof counts] || 0
  }));
});

const groupCounts = computed(() => nodeGroups.groupCounts.value);

// 转换为SmartGroupTabs的GroupCount格式
const smartGroupCounts = computed(() => {
  const counts = nodeGroups.groupCounts.value || {};
  return {
    all: counts.all || 0,
    ungrouped: counts.ungrouped || 0,
    ...Object.fromEntries(
      Object.entries(counts).filter(([key]) =>
        key !== 'all' && key !== 'ungrouped'
      )
    )
  };
});

// 筛选选项 - 只保留协议选项，其他的已移到组件内部
const protocolOptions = computed(() => {
  const protocols = Array.from(new Set(nodeManagement.nodes.value.map(n => n.protocol).filter(Boolean)));
  return protocols.map(protocol => ({
    label: protocol.toUpperCase(),
    value: protocol
  }));
});

// 删除状态选项、延迟选项等已移到组件内部

// 筛选后的节点
const filteredNodes = computed(() => {
  let result = nodeManagement.nodes.value;

  // 搜索筛选
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    result = result.filter(node =>
      node.name.toLowerCase().includes(query) ||
      (node.server?.toLowerCase() || '').includes(query)
    );
  }

  // 协议筛选
  if (selectedProtocols.value && selectedProtocols.value.length > 0) {
    result = result.filter(node =>
      selectedProtocols.value.includes(node.protocol)
    );
  }

  // 状态筛选（基于健康检查状态）
  if (selectedStatuses.value && selectedStatuses.value.length > 0) {
    const healthStatuses = result.map(node => nodeHealth.getNodeHealthStatus(node));
    result = result.filter((node, index) =>
      selectedStatuses.value.includes(healthStatuses[index].status)
    );
  }

  // 视图筛选（基于健康检查状态）
  if (activeView.value === 'online') {
    const healthStatuses = result.map(node => nodeHealth.getNodeHealthStatus(node));
    result = result.filter((node, index) => healthStatuses[index].status === 'online');
  } else if (activeView.value === 'offline') {
    const healthStatuses = result.map(node => nodeHealth.getNodeHealthStatus(node));
    result = result.filter((node, index) => healthStatuses[index].status === 'offline');
  } else if (activeView.value === 'error') {
    const healthStatuses = result.map(node => nodeHealth.getNodeHealthStatus(node));
    result = result.filter((node, index) => healthStatuses[index].status === 'error');
  }

  // 延迟筛选
  if (latencyFilter.value) {
    const healthStatuses = result.map(node => nodeHealth.getNodeHealthStatus(node));
    result = result.filter((node, index) => {
      const latency = healthStatuses[index].latency;
      if (!latency) return false;
      switch (latencyFilter.value) {
        case 'excellent': return latency < 100;
        case 'good': return latency >= 100 && latency < 300;
        case 'medium': return latency >= 300 && latency < 1000;
        case 'poor': return latency >= 1000;
        default: return true;
      }
    });
  }

  // 分组筛选
  if (activeGroupId.value === 'all') {
    // 不筛选
  } else if (activeGroupId.value === 'ungrouped') {
    result = result.filter(node => !node.group_id);
  } else {
    result = result.filter(node => node.group_id === activeGroupId.value);
  }

  return result;
});

// 分页后的节点（用于表格显示）
const paginatedNodes = computed(() => {
  const start = (paginationState.value.page - 1) * paginationState.value.pageSize;
  const end = start + paginationState.value.pageSize;
  return filteredNodes.value.slice(start, end);
});

// 分页配置（用于显示信息）
const paginationInfo = computed(() => {
  if (!nodeManagement.nodes.value || nodeManagement.nodes.value.length === 0) {
    return null;
  }

  return {
    itemCount: filteredNodes.value.length,
    pageSize: paginationState.value.pageSize,
    pageSizes: [10, 20, 50, 100],
  };
});

// 选中节点统计
const selectedNodesSummary = computed(() => {
  const selected = nodeManagement.nodes.value.filter(n => selectedNodes.value.includes(n.id));
  const healthStatuses = selected.map(node => nodeHealth.getNodeHealthStatus(node));

  return {
    total: selected.length,
    online: healthStatuses.filter(h => h.status === 'online').length,
    offline: healthStatuses.filter(h => h.status === 'offline').length,
    error: healthStatuses.filter(h => h.status === 'error').length,
    pending: healthStatuses.filter(h => h.status === 'pending').length,
  };
});

// 测试下拉菜单选项
const testDropdownOptions = computed(() => {
  const selected = nodeManagement.nodes.value.filter(n => selectedNodes.value.includes(n.id));
  const selectedHealthStatuses = selected.map(node => nodeHealth.getNodeHealthStatus(node));
  const options = [];

  // 如果有离线节点，显示快速测试选项
  const offlineNodes = selected.filter((node, index) => selectedHealthStatuses[index].status === 'offline');
  if (offlineNodes.length > 0) {
    options.push({
      label: `测试离线 (${offlineNodes.length})`,
      key: 'test-offline',
      type: 'warning' as const,
      icon: FlashIcon,
      description: '测试当前离线的节点'
    });
  }

  // 如果有错误节点，显示重试选项
  const errorNodes = selected.filter((node, index) => selectedHealthStatuses[index].status === 'error');
  if (errorNodes.length > 0) {
    options.push({
      label: `重试错误 (${errorNodes.length})`,
      key: 'retry-errors',
      type: 'danger' as const,
      icon: RefreshIcon,
      description: '重新测试之前测试失败的节点'
    });
  }

  // 如果有在线节点，显示重新测试选项
  const onlineNodes = selected.filter((node, index) => selectedHealthStatuses[index].status === 'online');
  if (onlineNodes.length > 0) {
    options.push({
      label: `重新测试 (${onlineNodes.length})`,
      key: 'retest-online',
      type: 'default' as const,
      icon: RefreshIcon,
      description: '重新测试当前在线的节点'
    });
  }

  // 默认选项
  options.push({
    type: 'divider' as const,
    key: 'divider-1',
    label: ''
  });

  options.push({
    label: `测试所有选中 (${selected.length})`,
    key: 'test-all',
    type: 'default' as const,
    icon: FlashIcon,
    description: selected.length > 0 ? '测试所有选中的节点' : '请先选择要测试的节点'
  });

  return options;
});

// 批量编辑选项
const batchEditOptions = computed(() => {
  const selected = nodeManagement.nodes.value.filter(n => selectedNodes.value.includes(n.id));
  const selectedHealthStatuses = selected.map(node => nodeHealth.getNodeHealthStatus(node));
  const options = [];

  // 如果有未分组节点
  const ungroupedNodes = selected.filter(n => !n.group_id);
  if (ungroupedNodes.length > 0) {
    options.push({
      label: `移动到分组 (${ungroupedNodes.length})`,
      key: 'move-to-group',
      icon: FolderIcon
    });
  }

  // 批量修改分组
  options.push({
    label: '批量修改分组',
    key: 'batch-change-group',
    icon: FolderIcon
  });

  // 批量重命名
  options.push({
    label: '批量重命名',
    key: 'batch-rename',
    icon: SettingsIcon
  });

  // 如果有失败的节点
  const failedNodes = selected.filter((node, index) => selectedHealthStatuses[index].status === 'error');
  if (failedNodes.length > 0) {
    options.push({
      label: `清理失败项 (${failedNodes.length})`,
      key: 'clear-failures',
      icon: TrashIcon
    });
  }

  return options;
});

// 导出下拉菜单选项
const exportDropdownOptions = computed(() => {
  return [
    {
      label: '导出选中节点 (JSON)',
      key: 'export-json',
      icon: DownloadIcon,
      description: '将选中的节点导出为JSON格式文件'
    },
    {
      label: '导出选中节点 (订阅链接)',
      key: 'export-subscription',
      icon: CopyIcon,
      description: '生成选中节点的订阅链接'
    },
    {
      label: '导出为配置文件',
      key: 'export-config',
      icon: SettingsIcon,
      description: '导出为各种客户端配置文件'
    }
  ];
});

// 更多操作下拉菜单选项
const moreDropdownOptions = computed(() => {
  const selected = nodeManagement.nodes.value.filter(n => selectedNodes.value.includes(n.id));
  const selectedHealthStatuses = selected.map(node => nodeHealth.getNodeHealthStatus(node));
  const options = [];

  // 如果有未分组节点
  const ungroupedNodes = selected.filter(n => !n.group_id);
  if (ungroupedNodes.length > 0) {
    options.push({
      label: `移动到新分组 (${ungroupedNodes.length})`,
      key: 'move-to-new-group',
      icon: FolderIcon,
      description: '将未分组节点移动到新分组'
    });
  }

  // 如果有失败的节点
  const failedNodes = selected.filter((node, index) => selectedHealthStatuses[index].status === 'error');
  if (failedNodes.length > 0) {
    options.push({
      label: `清理失败项 (${failedNodes.length})`,
      key: 'clear-failures',
      icon: TrashIcon,
      description: '删除测试失败的节点'
    });
  }

  // 默认操作
  options.push(
    { type: 'divider' as const, key: 'divider-1', label: '' },
    {
      label: '复制链接',
      key: 'copy-links',
      icon: CopyIcon,
      description: '复制选中节点的链接到剪贴板'
    },
    {
      label: '删除选中',
      key: 'delete-selected',
      icon: TrashIcon,
      type: 'danger' as const,
      description: selected.length > 0 ? `删除 ${selected.length} 个选中的节点` : '请先选择要删除的节点'
    }
  );

  return options;
});

// 快速筛选选项（折叠状态下显示）
const quickFilterOptions = computed(() => [
  {
    key: 'all',
    label: '全部节点',
    icon: NodesIcon,
    active: activeView.value === 'all' && !hasFilters.value,
    action: () => {
      activeView.value = 'all';
      clearFilters();
    }
  },
  {
    key: 'online',
    label: '在线节点',
    icon: CheckCircleIcon,
    active: activeView.value === 'online',
    action: () => {
      activeView.value = 'online';
    }
  },
  {
    key: 'offline',
    label: '离线节点',
    icon: CloseCircleIcon,
    active: activeView.value === 'offline',
    action: () => {
      activeView.value = 'offline';
    }
  },
  {
    key: 'error',
    label: '异常节点',
    icon: WarningIcon,
    active: activeView.value === 'error',
    action: () => {
      activeView.value = 'error';
    }
  },
  {
    key: 'filtered',
    label: '筛选模式',
    icon: FilterIcon,
    active: Boolean(hasFilters.value && activeView.value === 'all'),
    action: () => {
      // 切换侧边栏展开状态以便进行详细筛选
      sidebarCollapsed.value = false;
    }
  }
]);

// Wrapper function for getStatusText to handle string parameter
const getStatusTextWrapper = (status: string): string => {
  return nodeHealth.getStatusText(status as any);
};

// 智能操作
const smartActions = computed(() => {
  const selected = selectedNodes.value.length;
  const actions = [];

  if (selected > 0) {
    const selectedNodesData = nodeManagement.nodes.value.filter(n => selectedNodes.value.includes(n.id));
    const selectedHealthStatuses = selectedNodesData.map(node => nodeHealth.getNodeHealthStatus(node));

    const offlineNodes = selectedNodesData.filter((node, index) => selectedHealthStatuses[index].status === 'offline');
    const errorNodes = selectedNodesData.filter((node, index) => selectedHealthStatuses[index].status === 'error');

    if (offlineNodes.length > 0) {
      actions.push({
        key: 'test-offline',
        label: `测试离线 (${offlineNodes.length})`,
        type: 'warning' as const,
        icon: FlashIcon,
        action: () => testSelectedNodes(['offline']),
        loading: false
      });
    }

    if (errorNodes.length > 0) {
      actions.push({
        key: 'retry-errors',
        label: `重试错误 (${errorNodes.length})`,
        type: 'error' as const,
        icon: RefreshIcon,
        action: () => testSelectedNodes(['error']),
        loading: false
      });
    }
  }

  // 移除智能操作中的自动删除功能，避免与用户手动删除冲突
  // if (nodeStats.value.errorCount > 0) {
  //   actions.push({
  //     key: 'clear-errors',
  //     label: `清理失败项 (${nodeStats.value.errorCount})`,
  //     type: 'warning' as const,
  //     icon: TrashIcon,
  //     action: () => clearFailedNodes(),
  //     loading: false
  //   });
  // }

  return actions.slice(0, 3);
});

// 右上角更多操作 - SmartHeaderActions格式
const headerSmartActions = computed(() => [
  {
    key: 'import',
    label: '批量导入',
    description: '从文件或链接批量导入节点',
    icon: ImportIcon,
    type: 'primary' as const
  },
  {
    key: 'test-all',
    label: '批量测试',
    description: '测试所有节点的连通性',
    icon: FlashIcon,
    type: 'success' as const
  },
  {
    key: 'export-all',
    label: '导出全部',
    description: '导出所有节点配置',
    icon: DownloadIcon,
    type: 'default' as const
  },
  {
    key: 'refresh',
    label: '刷新数据',
    description: '重新获取节点数据',
    icon: RefreshIcon,
    type: 'default' as const
  },
  {
    type: 'divider' as const,
    key: 'divider-1'
  },
  {
    key: 'settings',
    label: '设置',
    description: '节点管理设置',
    icon: SettingsIcon,
    type: 'default' as const
  }
]);

// 右上角更多操作 - 保留原格式用于兼容
const headerMoreActions = computed(() => [
  {
    label: '批量导入',
    key: 'import',
    icon: ImportIcon,
    description: '从文件或链接批量导入节点',
  },
  {
    label: '批量测试',
    key: 'test-all',
    icon: FlashIcon,
    description: '测试所有节点的连通性',
  },
  {
    label: '导出全部',
    key: 'export-all',
    icon: DownloadIcon,
    description: '导出所有节点配置',
  },
  {
    label: '刷新数据',
    key: 'refresh',
    icon: RefreshIcon,
    description: '重新获取节点数据',
  },
  {
    type: 'divider' as const,
    key: 'divider-1'
  },
  {
    label: '设置',
    key: 'settings',
    icon: SettingsIcon,
    description: '节点管理设置',
  },
]);

// 事件处理方法
// 处理统计卡片点击
const handleStatsCardClick = (stat: any, index: number) => {
  // 根据卡片类型切换视图
  switch (stat.key) {
    case 'all':
      handleViewChange('all');
      break;
    case 'online':
      handleViewChange('online');
      break;
    case 'offline':
      handleViewChange('offline');
      break;
    case 'error':
      handleViewChange('error');
      break;
  }
};

const handleViewChange = (view: string) => {
  activeView.value = view;
  paginationState.value.page = 1;
};

const handleGroupChange = (groupId: string) => {
  console.log('切换分组:', groupId);
  activeGroupId.value = groupId;
  paginationState.value.page = 1;

  // 调试信息
  setTimeout(() => {
    console.log('切换后的数据:', {
      activeGroupId: activeGroupId.value,
      filteredNodesCount: filteredNodes.value.length,
      firstFewNodes: filteredNodes.value.slice(0, 3)
    });
  }, 100);
};

// 右键菜单状态
const showContextMenu = ref(false);
const contextMenuX = ref(0);
const contextMenuY = ref(0);
const contextMenuGroup = ref<any>(null);

// 分组标签点击处理
const handleGroupTabClick = (group: any, event: MouseEvent) => {
  console.log('分组标签点击', group, event);
  // 可以在这里添加额外的点击逻辑
};

// 分组右键菜单处理
const handleGroupContextMenu = (group: any, event: MouseEvent) => {
  console.log('分组右键菜单', group, event);
  event.preventDefault();
  event.stopPropagation();

  // 设置右键菜单状态
  contextMenuGroup.value = group;
  contextMenuX.value = event.clientX;
  contextMenuY.value = event.clientY;
  showContextMenu.value = true;
};

// 关闭右键菜单
const closeContextMenu = () => {
  showContextMenu.value = false;
  contextMenuGroup.value = null;
};

// 处理右键菜单操作
const handleContextMenuAction = (key: string) => {
  if (contextMenuGroup.value) {
    handleGroupAction(key, contextMenuGroup.value);
  }
  closeContextMenu();
};

// 获取分组下拉菜单选项
const getGroupDropdownOptions = (group: any) => {
  return [
    {
      label: group.is_enabled ? '禁用' : '启用',
      key: 'toggle'
    },
    { label: '重命名', key: 'rename' },
    { label: '删除', key: 'delete' },
  ];
};

// 分组操作处理
const handleGroupAction = async (key: string, group: any) => {
  console.log('分组操作', key, group);

  switch (key) {
    case 'toggle':
      // 切换启用/禁用状态
      try {
        const result = await groupStore.toggleGroup(group.id);
        if (result.success) {
          const statusText = group.is_enabled ? '禁用' : '启用';
          message.success(`${statusText}分组 "${group.name}"`);
        } else {
          message.error(`${result.message || '操作失败'}`);
        }
      } catch (error) {
        console.error('切换分组状态时出错:', error);
        message.error('操作失败，请重试');
      }
      break;

    case 'rename':
      // 使用模态框重命名分组
      await handleRenameGroup(group);
      break;

    case 'delete':
      // 删除分组
      dialog.warning({
        title: '删除分组',
        content: `确定要删除分组 "${group.name}" 吗？删除后无法恢复。`,
        positiveText: '确定删除',
        negativeText: '取消',
        onPositiveClick: async () => {
          try {
            const result = await groupStore.deleteGroup(group.id);
            if (result.success) {
              message.success(`已删除分组 "${group.name}"`);

              // 如果当前在要删除的分组，切换到"全部"
              if (activeGroupId.value === group.id) {
                activeGroupId.value = 'all';
                paginationState.value.page = 1;
              }
            } else {
              message.error(`删除失败: ${result.message || '未知错误'}`);
            }
          } catch (error) {
            console.error('删除分组时出错:', error);
            message.error('删除失败，请重试');
          }
        }
      });
      break;
  }
};

// 处理SmartGroupTabs的新增分组操作
const handleAddAction = async (key: string, data?: { name: string; description: string }) => {
  switch (key) {
    case 'add-group':
      if (data?.name) {
        try {
          // 调用现有的addGroup API方法
          const result = await groupStore.addGroup(data.name);

          if (result.success) {
            message.success(`创建新分组: ${data.name}${data.description ? ` (${data.description})` : ''}`);

            // 切换到新创建的分组
            // 由于addGroup方法已经调用了fetchGroups()，我们只需要等待一会儿然后查找新分组
            setTimeout(() => {
              const newGroup = groupStore.groups.find(g => g.name === data.name);
              if (newGroup) {
                activeGroupId.value = newGroup.id;
                paginationState.value.page = 1;
              }
            }, 300);
          } else {
            message.error(`创建分组失败: ${result.message || '未知错误'}`);
          }
        } catch (error) {
          console.error('创建分组时出错:', error);
          message.error('创建分组时发生错误');
        }
      } else {
        message.warning('请输入分组名称');
      }
      break;
    default:
      message.warning(`未知操作: ${key}`);
  }
};

// 处理分组重命名 - 使用模态框
const handleRenameGroup = async (group: any) => {
  try {
    // 使用nodeManagement的openModal方法打开重命名模态框
    await nodeManagement.openModal('renameGroup', group);
  } catch (error) {
    console.error('打开重命名模态框时出错:', error);
    message.error('打开重命名模态框失败');
  }
};

// ���理保存分组 - 连接模态框系统和实际API
const handleSaveGroup = async () => {
  try {
    if (nodeManagement.editingGroup.value && nodeManagement.editingGroupName.value) {
      const group = nodeManagement.editingGroup.value;
      const newName = nodeManagement.editingGroupName.value.trim();

      if (!newName) {
        message.warning('请输入分组名称');
        return;
      }

      if (newName === group.name) {
        message.info('分组名称未改变');
        nodeManagement.closeModal('renameGroup');
        return;
      }

      const result = await groupStore.updateGroup(group.id, newName);
      if (result.success) {
        message.success(`将分组 "${group.name}" 重命名为 "${newName}"`);
        nodeManagement.closeModal('renameGroup');
      } else {
        message.error(`重命名失败: ${result.message || '未知错误'}`);
      }
    } else {
      // 新增分组逻辑
      const groupName = nodeManagement.newGroupName.value.trim();
      if (!groupName) {
        message.warning('请输入分组名称');
        return;
      }

      const result = await groupStore.addGroup(groupName);
      if (result.success) {
        message.success(`创建新分组: ${groupName}`);
        nodeManagement.closeModal('addGroup');

        // 切换到新创建的分组
        setTimeout(() => {
          const newGroup = groupStore.groups.find(g => g.name === groupName);
          if (newGroup) {
            activeGroupId.value = newGroup.id;
            paginationState.value.page = 1;
          }
        }, 300);
      } else {
        message.error(`创建分组失败: ${result.message || '未知错误'}`);
      }
    }
  } catch (error) {
    console.error('保存分组时出错:', error);
    message.error('保存分组失败，请重试');
  }
};

// 处理保存移动到分组
const handleSaveMoveToGroup = async () => {
  try {
    if (selectedNodes.value.length > 0 && nodeManagement.moveToGroupId.value !== undefined) {
      await nodeManagement.batchUpdateGroup(selectedNodes.value, nodeManagement.moveToGroupId.value);
      message.success('移动成功');
      nodeManagement.closeModal('moveToGroup');
      selectedNodes.value = [];
    }
  } catch (error) {
    message.error('移动失败');
  }
};

const handleSelectionChange = (keys: string[]) => {
  selectedNodes.value = keys;
  // 同步到nodeManagement的选中状态
  nodeManagement.checkedRowKeys.value = keys;
};

const handlePageChange = (page: number) => {
  paginationState.value.page = page;
};

const handlePageSizeChange = (pageSize: number) => {
  paginationState.value.pageSize = pageSize;
  paginationState.value.page = 1;
};

const handleHeaderMoreAction = async (key: string, item: any, event?: MouseEvent) => {
  // SmartHeaderActions格式：参数为 (key, item, event)
  // PerfectDropdown格式：参数仅为 key
  // 这里兼容两种格式

  switch (key) {
    case 'import':
      showImportModal.value = true;
      break;
    case 'test-all':
      await testAllNodes();
      break;
    case 'export-all':
      exportAllNodes();
      break;
    case 'refresh':
      await refreshData();
      break;
    case 'settings':
      // 打开设置
      message.info('设置功能开发中');
      break;
  }
};

const handleTestAction = async (key: string) => {
  const selected = nodeManagement.nodes.value.filter(n => selectedNodes.value.includes(n.id));

  switch (key) {
    case 'test-offline':
      await testSelectedNodes(['offline']);
      break;
    case 'retry-errors':
      await testSelectedNodes(['error']);
      break;
    case 'retest-online':
      await testSelectedNodes(['online']);
      break;
    case 'test-all':
      await testSelectedNodes(['all']);
      break;
  }
};

const handleExportAction = (key: string) => {
  switch (key) {
    case 'export-json':
      exportSelectedNodes('json');
      break;
    case 'export-subscription':
      exportSelectedNodes('subscription');
      break;
    case 'export-config':
      exportSelectedNodes('config');
      break;
  }
};

const handleBatchEditAction = async (key: string) => {
  const selected = nodeManagement.nodes.value.filter(n => selectedNodes.value.includes(n.id));

  switch (key) {
    case 'move-to-group':
      showBatchMoveModal.value = true;
      break;
    case 'batch-change-group':
      showBatchMoveModal.value = true;
      break;
    case 'batch-rename':
      message.info('批量重命名功能开发中');
      break;
    case 'clear-failures':
      await clearSelectedFailures();
      break;
  }
};

const handleMoreAction = async (key: string) => {
  const selected = nodeManagement.nodes.value.filter(n => selectedNodes.value.includes(n.id));

  switch (key) {
    case 'move-to-new-group':
      await handleMoveToNewGroup();
      break;
    case 'clear-failures':
      await clearSelectedFailures();
      break;
    case 'copy-links':
      copySelectedLinks();
      break;
    case 'delete-selected':
      // 调用统一的删除函数
      await deleteSelectedNodes();
      break;
  }
};

const handleSmartAction = async (action: any) => {
  try {
    if (action.action) {
      await action.action();
    }
  } catch (error) {
    console.error('Smart action error:', error);
    message.error('操作执行失败');
  }
};

const handleNodeAction = (key: string, node: Node) => {
  switch (key) {
    case 'copy':
      if (node.link) {
        navigator.clipboard.writeText(node.link);
        message.success('链接已复制');
      }
      break;
    case 'copy-config':
      navigator.clipboard.writeText(JSON.stringify(node, null, 2));
      message.success('配置已复制');
      break;
    case 'details':
      // 显示节点详情
      message.info('节点详情功能开发中');
      break;
    case 'delete':
      deleteNode(node);
      break;
  }
};

const handleAddNode = async (nodeData: any) => {
  try {
    await nodeManagement.createNode(nodeData);
    message.success('节点添加成功');
    showAddModal.value = false;
  } catch (error) {
    message.error('添加节点失败');
  }
};

const handleEditNode = async (nodeData: any) => {
  try {
    if (editingNode.value) {
      await nodeManagement.updateNode(editingNode.value.id, nodeData);
      message.success('节点更新成功');
      showEditModal.value = false;
    }
  } catch (error) {
    message.error('更新节点失败');
  }
};

const handleImport = async (importData: any) => {
  try {
    await nodeManagement.handleBatchImport();
    message.success('导入成功');
    showImportModal.value = false;
  } catch (error) {
    message.error('导入失败');
  }
};

const handleBatchMove = async (groupId: string) => {
  try {
    await nodeManagement.batchUpdateGroup(selectedNodes.value, groupId);
    message.success('移动成功');
    showBatchMoveModal.value = false;
    selectedNodes.value = [];
  } catch (error) {
    message.error('移动失败');
  }
};

const testNode = async (node: Node) => {
  try {
    await nodeHealth.checkNodeHealth(node.id);
    message.success('节点测试已启动');
  } catch (error) {
    message.error('启动测试失败');
  }
};

const editNode = (node: Node) => {
  editingNode.value = node;
  showEditModal.value = true;
};

const deleteNode = async (node: Node) => {
  try {
    await nodeManagement.deleteNode(node.id);
    message.success('节点已删除');
  } catch (error) {
    message.error('删除节点失败');
  }
};

const testSelectedNodes = async (filters?: string[]) => {
  testingSelected.value = true;
  try {
    let nodesToTest = selectedNodes.value;

    // 如果指定了过滤器，只测试符合条件的节点
    if (filters && filters.length > 0) {
      const selected = nodeManagement.nodes.value.filter(n => selectedNodes.value.includes(n.id));
      const selectedHealthStatuses = selected.map(node => nodeHealth.getNodeHealthStatus(node));

      nodesToTest = selected.filter((node, index) => {
        const status = selectedHealthStatuses[index].status;
        if (filters.includes('offline') && status === 'offline') return true;
        if (filters.includes('error') && status === 'error') return true;
        if (filters.includes('online') && status === 'online') return true;
        if (filters.includes('all')) return true;
        return false;
      }).map(n => n.id);
    }

    await nodeHealth.checkNodesHealth(nodesToTest);
    message.success(`已开始测试 ${nodesToTest.length} 个节点`);
  } catch (error) {
    message.error('批量测试失败');
  } finally {
    testingSelected.value = false;
  }
};

const copySelectedLinks = () => {
  const selected = filteredNodes.value.filter(node => selectedNodes.value.includes(node.id));
  const links = selected.map(node => node.link).filter(Boolean);

  if (links.length === 0) {
    message.warning('没有可复制的链接');
    return;
  }

  navigator.clipboard.writeText(links.join('\n'));
  message.success(`已复制 ${links.length} 个节点链接`);
};

const clearSelectedFailures = async () => {
  const selected = filteredNodes.value.filter(node =>
    selectedNodes.value.includes(node.id) && (node.error || node.status === 'error')
  );

  if (selected.length === 0) {
    message.warning('没有需要清理的失败项');
    return;
  }

  try {
    await nodeManagement.batchDeleteNodes(selected.map(n => n.id));
    message.success(`已清理 ${selected.length} 个失败项`);
  } catch (error) {
    message.error('清理失败');
  }
};

const handleMoveToNewGroup = () => {
  // 这里可以打开新建分组的模态框
  message.info('移动到新分组功能开发中');
};

const exportSelectedNodes = (format?: string) => {
  const selected = filteredNodes.value.filter(node => selectedNodes.value.includes(node.id));

  if (selected.length === 0) {
    message.warning('没有选中的节点可以导出');
    return;
  }

  let data: string;
  let filename: string;
  let mimeType: string;

  switch (format) {
    case 'subscription':
      // 导出为订阅链接格式
      const subscriptionData = selected.map(node => node.link || '').filter(Boolean).join('\n');
      data = subscriptionData;
      filename = `subscription-${Date.now()}.txt`;
      mimeType = 'text/plain';
      break;

    case 'config':
      // 导出为配置文件格式
      const configData = {
        name: 'SuperSub导出配置',
        proxies: selected.map(node => ({
          name: node.name,
          server: node.server,
          port: node.port,
          protocol: node.protocol,
          settings: node,
        }))
      };
      data = JSON.stringify(configData, null, 2);
      filename = `config-${Date.now()}.json`;
      mimeType = 'application/json';
      break;

    default:
      // 默认导出为JSON格式
      data = JSON.stringify(selected, null, 2);
      filename = `nodes-export-${Date.now()}.json`;
      mimeType = 'application/json';
      break;
  }

  // 创建并下载文件
  const blob = new Blob([data], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);

  message.success(`已导出 ${selected.length} 个节点 (${format || 'JSON'} 格式)`);
};

const deleteSelectedNodes = async () => {
  // 检查是否已经在删除过程中
  if (deleting.value) {
    return;
  }

  // 使用同步后的选中状态（优先使用nodeManagement的状态）
  const currentSelectedNodes = nodeManagement.checkedRowKeys.value.length > 0
    ? nodeManagement.checkedRowKeys.value
    : selectedNodes.value;

  if (currentSelectedNodes.length === 0) {
    message.warning('没有选中的节点可以删除');
    return;
  }

  deleting.value = true;

  dialog.warning({
    title: '确认批量删除',
    content: `确定要删除选中的 ${currentSelectedNodes.length} 个节点吗？此操作不可撤销。`,
    positiveText: '删除',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        // 使用统一的批量删除方法
        await nodeManagement.batchDeleteNodes(currentSelectedNodes);

        // 清空本地选中状态
        selectedNodes.value = [];
        // nodeManagement.batchDeleteNodes 已经会显示成功消息，这里不需要重复显示
      } catch (error) {
        // 错误已经在nodeManagement中处理
      } finally {
        deleting.value = false;
      }
    },
    onClose: () => {
      deleting.value = false;
    }
  });
};

const testAllNodes = async () => {
  try {
    const allNodeIds = filteredNodes.value.map(n => n.id);
    await nodeHealth.checkNodesHealth(allNodeIds);
    message.success('已开始测试所有节点');
  } catch (error) {
    message.error('批量测试失败');
  }
};

const exportAllNodes = () => {
  const data = JSON.stringify(filteredNodes.value, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `all-nodes-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
  message.success(`已导出 ${filteredNodes.value.length} 个节点`);
};

const refreshData = async () => {
  try {
    loading.value = true;
    await Promise.all([
      nodeManagement.fetchNodes(),
      nodeGroups.fetchGroups(),
      nodeHealth.refreshHealthStatus(),
    ]);
    message.success('数据已刷新');
  } catch (error) {
    message.error('刷新失败');
  } finally {
    loading.value = false;
  }
};

const clearFailedNodes = async () => {
  // 检查是否已经在删除过程中
  if (deleting.value) {
    return;
  }

  try {
    // 找到所有失败的节点
    const failedNodes = nodeManagement.nodes.value.filter(node => {
      const healthStatus = nodeHealth.getNodeHealthStatus(node);
      return healthStatus.status === 'error';
    });

    if (failedNodes.length === 0) {
      message.info('没有失败的节点需要清理');
      return;
    }

    deleting.value = true;

    dialog.warning({
      title: '清理失败节点',
      content: `确定要清理 ${failedNodes.length} 个失败的节点吗？此操作不可撤销。`,
      positiveText: '清理',
      negativeText: '取消',
      onPositiveClick: async () => {
        try {
          await nodeManagement.batchDeleteNodes(failedNodes.map(n => n.id));
          message.success(`已清理 ${failedNodes.length} 个失败项`);
        } catch (error) {
          message.error('清理失败');
        } finally {
          deleting.value = false;
        }
      },
      onClose: () => {
        deleting.value = false;
      }
    });
  } catch (error) {
    deleting.value = false;
  }
};

const clearFilters = () => {
  searchQuery.value = '';
  selectedProtocols.value = [];
  selectedStatuses.value = [];
  latencyFilter.value = '';
  activeView.value = 'all';
  paginationState.value.page = 1;

  // 重置分组选择到"全部"
  activeGroupId.value = 'all';
};

const hasFilters = computed((): boolean => {
  return !!(searchQuery.value ||
         selectedProtocols.value.length > 0 ||
         selectedStatuses.value.length > 0 ||
         latencyFilter.value ||
         activeView.value !== 'all');
});

const toggleSidebar = () => {
  sidebarCollapsed.value = !sidebarCollapsed.value;
};

// 生命周期
let healthCheckInterval: NodeJS.Timeout | null = null;

onMounted(async () => {
  loading.value = true;
  try {
    // 先加载分组数据
    await nodeGroups.fetchGroups();
    // 确保groupStore也有数据
    if (groupStore.groups.length === 0) {
      await groupStore.fetchGroups();
    }

    // 然后加载节点数据
    await Promise.all([
      nodeManagement.fetchNodes(),
      nodeHealth.refreshHealthStatus(),
    ]);

    // 更新分组计数
    nodeGroups.updateGroupCounts();

    // 健康状态数据将在手动检查时更新
    console.log('节点数据加载完成');
  } catch (error) {
    message.error('加载数据失败');
  } finally {
    loading.value = false;
  }
});

// 组件卸载时清理定时器
onUnmounted(() => {
  if (healthCheckInterval) {
    clearInterval(healthCheckInterval);
    healthCheckInterval = null;
  }
});

// 监听节点数据变化，更新分组计数
watch(
  () => nodeManagement.nodes.value,
  (newNodes) => {
    if (newNodes && newNodes.length > 0) {
      nodeGroups.updateGroupCounts();
    }
  },
  { immediate: true, deep: true }
);
</script>

<style scoped>
.nodes-modern-layout {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

/* 主内容区域 */
.layout-content {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 16px;
  backdrop-filter: blur(10px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  padding: 0;
}

.content-container {
  display: grid;
  grid-template-columns: 280px 1fr;
  width: 100%;
  min-height: 600px;
  transition: grid-template-columns 0.3s ease;
}

.content-container.sidebar-collapsed {
  grid-template-columns: 60px 1fr;
}

/* 主内容区域 */
.content-main {
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
  min-width: 0; /* 确保可以收缩 */
  overflow-x: hidden; /* 防止内容溢出 */
}

/* 分组标签 */
.group-tabs-section {
  background: white;
  border-radius: 8px;
  padding: 16px;
  border: 1px solid #e2e8f0;
  margin-bottom: 16px;
  width: 100%;
  box-sizing: border-box;
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .content-container {
    grid-template-columns: 1fr;
  }

  .content-sidebar {
    display: none;
  }

  .content-sidebar.collapsed {
    display: flex;
    position: fixed;
    top: 0;
    left: 0;
    bottom: 0;
    width: 60px;
    background: #f8fafc;
    border-right: 1px solid #e2e8f0;
    z-index: 1000;
    box-shadow: 2px 0 8px rgba(0, 0, 0, 0.1);
  }
}

@media (max-width: 768px) {
  .nodes-modern-layout {
    padding: 12px;
  }

  .content-main {
    padding: 16px;
  }

  .group-tabs-section {
    padding: 8px;
  }
}
</style>