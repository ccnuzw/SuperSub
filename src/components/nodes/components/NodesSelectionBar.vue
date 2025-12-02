<template>
  <div v-if="selectedNodesCount > 0" class="selection-bar">
    <div class="selection-left">
      <div class="selection-info">
        <n-icon :component="CheckCircleIcon" class="selection-icon" />
        <span class="selection-text">
          已选择 <strong>{{ selectedNodesCount }}</strong> 个节点
        </span>
      </div>
      <div class="selection-summary" v-if="selectedNodesSummary.total > 0">
        <n-space size="small">
          <n-tag size="small" type="success">
            在线 {{ selectedNodesSummary.online }}
          </n-tag>
          <n-tag size="small" type="error">
            离线 {{ selectedNodesSummary.offline }}
          </n-tag>
          <n-tag size="small" type="warning">
            错误 {{ selectedNodesSummary.error }}
          </n-tag>
          <n-tag size="small" type="default">
            未测试 {{ selectedNodesSummary.pending }}
          </n-tag>
        </n-space>
      </div>
    </div>
    <div class="selection-right">
      <n-space size="small">
        <!-- 智能测试按钮 -->
        <PerfectDropdown
          :items="testDropdownOptions"
          @select="$emit('test-action', $event)"
          placement="bottom-right"
          title="智能测试"
          class="smart-test-dropdown"
        >
          <template #trigger>
            <n-button type="primary" :loading="testingSelected" class="smart-test-btn">
              <template #icon><FlashIcon /></template>
              智能测试
            </n-button>
          </template>
        </PerfectDropdown>

        <!-- 快速操作 -->
        <n-divider vertical style="height: 20px; margin: 0 8px;" />

        <!-- 移动分组 -->
        <n-button @click="$emit('batch-move')" type="default" class="smart-action-btn">
          <template #icon><FolderIcon /></template>
          移动分组
        </n-button>

        <!-- 导出 -->
        <PerfectDropdown
          :items="exportDropdownOptions"
          @select="$emit('export-action', $event)"
          placement="bottom-right"
          title="导出设置"
          class="smart-export-dropdown"
        >
          <template #trigger>
            <n-button type="info" class="smart-export-btn">
              <template #icon><DownloadIcon /></template>
              导出
            </n-button>
          </template>
        </PerfectDropdown>

        <!-- 更多操作 -->
        <PerfectDropdown
          :items="moreDropdownOptions"
          @select="$emit('more-action', $event)"
          placement="bottom-right"
          title="更多操作"
          class="smart-more-dropdown"
        >
          <template #trigger>
            <n-button type="default" class="smart-more-btn">
              <template #icon><MoreIcon /></template>
              更多
            </n-button>
          </template>
        </PerfectDropdown>
      </n-space>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  CheckmarkCircle as CheckCircleIcon,
  Flash as FlashIcon,
  Folder as FolderIcon,
  Download as DownloadIcon,
  EllipsisVertical as MoreIcon
} from '@vicons/ionicons5';
import PerfectDropdown from '../../PerfectDropdown.vue';

interface SelectedNodesSummary {
  total: number;
  online: number;
  offline: number;
  error: number;
  pending: number;
}

interface DropdownOption {
  label: string;
  key: string;
  icon?: any;
  type?: 'default' | 'warning' | 'danger' | 'divider';
  description?: string;
}

interface Props {
  selectedNodesCount: number;
  testingSelected: boolean;
  selectedNodesSummary: SelectedNodesSummary;
  testDropdownOptions: DropdownOption[];
  exportDropdownOptions: DropdownOption[];
  moreDropdownOptions: DropdownOption[];
}

defineProps<Props>();

defineEmits<{
  'test-action': [key: string];
  'batch-move': [];
  'export-action': [key: string];
  'more-action': [key: string];
}>();
</script>

<style scoped>
/* 选中节点操作栏 */
.selection-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background: linear-gradient(135deg, #e6f7ff 0%, #f0f9ff 100%);
  border: 1px solid #91d5ff;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(24, 144, 255, 0.1);
  position: relative;
}

.selection-bar::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, #1890ff, #40a9ff, #69c0ff);
}

