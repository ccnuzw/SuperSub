<template>
  <div class="smart-toolbar">
    <!-- 左侧：搜索和筛选 -->
    <div class="toolbar-section toolbar-left">
      <n-input
        v-model:value="localSearchQuery"
        :placeholder="searchPlaceholder"
        class="search-input"
        clearable
        @update:value="handleSearchUpdate"
      >
        <template #prefix>
          <n-icon :component="SearchIcon" />
        </template>
      </n-input>

      <!-- 动态筛选器 -->
      <div v-for="filter in filters" :key="filter.key" class="filter-container">
        <n-select
          v-if="filter.type === 'select'"
          v-model:value="localFilters[filter.key]"
          :placeholder="filter.placeholder"
          :options="filter.options"
          :multiple="filter.multiple"
          clearable
          class="filter-select"
          @update:value="handleFilterUpdate"
        />

        <n-date-picker
          v-else-if="filter.type === 'date'"
          v-model:value="localFilters[filter.key]"
          :placeholder="filter.placeholder"
          clearable
          class="filter-date"
          @update:value="handleFilterUpdate"
        />
      </div>
    </div>

    <!-- 中间：标签页或分组导航 -->
    <div v-if="tabs && tabs.length > 0" class="toolbar-section toolbar-center">
      <n-tabs
        v-model:value="localActiveTab"
        type="segment"
        @update:value="handleTabChange"
        class="group-tabs"
        scrollable
      >
        <n-tab-pane
          v-for="tab in tabs"
          :key="tab.key"
          :name="tab.key"
          :tab="tab.label"
        />
      </n-tabs>
    </div>

    <!-- 右侧：操作区 -->
    <div class="toolbar-section toolbar-right">
      <!-- 常用操作按钮 -->
      <ActionButtonGroup
        :actions="primaryActions"
        size="medium"
        @action="handlePrimaryAction"
      />

      <!-- 智能推荐操作 -->
      <SmartActions
        v-if="smartActions.length > 0"
        :actions="smartActions"
        :context="context"
        @action="handleSmartAction"
      />

      <!-- 更多操作下拉 -->
      <SmartDropdown
        v-if="moreActions.length > 0"
        :items="moreActions"
        placement="bottom-right"
        @select="handleMoreAction"
      >
        <template #trigger>
          <n-button circle>
            <template #icon>
              <n-icon :component="MoreIcon" />
            </template>
          </n-button>
        </template>
      </SmartDropdown>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { Search as SearchIcon, EllipsisHorizontal as MoreIcon } from '@vicons/ionicons5';
import ActionButtonGroup from './ActionButtonGroup.vue';
import SmartActions from './SmartActions.vue';
import SmartDropdown from './SmartDropdown.vue';
import type { ActionButton } from './ActionButtonGroup.vue';
import type { MenuItem } from './SmartDropdown.vue';
import type { SmartAction } from './SmartActions.vue';

// 筛选器配置接口
export interface FilterConfig {
  key: string;
  type: 'select' | 'date' | 'input';
  placeholder: string;
  options?: Array<{ label: string; value: string | number }>;
  multiple?: boolean;
}

// 标签页配置接口
export interface TabConfig {
  key: string;
  label: string;
  badge?: string | number;
}

// Props
interface Props {
  // 搜索配置
  searchQuery: string;
  searchPlaceholder?: string;

  // 筛选配置
  filters?: FilterConfig[];
  filterValues?: Record<string, any>;

  // 标签页配置
  tabs?: TabConfig[];
  activeTab?: string;

  // 操作配置
  primaryActions?: ActionButton[];
  smartActions?: SmartAction[];
  moreActions?: MenuItem[];

  // 上下文数据
  context?: any;
}

const props = withDefaults(defineProps<Props>(), {
  searchPlaceholder: '搜索...',
  filters: () => [],
  filterValues: () => ({}),
  tabs: () => [],
  activeTab: '',
  primaryActions: () => [],
  smartActions: () => [],
  moreActions: () => [],
  context: () => ({})
});

// Emits
const emit = defineEmits<{
  'update:searchQuery': [value: string];
  'update:filters': [value: Record<string, any>];
  'update:activeTab': [value: string];
  'primaryAction': [action: string];
  'smartAction': [action: string, params?: any];
  'moreAction': [key: string, item: MenuItem];
}>();

// 本地响应式数据
const localSearchQuery = ref(props.searchQuery);
const localFilters = ref({ ...props.filterValues });
const localActiveTab = ref(props.activeTab);

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

const handlePrimaryAction = (actionKey: string) => {
  emit('primaryAction', actionKey);
};

const handleSmartAction = (action: SmartAction, params?: any) => {
  emit('smartAction', action.key, params);
};

const handleMoreAction = (key: string, item: MenuItem) => {
  emit('moreAction', key, item);
};

// 监听外部props变化
watch(() => props.searchQuery, (newValue) => {
  localSearchQuery.value = newValue;
});

watch(() => props.filterValues, (newValues) => {
  localFilters.value = { ...newValues };
}, { deep: true });

watch(() => props.activeTab, (newTab) => {
  localActiveTab.value = newTab;
});

// 暴露方法给父组件
defineExpose({
  clearSearch: () => {
    localSearchQuery.value = '';
    emit('update:searchQuery', '');
  },
  clearFilters: () => {
    localFilters.value = {};
    emit('update:filters', {});
  },
  reset: () => {
    localSearchQuery.value = '';
    localFilters.value = {};
    localActiveTab.value = props.tabs[0]?.key || '';
  }
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

.filter-container {
  display: flex;
  align-items: center;
}

.filter-select,
.filter-date {
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

  .filter-select,
  .filter-date {
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

  .filter-container {
    width: 100%;
  }

  .filter-select,
  .filter-date {
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