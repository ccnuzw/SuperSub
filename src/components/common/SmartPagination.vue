<template>
  <div class="smart-pagination" v-if="showPagination">
    <n-pagination
      :model-value="currentPage"
      :page-size="pageSize"
      :item-count="totalItems"
      :page-sizes="pageSizes"
      :show-size-picker="showSizePicker"
      :show-quick-jumper="showQuickJumper"
      :disabled="disabled"
      :simple="simple"
      @update:page="handlePageChange"
      @update:page-size="handlePageSizeChange"
    >
      <template #prefix v-if="$slots.prefix">
        <slot name="prefix" />
      </template>

      <template #suffix v-if="$slots.suffix">
        <slot name="suffix" />
      </template>

      <template #prev v-if="$slots.prev">
        <slot name="prev" />
      </template>

      <template #next v-if="$slots.next">
        <slot name="next" />
      </template>
    </n-pagination>

    <!-- 分页信息显示 -->
    <div v-if="showInfo" class="pagination-info">
      <span class="info-text">
        {{ infoText }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

// Props 接口
interface Props {
  // 基础数据
  currentPage: number;
  pageSize: number;
  totalItems: number;

  // 功能开关
  showSizePicker?: boolean;
  showQuickJumper?: boolean;
  showInfo?: boolean;
  simple?: boolean;
  disabled?: boolean;

  // 配置选项
  pageSizes?: number[];
  pageSizeOptions?: { label: string; value: number }[];

  // 显示控制
  minItemsForPagination?: number; // 最少多少条数据才显示分页

  // 样式配置
  size?: 'small' | 'medium' | 'large';
  layout?: 'center' | 'left' | 'right';
}

const props = withDefaults(defineProps<Props>(), {
  showSizePicker: true,
  showQuickJumper: true,
  showInfo: false,
  simple: false,
  disabled: false,
  pageSizes: () => [10, 20, 50, 100],
  minItemsForPagination: 1,
  size: 'medium',
  layout: 'center'
});

// Emits
const emit = defineEmits<{
  'update:currentPage': [page: number];
  'update:pageSize': [pageSize: number];
  'page-change': [page: number];
  'page-size-change': [pageSize: number];
}>();

// 计算属性
const showPagination = computed(() => {
  return props.totalItems >= props.minItemsForPagination;
});

const totalPages = computed(() => {
  return Math.ceil(props.totalItems / props.pageSize);
});

const startIndex = computed(() => {
  return props.totalItems === 0 ? 0 : (props.currentPage - 1) * props.pageSize + 1;
});

const endIndex = computed(() => {
  const end = props.currentPage * props.pageSize;
  return Math.min(end, props.totalItems);
});

const infoText = computed(() => {
  if (props.totalItems === 0) {
    return '暂无数据';
  }
  return `第 ${startIndex.value}-${endIndex.value} 条，共 ${props.totalItems} 条`;
});

// 事件处理
const handlePageChange = (page: number) => {
  emit('update:currentPage', page);
  emit('page-change', page);
};

const handlePageSizeChange = (pageSize: number) => {
  emit('update:pageSize', pageSize);
  emit('page-size-change', pageSize);

  // 当页面大小改变时，重置到第一页
  if (props.currentPage !== 1) {
    emit('update:currentPage', 1);
    emit('page-change', 1);
  }
};
</script>

<style scoped>
.smart-pagination {
  padding: 16px;
  border-top: 1px solid #f0f0f0;
  background: #fafafa;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.smart-pagination[data-layout="left"] {
  align-items: flex-start;
}

.smart-pagination[data-layout="right"] {
  align-items: flex-end;
}

.pagination-info {
  display: flex;
  justify-content: center;
  width: 100%;
}

.info-text {
  font-size: 12px;
  color: #666;
  background: #f5f5f5;
  padding: 4px 8px;
  border-radius: 4px;
  border: 1px solid #e0e0e0;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .smart-pagination {
    padding: 12px;
  }

  .smart-pagination :deep(.n-pagination) {
    font-size: 12px;
  }

  .info-text {
    font-size: 11px;
    padding: 3px 6px;
  }
}

/* 尺寸变体 */
.smart-pagination[data-size="small"] {
  padding: 12px;
}

.smart-pagination[data-size="small"] :deep(.n-pagination) {
  font-size: 12px;
}

.smart-pagination[data-size="large"] {
  padding: 20px;
}

.smart-pagination[data-size="large"] :deep(.n-pagination) {
  font-size: 16px;
}

/* 简单模式 */
.smart-pagination[data-simple="true"] {
  background: transparent;
  border: none;
  padding: 8px 0;
}

/* 禁用状态 */
.smart-pagination[data-disabled="true"] {
  opacity: 0.6;
  pointer-events: none;
}

/* 深色主题支持 */
@media (prefers-color-scheme: dark) {
  .smart-pagination {
    background: #18181c;
    border-top-color: #303030;
  }

  .info-text {
    background: #242428;
    color: #999;
    border-color: #303030;
  }
}
</style>