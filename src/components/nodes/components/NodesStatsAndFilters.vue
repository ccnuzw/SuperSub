<template>
  <div class="stats-and-filters">
    <!-- 页面头部 -->
    <n-page-header title="手动节点管理" class="page-header">
      <template #extra>
        <n-space>
          <n-button
            type="primary"
            @click="$emit('openModal', 'addNode')"
          >
            新增节点
          </n-button>
          <n-button
            @click="$emit('openModal', 'batchImport')"
          >
            批量导入
          </n-button>
        </n-space>
      </template>
    </n-page-header>

    <!-- 统计信息 -->
    <div class="stats-section">
      <n-grid :cols="isMobile ? 2 : 6" :x-gap="16" :y-gap="16">
        <n-grid-item>
          <n-statistic label="总节点数" :value="statistics.total" />
        </n-grid-item>
        <n-grid-item>
          <n-statistic
            label="在线节点"
            :value="statistics.online"
            value-style="color: #52c41a"
          />
        </n-grid-item>
        <n-grid-item>
          <n-statistic
            label="离线节点"
            :value="statistics.offline"
            value-style="color: #ff4d4f"
          />
        </n-grid-item>
        <n-grid-item>
          <n-statistic
            label="健康率"
            :value="statistics.healthyRate"
            suffix="%"
            :value-style="{ color: getHealthRateColor(statistics.healthyRate) }"
          />
        </n-grid-item>
        <n-grid-item>
          <n-statistic label="平均延迟" :value="statistics.avgLatency" suffix="ms" />
        </n-grid-item>
        <n-grid-item v-if="hasCheckedNodes">
          <n-button
            type="primary"
            :loading="isCheckingHealth"
            @click="$emit('batchTestSelected')"
          >
            测试选中 ({{ hasCheckedNodes ? checkedCount : 0 }})
          </n-button>
        </n-grid-item>
      </n-grid>
    </div>

    <!-- 过滤器 -->
    <div class="filters-section">
      <n-space align="center" wrap>
        <!-- 搜索框 -->
        <n-input
          v-model:value="localKeyword"
          placeholder="搜索节点名称或服务器"
          clearable
          style="min-width: 200px"
          @update:value="handleSearchChange"
          @clear="handleClearSearch"
        >
          <template #prefix>
            <n-icon><SearchOutline /></n-icon>
          </template>
        </n-input>

        <!-- 协议过滤 -->
        <n-select
          v-model:value="localProtocolFilter"
          :options="protocolOptions"
          placeholder="协议类型"
          multiple
          clearable
          style="width: 150px"
          @update:value="handleProtocolChange"
        />

        <!-- 状态过滤 -->
        <n-select
          v-model:value="localStatusFilter"
          :options="statusOptions"
          placeholder="节点状态"
          multiple
          clearable
          style="width: 150px"
          @update:value="handleStatusChange"
        />

        <!-- 排序 -->
        <n-select
          v-model:value="localSortBy"
          :options="sortOptions"
          placeholder="排序方式"
          style="width: 150px"
          @update:value="handleSortChange"
        />

        <!-- 批量操作 -->
        <n-dropdown
          v-if="hasCheckedNodes"
          :options="batchActionOptions"
          placement="bottom-end"
          @select="handleBatchAction"
        >
          <n-button>批量操作 ({{ checkedCount }})</n-button>
        </n-dropdown>

        <!-- 清除过滤器 -->
        <n-button
          v-if="hasActiveFilters"
          @click="$emit('resetFilters')"
        >
          清除过滤
        </n-button>
      </n-space>

      <!-- 过滤条件摘要 -->
      <div v-if="hasActiveFilters" class="filter-summary">
        <n-text depth="3">{{ filterSummary }}</n-text>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useIsMobile } from '@/composables/useMediaQuery';
import { SearchOutline } from '@vicons/ionicons5';
import type { NodeStatistics, ProtocolDistribution } from '@/composables/useNodeStats';
import type { FilterConfig } from '@/composables/useNodeFilters';

// Props
interface Props {
  statistics: NodeStatistics;
  protocolDistribution: ProtocolDistribution[];
  filterConfig: FilterConfig;
  hasActiveFilters: boolean;
  filterSummary: string;
  hasCheckedNodes: boolean;
  isCheckingHealth: boolean;
  checkedCount?: number;
}

