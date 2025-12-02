<template>
  <div class="search-sidebar" :class="{ 'collapsed': sidebarCollapsed }">
    <!-- 折叠按钮 -->
    <div class="sidebar-toggle" @click="$emit('toggle-sidebar')">
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
            :model-value="searchQuery"
            @update:model-value="$emit('update:searchQuery', $event)"
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
            <n-checkbox-group :model-value="selectedProtocols" @update:model-value="$emit('update:selectedProtocols', $event)">
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
            <n-checkbox-group :model-value="selectedStatuses" @update:model-value="$emit('update:selectedStatuses', $event)">
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
            :model-value="latencyFilter"
            @update:model-value="$emit('update:latencyFilter', $event)"
            placeholder="选择延迟范围"
            :options="latencyOptions"
            clearable
          />
        </div>

        <!-- 清除筛选 -->
        <div class="form-group">
          <n-button block @click="$emit('clear-filters')" :disabled="!hasFilters">
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
</template>

<script setup lang="ts">
import { computed } from 'vue';
import {
  Search as SearchIcon,
  ChevronBack as ChevronBackIcon,
  ChevronForward as ChevronForwardIcon,
  Server as NodesIcon,
  CheckmarkCircle as CheckCircleIcon,
  CloseCircle as CloseCircleIcon,
  Warning as WarningIcon,
  Filter as FilterIcon
} from '@vicons/ionicons5';

interface Props {
  sidebarCollapsed: boolean;
  searchQuery: string;
  selectedProtocols: string[];
  selectedStatuses: string[];
  latencyFilter: string;
  hasFilters: boolean;
  protocolOptions: { label: string; value: string }[];
  activeView: string;
  quickFilterOptions: Array<{
    key: string;
    label: string;
    icon: any;
    active: boolean;
    action: () => void;
  }>;
}

const props = defineProps<Props>();

defineEmits<{
  'toggle-sidebar': [];
  'update:searchQuery': [value: string];
  'update:selectedProtocols': [value: string[]];
  'update:selectedStatuses': [value: string[]];
  'update:latencyFilter': [value: string];
  'clear-filters': [];
}>();

// 状态选项
const statusListOptions = [
  { label: '在线', value: 'online' },
  { label: '离线', value: 'offline' },
  { label: '测试中', value: 'testing' },
  { label: '未测试', value: 'pending' }
];

// 延迟选项
const latencyOptions = [
  { label: '优秀 (< 100ms)', value: 'excellent' },
  { label: '良好 (100-300ms)', value: 'good' },
  { label: '一般 (300-1000ms)', value: 'medium' },
  { label: '较差 (> 1000ms)', value: 'poor' },
];
</script>

<style scoped>
.search-sidebar {
  background: #f8fafc;
  border-right: 1px solid #e2e8f0;
  padding: 24px;
  position: relative;
  transition: all 0.3s ease;
  overflow: hidden;
}

.search-sidebar.collapsed {
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

.search-sidebar.collapsed .sidebar-toggle {
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

/* 响应式优化 */
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
.search-sidebar.collapsed .form-group {
  display: none;
}

.search-sidebar.collapsed .sidebar-toggle {
  display: flex;
}

.search-sidebar.collapsed .collapsed-filters {
  display: flex;
}

@media (max-width: 1024px) {
  .search-sidebar {
    display: none;
  }

  .search-sidebar.collapsed {
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
</style>