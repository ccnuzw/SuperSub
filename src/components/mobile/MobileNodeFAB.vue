<template>
  <div class="mobile-node-fab" :class="{ visible: isVisible }">
    <!-- 主要 FAB 按钮 -->
    <n-fab
      v-model:show="fabMenuOpen"
      type="primary"
      :style="{ position: 'fixed', bottom: '20px', right: '20px', zIndex: 1000 }"
      @click="handleFabClick"
    >
      <template #icon>
        <n-icon :component="fabMenuOpen ? CloseIcon : PlusIcon" />
      </template>
    </n-fab>

    <!-- 快捷操作菜单 -->
    <transition name="fab-menu">
      <div v-if="fabMenuOpen" class="fab-menu">
        <!-- 批量操作 -->
        <div
          v-if="selectedCount > 0"
          class="fab-action batch-actions"
          @click="showBatchActions = true"
        >
          <div class="action-content">
            <n-icon :component="CheckIcon" />
            <span>{{ selectedCount }} 个选中</span>
          </div>
        </div>

        <!-- 搜索 -->
        <div class="fab-action" @click="$emit('search')">
          <div class="action-content">
            <n-icon :component="SearchIcon" />
            <span>搜索节点</span>
          </div>
        </div>

        <!-- 筛选 -->
        <div class="fab-action" @click="$emit('filter')">
          <div class="action-content">
            <n-icon :component="FilterIcon" />
            <span>筛选</span>
          </div>
        </div>

        <!-- 刷新 -->
        <div class="fab-action" @click="$emit('refresh')" :loading="refreshing">
          <div class="action-content">
            <n-icon :component="RefreshIcon" />
            <span>刷新</span>
          </div>
        </div>

        <!-- 添加节点 -->
        <div class="fab-action primary" @click="$emit('add')">
          <div class="action-content">
            <n-icon :component="PlusIcon" />
            <span>添加节点</span>
          </div>
        </div>

        <!-- 导入节点 -->
        <div class="fab-action" @click="$emit('import')">
          <div class="action-content">
            <n-icon :component="ImportIcon" />
            <span>导入节点</span>
          </div>
        </div>
      </div>
    </transition>

    <!-- 遮罩层 -->
    <div
      v-if="fabMenuOpen"
      class="fab-overlay"
      @click="closeFabMenu"
    />

    <!-- 批量操作抽屉 -->
    <n-drawer
      v-model:show="showBatchActions"
      :width="320"
      placement="bottom"
      style="height: auto; max-height: 70vh;"
    >
      <n-drawer-content title="批量操作" closable>
        <div class="batch-actions-content">
          <div class="batch-info">
            <n-alert type="info">
              已选择 {{ selectedCount }} 个节点
            </n-alert>
          </div>

          <div class="action-list">
            <div class="action-item" @click="$emit('batchTest')">
              <div class="action-icon">
                <n-icon :component="FlashIcon" />
              </div>
              <div class="action-text">
                <div class="action-title">批量测试</div>
                <div class="action-desc">测试选中节点的连通性</div>
              </div>
            </div>

            <div class="action-item" @click="$emit('batchMove')">
              <div class="action-icon">
                <n-icon :component="FolderIcon" />
              </div>
              <div class="action-text">
                <div class="action-title">移动分组</div>
                <div class="action-desc">将选中节点移动到其他分组</div>
              </div>
            </div>

            <div class="action-item" @click="$emit('batchExport')">
              <div class="action-icon">
                <n-icon :component="DownloadIcon" />
              </div>
              <div class="action-text">
                <div class="action-title">导出节点</div>
                <div class="action-desc">导出选中节点为 JSON 文件</div>
              </div>
            </div>

            <div class="action-item danger" @click="$emit('batchDelete')">
              <div class="action-icon">
                <n-icon :component="TrashIcon" />
              </div>
              <div class="action-text">
                <div class="action-title">批量删除</div>
                <div class="action-desc">删除所有选中的节点</div>
              </div>
            </div>
          </div>

          <div class="batch-footer">
            <n-button @click="clearSelection" block>
              清空选择
            </n-button>
          </div>
        </div>
      </n-drawer-content>
    </n-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import {
  Add as PlusIcon,
  Close as CloseIcon,
  Search as SearchIcon,
  Filter as FilterIcon,
  Refresh as RefreshIcon,
  Download as ImportIcon,
  Checkmark as CheckIcon,
  Flash as FlashIcon,
  Folder as FolderIcon,
  Download as DownloadIcon,
  Trash as TrashIcon
} from '@vicons/ionicons5';

