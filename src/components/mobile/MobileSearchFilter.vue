<template>
  <div class="mobile-search-filter" :class="{ active: isActive }">
    <!-- 搜索头部 -->
    <div class="search-header">
      <div class="search-input-wrapper">
        <n-input
          ref="searchInput"
          v-model:value="searchQuery"
          placeholder="搜索节点名称或服务器地址..."
          class="search-input"
          clearable
          @blur="handleBlur"
          @keyup.enter="handleSearch"
        >
          <template #prefix>
            <n-icon :component="SearchIcon" />
          </template>
        </n-input>
      </div>

      <n-button
        text
        size="small"
        @click="closeSearch"
        class="cancel-btn"
      >
        取消
      </n-button>
    </div>

    <!-- 快速筛选标签 -->
    <div class="quick-filters">
      <div class="filter-section">
        <div class="section-title">快速筛选</div>
        <div class="filter-tags">
          <n-tag
            v-for="option in quickFilterOptions"
            :key="option.key"
            :type="getActiveFilters(option.type).includes(option.key) ? 'primary' : 'default'"
            :checkable="true"
            @click="toggleQuickFilter(option)"
            class="filter-tag"
          >
            <template #icon>
              <n-icon :component="option.icon" />
            </template>
            {{ option.label }}
          </n-tag>
        </div>
      </div>

      <!-- 协议筛选 -->
      <div class="filter-section">
        <div class="section-title">协议类型</div>
        <div class="filter-tags">
          <n-tag
            v-for="protocol in protocolOptions"
            :key="protocol.value"
            :type="filters.protocols.includes(protocol.value) ? 'primary' : 'default'"
            :checkable="true"
            @click="toggleProtocol(protocol.value)"
            class="filter-tag"
          >
            {{ protocol.label }}
          </n-tag>
        </div>
      </div>

      <!-- 分组筛选 -->
      <div v-if="groups.length > 0" class="filter-section">
        <div class="section-title">分组</div>
        <div class="filter-tags">
          <n-tag
            v-for="group in groupOptions"
            :key="group.value"
            :type="filters.groupId === group.value ? 'primary' : 'default'"
            :checkable="true"
            @click="toggleGroup(group.value)"
            class="filter-tag"
          >
            <template #icon>
              <n-icon :component="FolderIcon" />
            </template>
            {{ group.label }}
          </n-tag>
        </div>
      </div>
    </div>

    <!-- 高级选项 -->
    <div class="advanced-options">
      <n-collapse>
        <n-collapse-item title="高级筛选" name="advanced">
          <div class="advanced-filters">
            <!-- 状态筛选 -->
            <div class="advanced-filter">
              <div class="filter-title">节点状态</div>
              <n-checkbox-group v-model:value="filters.statuses">
                <n-space>
                  <n-checkbox
                    v-for="status in statusOptions"
                    :key="status.value"
                    :value="status.value"
                    :label="status.label"
                  />
                </n-space>
              </n-checkbox-group>
            </div>

            <!-- 延迟筛选 -->
            <div class="advanced-filter">
              <div class="filter-title">延迟范围</div>
              <n-space>
                <n-input-number
                  v-model:value="filters.latencyRange[0]"
                  placeholder="最小延迟"
                  :min="0"
                  :max="9999"
                  style="width: 100px;"
                />
                <span>-</span>
                <n-input-number
                  v-model:value="filters.latencyRange[1]"
                  placeholder="最大延迟"
                  :min="0"
                  :max="9999"
                  style="width: 100px;"
                />
                <span>ms</span>
              </n-space>
            </div>

            <!-- 时间范围 -->
            <div class="advanced-filter">
              <div class="filter-title">创建时间</div>
              <n-radio-group v-model:value="filters.timeRange">
                <n-space>
                  <n-radio value="all">全部时间</n-radio>
                  <n-radio value="today">今天</n-radio>
                  <n-radio value="week">本周</n-radio>
                  <n-radio value="month">本月</n-radio>
                </n-space>
              </n-radio-group>
            </div>
          </div>
        </n-collapse-item>
      </n-collapse>
    </div>

    <!-- 筛选结果和操作 -->
    <div class="filter-footer">
      <div class="filter-summary">
        <span>找到 {{ resultCount }} 个节点</span>
        <span v-if="hasActiveFilters" class="clear-filters" @click="clearAllFilters">
          清空筛选
        </span>
      </div>
      <div class="filter-actions">
        <n-button size="small" @click="resetFilters">
          重置
        </n-button>
        <n-button size="small" type="primary" @click="applyFilters">
          应用筛选
        </n-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, nextTick, watch } from 'vue';
