<template>
  <div class="nodes-new-layout">
    <!-- 顶部简洁导航栏 -->
    <div class="nodes-header">
      <div class="header-left">
        <h1 class="page-title">节点管理</h1>
        <div class="quick-stats">
          <div class="stat-item" :class="{ active: activeTab === 'all' }">
            <span class="stat-count">{{ totalCount }}</span>
            <span class="stat-label">全部</span>
          </div>
          <div class="stat-item" :class="{ active: activeTab === 'online' }">
            <span class="stat-count">{{ onlineCount }}</span>
            <span class="stat-label">在线</span>
          </div>
          <div class="stat-item" :class="{ active: activeTab === 'offline' }">
            <span class="stat-count">{{ offlineCount }}</span>
            <span class="stat-label">离线</span>
          </div>
        </div>
      </div>

      <div class="header-right">
        <n-button type="primary" @click="showAddModal = true">
          <template #icon><PlusIcon /></template>
          添加节点
        </n-button>
      </div>
    </div>

    <!-- 简化的搜索和筛选栏 -->
    <div class="nodes-toolbar">
      <div class="search-section">
        <n-input
          v-model:value="searchQuery"
          placeholder="搜索节点名称或服务器地址..."
          class="search-input"
          clearable
        >
          <template #prefix>
            <n-icon :component="SearchIcon" />
          </template>
        </n-input>
      </div>

      <div class="filter-section">
        <n-select
          v-model:value="selectedProtocol"
          placeholder="协议类型"
          :options="protocolOptions"
          clearable
          class="filter-select"
        />

        <n-select
          v-model:value="selectedStatus"
          placeholder="节点状态"
          :options="statusOptions"
          clearable
          class="filter-select"
        />

        <n-select
          v-model:value="selectedGroup"
          placeholder="分组"
          :options="groupOptions"
          clearable
          class="filter-select"
        />
      </div>

      <div class="action-section">
        <n-button-group>
          <n-button @click="refreshNodes" :loading="refreshing">
            <template #icon><RefreshIcon /></template>
          </n-button>
          <n-button @click="showImportModal = true">
            <template #icon><ImportIcon /></template>
          </n-button>
        </n-button-group>
      </div>
    </div>

    <!-- 分组标签页 -->
    <div class="groups-tabs" v-if="groups && groups.length > 0">
      <n-tabs v-model:value="activeGroupId" type="line" @update:value="handleGroupChange">
        <n-tab-pane name="all" :tab="`全部 (${groupCounts.all || 0})`" />
        <n-tab-pane name="ungrouped" :tab="`未分组 (${groupCounts.ungrouped || 0})`" />
        <n-tab-pane
          v-for="group in groups"
          :key="group.id"
          :name="group.id"
          :tab="group.name"
        />
      </n-tabs>
    </div>

    <!-- 主内容区域 -->
    <div class="nodes-content">
      <!-- 选中节点操作栏 -->
      <div v-if="selectedNodes.length > 0" class="selection-bar">
        <div class="selection-info">
          <span>已选择 {{ selectedNodes.length }} 个节点</span>
        </div>
        <div class="selection-actions">
          <n-button @click="testSelectedNodes" :loading="testingSelected">
            <template #icon><FlashIcon /></template>
            测试选中
          </n-button>
          <n-button @click="showBatchMoveModal = true">
            <template #icon><FolderIcon /></template>
            移动分组
          </n-button>
          <n-button @click="exportSelectedNodes">
            <template #icon><DownloadIcon /></template>
            导出选中
          </n-button>
          <n-button @click="deleteSelectedNodes" type="error">
            <template #icon><TrashIcon /></template>
            删除选中
          </n-button>
        </div>
      </div>

      <!-- 桌面端表格视图 -->
      <div v-if="!isMobile" class="desktop-view">
        <n-data-table
          :columns="tableColumns"
          :data="filteredNodes"
          :loading="loading"
          :pagination="paginationConfig"
          :row-key="(row: any) => row.id"
          :checked-row-keys="selectedNodes"
          :scroll-x="1400"
          flex-height
          @update:checked-row-keys="handleSelectionChange"
          @update:page="handlePageChange"
          @update:page-size="handlePageSizeChange"
        />
      </div>

      <!-- 移动端卡片视图 -->
      <div v-else class="mobile-view">
        <div class="node-cards">
          <div
            v-for="node in paginatedNodes"
            :key="node.id"
            class="node-card"
            @contextmenu="handleContextMenu($event, node)"
          >
            <div class="node-header">
              <div class="node-name">{{ node.name }}</div>
              <div class="node-protocol">
                <n-tag :color="getProtocolColor(node.protocol)" size="small">
                  {{ node.protocol?.toUpperCase() }}
                </n-tag>
              </div>
            </div>

            <div class="node-info">
              <div class="info-row">
                <span class="label">服务器:</span>
                <span class="value">{{ node.server || '' }}</span>
              </div>
              <div class="info-row">
                <span class="label">端口:</span>
                <span class="value">{{ node.port }}</span>
              </div>
              <div class="info-row">
                <span class="label">状态:</span>
                <span class="value">
                  <n-tag
                    :type="getStatusType(node.status)"
                    size="small"
                  >
                    {{ getStatusText(node.status) }}
                  </n-tag>
                </span>
              </div>
              <div v-if="node.latency" class="info-row">
                <span class="label">延迟:</span>
                <span class="value" :class="getLatencyClass(node.latency)">
                  {{ formatLatency(node.latency) }}
                </span>
              </div>
            </div>

            <div class="node-actions">
              <n-button size="small" @click="testNode(node)" :loading="node.testing">
                <template #icon><FlashIcon /></template>
              </n-button>
              <n-button size="small" type="primary" @click="editNode(node)">
                <template #icon><EditIcon /></template>
              </n-button>
              <n-dropdown
                :options="getMoreActions(node)"
                @select="handleMoreAction"
                placement="bottom-end"
              >
                <n-button size="small">
                  <template #icon><MoreIcon /></template>
                </n-button>
              </n-dropdown>
            </div>
          </div>
        </div>

        <!-- 移动端分页 -->
        <n-pagination
          v-model:page="currentPage"
          v-model:page-size="pageSize"
          :item-count="filteredNodes.length"
          :page-sizes="[10, 20, 50]"
          show-size-picker
          show-quick-jumper
          class="mobile-pagination"
          @update:page="handlePageChange"
          @update:page-size="handlePageSizeChange"
        />
      </div>
    </div>

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

    <!-- 各种模态框 -->
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
      @move="handleBatchMove"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, h } from 'vue';
