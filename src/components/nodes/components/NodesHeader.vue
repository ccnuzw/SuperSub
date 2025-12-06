<template>
  <div class="nodes-header">
    <!-- 标题和操作按钮区域 -->
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
        <!-- 迷你统计标签 -->
        <div class="mini-stats-tags">
          <div
            v-for="stat in nodeStatsCards"
            :key="stat.key"
            class="mini-stat-tag"
            :class="`mini-stat-tag--${stat.type}`"
            @click="() => $emit('stats-click', stat)"
          >
            <n-icon :component="stat.icon" :size="12" />
            <span class="mini-stat-text">{{ stat.value }} {{ stat.label }}</span>
          </div>
        </div>

        <!-- 主要操作按钮 -->
        <n-space>
          <n-button type="primary" size="medium" @click="$emit('add-node')">
            <template #icon><AddIcon /></template>
            添加节点
          </n-button>

          <!-- 更多操作下拉菜单 -->
          <SmartHeaderActions
            :items="headerSmartActions"
            @select="(key: string, item: any, event: MouseEvent) => $emit('header-action', key, item, event)"
            placement="bottom-right"
            button-type="default"
            :ghost="false"
            size="medium"
          />
        </n-space>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import {
  Add as AddIcon,
  Server as NodesIcon,
  CheckmarkCircle as CheckCircleIcon,
  CloseCircle as CloseCircleIcon,
  Warning as WarningIcon,
} from '@vicons/ionicons5';
import SmartHeaderActions from '../../common/SmartHeaderActions.vue';

interface Props {
  nodeStats: {
    totalCount: number;
    onlineCount: number;
    offlineCount: number;
    errorCount: number;
  };
  headerSmartActions: any[];
}

const props = defineProps<Props>();

defineEmits<{
  'add-node': [];
  'header-action': [key: string, item: any, event?: MouseEvent];
  'stats-click': [stat: any, index?: number];
}>();

// 统计卡片数据
const nodeStatsCards = computed(() => [
  {
    key: 'all',
    label: '全部节点',
    value: props.nodeStats.totalCount,
    icon: NodesIcon,
    type: 'primary' as const,
    tooltip: '点击查看全部节点',
    onClick: () => {}
  },
  {
    key: 'online',
    label: '在线节点',
    value: props.nodeStats.onlineCount,
    icon: CheckCircleIcon,
    type: 'success' as const,
    tooltip: '点击查看在线节点',
    onClick: () => {}
  },
  {
    key: 'offline',
    label: '离线节点',
    value: props.nodeStats.offlineCount,
    icon: CloseCircleIcon,
    type: 'warning' as const,
    tooltip: '点击查看离线节点',
    onClick: () => {}
  },
  {
    key: 'error',
    label: '异常节点',
    value: props.nodeStats.errorCount,
    icon: WarningIcon,
    type: 'error' as const,
    tooltip: '点击查看异常节点',
    onClick: () => {}
  }
]);
</script>

<style scoped>
.nodes-header {
  margin-bottom: 24px;
}

.header-main {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0;
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
  text-shadow: none;
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

/* 头部右侧区域 */
.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

/* 迷你统计标签 */
.mini-stats-tags {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-right: 8px;
}

.mini-stat-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
  border: 1px solid transparent;
}

.mini-stat-tag:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}

.mini-stat-text {
  color: inherit;
  font-size: 11px;
  font-weight: 500;
}

/* 不同类型的迷你统计标签 */
.mini-stat-tag--primary {
  background: rgba(102, 126, 234, 0.1);
  color: #667eea;
  border-color: rgba(102, 126, 234, 0.2);
}

.mini-stat-tag--success {
  background: rgba(34, 197, 94, 0.1);
  color: #22c55e;
  border-color: rgba(34, 197, 94, 0.2);
}

.mini-stat-tag--warning {
  background: rgba(245, 158, 11, 0.1);
  color: #f59e0b;
  border-color: rgba(245, 158, 11, 0.2);
}

.mini-stat-tag--error {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
  border-color: rgba(239, 68, 68, 0.2);
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

@media (max-width: 768px) {
  .header-main {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }

  .header-right {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }

  .mini-stats-tags {
    justify-content: center;
    flex-wrap: wrap;
    margin-right: 0;
    gap: 6px;
  }

  .mini-stat-tag {
    padding: 3px 6px;
    font-size: 10px;
  }

  .mini-stat-text {
    font-size: 10px;
  }
}

@media (max-width: 480px) {
  .mini-stats-tags {
    gap: 4px;
  }

  .mini-stat-tag {
    padding: 2px 5px;
    font-size: 9px;
  }

  .mini-stat-text {
    font-size: 9px;
  }
}
</style>