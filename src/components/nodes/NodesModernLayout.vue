<template>
  <div class="nodes-modern-layout">
    <!-- 顶部区域：标题 + 统计 + 操作 -->
    <div class="layout-header">
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
          <!-- 主要操作按钮 -->
          <n-space>
            <n-button type="primary" size="medium" @click="handleAddNode">
              <template #icon><AddIcon /></template>
              添加节点
            </n-button>

            <!-- 更多操作下拉菜单 -->
            <SmartHeaderActions
              :items="headerSmartActions"
              @select="handleHeaderMoreAction"
              placement="bottom-right"
              button-type="default"
              :ghost="false"
              size="medium"
            />
          </n-space>
        </div>
      </div>

      <!-- 统计卡片 -->
      <div class="stats-section">
        <StatsCardGrid
          :stats="nodeStatsCards"
          :columns="4"
          :animated="true"
          :clickable="true"
          size="medium"
          @card-click="handleStatsCardClick"
        />
      </div>
    </div>

    <!-- 主要内容区域 -->
    <div class="layout-content">
      <div class="content-container" :class="{ 'sidebar-collapsed': sidebarCollapsed }">
        <!-- 左侧：搜索和筛选 -->
        <div class="content-sidebar" :class="{ 'collapsed': sidebarCollapsed }">
          <!-- 折叠按钮 -->
          <div class="sidebar-toggle" @click="toggleSidebar">
            <n-icon :component="sidebarCollapsed ? ChevronForwardIcon : ChevronBackIcon" />
          </div>

          <div class="search-panel" v-show="!sidebarCollapsed">
            <div class="panel-header">
              <h3>搜索与筛选</h3>
            </div>

            <div class="panel-content">
              <!-- 搜索框 -->
              <div class="form-group">
                <n-input
                  v-model:value="searchQuery"
                  placeholder="搜索节点名称、服务器地址..."
                  class="search-input"
                  clearable
                >
                  <template #prefix>
                    <n-icon :component="SearchIcon" />
                  </template>
                </n-input>
              </div>

              <!-- 协议筛选 -->
              <div class="form-group">
                <label class="form-label">协议类型</label>
                <div class="protocol-filters">
                  <n-checkbox-group v-model:value="selectedProtocols">
                    <div class="protocol-grid">
                      <n-checkbox
                        v-for="protocol in protocolOptions"
                        :key="protocol.value"
                        :value="protocol.value"
                        class="protocol-checkbox"
                      >
                        <span class="protocol-label">{{ protocol.label }}</span>
                      </n-checkbox>
                    </div>
                  </n-checkbox-group>
                </div>
              </div>

              <!-- 状态筛选 -->
              <div class="form-group">
                <label class="form-label">节点状态</label>
                <div class="status-filters">
                  <n-checkbox-group v-model:value="selectedStatuses">
                    <div class="status-grid">
                      <n-checkbox
                        v-for="status in statusListOptions"
                        :key="status.value"
                        :value="status.value"
                        class="status-checkbox"
                      >
                        <span class="status-label">{{ status.label }}</span>
                      </n-checkbox>
                    </div>
                  </n-checkbox-group>
                </div>
              </div>

              <!-- 延迟筛选 -->
              <div class="form-group">
                <label class="form-label">延迟范围</label>
                <n-select
                  v-model:value="latencyFilter"
                  placeholder="选择延迟范围"
                  :options="latencyOptions"
                  clearable
                />
              </div>

              <!-- 清除筛选 -->
              <div class="form-group">
                <n-button block @click="clearFilters" :disabled="!hasFilters">
                  清除所有筛选
                </n-button>
              </div>
            </div>
          </div>

          <!-- 折叠状态下的快速筛选按钮 -->
          <div class="collapsed-filters" v-if="sidebarCollapsed">
            <n-tooltip placement="right" v-for="option in quickFilterOptions" :key="option.key">
              <template #trigger>
                <div
                  class="quick-filter-btn"
                  :class="{ active: option.active }"
                  @click="option.action"
                >
                  <n-icon :component="option.icon" />
                </div>
              </template>
              {{ option.label }}
            </n-tooltip>
          </div>
        </div>

        <!-- 中间：主内容区域 -->
        <div class="content-main">
          <!-- 智能操作栏 -->
          <div class="smart-bar" v-if="smartActions.length > 0">
            <div class="smart-bar-content">
              <div class="smart-bar-info">
                <n-icon :component="BulbIcon" class="smart-icon" />
                <span class="smart-text">智能推荐操作</span>
              </div>
              <div class="smart-bar-actions">
                <n-space>
                  <n-button
                    v-for="action in smartActions"
                    :key="action.key"
                    :type="action.type"
                    size="small"
                    @click="handleSmartAction(action)"
                    :loading="action.loading"
                  >
                    <template #icon v-if="action.icon">
                      <n-icon :component="action.icon" />
                    </template>
                    {{ action.label }}
                  </n-button>
                </n-space>
              </div>
            </div>
          </div>

          <!-- 分组标签页 -->
          <div class="group-tabs-section">
            <SmartGroupTabs
              :groups="smartGroups"
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
          <div v-if="selectedNodes.length > 0" class="selection-bar">
            <div class="selection-left">
              <div class="selection-info">
                <n-icon :component="CheckCircleIcon" class="selection-icon" />
                <span class="selection-text">
                  已选择 <strong>{{ selectedNodes.length }}</strong> 个节点
                </span>
              </div>
              <div class="selection-summary" v-if="selectedNodesSummary.total > 0">
                <n-space size="small">
                  <n-tag size="small" type="success">
                    在线 {{ selectedNodesSummary.online }}
                  </n-tag>
                  <n-tag size="small" type="error">
                    离线 {{ selectedNodesSummary.offline }}
                  </n-tag>
                  <n-tag size="small" type="warning">
                    错误 {{ selectedNodesSummary.error }}
                  </n-tag>
                  <n-tag size="small" type="default">
                    未测试 {{ selectedNodesSummary.pending }}
                  </n-tag>
                </n-space>
              </div>
            </div>
            <div class="selection-right">
              <n-space size="small">
                <!-- 智能测试按钮 -->
              <PerfectDropdown
                :items="testDropdownOptions"
                @select="handleTestAction"
                placement="bottom-right"
                title="智能测试"
                class="smart-test-dropdown"
              >
                <template #trigger>
                  <n-button type="primary" :loading="testingSelected" class="smart-test-btn">
                    <template #icon><FlashIcon /></template>
                    智能测试
                  </n-button>
                </template>
              </PerfectDropdown>

                <!-- 快速操作 -->
                <n-divider vertical style="height: 20px; margin: 0 8px;" />

                <!-- 移动分组 -->
                <n-button @click="showBatchMoveModal = true" type="default" class="smart-action-btn">
                  <template #icon><FolderIcon /></template>
                  移动分组
                </n-button>

                <!-- 导出 -->
              <PerfectDropdown
                :items="exportDropdownOptions"
                @select="handleExportAction"
                placement="bottom-right"
                title="导出设置"
                class="smart-export-dropdown"
              >
                <template #trigger>
                  <n-button type="info" class="smart-export-btn">
                    <template #icon><DownloadIcon /></template>
                    导出
                  </n-button>
                </template>
              </PerfectDropdown>

                <!-- 更多操作 -->
              <PerfectDropdown
                :items="moreDropdownOptions"
                @select="handleMoreAction"
                placement="bottom-right"
                title="更多操作"
                class="smart-more-dropdown"
              >
                <template #trigger>
                  <n-button type="default" class="smart-more-btn">
                    <template #icon><MoreIcon /></template>
                    更多
                  </n-button>
                </template>
              </PerfectDropdown>
              </n-space>
            </div>
          </div>

          <!-- 表格区域 -->
          <div class="table-section">
  
            <!-- 数据表格 - 无内置分页 -->
            <n-data-table
              :key="paginationKey"
              :columns="tableColumns"
              :data="paginatedNodes"
              :loading="loading"
              :pagination="false"
              :row-key="(row: any) => row.id"
              :checked-row-keys="selectedNodes"
              :scroll-x="1400"
              flex-height
              style="height: 550px"
              @update:checked-row-keys="handleSelectionChange"
            />

            <!-- 自定义分页 - 在表格下方 -->
            <div class="custom-pagination" v-if="paginationInfo">
              <n-pagination
                v-model:page="paginationState.page"
                v-model:page-size="paginationState.pageSize"
                :item-count="paginationInfo.itemCount"
                :page-sizes="paginationInfo.pageSizes"
                show-size-picker
                show-quick-jumper
                @update:page="handlePageChange"
                @update:page-size="handlePageSizeChange"
              />
            </div>
          </div>
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
      @close-modal="nodeManagement.closeModal"
      @save-node="nodeManagement.handleSaveNode"
      @batch-import="nodeManagement.handleBatchImport"
      @save-group="handleSaveGroup"
      @save-move-to-group="handleSaveMoveToGroup"
      @update:node-form-state="(value) => nodeManagement.nodeFormState = value"
      @update:add-link="(value) => nodeManagement.addLink = value"
      @update:import-preview="(value) => nodeManagement.importPreview = value"
      @update:import-group-id="(value) => nodeManagement.importGroupId = value"
      @update:editing-group-name="(value) => nodeManagement.editingGroupName = value"
      @update:new-group-name="(value) => nodeManagement.newGroupName = value"
      @update:move-to-group-id="(value) => nodeManagement.moveToGroupId = value"
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
import { ref, computed, onMounted, onUnmounted, watch, h } from 'vue';
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
import StatsCardGrid from '../common/StatsCardGrid.vue';
import LatencyIndicator from '../common/LatencyIndicator.vue';
import ProtocolTag from '../common/ProtocolTag.vue';
import StatusBadge from '../common/StatusBadge.vue';
import SmartGroupTabs from '../common/SmartGroupTabs.vue';
import PerfectDropdown from '../PerfectDropdown.vue';
import NodeModal from '@/views/components/NodeModal.vue';
import ImportModal from '@/views/components/ImportModal.vue';
import BatchMoveModal from '@/views/components/BatchMoveModal.vue';
// 导入NodeFormAndImport组件以获得模态框系统
import NodeFormAndImport from './components/NodeFormAndImport.vue';
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