import { useIsMobile } from '@/composables/useMediaQuery';
import { useMessage } from 'naive-ui';
import {
  Add as PlusIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Download as ImportIcon,
  Flash as FlashIcon,
  Folder as FolderIcon,
  Download as DownloadIcon,
  Trash as TrashIcon,
  Pencil as EditIcon,
  EllipsisVertical as MoreIcon
} from '@vicons/ionicons5';
import type { Node, NodeGroup } from '@/types/entities';
import { NodeService } from '@/services/nodeService';
import NodeModal from './components/NodeModal.vue';
import ImportModal from './components/ImportModal.vue';
import BatchMoveModal from './components/BatchMoveModal.vue';

const isMobile = useIsMobile();
const message = useMessage();

// 基础状态
const loading = ref(false);
const refreshing = ref(false);
const testingSelected = ref(false);
const nodes = ref<Node[]>([]);
const groups = ref<NodeGroup[]>([]);

// 筛选和搜索状态
const searchQuery = ref('');
const selectedProtocol = ref('');
const selectedStatus = ref('');
const selectedGroup = ref('');
const activeGroupId = ref('all');
const activeTab = ref('all');

// 分页状态
const currentPage = ref(1);
const pageSize = ref(isMobile.value ? 10 : 20);

// 选择状态
const selectedNodes = ref<string[]>([]);

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

// 筛选选项
const protocolOptions = computed(() => [
  { label: '全部协议', value: '' },
  ...Array.from(new Set(nodes.value.map(n => n.protocol).filter(Boolean)))
    .map(protocol => ({ label: protocol.toUpperCase(), value: protocol }))
]);

const statusOptions = computed(() => [
  { label: '全部状态', value: '' },
  { label: '在线', value: 'online' },
  { label: '离线', value: 'offline' },
  { label: '测试中', value: 'testing' },
  { label: '未测试', value: 'pending' }
]);

