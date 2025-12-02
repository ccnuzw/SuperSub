<template>
  <div class="component-test-page">
    <div class="test-header">
      <h1>🧪 通用组件库测试页面</h1>
      <p>测试所有组件的基本功能和样式</p>
    </div>

    <!-- StatsCard 测试 -->
    <div class="test-section">
      <h2>📊 StatsCard (统计卡片)</h2>
      <div class="stats-demo-grid">
        <StatsCard
          title="总节点数"
          :value="1234"
          unit="个"
          :icon="ServerIcon"
          color="primary"
          :trend="'up'"
          trend-value="+12%"
          :hoverable="true"
        />

        <StatsCard
          title="在线节点"
          :value="856"
          unit="个"
          :icon="CheckCircleIcon"
          color="success"
          :trend="'up'"
          trend-value="+5%"
          :hoverable="true"
        />

        <StatsCard
          title="离线节点"
          :value="378"
          unit="个"
          :icon="CloseCircleIcon"
          color="error"
          :trend="'down'"
          trend-value="-3%"
          :hoverable="true"
        />

        <StatsCard
          title="异常节点"
          :value="23"
          unit="个"
          :icon="WarningIcon"
          color="warning"
          :hoverable="true"
        />
      </div>
    </div>

    <!-- ActionButtonGroup 测试 -->
    <div class="test-section">
      <h2>🎯 ActionButtonGroup (按钮组)</h2>
      <div class="button-demo">
        <h3>基础按钮组</h3>
        <ActionButtonGroup
          :actions="basicActions"
          @action="handleAction"
        />

        <h3>带优先级的按钮组</h3>
        <ActionButtonGroup
          :actions="priorityActions"
          @action="handleAction"
        />

        <h3>垂直布局</h3>
        <ActionButtonGroup
          :actions="basicActions"
          vertical
          @action="handleAction"
        />
      </div>
    </div>

    <!-- SmartDropdown 测试 -->
    <div class="test-section">
      <h2>📋 SmartDropdown (下拉菜单)</h2>
      <div class="dropdown-demo">
        <h3>基础下拉菜单</h3>
        <SmartDropdown
          :items="basicMenuItems"
          title="操作菜单"
          @select="handleDropdownSelect"
        />

        <h3>带分组的下拉菜单</h3>
        <SmartDropdown
          :items="groupedMenuItems"
          title="系统设置"
          @select="handleDropdownSelect"
        />

        <h3>自定义触发器</h3>
        <SmartDropdown
          :items="basicMenuItems"
          placement="bottom-right"
          @select="handleDropdownSelect"
        >
          <template #trigger>
            <n-button type="primary">
              自定义按钮
            </n-button>
          </template>
        </SmartDropdown>
      </div>
    </div>

    <!-- SmartActions 测试 -->
    <div class="test-section">
      <h2>🧠 SmartActions (智能操作)</h2>
      <div class="smart-actions-demo">
        <h3>基础智能操作</h3>
        <SmartActions
          :actions="smartActions"
          :context="{ selectedCount: selectedCount }"
          @action="handleSmartAction"
        />

        <h3>基于选择的智能操作</h3>
        <div class="selection-demo">
          <p>已选择: {{ selectedCount }} 项</p>
          <n-button @click="toggleSelection">模拟选择状态</n-button>
        </div>
      </div>
    </div>

    <!-- SmartToolbar 测试 -->
    <div class="test-section">
      <h2>🛠️ SmartToolbar (智能工具栏)</h2>
      <SmartToolbar
        :search-query="searchQuery"
        :search-placeholder="'搜索组件...'"
        :filters="toolbarFilters"
        :filter-values="filterValues"
        :tabs="toolbarTabs"
        :active-tab="activeTab"
        :primary-actions="toolbarActions"
        :smart-actions="toolbarSmartActions"
        :more-actions="toolbarMoreActions"
        :context="{ selectedItems: [] }"
        @update:searchQuery="handleSearchUpdate"
        @update:filters="handleFilterUpdate"
        @update:activeTab="handleTabChange"
        @primaryAction="handleToolbarAction"
        @smartAction="handleToolbarSmartAction"
        @moreAction="handleToolbarMoreAction"
      />
    </div>

    <!-- StatsPanel 测试 -->
    <div class="test-section">
      <h2>📈 StatsPanel (统计面板)</h2>
      <StatsPanel
        title="测试统计面板"
        :stats="panelStats"
        :searchable="true"
        :filters="panelFilters"
        :filter-values="panelFilterValues"
        :header-actions="panelHeaderActions"
        :batch-actions="panelBatchActions"
        @update:searchQuery="handlePanelSearch"
        @update:filterValues="handlePanelFilter"
        @headerAction="handlePanelHeaderAction"
        @batchAction="handlePanelBatchAction"
      />
    </div>

    <!-- ModernDataTable 测试 -->
    <div class="test-section">
      <h2>📋 ModernDataTable (现代数据表格)</h2>
      <ModernDataTable
        :columns="tableColumns"
        :data="tableData"
        :loading="tableLoading"
        :selectable="true"
        :header-actions="tableHeaderActions"
        :bulk-actions="tableBulkActions"
        @selection-change="handleTableSelection"
        @edit="handleTableEdit"
        @delete="handleTableDelete"
        @bulk-action="handleTableBulkAction"
        @header-action="handleTableHeaderAction"
      />
    </div>

    <!-- 测试结果面板 -->
    <div class="test-section results-panel">
      <h2>📝 测试结果</h2>
      <div class="results-grid">
        <div class="result-item">
          <h3>组件加载状态</h3>
          <div class="status success">✅ 所有组件加载成功</div>
        </div>
        <div class="result-item">
          <h3>最后操作</h3>
          <div class="last-action">{{ lastAction || '暂无操作' }}</div>
        </div>
        <div class="result-item">
          <h3>主题支持</h3>
          <div class="theme-test">
            <n-button @click="toggleTheme">切换主题</n-button>
            <span class="current-theme">当前: {{ isDark ? '深色' : '浅色' }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { NButton } from 'naive-ui';
import {
  ServerOutline as ServerIcon,
  CheckmarkCircle as CheckCircleIcon,
  CloseCircle as CloseCircleIcon,
  Warning as WarningIcon,
  Settings as SettingsIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  Trash as TrashIcon,
  Save as SaveIcon,
  Search as SearchIcon
} from '@vicons/ionicons5';

// 导入所有通用组件
import StatsCard from '@/components/common/StatsCard.vue';
import ActionButtonGroup from '@/components/common/ActionButtonGroup.vue';
import SmartDropdown from '@/components/common/SmartDropdown.vue';
import SmartActions from '@/components/common/SmartActions.vue';
import SmartToolbar from '@/components/common/SmartToolbar.vue';
import StatsPanel from '@/components/common/StatsPanel.vue';
import ModernDataTable from '@/components/common/ModernDataTable.vue';

// 响应式状态
const selectedCount = ref(0);
const searchQuery = ref('');
const filterValues = ref({});
const activeTab = ref('all');
const lastAction = ref('');
const isDark = ref(false);

// 表格测试数据
const tableData = ref([
  {
    id: '1',
    name: '节点1',
    server: 'server1.example.com',
    status: 'online',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: '2',
    name: '节点2',
    server: 'server2.example.com',
    status: 'offline',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: '3',
    name: '节点3',
    server: 'server3.example.com',
    status: 'online',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  }
]);

const tableLoading = ref(false);

// ActionButtonGroup 测试数据
const basicActions = [
  { key: 'save', label: '保存', type: 'primary' as const, icon: SaveIcon },
  { key: 'cancel', label: '取消', type: 'default' as const },
  { key: 'delete', label: '删除', type: 'error' as const, icon: TrashIcon }
];

const priorityActions = [
  { key: 'urgent', label: '紧急', type: 'error' as const, priority: 'high' as const, icon: WarningIcon },
  { key: 'normal', label: '普通', type: 'primary' as const, priority: 'medium' as const, icon: SaveIcon },
  { key: 'low', label: '低优先级', type: 'default' as const, priority: 'low' as const, icon: SettingsIcon }
];

// SmartDropdown 测试数据
const basicMenuItems = [
  { key: 'settings', label: '设置', icon: SettingsIcon },
  { key: 'download', label: '下载', icon: DownloadIcon },
  { key: 'refresh', label: '刷新', icon: RefreshIcon },
  { key: 'divider', type: 'divider' as const },
  { key: 'delete', label: '删除', icon: TrashIcon, type: 'danger' as const }
];

const groupedMenuItems = [
  {
    key: 'user-settings',
    label: '用户设置',
    icon: SettingsIcon
  },
  {
    key: 'divider1',
    type: 'divider' as const
  },
  {
    key: 'export',
    label: '导出数据',
    icon: DownloadIcon,
    description: '导出为JSON格式'
  },
  {
    key: 'import',
    label: '导入数据',
    description: '从文件导入'
  }
];

// SmartActions 测试数据
const smartActions = [
  {
    key: 'test-selected',
    label: '测试选中项',
    type: 'primary' as const,
    condition: (ctx: any) => ctx.selectedCount > 0,
    action: () => console.log('Testing selected items')
  },
  {
    key: 'delete-selected',
    label: '删除选中项',
    type: 'error' as const,
    condition: (ctx: any) => ctx.selectedCount > 0,
    action: () => console.log('Deleting selected items')
  },
  {
    key: 'refresh-all',
    label: '刷新全部',
    type: 'default' as const,
    action: () => console.log('Refreshing all items')
  }
];

// SmartToolbar 测试数据
const toolbarFilters = [
  {
    key: 'type',
    type: 'select' as const,
    placeholder: '组件类型',
    options: [
      { label: '全部', value: '' },
      { label: '统计组件', value: 'stats' },
      { label: '操作组件', value: 'actions' }
    ]
  }
];

const toolbarTabs = [
  { key: 'all', label: '全部组件' },
  { key: 'stats', label: '统计组件' },
  { key: 'actions', label: '操作组件' }
];

const toolbarActions = [
  { key: 'add', label: '添加', type: 'primary' as const, icon: SaveIcon }
];

const toolbarSmartActions = [
  {
    key: 'test-all',
    label: '测试所有',
    type: 'success' as const,
    action: () => console.log('Testing all components')
  }
];

const toolbarMoreActions = [
  { key: 'settings', label: '设置', icon: SettingsIcon },
  { key: 'export', label: '导出', icon: DownloadIcon }
];

// StatsPanel 测试数据
const panelStats = [
  { key: 'total', title: '总组件数', value: 7, icon: ServerIcon, color: 'primary' as const, order: 1 },
  { key: 'tested', title: '已测试', value: 7, icon: CheckCircleIcon, color: 'success' as const, order: 2 },
  { key: 'passed', title: '测试通过', value: 7, icon: CheckCircleIcon, color: 'info' as const, order: 3 }
];

const panelFilters = [
  {
    key: 'status',
    type: 'select' as const,
    placeholder: '测试状态',
    options: [
      { label: '全部', value: '' },
      { label: '通过', value: 'passed' },
      { label: '失败', value: 'failed' }
    ]
  }
];

const panelFilterValues = ref({});

const panelHeaderActions = [
  { key: 'run-tests', label: '运行测试', type: 'primary' as const, icon: RefreshIcon }
];

const panelBatchActions = [
  { key: 'export-results', label: '导出结果', type: 'default' as const }
];

// ModernDataTable 测试数据
const tableColumns = [
  { key: 'name', title: '名称', width: 200 },
  { key: 'server', title: '服务器', width: 200 },
  { key: 'status', title: '状态', width: 100 }
];

const tableHeaderActions = [
  { key: 'add-row', label: '添加行', type: 'primary' as const }
];

const tableBulkActions = [
  { key: 'delete-selected', label: '删除选中', type: 'error' as const }
];

// 事件处理方法
const handleAction = (key: string) => {
  lastAction.value = `按钮操作: ${key}`;
  console.log('Action:', key);
};

const handleDropdownSelect = (key: string, item: any) => {
  lastAction.value = `下拉菜单选择: ${key}`;
  console.log('Dropdown select:', key, item);
};

const handleSmartAction = (action: any) => {
  lastAction.value = `智能操作: ${action.key}`;
  console.log('Smart action:', action);
};

const toggleSelection = () => {
  selectedCount.value = selectedCount.value > 0 ? 0 : 3;
};

const handleSearchUpdate = (query: string) => {
  lastAction.value = `搜索更新: ${query}`;
  searchQuery.value = query;
};

const handleFilterUpdate = (filters: any) => {
  lastAction.value = `筛选更新: ${JSON.stringify(filters)}`;
  filterValues.value = filters;
};

const handleTabChange = (tab: string) => {
  lastAction.value = `标签切换: ${tab}`;
  activeTab.value = tab;
};

const handleToolbarAction = (action: string) => {
  lastAction.value = `工具栏操作: ${action}`;
};

const handleToolbarSmartAction = (action: string, params?: any) => {
  lastAction.value = `工具栏智能操作: ${action}`;
};

const handleToolbarMoreAction = (key: string, item: any) => {
  lastAction.value = `工具栏更多操作: ${key}`;
};

const handlePanelSearch = (query: string) => {
  lastAction.value = `面板搜索: ${query}`;
};

const handlePanelFilter = (filters: any) => {
  lastAction.value = `面板筛选: ${JSON.stringify(filters)}`;
  panelFilterValues.value = filters;
};

const handlePanelHeaderAction = (action: string) => {
  lastAction.value = `面板头部操作: ${action}`;
};

const handlePanelBatchAction = (action: string) => {
  lastAction.value = `面板批量操作: ${action}`;
};

const handleTableSelection = (keys: string[], items: any[]) => {
  lastAction.value = `表格选择: ${keys.length} 项`;
};

const handleTableEdit = (item: any) => {
  lastAction.value = `表格编辑: ${item.name}`;
};

const handleTableDelete = (item: any) => {
  lastAction.value = `表格删除: ${item.name}`;
};

const handleTableBulkAction = (action: string, items: any[]) => {
  lastAction.value = `表格批量操作: ${action} (${items.length} 项)`;
};

const handleTableHeaderAction = (action: string) => {
  lastAction.value = `表格头部操作: ${action}`;
};

const toggleTheme = () => {
  isDark.value = !isDark.value;
  document.documentElement.classList.toggle('dark', isDark.value);
  lastAction.value = `主题切换: ${isDark.value ? '深色' : '浅色'}`;
};
</script>

<style scoped>
/* 引入通用样式 */
@import '@/styles/common.css';

.component-test-page {
  max-width: 1400px;
  margin: 0 auto;
  padding: var(--spacing-xl);
  background: var(--bg-secondary);
  min-height: 100vh;
}

.test-header {
  text-align: center;
  margin-bottom: var(--spacing-3xl);
  padding: var(--spacing-2xl);
  background: var(--bg-primary);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
}

.test-header h1 {
  color: var(--text-primary);
  margin-bottom: var(--spacing-md);
}

.test-header p {
  color: var(--text-secondary);
  font-size: 1.125rem;
}

.test-section {
  margin-bottom: var(--spacing-3xl);
  padding: var(--spacing-xl);
  background: var(--bg-primary);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
}

.test-section h2 {
  color: var(--text-primary);
  margin-bottom: var(--spacing-lg);
  padding-bottom: var(--spacing-md);
  border-bottom: 2px solid var(--border-primary);
}

/* StatsCard 演示 */
.stats-demo-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: var(--spacing-lg);
  margin-top: var(--spacing-lg);
}