// 计算属性：统计数据 - StatsCardGrid格式
const nodeStatsCards = computed(() => [
  {
    key: 'all',
    label: '全部节点',
    value: nodeStats.value.totalCount,
    icon: NodesIcon,
    type: 'primary' as const,
    tooltip: '点击查看全部节点',
    onClick: () => handleViewChange('all')
  },
  {
    key: 'online',
    label: '在线节点',
    value: nodeStats.value.onlineCount,
    icon: CheckCircleIcon,
    type: 'success' as const,
    tooltip: '点击查看在线节点',
    onClick: () => handleViewChange('online')
  },
  {
    key: 'offline',
    label: '离线节点',
    value: nodeStats.value.offlineCount,
    icon: CloseCircleIcon,
    type: 'warning' as const,
    tooltip: '点击查看离线节点',
    onClick: () => handleViewChange('offline')
  },
  {
    key: 'error',
    label: '异常节点',
    value: nodeStats.value.errorCount,
    icon: WarningIcon,
    type: 'error' as const,
    tooltip: '点击查看异常节点',
    onClick: () => handleViewChange('error')
  }
]);

// 计算属性：统计数据
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

// 分组数据 - 直接使用groupStore的数据
const groups = computed(() => {
  return groupStore.groups || [];
});

// 转换为SmartGroupTabs的GroupItem格式
const smartGroups = computed(() => {
  return groups.value.map(group => ({
    id: group.id,
    name: group.name,
    description: group.description || undefined,
    is_enabled: group.is_enabled,
    disabled: !group.is_enabled
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

// 筛选选项
const protocolOptions = computed(() => {
  const protocols = Array.from(new Set(nodeManagement.nodes.value.map(n => n.protocol).filter(Boolean)));
  return protocols.map(protocol => ({
    label: protocol.toUpperCase(),
    value: protocol
  }));
});

const statusListOptions = [
  { label: '在线', value: 'online' },
  { label: '离线', value: 'offline' },
  { label: '测试中', value: 'testing' },
  { label: '未测试', value: 'pending' }
];

const latencyOptions = [
  { label: '优秀 (< 100ms)', value: 'excellent' },
  { label: '良好 (100-300ms)', value: 'good' },
  { label: '一般 (300-1000ms)', value: 'medium' },
  { label: '较差 (> 1000ms)', value: 'poor' },
];

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
    key: 'divider-1'
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
    { type: 'divider' as const, key: 'divider-1' },
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
    active: hasFilters.value && activeView.value === 'all',
    action: () => {
      // 切换侧边栏展开状态以便进行详细筛选
      sidebarCollapsed.value = false;
    }
  }
]);

// 强制响应式更新
const paginationKey = computed(() => {
  return `${nodeManagement.nodes.value?.length || 0}-${filteredNodes.value.length}-${paginationState.value.page}-${paginationState.value.pageSize}`;
});

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

  if (nodeStats.value.errorCount > 0) {
    actions.push({
      key: 'clear-errors',
      label: `清理失败项 (${nodeStats.value.errorCount})`,
      type: 'warning' as const,
      icon: TrashIcon,
      action: () => clearFailedNodes(),
      loading: false
    });
  }

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

// 渲染智能测试下拉菜单标签
const renderTestDropdownLabel = (option: any) => {
  const getIconAndColor = () => {
    switch (option.key) {
      case 'test-offline':
        return { icon: '🔥', color: '#fa8c16' };
      case 'retry-errors':
        return { icon: '🔄', color: '#722ed1' };
      case 'retest-online':
        return { icon: '✨', color: '#1890ff' };
      default:
        return { icon: '⚡', color: '#fa8c16' };
    }
  };

  const { icon, color } = getIconAndColor();

  return h('div', {
    style: `
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 12px;
      cursor: pointer;
      background: white;
      color: #333;
      font-size: 14px;
      font-weight: 500;
      border: none;
      outline: none;
      width: 100%;
      text-align: left;
      box-sizing: border-box;
      margin: 0;
      border-radius: 0;
      line-height: 1.4;
      transition: background-color 0.2s ease;
    `,
    onMouseenter: (e: MouseEvent) => {
      const target = e.currentTarget as HTMLElement;
      target.style.backgroundColor = `${color}15`;
    },
    onMouseleave: (e: MouseEvent) => {
      const target = e.currentTarget as HTMLElement;
      target.style.backgroundColor = 'white';
    }
  }, [
    h('span', {
      style: `
        color: ${color};
        font-size: 16px;
        flex-shrink: 0;
        display: inline-block;
        width: 16px;
        text-align: center;
        margin-right: 2px;
      `
    }, icon),
    option.label
  ]);
};

// 渲染导出下拉菜单标签
const renderExportDropdownLabel = (option: any) => {
  const getIconAndColor = () => {
    switch (option.key) {
      case 'export-json':
        return { icon: '📄', color: '#52c41a' };
      case 'export-subscription':
        return { icon: '🔗', color: '#1890ff' };
      case 'export-config':
        return { icon: '⚙️', color: '#722ed1' };
      default:
        return { icon: '📥', color: '#52c41a' };
    }
  };

  const { icon, color } = getIconAndColor();

  return h('div', {
    style: `
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 12px;
      cursor: pointer;
      background: white;
      color: #333;
      font-size: 14px;
      font-weight: 500;
      border: none;
      outline: none;
      width: 100%;
      text-align: left;
      box-sizing: border-box;
      margin: 0;
      border-radius: 0;
      line-height: 1.4;
      transition: background-color 0.2s ease;
    `,
    onMouseenter: (e: MouseEvent) => {
      const target = e.currentTarget as HTMLElement;
      target.style.backgroundColor = `${color}15`;
    },
    onMouseleave: (e: MouseEvent) => {
      const target = e.currentTarget as HTMLElement;
      target.style.backgroundColor = 'white';
    }
  }, [
    h('span', {
      style: `
        color: ${color};
        font-size: 16px;
        flex-shrink: 0;
        display: inline-block;
        width: 16px;
        text-align: center;
        margin-right: 2px;
      `
    }, icon),
    option.label
  ]);
};

// 渲染更多操作下拉菜单标签
const renderMoreDropdownLabel = (option: any) => {
  const getIconAndColor = () => {
    switch (option.key) {
      case 'move-to-new-group':
        return { icon: '📁', color: '#1890ff', bg: '#f0f9ff' };
      case 'clear-failures':
        return { icon: '🧹', color: '#faad14', bg: '#fff7e6' };
      case 'copy-links':
        return { icon: '📋', color: '#52c41a', bg: '#f6ffed' };
      case 'delete-selected':
        return { icon: '🗑️', color: '#ff4d4f', bg: '#fff2f0' };
      default:
        return { icon: '⚙️', color: '#666666', bg: '#fafafa' };
    }
  };

  const { icon, color } = getIconAndColor();

  return h('div', {
    style: `
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 12px;
      cursor: pointer;
      background: white;
      color: #333;
      font-size: 14px;
      font-weight: 500;
      border: none;
      outline: none;
      width: 100%;
      text-align: left;
      box-sizing: border-box;
      margin: 0;
      border-radius: 0;
      line-height: 1.4;
      transition: background-color 0.2s ease;
    `,
    onMouseenter: (e: MouseEvent) => {
      const target = e.currentTarget as HTMLElement;
      target.style.backgroundColor = `${color}15`;
    },
    onMouseleave: (e: MouseEvent) => {
      const target = e.currentTarget as HTMLElement;
      target.style.backgroundColor = 'white';
    }
  }, [
    h('span', {
      style: `
        color: ${color};
        font-size: 16px;
        flex-shrink: 0;
        display: inline-block;
        width: 16px;
        text-align: center;
        margin-right: 2px;
      `
    }, icon),
    option.label
  ]);
};
const tableColumns = computed(() => [
  { type: 'selection', fixed: 'left' as const },
  {
    title: '节点名称',
    key: 'name',
    width: 200,
    fixed: 'left' as const,
    ellipsis: { tooltip: true },
    render: (row: any) => {
      return h('span', {
        style: `
          color: #1890ff;
          cursor: pointer;
          font-weight: 500;
          transition: color 0.2s ease;
        `,
        onClick: () => editNode(row),
        onMouseenter: (e: MouseEvent) => {
          const target = e.currentTarget as HTMLElement;
          target.style.color = '#40a9ff';
          target.style.textDecoration = 'underline';
        },
        onMouseleave: (e: MouseEvent) => {
          const target = e.currentTarget as HTMLElement;
          target.style.color = '#1890ff';
          target.style.textDecoration = 'none';
        }
      }, row.name);
    }
  },
  {
    title: '协议',
    key: 'protocol',
    width: 100,
    render: (row: any) => {
      const protocol = row.protocol?.toLowerCase() || 'unknown';

      if (protocol === 'unknown') {
        return h('span', { style: 'color: #999; font-size: 12px;' }, '未知');
      }

      return h(ProtocolTag, {
        protocol: protocol,
        size: 'small',
        variant: 'colorful',
        showIcon: true,
        round: true,
        colorScheme: 'default',
        uppercase: true
      });
    }
  },
  { title: '服务器', key: 'server', width: 150, ellipsis: { tooltip: true } },
  { title: '端口', key: 'port', width: 80 },
  {
    title: '状态',
    key: 'status',
    width: 100,
    render: (row: any) => {
      const healthStatus = nodeHealth.getNodeHealthStatus(row);

      // 映射健康状态到StatusBadge的状态
      let badgeStatus: 'online' | 'offline' | 'testing' | 'error' | 'warning' | 'unknown' = 'unknown';

      switch (healthStatus.status) {
        case 'online':
          badgeStatus = 'online';
          break;
        case 'offline':
          badgeStatus = 'offline';
          break;
        case 'testing':
          badgeStatus = 'testing';
          break;
        case 'error':
          badgeStatus = 'error';
          break;
        case 'pending':
          badgeStatus = 'unknown';
          break;
        default:
          badgeStatus = 'unknown';
      }

      return h(StatusBadge, {
        status: badgeStatus,
        size: 'small',
        variant: 'default',
        showIcon: true,
        showIndicator: false,
        bordered: true,
        round: false,
        colorScheme: 'default',
        pulse: healthStatus.status === 'testing',
        glow: false,
        tooltip: `节点状态: ${nodeHealth.getStatusText(healthStatus.status)}`,
        tooltipDescription: `最后检查: ${(healthStatus as any).lastChecked ? new Date((healthStatus as any).lastChecked).toLocaleString() : '从未检查'}`,
        tooltipPlacement: 'top'
      });
    }
  },
  {
    title: '延迟',
    key: 'latency',
    width: 100,
    render: (row: any) => {
      const healthStatus = nodeHealth.getNodeHealthStatus(row);

      let latency: number | null = null;

      if (healthStatus.status === 'testing') {
        latency = -1; // 使用负数表示测试中
      } else if (healthStatus.status === 'pending' || !healthStatus.latency) {
        latency = null; // 使用null表示未测试
      } else if (healthStatus.latency === 0 || healthStatus.latency === -1) {
        latency = -2; // 使用特殊负数表示超时
      } else {
        latency = healthStatus.latency;
      }

      return h(LatencyIndicator, {
        latency: latency,
        size: 'small',
        showIcon: true,
        showUnit: true,
        colorScheme: 'network',
        thresholds: { good: 100, medium: 300, poor: 500 },
        loadingLabel: '测试中',
        unknownLabel: '未测试'
      });
    }
  },
  {
    title: '分组',
    key: 'group',
    width: 120,
    render: (row: any) => {
      if (!row.group_id) {
        return h('span', {
          style: 'color: #999; font-size: 12px; padding: 2px 6px; background: #f5f5f5; border-radius: 4px;'
        }, '未分组');
      }

      const group = groups.value.find(g => g.id === row.group_id);
      const groupName = group?.name || '未知分组';

      return h('span', {
        style: `
          color: #1890ff;
          font-size: 12px;
          padding: 2px 6px;
          background: #f0f9ff;
          border: 1px solid #91d5ff;
          border-radius: 4px;
          font-weight: 500;
        `
      }, groupName);
    }
  },
  {
    title: '创建时间',
    key: 'created_at',
    width: 150,
    render: (row: any) => {
      return new Date(row.created_at).toLocaleDateString();
    }
  }
]);

// 事件处理方法
// 处理统计卡片点击
const handleStatsCardClick = (stat: any, index: number) => {
  // 调用卡片中定义的onClick方法
  if (stat.onClick) {
    stat.onClick();
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

    // 测试开始后定期刷新状态
    const refreshInterval = setInterval(() => {
      nodeHealth.refreshHealthStatus();
    }, 2000);

    // 10秒后停止刷新
    setTimeout(() => {
      clearInterval(refreshInterval);
    }, 10000);
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

    // 测试开始后定期刷新状态
    const refreshInterval = setInterval(() => {
      nodeHealth.refreshHealthStatus();
    }, 2000);

    // 15秒后停止刷新（批量测试可能需要更长时间）
    setTimeout(() => {
      clearInterval(refreshInterval);
    }, 15000);
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
  if (selectedNodes.value.length === 0) {
    message.warning('没有选中的节点可以删除');
    return;
  }

  dialog.warning({
    title: '确认批量删除',
    content: `确定要删除选中的 ${selectedNodes.value.length} 个节点吗？此操作不可撤销。`,
    positiveText: '删除',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        await nodeManagement.batchDeleteNodes(selectedNodes.value);
        message.success(`已删除 ${selectedNodes.value.length} 个节点`);
        selectedNodes.value = [];
      } catch (error) {
        message.error('批量删除失败');
      }
    },
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
  try {
    // 找到所有失败的节点
    const failedNodes = nodeManagement.nodes.value.filter(node => {
      const healthStatus = nodeHealth.getNodeHealthStatus(node);
      return healthStatus.status === 'error';
    });

    if (failedNodes.length > 0) {
      await nodeManagement.batchDeleteNodes(failedNodes.map(n => n.id));
      message.success(`已清理 ${failedNodes.length} 个失败项`);
    } else {
      message.info('没有失败的节点需要清理');
    }
  } catch (error) {
    message.error('清理失败');
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

const hasFilters = computed(() => {
  return searchQuery.value ||
         selectedProtocols.value.length > 0 ||
         selectedStatuses.value.length > 0 ||
         latencyFilter.value ||
         activeView.value !== 'all';
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

    // 启动定时刷新健康状态（每30秒）
    healthCheckInterval = setInterval(() => {
      nodeHealth.refreshHealthStatus();
    }, 30000);
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

/* 顶部区域 */
.layout-header {
  margin-bottom: 24px;
}

.header-main {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.page-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.page-title {
  margin: 0;
  font-size: 28px;
  font-weight: 700;
  color: white;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.page-breadcrumb {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.8);
}

.breadcrumb-separator {
  color: rgba(255, 255, 255, 0.6);
}

.breadcrumb-item.active {
  color: white;
  font-weight: 500;
}

/* 统计卡片 */
.stats-section {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 16px;
  padding: 24px;
  backdrop-filter: blur(10px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  background: #f8fafc;
  border: 2px solid transparent;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.stat-card:hover {
  border-color: #667eea;
  background: white;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.1);
  transform: translateY(-2px);
}

.stat-card.active {
  border-color: #667eea;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.stat-icon {
  font-size: 24px;
  color: #667eea;
  opacity: 0.8;
}

.stat-card.active .stat-icon {
  color: white;
  opacity: 1;
}

.stat-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-number {
  font-size: 24px;
  font-weight: 700;
  line-height: 1;
}

.stat-label {
  font-size: 14px;
  opacity: 0.8;
}

.stat-card.active .stat-label {
  color: rgba(255, 255, 255, 0.9);
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

/* 侧边栏 */
.content-sidebar {
  background: #f8fafc;
  border-right: 1px solid #e2e8f0;
  padding: 24px;
  position: relative;
  transition: all 0.3s ease;
  overflow: hidden;
}

.content-sidebar.collapsed {
  padding: 12px 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

/* 折叠按钮 */
.sidebar-toggle {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  z-index: 10;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.sidebar-toggle:hover {
  background: #f1f5f9;
  border-color: #cbd5e1;
  transform: scale(1.05);
}

.content-sidebar.collapsed .sidebar-toggle {
  position: relative;
  top: auto;
  right: auto;
  margin-bottom: 8px;
}

/* 折叠状态下的快速筛选按钮 */
.collapsed-filters {
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: center;
  width: 100%;
}

.quick-filter-btn {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  color: #64748b;
  font-size: 18px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.quick-filter-btn:hover {
  background: #f8fafc;
  border-color: #cbd5e1;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.quick-filter-btn.active {
  background: #3b82f6;
  border-color: #3b82f6;
  color: white;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.quick-filter-btn.active:hover {
  background: #2563eb;
  border-color: #2563eb;
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(59, 130, 246, 0.4);
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

.search-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.panel-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
}

.panel-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-label {
  font-size: 14px;
  font-weight: 500;
  color: #475569;
}

.search-input {
  width: 100%;
}

.protocol-filters,
.status-filters {
  width: 100%;
  overflow: visible;
}

.protocol-grid,
.status-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  gap: 8px 12px;
  align-items: start;
  width: 100%;
}

.protocol-checkbox,
.status-checkbox {
  margin: 0;
  width: 100%;
  min-width: 0;
}

.protocol-checkbox :deep(.n-checkbox__label),
.status-checkbox :deep(.n-checkbox__label) {
  width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 12px;
  line-height: 1.2;
}

.protocol-label,
.status-label {
  font-size: 12px;
  font-weight: 500;
  color: #475569;
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 针对较多协议项的优化 */
.protocol-grid {
  grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
  gap: 6px 8px;
}

/* 当协议数量很多时，使用更紧凑的布局 */
@media (max-height: 800px) {
  .protocol-grid {
    grid-template-columns: repeat(auto-fit, minmax(70px, 1fr));
    gap: 4px 6px;
  }

  .protocol-label,
  .status-label {
    font-size: 11px;
  }
}

/* 侧边栏折叠状态下的响应式优化 */
@media (max-width: 768px) {
  .protocol-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .status-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 480px) {
  .protocol-grid {
    grid-template-columns: 1fr;
    gap: 4px;
  }

  .status-grid {
    grid-template-columns: 1fr;
    gap: 4px;
  }

  .protocol-label,
  .status-label {
    font-size: 11px;
  }
}

/* 折叠状态下侧边栏的优化 */
.content-sidebar.collapsed .form-group {
  display: none;
}

.content-sidebar.collapsed .sidebar-toggle {
  display: flex;
}

.content-sidebar.collapsed .collapsed-filters {
  display: flex;
}

/* 主内容 */
.content-main {
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* 智能操作栏 */
.smart-bar {
  background: linear-gradient(135deg, #fff7e6 0%, #fef9e7 100%);
  border: 1px solid #ffd591;
  border-radius: 12px;
  padding: 16px 20px;
  color: #d46b08;
  box-shadow: 0 4px 12px rgba(212, 107, 8, 0.1);
  position: relative;
  overflow: hidden;
}

.smart-bar::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, #faad14, #ffc53d, #ffd666);
}

.smart-bar-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.smart-bar-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.smart-icon {
  font-size: 20px;
  color: #fa8c16;
}

.smart-text {
  font-weight: 700;
  font-size: 14px;
  color: #d46b08;
}

.smart-bar-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.smart-bar-actions :deep(.n-button) {
  border-radius: 8px;
  font-weight: 600;
  box-shadow: 0 2px 6px rgba(212, 107, 8, 0.2);
  transition: all 0.3s ease;
  border: 1.5px solid transparent;
}

.smart-bar-actions :deep(.n-button:hover) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(212, 107, 8, 0.3);
}

.smart-bar-actions :deep(.n-button--warning) {
  background: linear-gradient(135deg, #fa8c16 0%, #faad14 100%);
  border-color: #faad14;
  color: white;
}

.smart-bar-actions :deep(.n-button--warning:hover) {
  background: linear-gradient(135deg, #d46b08 0%, #fa8c16 100%);
  box-shadow: 0 4px 12px rgba(212, 107, 8, 0.4);
}

.smart-bar-actions :deep(.n-button--success) {
  background: linear-gradient(135deg, #52c41a 0%, #73d13d 100%);
  border-color: #73d13d;
  color: white;
}

.smart-bar-actions :deep(.n-button--success:hover) {
  background: linear-gradient(135deg, #389e0d 0%, #52c41a 100%);
  box-shadow: 0 4px 12px rgba(82, 196, 26, 0.4);
}

.smart-bar-actions :deep(.n-button--error) {
  background: linear-gradient(135deg, #ff4d4f 0%, #ff7875 100%);
  border-color: #ff7875;
  color: white;
}

.smart-bar-actions :deep(.n-button--error:hover) {
  background: linear-gradient(135deg, #cf1322 0%, #ff4d4f 100%);
  box-shadow: 0 4px 12px rgba(255, 77, 79, 0.4);
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

.group-tabs {
  width: 100%;
}

.group-tabs :deep(.n-tabs) {
  width: 100%;
}

.group-tabs :deep(.n-tabs-nav) {
  margin-bottom: 0;
  display: flex;
  flex-wrap: wrap;
  width: 100%;
  gap: 4px;
}

.group-tabs :deep(.n-tabs-tab-wrapper) {
  display: flex;
  flex-wrap: wrap;
  width: 100%;
  gap: 4px;
}

.group-tabs :deep(.n-tabs-tab) {
  flex: 1 1 calc(16.66% - 4px); /* 6个标签，每个占约1/6宽度 */
  min-width: 120px;
  padding: 8px 12px;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  cursor: pointer;
}

/* 分组标签内部元素样式 */
.group-tab-wrapper {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  gap: 8px;
  font-size: 14px;
}

.group-actions-button {
  opacity: 1 !important;
  transition: all 0.2s;
  background-color: transparent;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  padding: 2px;
  min-width: 24px;
  height: 24px;
  flex-shrink: 0;
}

.group-actions-button:hover {
  background-color: #f5f5f5 !important;
  border-color: #d0d0d0;
}

.group-tabs :deep(.n-tabs-tab:hover) {
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.group-tabs :deep(.n-tabs-tab--active) {
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(32, 128, 240, 0.2);
}

/* 响应式调整 */
@media (max-width: 1200px) {
  .group-tabs :deep(.n-tabs-tab) {
    flex: 1 1 calc(20% - 4px); /* 5个标签时每行占20% */
    min-width: 90px;
    font-size: 11px;
    padding: 6px 8px;
  }
}

@media (max-width: 768px) {
  .group-tabs :deep(.n-tabs-tab) {
    flex: 1 1 calc(33.33% - 3px); /* 3个标签时每行占33% */
    min-width: 80px;
    font-size: 10px;
    padding: 4px 6px;
  }

  .group-tabs-section {
    padding: 8px;
  }
}

@media (max-width: 480px) {
  .group-tabs :deep(.n-tabs-tab) {
    flex: 1 1 calc(50% - 2px); /* 2个标签时每行占50% */
    min-width: 70px;
    font-size: 9px;
    padding: 3px 4px;
  }
}

/* 选中节点操作栏 */
.selection-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background: linear-gradient(135deg, #e6f7ff 0%, #f0f9ff 100%);
  border: 1px solid #91d5ff;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(24, 144, 255, 0.1);
  position: relative;
  /* 移除 overflow: hidden 让下拉菜单能显示出来 */
  /* overflow: hidden; */
}

.selection-bar::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, #1890ff, #40a9ff, #69c0ff);
}

.selection-left {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.selection-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.selection-icon {
  color: #1890ff;
  font-size: 18px;
}

.selection-text {
  font-size: 14px;
  color: #1e40af;
  font-weight: 500;
}

.selection-text strong {
  color: #1890ff;
  font-weight: 700;
}

.selection-summary {
  display: flex;
  align-items: center;
}

.selection-summary :deep(.n-tag) {
  font-weight: 600;
  border-radius: 6px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;
}

.selection-summary :deep(.n-tag:hover) {
  transform: translateY(-1px);
  box-shadow: 0 3px 6px rgba(0, 0, 0, 0.15);
}

.selection-right {
  display: flex;
  align-items: center;
}

.selection-right :deep(.n-button) {
  border-radius: 8px;
  font-weight: 600;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  border: 1.5px solid transparent;
}

.selection-right :deep(.n-button:hover) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.selection-right :deep(.n-button--primary) {
  background: linear-gradient(135deg, #1890ff 0%, #40a9ff 100%);
  border-color: #40a9ff;
}

.selection-right :deep(.n-button--primary:hover) {
  background: linear-gradient(135deg, #096dd9 0%, #1890ff 100%);
  box-shadow: 0 4px 12px rgba(24, 144, 255, 0.3);
}

.selection-right :deep(.n-button--info) {
  background: linear-gradient(135deg, #13c2c2 0%, #36cfc9 100%);
  border-color: #36cfc9;
}

.selection-right :deep(.n-button--info:hover) {
  background: linear-gradient(135deg, #08979c 0%, #13c2c2 100%);
  box-shadow: 0 4px 12px rgba(19, 194, 194, 0.3);
}

.selection-right :deep(.n-button--default) {
  background: linear-gradient(135deg, #ffffff 0%, #fafafa 100%);
  border-color: #d9d9d9;
  color: #595959;
}

.selection-right :deep(.n-button--default:hover) {
  background: linear-gradient(135deg, #fafafa 0%, #ffffff 100%);
  border-color: #1890ff;
  color: #1890ff;
}

.selection-right :deep(.n-dropdown) {
  border-radius: 8px;
}

.selection-right :deep(.n-divider.n-divider--vertical) {
  background: linear-gradient(180deg, transparent, #1890ff, transparent);
  width: 2px;
  margin: 0 12px;
}

/* 表格区域 */
.table-section {
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

/* 自定义分页 */
.custom-pagination {
  padding: 16px;
  border-top: 1px solid #f0f0f0;
  background: #fafafa;
  display: flex;
  justify-content: center;
}

/* 智能感知区域按钮样式 */
.smart-test-btn,
.smart-export-btn,
.smart-more-btn,
.smart-action-btn {
  cursor: pointer !important;
  border-radius: 8px !important;
  font-weight: 600 !important;
  font-size: 13px !important;
  padding: 8px 16px !important;
  height: 36px !important;
  min-width: 90px !important;
  transition: all 0.2s ease !important;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1) !important;
}

.smart-test-btn {
  background: linear-gradient(135deg, #fa8c16 0%, #ff9c6f 100%) !important;
  border: 1px solid #fa8c16 !important;
  color: #ffffff !important;
}

.smart-test-btn:hover {
  background: linear-gradient(135deg, #d46b08 0%, #fa8c16 100%) !important;
  border-color: #d46b08 !important;
  transform: translateY(-1px) !important;
  box-shadow: 0 4px 8px rgba(250, 140, 6, 0.3) !important;
}

.smart-export-btn {
  background: linear-gradient(135deg, #52c41a 0%, #73d13d 100%) !important;
  border: 1px solid #52c41a !important;
  color: #ffffff !important;
}

.smart-export-btn:hover {
  background: linear-gradient(135deg, #389e0d 0%, #52c41a 100%) !important;
  border-color: #389e0d !important;
  transform: translateY(-1px) !important;
  box-shadow: 0 4px 8px rgba(82, 196, 26, 0.3) !important;
}

.smart-more-btn {
  background: linear-gradient(135deg, #8c8c8c 0%, #bfbfbf 100%) !important;
  border: 1px solid #8c8c8c !important;
  color: #ffffff !important;
}

.smart-more-btn:hover {
  background: linear-gradient(135deg, #666666 0%, #8c8c8c 100%) !important;
  border-color: #666666 !important;
  transform: translateY(-1px) !important;
  box-shadow: 0 4px 8px rgba(102, 102, 102, 0.3) !important;
}

.smart-action-btn {
  background: linear-gradient(135deg, #1890ff 0%, #40a9ff 100%) !important;
  border: 1px solid #1890ff !important;
  color: #ffffff !important;
}

.smart-action-btn:hover {
  background: linear-gradient(135deg, #096dd9 0%, #1890ff 100%) !important;
  border-color: #096dd9 !important;
  transform: translateY(-1px) !important;
  box-shadow: 0 4px 8px rgba(24, 144, 255, 0.3) !important;
}

/* 智能感知下拉菜单样式 - 参照顶部折叠菜单 */
.smart-test-dropdown :deep(.n-dropdown-menu),
.smart-export-dropdown :deep(.n-dropdown-menu),
.smart-more-dropdown :deep(.n-dropdown-menu) {
  border-radius: 8px !important;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12) !important;
  border: 1px solid #e2e8f0 !important;
  background: #ffffff !important;
  padding: 0 !important;
  min-width: 160px !important;
  max-width: 200px !important;
  margin: 0 !important;
  overflow: hidden !important;
}

.smart-test-dropdown :deep(.n-dropdown-menu-body),
.smart-export-dropdown :deep(.n-dropdown-menu-body),
.smart-more-dropdown :deep(.n-dropdown-menu-body),
.smart-test-dropdown :deep(.n-dropdown-menu-content),
.smart-export-dropdown :deep(.n-dropdown-menu-content),
.smart-more-dropdown :deep(.n-dropdown-menu-content) {
  padding: 0 !important;
  margin: 0 !important;
}

.smart-test-dropdown :deep(.n-dropdown-menu-item),
.smart-export-dropdown :deep(.n-dropdown-menu-item),
.smart-more-dropdown :deep(.n-dropdown-menu-item) {
  margin: 0 !important;
  padding: 0 !important;
  background: transparent !important;
  border: none !important;
  outline: none !important;
  width: 100% !important;
  display: block !important;
  position: static !important;
}

.smart-test-dropdown :deep(.n-dropdown-menu-item:hover),
.smart-export-dropdown :deep(.n-dropdown-menu-item:hover),
.smart-more-dropdown :deep(.n-dropdown-menu-item:hover) {
  background: transparent !important;
}

.smart-test-dropdown :deep(.n-dropdown-menu-item.n-dropdown-menu-item--selected),
.smart-export-dropdown :deep(.n-dropdown-menu-item.n-dropdown-menu-item--selected),
.smart-more-dropdown :deep(.n-dropdown-menu-item.n-dropdown-menu-item--selected) {
  background: #f8fafc !important;
}

.smart-test-dropdown :deep(.n-dropdown-menu-item-content),
.smart-export-dropdown :deep(.n-dropdown-menu-item-content),
.smart-more-dropdown :deep(.n-dropdown-menu-item-content) {
  padding: 0 !important;
  margin: 0 !important;
  width: 100% !important;
  display: block !important;
  position: static !important;
  background: transparent !important;
}

.smart-test-dropdown :deep(.n-dropdown-divider),
.smart-export-dropdown :deep(.n-dropdown-divider),
.smart-more-dropdown :deep(.n-dropdown-divider) {
  margin: 0 !important;
  border-color: #e2e8f0 !important;
  height: 1px !important;
  padding: 0 !important;
}

/* 添加脉动动画 */
@keyframes pulse {
  0% {
    box-shadow: 0 4px 12px rgba(255, 77, 79, 0.3), 0 0 0 0 rgba(255, 77, 79, 0.4);
  }
  70% {
    box-shadow: 0 4px 12px rgba(255, 77, 79, 0.3), 0 0 0 10px rgba(255, 77, 79, 0.2);
  }
  100% {
    box-shadow: 0 4px 12px rgba(255, 77, 79, 0.3), 0 0 0 0 rgba(255, 77, 79, 0.2);
  }
}

.pulse-danger {
  animation: pulse 2s infinite;
}

/* 移除所有默认样式 */
.smart-test-dropdown :deep(*),
.smart-export-dropdown :deep(*),
.smart-more-dropdown :deep(*) {
  box-sizing: border-box !important;
}
/* 顶部右侧按钮样式 */
.header-right :deep(.n-button) {
  border-radius: 12px;
  font-weight: 600;
  transition: all 0.3s ease;
  border: 2px solid transparent;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.header-right :deep(.n-button--primary) {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-color: #667eea;
  color: white;
}

.header-right :deep(.n-button--primary:hover) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.3);
  background: linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%);
}

/* 更多操作按钮样式 */
.header-more-btn {
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  border: 2px solid #e2e8f0;
  color: #64748b;
  border-radius: 12px;
  width: 44px;
  height: 36px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.header-more-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.1);
  border-color: #cbd5e1;
  color: #475569;
  background: linear-gradient(135deg, #ffffff 0%, #f1f5f9 100%);
}

.header-more-icon {
  font-size: 18px !important;
  transition: all 0.3s ease;
}

.header-more-btn:hover .header-more-icon {
  transform: rotate(90deg);
}

/* 下拉菜单样式 - 简化版本 */
.header-more-dropdown :deep(.n-dropdown-menu) {
  border-radius: 8px !important;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12) !important;
  border: 1px solid #e2e8f0 !important;
  background: #ffffff !important;
  padding: 0 !important;
  min-width: 160px !important;
  max-width: 200px !important;
  margin: 0 !important;
  overflow: hidden !important;
}

.header-more-dropdown :deep(.n-dropdown-menu-body) {
  padding: 0 !important;
  margin: 0 !important;
}

.header-more-dropdown :deep(.n-dropdown-menu-content) {
  padding: 0 !important;
  margin: 0 !important;
}

.header-more-dropdown :deep(.n-dropdown-menu-item) {
  margin: 0 !important;
  padding: 0 !important;
  background: transparent !important;
  border: none !important;
  outline: none !important;
  width: 100% !important;
  display: block !important;
  position: static !important;
}

.header-more-dropdown :deep(.n-dropdown-menu-item:hover) {
  background: transparent !important;
}

.header-more-dropdown :deep(.n-dropdown-menu-item.n-dropdown-menu-item--selected) {
  background: #f8fafc !important;
}

.header-more-dropdown :deep(.n-dropdown-menu-item-content) {
  padding: 0 !important;
  margin: 0 !important;
  width: 100% !important;
  display: block !important;
  position: static !important;
  background: transparent !important;
}

.header-more-dropdown :deep(.n-dropdown-divider) {
  margin: 0 !important;
  border-color: #e2e8f0 !important;
  height: 1px !important;
  padding: 0 !important;
}

/* 移除所有默认样式 */
.header-more-dropdown :deep(*) {
  box-sizing: border-box !important;
}
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

  .selection-bar {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }

  .selection-left {
    align-items: center;
    text-align: center;
  }

  .selection-right {
    justify-content: center;
    flex-wrap: wrap;
  }
}

@media (max-width: 768px) {
  .nodes-modern-layout {
    padding: 12px;
  }

  .header-main {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }

  .stat-card {
    padding: 16px;
  }

  .smart-bar-content {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
    text-align: center;
  }

  .smart-bar-actions {
    justify-content: center;
    flex-wrap: wrap;
  }

  .smart-bar-actions :deep(.n-button) {
    font-size: 12px;
    padding: 0 12px;
  }

  .selection-bar {
    padding: 12px 16px;
  }

  .selection-right :deep(.n-button) {
    font-size: 12px;
    padding: 0 12px;
  }

  .group-tabs-section {
    padding: 8px;
  }

  .smart-bar {
    padding: 12px 16px;
  }

  .smart-text {
    font-size: 13px;
  }
}

@media (max-width: 480px) {
  .selection-right {
    gap: 8px;
  }

  .selection-right :deep(.n-button) {
    font-size: 11px;
    padding: 0 8px;
  }

  .selection-right :deep(.n-button .n-button__content) {
    gap: 4px;
  }

  .smart-bar-actions {
    gap: 6px;
  }

  .smart-bar-actions :deep(.n-button) {
    font-size: 11px;
    padding: 0 8px;
  }

  .smart-bar-actions :deep(.n-button .n-button__content) {
    gap: 4px;
  }
}
</style>