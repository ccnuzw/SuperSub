<template>
  <div class="mobile-nodes-page">
    <!-- 移动端顶部栏 -->
    <div class="mobile-header">
      <div class="header-content">
        <div class="header-left">
          <h1 class="page-title">节点管理</h1>
          <div class="stats-pills">
            <div class="stat-pill online">
              <span class="count">{{ onlineCount }}</span>
              <span class="label">在线</span>
            </div>
            <div class="stat-pill offline">
              <span class="count">{{ offlineCount }}</span>
              <span class="label">离线</span>
            </div>
            <div class="stat-pill total">
              <span class="count">{{ totalCount }}</span>
              <span class="label">总计</span>
            </div>
          </div>
        </div>

        <div class="header-actions">
          <n-button
            text
            size="small"
            @click="showSearchFilter = true"
            class="search-btn"
          >
            <template #icon>
              <n-icon :component="SearchIcon" />
            </template>
          </n-button>

          <n-button
            text
            size="small"
            @click="refreshNodes"
            :loading="refreshing"
            class="refresh-btn"
          >
            <template #icon>
              <n-icon :component="RefreshIcon" />
            </template>
          </n-button>
        </div>
      </div>
    </div>

    <!-- 分组导航 -->
    <div class="group-nav">
      <div class="group-tabs">
        <div
          class="group-tab"
          :class="{ active: activeGroup === 'all' }"
          @click="setActiveGroup('all')"
        >
          <span class="tab-name">全部</span>
          <n-badge :value="groupCounts.all || 0" :max="999" />
        </div>

        <div
          class="group-tab"
          :class="{ active: activeGroup === 'ungrouped' }"
          @click="setActiveGroup('ungrouped')"
        >
          <span class="tab-name">未分组</span>
          <n-badge :value="groupCounts.ungrouped || 0" :max="999" />
        </div>

        <div
          v-for="group in groups"
          :key="group.id"
          class="group-tab"
          :class="{ active: activeGroup === group.id }"
          @click="setActiveGroup(group.id)"
        >
          <span class="tab-name">{{ group.name }}</span>
          <n-badge :value="getGroupNodeCount(group.id)" :max="999" />
        </div>
      </div>

      <!-- 分组横向滚动提示 -->
      <div v-if="hasOverflowGroups" class="scroll-indicator">
        <n-icon :component="ChevronForwardIcon" />
      </div>
    </div>

    <!-- 当前筛选信息 -->
    <div v-if="hasActiveFilters" class="active-filters">
      <div class="filter-tags">
        <n-tag
          v-for="filter in activeFilterTags"
          :key="filter.key"
          closable
          @close="removeFilter(filter)"
          size="small"
          type="info"
        >
          {{ filter.label }}
        </n-tag>
        <n-button
          text
          size="small"
          @click="clearAllFilters"
          type="primary"
        >
          清空筛选
        </n-button>
      </div>
    </div>

    <!-- 主要内容区域 -->
    <div class="mobile-content">
      <!-- 选中节点信息栏 -->
      <div v-if="selectedNodes.length > 0" class="selection-bar">
        <div class="selection-info">
          <span class="selection-count">已选择 {{ selectedNodes.length }} 个节点</span>
        </div>
        <div class="selection-preview">
          <div class="selected-nodes-mini">
            <div
              v-for="(node, index) in selectedNodes.slice(0, 3)"
              :key="node.id"
              class="selected-node-mini"
              :title="node.name"
            >
              <n-tag size="small" :color="{ color: getProtocolColor(node.protocol) }">
                {{ node.protocol?.toUpperCase() }}
              </n-tag>
            </div>
            <div v-if="selectedNodes.length > 3" class="more-selected">
              +{{ selectedNodes.length - 3 }}
            </div>
          </div>
        </div>
      </div>

      <!-- 节点列表 -->
      <div class="nodes-list">
        <!-- 空状态 -->
        <div v-if="filteredNodes.length === 0 && !loading" class="empty-state">
          <div class="empty-icon">
            <n-icon :component="InboxIcon" size="64" />
          </div>
          <div class="empty-title">{{ getEmptyTitle() }}</div>
          <div class="empty-desc">{{ getEmptyDescription() }}</div>
          <div class="empty-actions">
            <n-button @click="showAddModal = true" type="primary">
              <template #icon><PlusIcon /></template>
              添加节点
            </n-button>
            <n-button @click="showImportModal = true">
              <template #icon><ImportIcon /></template>
              导入节点
            </n-button>
          </div>
        </div>

        <!-- 节点卡片 -->
        <div v-else class="node-cards">
          <div
            v-for="node in paginatedNodes"
            :key="node.id"
            class="node-card"
            :class="getNodeCardClasses(node)"
            @click="toggleNodeSelection(node)"
            @contextmenu.prevent="handleContextMenu($event, node)"
          >
            <!-- 选择指示器 -->
            <div class="selection-indicator">
              <n-checkbox
                :checked="selectedNodes.some(n => n.id === node.id)"
                @update:checked="(checked: boolean) => handleNodeSelect(node, checked)"
                @click.stop
              />
            </div>

            <!-- 节点主要信息 -->
            <div class="node-main">
              <div class="node-header">
                <div class="node-name">{{ node.name || '未命名节点' }}</div>
                <div class="node-status">
                  <n-tag
                    :type="getStatusType(node.status)"
                    size="small"
                    :bordered="false"
                  >
                    {{ getStatusText(node.status) }}
                  </n-tag>
                </div>
              </div>

              <div class="node-details">
                <div class="detail-row">
                  <span class="protocol-badge" :style="{ backgroundColor: getProtocolColor(node.protocol) }">
                    {{ node.protocol?.toUpperCase() }}
                  </span>
                  <span class="server-info">{{ node.server || '' }}:{{ node.port || '' }}</span>
                </div>

                <div v-if="node.latency !== undefined" class="detail-row">
                  <span class="latency-info" :class="getLatencyClass(node.latency)">
                    {{ formatLatency(node.latency) }}
                  </span>
                  <span v-if="node.last_test_at" class="last-test">
                    {{ formatLastTest(node.last_test_at) }}
                  </span>
                </div>
              </div>
            </div>

            <!-- 快速操作 -->
            <div class="node-actions">
              <n-button
                size="small"
                circle
                @click.stop="testNode(node)"
                :loading="node.testing"
                class="action-btn test-btn"
              >
                <template #icon>
                  <n-icon :component="FlashIcon" />
                </template>
              </n-button>

              <n-button
                size="small"
                circle
                type="primary"
                @click.stop="editNode(node)"
                class="action-btn edit-btn"
              >
                <template #icon>
                  <n-icon :component="EditIcon" />
                </template>
              </n-button>

              <n-dropdown
                :options="getMoreActions(node)"
                @select="handleMoreAction"
                placement="bottom-end"
                trigger="click"
                @click.stop
              >
                <n-button
                  size="small"
                  circle
                  class="action-btn more-btn"
                >
                  <template #icon>
                    <n-icon :component="MoreIcon" />
                  </template>
                </n-button>
              </n-dropdown>
            </div>
          </div>
        </div>

        <!-- 加载状态 -->
        <div v-if="loading" class="loading-state">
          <n-spin size="large" />
          <div class="loading-text">加载节点中...</div>
        </div>
      </div>

      <!-- 移动端分页 -->
      <div v-if="filteredNodes.length > pageSize" class="mobile-pagination">
        <n-pagination
          v-model:page="currentPage"
          v-model:page-size="pageSize"
          :item-count="filteredNodes.length"
          :page-sizes="[10, 20, 50]"
          show-size-picker
          show-quick-jumper
          simple
        />
      </div>
    </div>

    <!-- 移动端搜索筛选界面 -->
    <MobileSearchFilter
      v-model:show="showSearchFilter"
      :groups="groups"
      :initial-filters="currentFilters"
      @search="handleSearch"
      @filter="handleFilter"
      @clear="handleClearFilters"
    />

    <!-- 移动端 FAB -->
    <MobileNodeFAB
      :selected-count="selectedNodes.length"
      :refreshing="refreshing"
      @search="showSearchFilter = true"
      @filter="showSearchFilter = true"
      @refresh="refreshNodes"
      @add="showAddModal = true"
      @import="showImportModal = true"
      @batch-test="testSelectedNodes"
      @batch-move="showBatchMoveModal = true"
      @batch-export="exportSelectedNodes"
      @batch-delete="deleteSelectedNodes"
      @clear-selection="clearSelection"
    />

    <!-- 右键菜单 -->
    <n-dropdown
      :show="contextMenuVisible"
      :x="contextMenuX"
      :y="contextMenuY"
      :options="contextMenuOptions"
      @clickoutside="closeContextMenu"
      @select="handleContextMenuSelect"
      placement="bottom-start"
    />

    <!-- 模态框组件 -->
    <NodeModal
      v-model:show="showAddModal"
      :node="null"
      :groups="groups"
      @save="handleAddNode"
    />

    <NodeModal
      v-model:show="showEditModal"
      :node="editingNode"
      :groups="groups"
      @save="handleEditNode"
    />

    <ImportModal
      v-model:show="showImportModal"
      :groups="groups"
      @import="handleImport"
    />

    <BatchMoveModal
      v-model:show="showBatchMoveModal"
      :groups="groups"
      :selected-count="selectedNodes.length"
      @move="handleBatchMove"
      @createGroup="handleCreateGroup"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useMessage } from 'naive-ui';