.selection-left {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.selection-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.selection-icon {
  color: #1890ff;
  font-size: 18px;
}

.selection-text {
  font-size: 14px;
  color: #1e40af;
  font-weight: 500;
}

.selection-text strong {
  color: #1890ff;
  font-weight: 700;
}

.selection-summary {
  display: flex;
  align-items: center;
}

.selection-summary :deep(.n-tag) {
  font-weight: 600;
  border-radius: 6px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;
}

.selection-summary :deep(.n-tag:hover) {
  transform: translateY(-1px);
  box-shadow: 0 3px 6px rgba(0, 0, 0, 0.15);
}

.selection-right {
  display: flex;
  align-items: center;
}

.selection-right :deep(.n-button) {
  border-radius: 8px;
  font-weight: 600;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  border: 1.5px solid transparent;
}

.selection-right :deep(.n-button:hover) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.selection-right :deep(.n-button--primary) {
  background: linear-gradient(135deg, #1890ff 0%, #40a9ff 100%);
  border-color: #40a9ff;
}

.selection-right :deep(.n-button--primary:hover) {
  background: linear-gradient(135deg, #096dd9 0%, #1890ff 100%);
  box-shadow: 0 4px 12px rgba(24, 144, 255, 0.3);
}

.selection-right :deep(.n-button--info) {
  background: linear-gradient(135deg, #13c2c2 0%, #36cfc9 100%);
  border-color: #36cfc9;
}

.selection-right :deep(.n-button--info:hover) {
  background: linear-gradient(135deg, #08979c 0%, #13c2c2 100%);
  box-shadow: 0 4px 12px rgba(19, 194, 194, 0.3);
}

.selection-right :deep(.n-button--default) {
  background: linear-gradient(135deg, #ffffff 0%, #fafafa 100%);
  border-color: #d9d9d9;
  color: #595959;
}

.selection-right :deep(.n-button--default:hover) {
  background: linear-gradient(135deg, #fafafa 0%, #ffffff 100%);
  border-color: #1890ff;
  color: #1890ff;
}

.selection-right :deep(.n-dropdown) {
  border-radius: 8px;
}

.selection-right :deep(.n-divider.n-divider--vertical) {
  background: linear-gradient(180deg, transparent, #1890ff, transparent);
  width: 2px;
  margin: 0 12px;
}

/* 智能感知区域按钮样式 */
.smart-test-btn,
.smart-export-btn,
.smart-more-btn,
.smart-action-btn {
  cursor: pointer !important;
  border-radius: 8px !important;
  font-weight: 600 !important;
  font-size: 13px !important;
  padding: 8px 16px !important;
  height: 36px !important;
  min-width: 90px !important;
  transition: all 0.2s ease !important;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1) !important;
}

.smart-test-btn {
  background: linear-gradient(135deg, #fa8c16 0%, #ff9c6f 100%) !important;
  border: 1px solid #fa8c16 !important;
  color: #ffffff !important;
}

.smart-test-btn:hover {
  background: linear-gradient(135deg, #d46b08 0%, #fa8c16 100%) !important;
  border-color: #d46b08 !important;
  transform: translateY(-1px) !important;
  box-shadow: 0 4px 8px rgba(250, 140, 6, 0.3) !important;
}

.smart-export-btn {
  background: linear-gradient(135deg, #52c41a 0%, #73d13d 100%) !important;
  border: 1px solid #52c41a !important;
  color: #ffffff !important;
}

.smart-export-btn:hover {
  background: linear-gradient(135deg, #389e0d 0%, #52c41a 100%) !important;
  border-color: #389e0d !important;
  transform: translateY(-1px) !important;
  box-shadow: 0 4px 8px rgba(82, 196, 26, 0.3) !important;
}

.smart-more-btn {
  background: linear-gradient(135deg, #8c8c8c 0%, #bfbfbf 100%) !important;
  border: 1px solid #8c8c8c !important;
  color: #ffffff !important;
}

.smart-more-btn:hover {
  background: linear-gradient(135deg, #666666 0%, #8c8c8c 100%) !important;
  border-color: #666666 !important;
  transform: translateY(-1px) !important;
  box-shadow: 0 4px 8px rgba(102, 102, 102, 0.3) !important;
}

.smart-action-btn {
  background: linear-gradient(135deg, #1890ff 0%, #40a9ff 100%) !important;
  border: 1px solid #1890ff !important;
  color: #ffffff !important;
}

.smart-action-btn:hover {
  background: linear-gradient(135deg, #096dd9 0%, #1890ff 100%) !important;
  border-color: #096dd9 !important;
  transform: translateY(-1px) !important;
  box-shadow: 0 4px 8px rgba(24, 144, 255, 0.3) !important;
}

/* 智能感知下拉菜单样式 */
.smart-test-dropdown :deep(.n-dropdown-menu),
.smart-export-dropdown :deep(.n-dropdown-menu),
.smart-more-dropdown :deep(.n-dropdown-menu) {
  border-radius: 8px !important;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12) !important;
  border: 1px solid #e2e8f0 !important;
  background: #ffffff !important;
  padding: 0 !important;
  min-width: 160px !important;
  max-width: 200px !important;
  margin: 0 !important;
  overflow: hidden !important;
}

.smart-test-dropdown :deep(.n-dropdown-menu-body),
.smart-export-dropdown :deep(.n-dropdown-menu-body),
.smart-more-dropdown :deep(.n-dropdown-menu-body),
.smart-test-dropdown :deep(.n-dropdown-menu-content),
.smart-export-dropdown :deep(.n-dropdown-menu-content),
.smart-more-dropdown :deep(.n-dropdown-menu-content) {
  padding: 0 !important;
  margin: 0 !important;
}

.smart-test-dropdown :deep(.n-dropdown-menu-item),
.smart-export-dropdown :deep(.n-dropdown-menu-item),
.smart-more-dropdown :deep(.n-dropdown-menu-item) {
  margin: 0 !important;
  padding: 0 !important;
  background: transparent !important;
  border: none !important;
  outline: none !important;
  width: 100% !important;
  display: block !important;
  position: static !important;
}

.smart-test-dropdown :deep(.n-dropdown-menu-item:hover),
.smart-export-dropdown :deep(.n-dropdown-menu-item:hover),
.smart-more-dropdown :deep(.n-dropdown-menu-item:hover) {
  background: transparent !important;
}

.smart-test-dropdown :deep(.n-dropdown-menu-item.n-dropdown-menu-item--selected),
.smart-export-dropdown :deep(.n-dropdown-menu-item.n-dropdown-menu-item--selected),
.smart-more-dropdown :deep(.n-dropdown-menu-item.n-dropdown-menu-item--selected) {
  background: #f8fafc !important;
}

.smart-test-dropdown :deep(.n-dropdown-menu-item-content),
.smart-export-dropdown :deep(.n-dropdown-menu-item-content),
.smart-more-dropdown :deep(.n-dropdown-menu-item-content) {
  padding: 0 !important;
  margin: 0 !important;
  width: 100% !important;
  display: block !important;
  position: static !important;
  background: transparent !important;
}

.smart-test-dropdown :deep(.n-dropdown-divider),
.smart-export-dropdown :deep(.n-dropdown-divider),
.smart-more-dropdown :deep(.n-dropdown-divider) {
  margin: 0 !important;
  border-color: #e2e8f0 !important;
  height: 1px !important;
  padding: 0 !important;
}

@media (max-width: 1024px) {
  .selection-bar {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }

  .selection-left {
    align-items: center;
    text-align: center;
  }

  .selection-right {
    justify-content: center;
    flex-wrap: wrap;
  }
}

@media (max-width: 768px) {
  .selection-bar {
    padding: 12px 16px;
  }

  .selection-right :deep(.n-button) {
    font-size: 12px;
    padding: 0 12px;
  }
}

@media (max-width: 480px) {
  .selection-right {
    gap: 8px;
  }

  .selection-right :deep(.n-button) {
    font-size: 11px;
    padding: 0 8px;
  }

  .selection-right :deep(.n-button .n-button__content) {
    gap: 4px;
  }
}
</style>