import { useIsMobile } from '@/composables/useMediaQuery';
import {
  Search as SearchIcon,
  CheckmarkCircle as OnlineIcon,
  CloseCircle as OfflineIcon,
  Warning as ErrorIcon,
  Time as PendingIcon,
  Folder as FolderIcon
} from '@vicons/ionicons5';
import type { NodeGroup } from '@/types/entities';

interface Props {
  show: boolean;
  groups: NodeGroup[];
  initialFilters?: any;
}

const props = withDefaults(defineProps<Props>(), {
  show: false,
  groups: () => [],
  initialFilters: () => ({})
});

const emit = defineEmits<{
  'update:show': [value: boolean];
  'search': [query: string];
  'filter': [filters: any];
  'clear': [];
}>();

const isMobile = useIsMobile();
const searchInput = ref();

// 状态管理
const isActive = computed({
  get: () => props.show,
  set: (value) => emit('update:show', value)
});

const searchQuery = ref('');
const resultCount = ref(0);

// 筛选状态
const filters = reactive({
  protocols: [] as string[],
  statuses: [] as string[],
  groupId: '',
  latencyRange: [0, 9999] as [number, number],
  timeRange: 'all'
});

// 快速筛选选项
const quickFilterOptions = [
  { key: 'online', label: '在线', type: 'status', icon: OnlineIcon },
  { key: 'offline', label: '离线', type: 'status', icon: OfflineIcon },
  { key: 'error', label: '错误', type: 'status', icon: ErrorIcon },
  { key: 'pending', label: '未测试', type: 'status', icon: PendingIcon }
];

// 协议选项
const protocolOptions = computed(() => [
  { label: 'VMess', value: 'vmess' },
  { label: 'VLESS', value: 'vless' },
  { label: 'Trojan', value: 'trojan' },
  { label: 'SS', value: 'ss' },
  { label: 'SSR', value: 'ssr' },
  { label: 'Hysteria2', value: 'hysteria2' },
  { label: 'TUIC', value: 'tuic' }
]);

// 分组选项
const groupOptions = computed(() => [
  { label: '全部分组', value: '' },
  ...props.groups.map(group => ({
    label: group.name,
    value: group.id
  }))
]);

// 状态选项
const statusOptions = [
  { label: '在线', value: 'online' },
  { label: '离线', value: 'offline' },
  { label: '错误', value: 'error' },
  { label: '测试中', value: 'testing' },
  { label: '未测试', value: 'pending' }
];

// 计算属性
const hasActiveFilters = computed(() => {
  return filters.protocols.length > 0 ||
         filters.statuses.length > 0 ||
         filters.groupId !== '' ||
         searchQuery.value !== '';
});

// 方法
const closeSearch = () => {
  isActive.value = false;
};

const handleBlur = () => {
  // 延迟关闭，给用户时间点击其他元素
  setTimeout(() => {
    if (!searchInput.value?.inputEl?.matches(':focus')) {
      closeSearch();
    }
  }, 200);
};

const handleSearch = () => {
  emit('search', searchQuery.value);
  nextTick(() => {
    applyFilters();
  });
};

const toggleQuickFilter = (option: any) => {
  if (option.type === 'status') {
    const index = filters.statuses.indexOf(option.key);
    if (index > -1) {
      filters.statuses.splice(index, 1);
    } else {
      filters.statuses.push(option.key);
    }
  }
};