import {
  Search as SearchIcon,
  Refresh as RefreshIcon,
  ChevronForward as ChevronForwardIcon,
  Archive as InboxIcon,
  Add as PlusIcon,
  Download as ImportIcon,
  Flash as FlashIcon,
  Pencil as EditIcon,
  EllipsisVertical as MoreIcon
} from '@vicons/ionicons5';
import type { Node, NodeGroup } from '@/types/entities';
import MobileSearchFilter from '@/components/mobile/MobileSearchFilter.vue';
import MobileNodeFAB from '@/components/mobile/MobileNodeFAB.vue';
import NodeModal from './components/NodeModal.vue';
import ImportModal from './components/ImportModal.vue';
import BatchMoveModal from './components/BatchMoveModal.vue';

const message = useMessage();

// 基础状态
const loading = ref(false);
const refreshing = ref(false);
const nodes = ref<Node[]>([]);
const groups = ref<NodeGroup[]>([]);

// 移动端特定状态
const showSearchFilter = ref(false);

// 选择状态
const selectedNodes = ref<Node[]>([]);

// 分页状态
const currentPage = ref(1);
const pageSize = ref(15);

// 筛选状态
const activeGroup = ref('all');
const currentFilters = ref({
  search: '',
  protocols: [] as string[],
  statuses: [] as string[],
  groupId: ''
});

