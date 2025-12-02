<template>
  <div class="stats-panel">
    <!-- 页面头部 -->
    <div v-if="title || headerActions" class="panel-header">
      <n-page-header v-if="title" :title="title" class="page-header">
        <template #extra v-if="headerActions">
          <ActionButtonGroup
            :actions="headerActions"
            size="small"
            @action="handleHeaderAction"
          />
        </template>
      </n-page-header>
    </div>

    <!-- 统计信息网格 -->
    <div class="stats-section">
      <n-grid :cols="responsiveCols" :x-gap="16" :y-gap="16">
        <n-grid-item
          v-for="stat in computedStats"
          :key="stat.key"
        >
          <StatsCard
            :title="stat.title"
            :value="stat.value"
            :unit="stat.unit"
            :subtitle="stat.subtitle"
            :icon="stat.icon"
            :icon-color="stat.iconColor"
            :color="stat.color"
            :trend="stat.trend"
            :trend-value="stat.trendValue"
            :formatter="stat.formatter"
            :bordered="stat.bordered"
            :hoverable="stat.hoverable"
          />
        </n-grid-item>
      </n-grid>
    </div>

    <!-- 过滤器区域 -->
    <div v-if="filters && filters.length > 0" class="filters-section">
      <n-space align="center" wrap>
        <!-- 搜索框 -->
        <n-input
          v-if="searchable"
          v-model:value="localSearchQuery"
          :placeholder="searchPlaceholder"
          clearable
          style="min-width: 200px"
          @update:value="handleSearchChange"
          @clear="handleClearSearch"
        >
          <template #prefix>
            <n-icon><SearchIcon /></n-icon>
          </template>
        </n-input>

        <!-- 动态筛选器 -->
        <div v-for="filter in filters" :key="filter.key" class="filter-item">
          <n-select
            v-if="filter.type === 'select'"
            v-model:value="localFilterValues[filter.key]"
            :placeholder="filter.placeholder"
            :options="filter.options"
            :multiple="filter.multiple"
            clearable
            style="width: 150px"
            @update:value="handleFilterChange"
          />

          <n-date-picker
            v-else-if="filter.type === 'date'"
            v-model:value="localFilterValues[filter.key]"
            :placeholder="filter.placeholder"
            clearable
            style="width: 150px"
            @update:value="handleFilterChange"
          />
        </div>

        <!-- 批量操作 -->
        <ActionButtonGroup
          v-if="batchActions && batchActions.length > 0"
          :actions="batchActions"
          size="small"
          @action="handleBatchAction"
        />

        <!-- 清除过滤器 -->
        <n-button
          v-if="hasActiveFilters"
          @click="handleClearFilters"
        >
          清除过滤
        </n-button>
      </n-space>

      <!-- 过滤条件摘要 -->
      <div v-if="hasActiveFilters && filterSummary" class="filter-summary">
        <n-text depth="3">{{ filterSummary }}</n-text>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useIsMobile } from '@/composables/useMediaQuery';
import { Search as SearchIcon } from '@vicons/ionicons5';
import StatsCard from './StatsCard.vue';
import ActionButtonGroup from './ActionButtonGroup.vue';
import type { ActionButton } from './ActionButtonGroup.vue';

// 统计项接口
export interface StatItem {
  key: string;
  title: string;
  value: number | string;
  unit?: string;
  subtitle?: string;
  icon?: any;
  iconColor?: string;
  color?: 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info';
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  formatter?: (value: number | string) => string;
  bordered?: boolean;
  hoverable?: boolean;
  // 条件显示
  condition?: (context: any) => boolean;
  // 排序权重
  order?: number;
}

// 筛选器配置接口
export interface FilterConfig {
  key: string;
  type: 'select' | 'date' | 'input';
  placeholder: string;
  options?: Array<{ label: string; value: string | number }>;
  multiple?: boolean;
}

// Props
interface Props {
  // 基础配置
  title?: string;
  stats: StatItem[];
  context?: any;

  // 搜索和筛选
  searchable?: boolean;
  searchPlaceholder?: string;
  searchQuery?: string;
  filters?: FilterConfig[];
  filterValues?: Record<string, any>;
  filterSummary?: string;

  // 操作按钮
  headerActions?: ActionButton[];
  batchActions?: ActionButton[];

  // 响应式配置
  cols?: number;
  mobileCols?: number;
}

const props = withDefaults(defineProps<Props>(), {
  title: '',
  stats: () => [],
  context: () => ({}),
  searchable: false,
  searchPlaceholder: '搜索...',
  searchQuery: '',
  filters: () => [],
  filterValues: () => ({}),
  filterSummary: '',
  headerActions: () => [],
  batchActions: () => [],
  cols: 6,
  mobileCols: 2
});

// Emits
const emit = defineEmits<{
  'update:searchQuery': [value: string];
  'update:filterValues': [value: Record<string, any>];
  'headerAction': [action: string];
  'batchAction': [action: string];
  'clearFilters': [];
  'clearSearch': [];
}>();

// 响应式数据
const isMobile = useIsMobile();
const localSearchQuery = ref(props.searchQuery);
const localFilterValues = ref({ ...props.filterValues });

// 计算属性
const responsiveCols = computed(() => {
  return isMobile.value ? props.mobileCols : props.cols;
});

const computedStats = computed(() => {
  return props.stats
    // 根据条件过滤
    .filter(stat => !stat.condition || stat.condition(props.context))
    // 按order排序
    .sort((a, b) => (a.order || 0) - (b.order || 0));
});

const hasActiveFilters = computed(() => {
  return Object.values(localFilterValues.value).some(value =>
    value !== '' && value !== null && value !== undefined &&
    (!Array.isArray(value) || value.length > 0)
  );
});

// 事件处理方法
const handleSearchChange = (value: string) => {
  localSearchQuery.value = value;
  emit('update:searchQuery', value);
};

const handleClearSearch = () => {
  localSearchQuery.value = '';
  emit('clearSearch');
};

const handleFilterChange = () => {
  emit('update:filterValues', localFilterValues.value);
};

const handleClearFilters = () => {
  localFilterValues.value = {};
  emit('clearFilters');
};

const handleHeaderAction = (actionKey: string) => {
  emit('headerAction', actionKey);
};

const handleBatchAction = (actionKey: string) => {
  emit('batchAction', actionKey);
};

// 监听外部状态变化
watch(() => props.searchQuery, (newValue) => {
  localSearchQuery.value = newValue;
});

watch(() => props.filterValues, (newValues) => {
  localFilterValues.value = { ...newValues };
}, { deep: true });

// 暴露方法给父组件
defineExpose({
  clearAll: () => {
    localSearchQuery.value = '';
    localFilterValues.value = {};
  },
  getFilterValues: () => localFilterValues.value,
  getSearchQuery: () => localSearchQuery.value
});
</script>

<style scoped>
.stats-panel {
  margin-bottom: 16px;
}

.panel-header {
  margin-bottom: 24px;
}

.page-header {
  margin-bottom: 0;
}

.stats-section {
  margin-bottom: 24px;
  padding: 16px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.filters-section {
  padding: 16px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.filter-item {
  display: flex;
  align-items: center;
}

.filter-summary {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .stats-section,
  .filters-section {
    padding: 12px;
  }

  .filter-item {
    width: 100%;
  }

  .filter-item :deep(.n-select),
  .filter-item :deep(.n-date-picker) {
    width: 100%;
  }
}

/* 深色主题支持 */
.dark .stats-section,
.dark .filters-section {
  background: #18181c;
  border: 1px solid #303030;
}

.dark .filter-summary {
  border-top-color: #303030;
}
</style>