interface Props {
  selectedCount?: number;
  refreshing?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  selectedCount: 0,
  refreshing: false
});

const emit = defineEmits<{
  search: [];
  filter: [];
  refresh: [];
  add: [];
  import: [];
  batchTest: [];
  batchMove: [];
  batchExport: [];
  batchDelete: [];
  clearSelection: [];
}>();

// 状态管理
const fabMenuOpen = ref(false);
const showBatchActions = ref(false);
const isVisible = ref(true);
let lastScrollY = 0;

// 事件处理
const handleFabClick = () => {
  if (props.selectedCount > 0 && !fabMenuOpen.value) {
    showBatchActions.value = true;
  } else {
    fabMenuOpen.value = !fabMenuOpen.value;
  }
};

const closeFabMenu = () => {
  fabMenuOpen.value = false;
};

const clearSelection = () => {
  emit('clearSelection');
  showBatchActions.value = false;
};

// 滚动隐藏/显示逻辑
const handleScroll = () => {
  const currentScrollY = window.scrollY;
  const scrollDelta = currentScrollY - lastScrollY;

  if (scrollDelta > 100 && currentScrollY > 200) {
    // 向下滚动，隐藏 FAB
    isVisible.value = false;
  } else if (scrollDelta < -100) {
    // 向上滚动，显示 FAB
    isVisible.value = true;
  }

  lastScrollY = currentScrollY;
};

// 生命周期
onMounted(() => {
  window.addEventListener('scroll', handleScroll, { passive: true });
});

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll);
});
</script>

<style scoped>
.mobile-node-fab {
  position: relative;
  z-index: 1000;
}

.fab-menu {
  position: fixed;
  bottom: 90px;
  right: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: flex-end;
  z-index: 999;
}

.fab-action {
  min-width: 140px;
  max-width: 200px;
  padding: 12px 16px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid #e8e8e8;
}

.fab-action:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.16);
}

.fab-action.primary {
  background: #1890ff;
  color: white;
  border-color: #1890ff;
}

.fab-action.batch-actions {
  background: #52c41a;
  color: white;
  border-color: #52c41a;
}

.fab-action.danger {
  background: #ff4d4f;
  color: white;
  border-color: #ff4d4f;
}

.action-content {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 14px;
  font-weight: 500;
}

.action-content .n-icon {
  font-size: 18px;
}

.fab-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.3);
  z-index: 998;
  backdrop-filter: blur(2px);
}

.fab-menu-enter-active,
.fab-menu-leave-active {
  transition: all 0.3s ease;
}

.fab-menu-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

.fab-menu-leave-to {
  opacity: 0;
  transform: translateY(20px);
}

.fab-menu-move {
  transition: transform 0.3s ease;
}

/* 批量操作抽屉样式 */
.batch-actions-content {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.batch-info {
  margin-bottom: 20px;
}

.action-list {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.action-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid transparent;
}

.action-item:hover {
  background: #e3f2fd;
  border-color: #1890ff;
}

.action-item.danger:hover {
  background: #ffebee;
  border-color: #ff4d4f;
}

.action-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  color: #1890ff;
  font-size: 20px;
}

.action-item.danger .action-icon {
  color: #ff4d4f;
}

.action-text {
  flex: 1;
}

.action-title {
  font-weight: 600;
  font-size: 16px;
  margin-bottom: 4px;
}

.action-desc {
  font-size: 14px;
  color: #666;
}

.batch-footer {
  padding-top: 20px;
  border-top: 1px solid #e8e8e8;
}

/* 可见性动画 */
.mobile-node-fab {
  transition: transform 0.3s ease, opacity 0.3s ease;
}

.mobile-node-fab:not(.visible) {
  transform: translateY(100px);
  opacity: 0;
}

/* 响应式调整 */
@media (max-width: 380px) {
  .fab-menu {
    right: 12px;
  }

  .fab-action {
    min-width: 120px;
    padding: 10px 12px;
  }

  .action-content {
    font-size: 13px;
  }

  .action-content .n-icon {
    font-size: 16px;
  }
}

@media (min-height: 800px) {
  .fab-menu {
    bottom: 100px;
  }
}

/* 深色模式支持 */
@media (prefers-color-scheme: dark) {
  .fab-action {
    background: #1f1f1f;
    border-color: #404040;
    color: white;
  }

  .action-item {
    background: #2a2a2a;
  }

  .action-item:hover {
    background: #333333;
  }

  .action-icon {
    background: #404040;
  }
}
</style>