// UI状态
const showAddModal = ref(false);
const showEditModal = ref(false);
const showImportModal = ref(false);
const showBatchMoveModal = ref(false);
const editingNode = ref<Node | null>(null);

// 右键菜单状态
const contextMenuVisible = ref(false);
const contextMenuX = ref(0);
const contextMenuY = ref(0);
const contextNode = ref<Node | null>(null);

// 右键菜单选项
const contextMenuOptions = computed(() => {
  if (!contextNode.value) return [];

  return [
    {
      label: '复制链接',
      key: 'copy'
    },
    {
      label: '复制配置',
      key: 'copy-config'
    },
    {
      label: '节点详情',
      key: 'details'
    },
    {
      type: 'divider' as const
    },
    {
      label: '删除节点',
      key: 'delete'
    }
  ];
});

// 统计数据
const totalCount = computed(() => nodes.value.length);
const onlineCount = computed(() => nodes.value.filter(n => n.status === 'online').length);
const offlineCount = computed(() => nodes.value.filter(n => n.status === 'offline').length);

// 分组统计
const groupCounts = computed(() => {
  const counts: Record<string, number> = {
    all: nodes.value.length,
    ungrouped: nodes.value.filter(n => !n.group_id).length
  };

  groups.value.forEach(group => {
    counts[group.id] = nodes.value.filter(n => n.group_id === group.id).length;
  });

  return counts;
});

// 分组导航
const hasOverflowGroups = computed(() => {
  return groups.value.length > 4; // 超过4个分组时显示滚动提示
});