const props = withDefaults(defineProps<Props>(), {
  checkedCount: 0,
});

// Emits
const emit = defineEmits<{
  search: [keyword: string];
  updateFilter: [key: keyof FilterConfig, value: any];
  resetFilters: [];
  clearSearch: [];
  batchTestSelected: [];
  batchDeleteSelected: [];
  batchMoveToGroup: [];
  sortSelected: [];
  deduplicateSelected: [];
  checkAllHealth: [];
  openModal: [modal: string];
}>();

// 响应式数据
const isMobile = useIsMobile();
const localKeyword = ref(props.filterConfig.keyword);
const localProtocolFilter = ref<string[]>(props.filterConfig.protocol);
const localStatusFilter = ref<string[]>(props.filterConfig.status);
const localSortBy = ref(props.filterConfig.sortBy);

// 配置选项
const protocolOptions = [
  { label: '全部', value: 'all' },
  { label: 'VMess', value: 'vmess' },
  { label: 'VLESS', value: 'vless' },
  { label: 'Trojan', value: 'trojan' },
  { label: 'Shadowsocks', value: 'ss' },
  { label: 'ShadowsocksR', value: 'ssr' },
  { label: 'Hysteria2', value: 'hysteria2' },
  { label: 'TUIC', value: 'tuic' },
];

const statusOptions = [
  { label: '全部', value: 'all' },
  { label: '在线', value: 'online' },
  { label: '离线', value: 'offline' },
  { label: '错误', value: 'error' },
  { label: '测试中', value: 'testing' },
  { label: '未测试', value: 'pending' },
];

const sortOptions = [
  { label: '默认排序', value: 'default' },
  { label: '按名称', value: 'name' },
  { label: '按延迟', value: 'latency' },
  { label: '按创建时间', value: 'created_at' },
  { label: '按更新时间', value: 'updated_at' },
];

const batchActionOptions = [
  { label: '批量删除', key: 'delete' },
  { label: '批量测试', key: 'test' },
  { label: '移动到分组', key: 'move' },
  { label: '按健康状态排序', key: 'sortByHealth' },
  { label: '按延迟排序', key: 'sortByLatency' },
  { label: '去重', key: 'deduplicate' },
];

// 方法
const handleSearchChange = (value: string) => {
  emit('search', value);
};

const handleClearSearch = () => {
  localKeyword.value = '';
  emit('clearSearch');
};

const handleProtocolChange = (value: string[]) => {
  emit('updateFilter', 'protocol', value);
};

const handleStatusChange = (value: string[]) => {
  emit('updateFilter', 'status', value);
};

const handleSortChange = (value: string) => {
  emit('updateFilter', 'sortBy', value);
};

const handleBatchAction = (key: string) => {
  switch (key) {
    case 'delete':
      emit('batchDeleteSelected');
      break;
    case 'test':
      emit('batchTestSelected');
      break;
    case 'move':
      emit('batchMoveToGroup');
      break;
    case 'sortByHealth':
      emit('sortSelected');
      break;
    case 'sortByLatency':
      emit('deduplicateSelected');
      break;
    case 'deduplicate':
      emit('deduplicateSelected');
      break;
  }
};

const getHealthRateColor = (rate: number): string => {
  if (rate >= 90) return '#52c41a';
  if (rate >= 75) return '#1890ff';
  if (rate >= 50) return '#faad14';
  if (rate >= 25) return '#ff7a45';
  return '#ff4d4f';
};

// 监听外部状态变化
watch(
  () => props.filterConfig,
  (newConfig) => {
    localKeyword.value = newConfig.keyword;
    localProtocolFilter.value = newConfig.protocol;
    localStatusFilter.value = newConfig.status;
    localSortBy.value = newConfig.sortBy;
  },
  { deep: true }
);
</script>

<style scoped>
.stats-and-filters {
  margin-bottom: 16px;
}

.page-header {
  margin-bottom: 24px;
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

.filter-summary {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
}

@media (max-width: 768px) {
  .stats-section,
  .filters-section {
    padding: 12px;
  }
}
</style>