const toggleProtocol = (protocol: string) => {
  const index = filters.protocols.indexOf(protocol);
  if (index > -1) {
    filters.protocols.splice(index, 1);
  } else {
    filters.protocols.push(protocol);
  }
};

const toggleGroup = (groupId: string) => {
  filters.groupId = filters.groupId === groupId ? '' : groupId;
};

const getActiveFilters = (type: string) => {
  if (type === 'status') {
    return filters.statuses;
  }
  return [];
};

const clearAllFilters = () => {
  searchQuery.value = '';
  filters.protocols = [];
  filters.statuses = [];
  filters.groupId = '';
  filters.latencyRange = [0, 9999];
  filters.timeRange = 'all';
  emit('clear');
};

const resetFilters = () => {
  clearAllFilters();
};

const applyFilters = () => {
  emit('filter', {
    search: searchQuery.value,
    protocols: filters.protocols,
    statuses: filters.statuses,
    groupId: filters.groupId,
    latencyRange: filters.latencyRange,
    timeRange: filters.timeRange
  });
};

// 监听显示状态变化
watch(() => props.show, async (newValue) => {
  if (newValue) {
    await nextTick();
    searchInput.value?.focus();
  }
});

// 监听初始筛选器
watch(() => props.initialFilters, (newFilters) => {
  if (newFilters) {
    searchQuery.value = newFilters.search || '';
    filters.protocols = newFilters.protocols || [];
    filters.statuses = newFilters.statuses || [];
    filters.groupId = newFilters.groupId || '';
    filters.latencyRange = newFilters.latencyRange || [0, 9999];
    filters.timeRange = newFilters.timeRange || 'all';
  }
}, { immediate: true, deep: true });
</script>

<style scoped>
.mobile-search-filter {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: white;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  transform: translateY(100%);
  transition: transform 0.3s ease;
}

.mobile-search-filter.active {
  transform: translateY(0);
}

.search-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  border-bottom: 1px solid #f0f0f0;
  background: white;
}

.search-input-wrapper {
  flex: 1;
}

.search-input {
  font-size: 16px; /* 防止 iOS 放大 */
}

.cancel-btn {
  flex-shrink: 0;
  font-size: 16px;
}

.quick-filters {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.filter-section {
  margin-bottom: 24px;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: #666;
  margin-bottom: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.filter-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.filter-tag {
  cursor: pointer;
  transition: all 0.2s ease;
  user-select: none;
}

.filter-tag:hover {
  transform: translateY(-1px);
}

.advanced-options {
  padding: 0 16px;
}

.advanced-filters {
  padding: 16px 0;
}

.advanced-filter {
  margin-bottom: 20px;
}

.filter-title {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 12px;
  color: #333;
}

.filter-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-top: 1px solid #f0f0f0;
  background: #fafafa;
}

.filter-summary {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 14px;
  color: #666;
}

.clear-filters {
  color: #1890ff;
  cursor: pointer;
  text-decoration: underline;
}

.filter-actions {
  display: flex;
  gap: 8px;
}

/* 响应式调整 */
@media (max-width: 380px) {
  .search-header {
    padding: 12px;
  }

  .quick-filters {
    padding: 12px;
  }

  .filter-footer {
    padding: 12px;
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }

  .filter-actions {
    justify-content: stretch;
  }

  .filter-actions .n-button {
    flex: 1;
  }
}

/* 深色模式支持 */
@media (prefers-color-scheme: dark) {
  .mobile-search-filter {
    background: #1a1a1a;
    color: white;
  }

  .search-header {
    background: #1a1a1a;
    border-bottom-color: #333;
  }

  .section-title {
    color: #ccc;
  }

  .filter-footer {
    background: #222;
    border-top-color: #333;
  }

  .filter-summary {
    color: #ccc;
  }
}

/* 动画效果 */
.filter-tag {
  animation: fadeInUp 0.2s ease;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>