// 筛选后的节点
const filteredNodes = computed(() => {
  let result = nodes.value;

  // 分组筛选
  if (activeGroup.value === 'all') {
    // 不筛选
  } else if (activeGroup.value === 'ungrouped') {
    result = result.filter(node => !node.group_id);
  } else {
    result = result.filter(node => node.group_id === activeGroup.value);
  }

  // 搜索筛选
  if (currentFilters.value.search) {
    const query = currentFilters.value.search.toLowerCase();
    result = result.filter(node =>
      node.name.toLowerCase().includes(query) ||
      (node.server?.toLowerCase() || '').includes(query)
    );
  }

  // 协议筛选
  if (currentFilters.value.protocols.length > 0) {
    result = result.filter(node =>
      currentFilters.value.protocols.includes(node.protocol)
    );
  }

  // 状态筛选
  if (currentFilters.value.statuses.length > 0) {
    result = result.filter(node =>
      currentFilters.value.statuses.includes(node.status)
    );
  }

  return result;
});

// 分页后的节点
const paginatedNodes = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  const end = start + pageSize.value;
  return filteredNodes.value.slice(start, end);
});

// 当前筛选标签
const activeFilterTags = computed(() => {
  const tags = [];

  if (currentFilters.value.search) {
    tags.push({ key: 'search', label: `搜索: ${currentFilters.value.search}` });
  }

  currentFilters.value.protocols.forEach(protocol => {
    tags.push({ key: `protocol-${protocol}`, label: protocol.toUpperCase() });
  });

  currentFilters.value.statuses.forEach(status => {
    tags.push({ key: `status-${status}`, label: getStatusText(status) });
  });

  return tags;
});

const hasActiveFilters = computed(() => {
  return activeFilterTags.value.length > 0;
});

// 方法
const getGroupNodeCount = (groupId: string): number => {
  if (groupId === 'ungrouped') {
    return nodes.value.filter(n => !n.group_id).length;
  }
  return nodes.value.filter(n => n.group_id === groupId).length;
};

const setActiveGroup = (groupId: string) => {
  activeGroup.value = groupId;
  currentPage.value = 1;
  clearSelection();
};

const refreshNodes = async () => {
  refreshing.value = true;
  try {
    // await NodeService.fetchNodes();
    // await NodeService.fetchGroups();
    message.success('节点列表已刷新');
  } catch (error) {
    message.error('刷新失败');
  } finally {
    refreshing.value = false;
  }
};

const handleSearch = (query: string) => {
  currentFilters.value.search = query;
  currentPage.value = 1;
};

const handleFilter = (filters: any) => {
  currentFilters.value = { ...filters };
  currentPage.value = 1;
};

const handleClearFilters = () => {
  currentFilters.value = {
    search: '',
    protocols: [],
    statuses: [],
    groupId: ''
  };
  currentPage.value = 1;
};

const removeFilter = (filter: any) => {
  if (filter.key === 'search') {
    currentFilters.value.search = '';
  } else if (filter.key.startsWith('protocol-')) {
    const protocol = filter.key.replace('protocol-', '');
    const index = currentFilters.value.protocols.indexOf(protocol);
    if (index > -1) {
      currentFilters.value.protocols.splice(index, 1);
    }
  } else if (filter.key.startsWith('status-')) {
    const status = filter.key.replace('status-', '');
    const index = currentFilters.value.statuses.indexOf(status);
    if (index > -1) {
      currentFilters.value.statuses.splice(index, 1);
    }
  }
  currentPage.value = 1;
};

const clearAllFilters = () => {
  handleClearFilters();
};

const toggleNodeSelection = (node: Node) => {
  const index = selectedNodes.value.findIndex(n => n.id === node.id);
  if (index > -1) {
    selectedNodes.value.splice(index, 1);
  } else {
    selectedNodes.value.push(node);
  }
};

const handleNodeSelect = (node: Node, checked: boolean) => {
  const index = selectedNodes.value.findIndex(n => n.id === node.id);
  if (checked && index === -1) {
    selectedNodes.value.push(node);
  } else if (!checked && index > -1) {
    selectedNodes.value.splice(index, 1);
  }
};

const clearSelection = () => {
  selectedNodes.value = [];
};

const testNode = async (node: Node) => {
  // 实现节点测试
};