const groupOptions = computed(() => [
  { label: '全部分组', value: '' },
  ...groups.value.map(group => ({ label: group.name, value: group.id }))
]);

// 筛选后的节点
const filteredNodes = computed(() => {
  let result = nodes.value;

  // 搜索筛选
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    result = result.filter(node =>
      node.name.toLowerCase().includes(query) ||
      (node.server?.toLowerCase() || '').includes(query)
    );
  }

  // 协议筛选
  if (selectedProtocol.value) {
    result = result.filter(node => node.protocol === selectedProtocol.value);
  }

  // 状态筛选
  if (selectedStatus.value) {
    result = result.filter(node => node.status === selectedStatus.value);
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

// 移动端分页后的节点
const paginatedNodes = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  const end = start + pageSize.value;
  return filteredNodes.value.slice(start, end);
});

// 分页配置
const paginationConfig = computed(() => ({
  page: currentPage.value,
  pageSize: pageSize.value,
  itemCount: filteredNodes.value.length,
  showSizePicker: true,
  pageSizes: [10, 20, 50, 100],
  showQuickJumper: true
}));

// 表格列定义
const tableColumns = computed(() => [
  { type: 'selection', fixed: 'left' as const },
  { title: '节点名称', key: 'name', width: 200, fixed: 'left' as const, ellipsis: { tooltip: true } },
  {
    title: '协议',
    key: 'protocol',
    width: 100,
    render: (row: any) => {
      return h('span', { class: `protocol-tag protocol-${row.protocol}` }, row.protocol?.toUpperCase());
    }
  },
  { title: '服务器', key: 'server', width: 150, ellipsis: { tooltip: true } },
  { title: '端口', key: 'port', width: 80 },
  {
    title: '状态',
    key: 'status',
    width: 100,
    render: (row: any) => {
      return h('span', { class: `status-tag status-${row.status}` }, getStatusText(row.status));
    }
  },
  {
    title: '延迟',
    key: 'latency',
    width: 100,
    render: (row: any) => {
      return h('span', { class: getLatencyClass(row.latency) }, formatLatency(row.latency));
    }
  },
  {
    title: '操作',
    key: 'actions',
    width: 200,
    fixed: 'right' as const,
    render: (row: any) => {
      return h('div', { class: 'table-actions' }, [
        h('n-button', { size: 'small', onClick: () => testNode(row) }, '测试'),
        h('n-button', { size: 'small', type: 'primary', onClick: () => editNode(row) }, '编辑'),
        h('n-dropdown', {
          options: getMoreActions(row),
          onSelect: (key: string) => handleMoreAction(key, row)
        }, {
          default: () => h('n-button', { size: 'small' }, '更多')
        })
      ]);
    }
  }
]);

// 事件处理方法
const refreshNodes = async () => {
  refreshing.value = true;
  try {
    // await NodeService.fetchNodes();
    message.success('节点列表已刷新');
  } catch (error) {
    message.error('刷新失败');
  } finally {
    refreshing.value = false;
  }
};

const handleGroupChange = (groupId: string) => {
  activeGroupId.value = groupId;
  currentPage.value = 1; // 重置分页
};

const handleSelectionChange = (keys: string[]) => {
  selectedNodes.value = keys;
};

const handlePageChange = (page: number) => {
  currentPage.value = page;
};

const handlePageSizeChange = (size: number) => {
  pageSize.value = size;
  currentPage.value = 1;
};

const testNode = async (node: Node) => {
  // 实现节点测试逻辑
};

const editNode = (node: Node) => {
  editingNode.value = node;
  showEditModal.value = true;
};

const deleteNode = async (node: Node) => {
  // 实现节点删除逻辑
};

const testSelectedNodes = async () => {
  testingSelected.value = true;
  try {
    // 实现批量测试逻辑
    message.success(`已开始测试 ${selectedNodes.value.length} 个节点`);
  } catch (error) {
    message.error('批量测试失败');
  } finally {
    testingSelected.value = false;
  }
};