/* ButtonGroup 演示 */
.button-demo {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xl);
}

.button-demo h3 {
  color: var(--text-secondary);
  margin-bottom: var(--spacing-md);
}

/* Dropdown 演示 */
.dropdown-demo {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xl);
}

.dropdown-demo h3 {
  color: var(--text-secondary);
  margin-bottom: var(--spacing-md);
}

/* SmartActions 演示 */
.smart-actions-demo {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.smart-actions-demo h3 {
  color: var(--text-secondary);
  margin-bottom: var(--spacing-md);
}

.selection-demo {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-lg);
  background: var(--bg-secondary);
  border-radius: var(--radius-md);
}

/* 结果面板 */
.results-panel {
  background: linear-gradient(135deg, var(--primary-50) 0%, var(--bg-primary) 100%);
  border: 2px solid var(--primary-200);
}

.results-panel h2 {
  color: var(--primary-600);
}

.results-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: var(--spacing-lg);
  margin-top: var(--spacing-lg);
}

.result-item {
  padding: var(--spacing-lg);
  background: var(--bg-primary);
  border-radius: var(--radius-md);
  border: 1px solid var(--border-primary);
}

.result-item h3 {
  color: var(--text-primary);
  margin-bottom: var(--spacing-md);
}

.status.success {
  color: var(--success);
  font-weight: 600;
}

.last-action {
  color: var(--text-secondary);
  font-family: 'SF Mono', 'Monaco', 'Consolas', monospace;
  font-size: 0.875rem;
  background: var(--bg-secondary);
  padding: var(--spacing-sm);
  border-radius: var(--radius-sm);
}

.theme-test {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.current-theme {
  color: var(--text-tertiary);
  font-size: 0.875rem;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .component-test-page {
    padding: var(--spacing-lg);
  }

  .test-header {
    padding: var(--spacing-lg);
  }

  .test-section {
    padding: var(--spacing-lg);
  }

  .stats-demo-grid {
    grid-template-columns: 1fr;
  }

  .results-grid {
    grid-template-columns: 1fr;
  }
}

/* 动画效果 */
.test-section {
  animation: fadeInUp 0.6s var(--ease-out-cubic);
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>