const editNode = (node: Node) => {
  editingNode.value = node;
  showEditModal.value = true;
};

const testSelectedNodes = async () => {
  // 实现批量测试
};

const exportSelectedNodes = () => {
  const data = JSON.stringify(selectedNodes.value, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `nodes-export-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
  message.success(`已导出 ${selectedNodes.value.length} 个节点`);
};

const deleteSelectedNodes = () => {
  // 实现批量删除
};

// 右键菜单
const handleContextMenu = (event: MouseEvent, node: Node) => {
  contextNode.value = node;
  contextMenuX.value = event.clientX;
  contextMenuY.value = event.clientY;
  contextMenuVisible.value = true;
};

const closeContextMenu = () => {
  contextMenuVisible.value = false;
  contextNode.value = null;
};

const handleContextMenuSelect = (key: string) => {
  if (contextNode.value) {
    handleMoreAction(key, contextNode.value);
  }
  closeContextMenu();
};

const getMoreActions = (node: Node) => [
  { label: '复制链接', key: 'copy' },
  { label: '复制配置', key: 'copy-config' },
  { label: '节点详情', key: 'details' },
  { type: 'divider' },
  { label: '删除节点', key: 'delete' }
];

const handleMoreAction = (key: string, node: Node) => {
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
      break;
    case 'delete':
      // 删除节点
      break;
  }
};

// 模态框处理
const handleAddNode = async (nodeData: any) => {
  try {
    // await NodeService.createNode(nodeData);
    message.success('节点添加成功');
    showAddModal.value = false;
    await refreshNodes();
  } catch (error) {
    message.error('添加节点失败');
  }
};

const handleEditNode = async (nodeData: any) => {
  try {
    if (editingNode.value) {
      // await NodeService.updateNode(editingNode.value.id, nodeData);
      message.success('节点更新成功');
      showEditModal.value = false;
      await refreshNodes();
    }
  } catch (error) {
    message.error('更新节点失败');
  }
};

const handleImport = async (importData: any) => {
  try {
    // await NodeImportService.import(importData.nodes);
    message.success(`成功导入 ${importData.nodes.length} 个节点`);
    showImportModal.value = false;
    await refreshNodes();
  } catch (error) {
    message.error('导入失败');
  }
};

const handleBatchMove = async (groupId: string, options: any) => {
  try {
    // await NodeService.batchUpdateGroup(selectedNodes.value.map(n => n.id), groupId);
    message.success(`已移动 ${selectedNodes.value.length} 个节点`);
    showBatchMoveModal.value = false;
    clearSelection();
    await refreshNodes();
  } catch (error) {
    message.error('移动失败');
  }
};

const handleCreateGroup = async (groupName: string) => {
  try {
    // await NodeService.createGroup(groupName);
    message.success('分组创建成功');
    await refreshNodes();
  } catch (error) {
    message.error('创建分组失败');
  }
};

// 工具方法
const getNodeCardClasses = (node: Node) => {
  return {
    'selected': selectedNodes.value.some(n => n.id === node.id),
    [`status-${node.status}`]: true
  };
};

const getProtocolColor = (protocol?: string) => {
  const colors: Record<string, string> = {
    vmess: '#1890ff',
    vless: '#52c41a',
    trojan: '#faad14',
    ss: '#722ed1',
    ssr: '#eb2f96',
    hysteria2: '#13c2c2',
    tuic: '#fa8c16'
  };
  return colors[protocol || ''] || '#d9d9d9';
};

const getStatusType = (status?: string) => {
  const types: Record<string, string> = {
    online: 'success',
    offline: 'error',
    testing: 'warning',
    pending: 'default'
  };
  return types[status || ''] || 'default';
};

const getStatusText = (status?: string) => {
  const texts: Record<string, string> = {
    online: '在线',
    offline: '离线',
    testing: '测试中',
    pending: '未测试'
  };
  return texts[status || ''] || '未知';
};

const getLatencyClass = (latency?: number) => {
  if (!latency) return 'latency-unknown';
  if (latency < 100) return 'latency-good';
  if (latency < 300) return 'latency-medium';
  return 'latency-poor';
};

const formatLatency = (latency?: number) => {
  if (!latency) return '未测试';
  if (latency === -1) return '超时';
  return `${latency}ms`;
};

const formatLastTest = (dateStr: string) => {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));

  if (diffMins < 60) {
    return `${diffMins}分钟前`;
  } else if (diffMins < 1440) {
    return `${Math.floor(diffMins / 60)}小时前`;
  } else {
    return `${Math.floor(diffMins / 1440)}天前`;
  }
};

const getEmptyTitle = () => {
  if (currentFilters.value.search) {
    return '未找到匹配的节点';
  }
  if (activeGroup.value !== 'all') {
    return '该分组暂无节点';
  }
  return '暂无节点';
};

const getEmptyDescription = () => {
  if (currentFilters.value.search) {
    return '尝试调整搜索关键词或筛选条件';
  }
  return '点击下方按钮添加或导入节点';
};

// 生命周期
onMounted(async () => {
  loading.value = true;
  try {
    // await Promise.all([
    //   NodeService.fetchNodes(),
    //   NodeService.fetchGroups()
    // ]);
  } catch (error) {
    message.error('加载数据失败');
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.mobile-nodes-page {
  min-height: 100vh;
  background: #f5f7fa;
  padding-bottom: env(safe-area-inset-bottom);
}

/* 移动端顶部栏 */
.mobile-header {
  position: sticky;
  top: 0;
  z-index: 100;
  background: white;
  border-bottom: 1px solid #f0f0f0;
  padding: 16px;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
}

.header-left {
  flex: 1;
}

.page-title {
  margin: 0 0 12px 0;
  font-size: 20px;
  font-weight: 600;
  color: #1a1a1a;
}

.stats-pills {
  display: flex;
  gap: 12px;
}

.stat-pill {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 6px 12px;
  border-radius: 12px;
  min-width: 48px;
  background: #f8f9fa;
  border: 1px solid #e9ecef;
}

.stat-pill.online {
  background: #f6ffed;
  border-color: #b7eb8f;
}

.stat-pill.offline {
  background: #fff2f0;
  border-color: #ffccc7;
}

.stat-pill.total {
  background: #e6f7ff;
  border-color: #91d5ff;
}

.stat-pill .count {
  font-size: 16px;
  font-weight: 600;
  line-height: 1;
}

.stat-pill .label {
  font-size: 10px;
  margin-top: 2px;
  opacity: 0.8;
}

.header-actions {
  display: flex;
  gap: 4px;
}

/* 分组导航 */
.group-nav {
  position: sticky;
  top: 80px;
  z-index: 90;
  background: white;
  border-bottom: 1px solid #f0f0f0;
}

.group-tabs {
  display: flex;
  overflow-x: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.group-tabs::-webkit-scrollbar {
  display: none;
}

.group-tab {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  cursor: pointer;
  white-space: nowrap;
  border-bottom: 2px solid transparent;
  transition: all 0.2s;
  min-width: 80px;
  justify-content: center;
}

.group-tab.active {
  color: #1890ff;
  border-bottom-color: #1890ff;
  background: #f6ffed;
}

.group-tab:hover {
  background: #f8f9fa;
}

.tab-name {
  font-size: 14px;
  font-weight: 500;
}

.scroll-indicator {
  position: absolute;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
  background: linear-gradient(90deg, transparent, white 70%);
  padding: 8px 4px;
  color: #999;
}

/* 当前筛选信息 */
.active-filters {
  background: white;
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
}

.filter-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

/* 主要内容区域 */
.mobile-content {
  padding: 12px;
  padding-bottom: 100px; /* 为 FAB 留出空间 */
}

.selection-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #e6f7ff;
  border: 1px solid #91d5ff;
  border-radius: 8px;
  padding: 12px 16px;
  margin-bottom: 12px;
}

.selection-count {
  font-size: 14px;
  font-weight: 500;
  color: #1890ff;
}

.selected-nodes-mini {
  display: flex;
  align-items: center;
  gap: 6px;
}

.selected-node-mini {
  display: flex;
}

.more-selected {
  font-size: 12px;
  color: #666;
  background: #f0f0f0;
  padding: 2px 6px;
  border-radius: 4px;
}

/* 节点列表 */
.nodes-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 60px 20px;
  text-align: center;
}

.empty-icon {
  color: #d9d9d9;
  margin-bottom: 16px;
}

.empty-title {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 8px;
  color: #333;
}

.empty-desc {
  font-size: 14px;
  color: #666;
  margin-bottom: 24px;
  line-height: 1.5;
}

.empty-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  justify-content: center;
}

.node-cards {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.node-card {
  display: flex;
  align-items: center;
  gap: 12px;
  background: white;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  border: 2px solid transparent;
  transition: all 0.2s ease;
  cursor: pointer;
}

.node-card:hover {
  border-color: #1890ff;
  box-shadow: 0 4px 16px rgba(24, 144, 255, 0.1);
}

.node-card.selected {
  border-color: #1890ff;
  background: #f6ffed;
}

.node-card.status-online {
  border-left: 4px solid #52c41a;
}

.node-card.status-offline {
  border-left: 4px solid #ff4d4f;
}

.node-card.status-testing {
  border-left: 4px solid #faad14;
}

.selection-indicator {
  flex-shrink: 0;
}

.node-main {
  flex: 1;
  min-width: 0;
}

.node-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.node-name {
  font-size: 16px;
  font-weight: 600;
  color: #1a1a1a;
  flex: 1;
  margin-right: 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.node-details {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.detail-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
}

.protocol-badge {
  color: white;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
}

.server-info {
  color: #666;
  font-family: monospace;
  font-size: 12px;
}

.latency-info {
  font-weight: 600;
  font-size: 12px;
}

.latency-good { color: #52c41a; }
.latency-medium { color: #1890ff; }
.latency-poor { color: #faad14; }
.latency-unknown { color: #999; }

.last-test {
  color: #999;
  font-size: 11px;
}

.node-actions {
  display: flex;
  gap: 6px;
  flex-shrink: 0;
}

.action-btn {
  width: 32px;
  height: 32px;
  border: none;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.action-btn.test-btn:hover {
  background: #1890ff;
  color: white;
}

.action-btn.edit-btn:hover {
  background: #52c41a;
  color: white;
}

.action-btn.more-btn:hover {
  background: #666;
  color: white;
}

/* 加载状态 */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 60px 20px;
  text-align: center;
}

.loading-text {
  margin-top: 16px;
  color: #666;
  font-size: 14px;
}

/* 移动端分页 */
.mobile-pagination {
  display: flex;
  justify-content: center;
  padding: 20px 0;
  background: white;
  border-radius: 8px;
  margin-top: 16px;
}

/* 响应式调整 */
@media (max-width: 380px) {
  .mobile-header {
    padding: 12px;
  }

  .stats-pills {
    gap: 8px;
  }

  .stat-pill {
    min-width: 40px;
    padding: 4px 8px;
  }

  .stat-pill .count {
    font-size: 14px;
  }

  .stat-pill .label {
    font-size: 9px;
  }

  .mobile-content {
    padding: 8px;
  }

  .node-card {
    padding: 12px;
    gap: 10px;
  }

  .node-name {
    font-size: 15px;
  }

  .selection-bar {
    padding: 10px 12px;
    flex-direction: column;
    gap: 8px;
    align-items: stretch;
  }

  .empty-actions {
    flex-direction: column;
    align-items: stretch;
  }
}

/* 深色模式支持 */
@media (prefers-color-scheme: dark) {
  .mobile-nodes-page {
    background: #121212;
  }

  .mobile-header {
    background: #1e1e1e;
    border-color: #333;
  }

  .page-title {
    color: white;
  }

  .stat-pill {
    background: #2a2a2a;
    border-color: #404040;
    color: white;
  }

  .group-nav {
    background: #1e1e1e;
    border-color: #333;
  }

  .group-tab {
    color: #ccc;
  }

  .group-tab.active {
    color: #1890ff;
    background: #1a2332;
  }

  .node-card {
    background: #1e1e1e;
    border-color: #333;
  }

  .node-name {
    color: white;
  }

  .server-info {
    color: #999;
  }

  .last-test {
    color: #666;
  }

  .mobile-pagination {
    background: #1e1e1e;
  }
}
</style>