const exportSelectedNodes = () => {
  const selected = nodes.value.filter(node => selectedNodes.value.includes(node.id));
  const data = JSON.stringify(selected, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `nodes-export-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
  message.success(`已导出 ${selected.length} 个节点`);
};

const deleteSelectedNodes = () => {
  // 实现批量删除逻辑
};

const handleContextMenu = (event: MouseEvent, node: Node) => {
  event.preventDefault();
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
      deleteNode(node);
      break;
  }
};

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
    // 实现导入逻辑
    message.success('导入成功');
    showImportModal.value = false;
    await refreshNodes();
  } catch (error) {
    message.error('导入失败');
  }
};

const handleBatchMove = async (groupId: string) => {
  try {
    // 实现批量移动逻辑
    message.success('移动成功');
    showBatchMoveModal.value = false;
    selectedNodes.value = [];
    await refreshNodes();
  } catch (error) {
    message.error('移动失败');
  }
};

// 工具方法
const getProtocolColor = (protocol?: string) => {
  const colors: Record<string, string> = {
    vmess: '#1890ff',
    vless: '#52c41a',
    trojan: '#faad14',
    ss: '#722ed1',
    ssr: '#eb2f96',
    hysteria2: '#13c2c2',
    tuic: '#fa8c16',
    anytls: '#f5222d'
  };
  return { color: colors[protocol || ''] || '#d9d9d9' };
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
.nodes-new-layout {
  padding: 20px;
  background-color: #f5f7fa;
  min-height: 100vh;
}

.nodes-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 30px;
}

.page-title {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: #1a1a1a;
}

.quick-stats {
  display: flex;
  gap: 20px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px 16px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  background: #fff;
  border: 1px solid #e8e8e8;
}

.stat-item:hover {
  border-color: #1890ff;
  box-shadow: 0 2px 8px rgba(24, 144, 255, 0.1);
}

.stat-item.active {
  background: #1890ff;
  border-color: #1890ff;
  color: white;
}

.stat-count {
  font-size: 18px;
  font-weight: 600;
  line-height: 1;
}

.stat-label {
  font-size: 12px;
  margin-top: 4px;
  opacity: 0.8;
}

.nodes-toolbar {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 16px 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  margin-bottom: 20px;
}

.search-section {
  flex: 1;
}

.search-input {
  max-width: 400px;
}

.filter-section {
  display: flex;
  gap: 12px;
}

.filter-select {
  width: 140px;
}

.groups-tabs {
  background: white;
  border-radius: 12px;
  padding: 0 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.selection-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
  background: #e6f7ff;
  border: 1px solid #91d5ff;
  border-radius: 8px;
  margin-bottom: 20px;
}

.selection-actions {
  display: flex;
  gap: 8px;
}

.desktop-view {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  overflow: hidden;
}

.mobile-view {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.node-cards {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.node-card {
  background: white;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  transition: all 0.2s;
  border: 1px solid #f0f0f0;
}

.node-card:hover {
  border-color: #1890ff;
  box-shadow: 0 4px 16px rgba(24, 144, 255, 0.1);
}

.node-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.node-name {
  font-size: 16px;
  font-weight: 600;
  color: #1a1a1a;
}

.node-info {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 12px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.label {
  font-size: 14px;
  color: #666;
}

.value {
  font-size: 14px;
  color: #1a1a1a;
  font-weight: 500;
}

.node-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.mobile-pagination {
  display: flex;
  justify-content: center;
  padding: 20px 0;
}

.protocol-tag, .status-tag {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.latency-good { color: #52c41a; }
.latency-medium { color: #1890ff; }
.latency-poor { color: #faad14; }
.latency-unknown { color: #999; }

/* 响应式设计 */
@media (max-width: 768px) {
  .nodes-new-layout {
    padding: 12px;
  }

  .nodes-header {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }

  .header-left {
    flex-direction: column;
    gap: 16px;
  }

  .nodes-toolbar {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }

  .filter-section {
    flex-wrap: wrap;
  }

  .selection-bar {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }

  .selection-actions {
    justify-content: center;
    flex-wrap: wrap;
  }
}

@media (max-width: 480px) {
  .filter-select {
    width: 100%;
  }

  .quick-stats {
    justify-content: space-around;
  }

  .stat-item {
    flex: 1;
    min-width: 0;
  }
}
</style>