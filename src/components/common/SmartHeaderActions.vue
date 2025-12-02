<template>
  <div class="smart-header-actions" @click="handleTriggerClick">
    <!-- 触发器按钮 -->
    <div class="trigger-button" :class="{ 'active': showDropdown }">
      <slot name="trigger">
        <!-- 默认触发按钮 -->
        <n-button
          circle
          :size="size"
          class="default-trigger"
          :type="buttonType"
          :ghost="ghost"
        >
          <template #icon>
            <n-icon :component="triggerIcon" :size="iconSize" />
          </template>
        </n-button>
      </slot>
    </div>

    <!-- 下拉菜单面板 -->
    <transition name="dropdown-bounce">
      <div
        v-show="showDropdown"
        class="dropdown-panel"
        :class="[
          `placement-${placement}`,
          { 'show': showDropdown }
        ]"
        :style="panelStyle"
      >
        <!-- 菜单背景容器 -->
        <div class="dropdown-backdrop">
          <!-- 菜单内容容器 -->
          <div class="dropdown-content">
            <!-- 菜单头部 -->
            <div class="dropdown-header" v-if="title">
              <div class="header-title">{{ title }}</div>
            </div>

            <!-- 菜单列表 -->
            <div class="menu-list">
              <div
                v-for="(item, index) in menuItems"
                :key="item.key || index"
                class="menu-item"
                :class="getItemClass(item)"
                @click="handleItemClick(item, $event)"
              >
                <!-- 分割线 -->
                <div v-if="item.type === 'divider'" class="divider-line"></div>

                <!-- 正常菜单项 -->
                <template v-else>
                  <div class="menu-item-content">
                    <!-- 图标 -->
                    <div class="menu-icon" v-if="item.icon">
                      <n-icon :component="item.icon" :size="16" />
                    </div>

                    <!-- 文本 -->
                    <div class="menu-text">
                      <div class="menu-label">{{ item.label }}</div>
                      <div class="menu-description" v-if="item.description">
                        {{ item.description }}
                      </div>
                    </div>

                    <!-- 快捷键或徽章 -->
                    <div class="menu-extra">
                      <div class="menu-shortcut" v-if="item.shortcut">
                        {{ item.shortcut }}
                      </div>
                      <div class="menu-badge" v-if="item.badge" :class="item.badgeType">
                        {{ item.badge }}
                      </div>
                      <div class="menu-status" v-if="item.status" :class="item.statusType">
                        {{ item.status }}
                      </div>
                    </div>
                  </div>
                </template>
              </div>
            </div>

            <!-- 菜单底部 -->
            <div class="dropdown-footer" v-if="footer">
              <div class="footer-text">{{ footer }}</div>
            </div>
          </div>
        </div>
      </div>
    </transition>

    <!-- 遮罩层 -->
    <div
      v-show="showDropdown"
      class="dropdown-overlay"
      @click="handleOverlayClick"
    ></div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue';
import { EllipsisHorizontal as DefaultTriggerIcon } from '@vicons/ionicons5';
import type { Component } from 'vue';

// 定义菜单项接口
export interface SmartActionItem {
  key: string;
  label?: string;
  description?: string;
  icon?: Component;
  shortcut?: string;
  badge?: string;
  badgeType?: 'primary' | 'success' | 'warning' | 'error' | 'info';
  status?: string;
  statusType?: 'online' | 'offline' | 'busy' | 'away';
  disabled?: boolean;
  type?: 'default' | 'danger' | 'warning' | 'primary' | 'success' | 'divider';
  action?: () => void;
  href?: string;
  target?: string;
}

// Props 接口
interface Props {
  // 基础数据
  items: SmartActionItem[];

  // 显示配置
  title?: string;
  footer?: string;
  placement?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left' | 'bottom-center' | 'top-center';

  // 按钮配置
  triggerIcon?: Component;
  buttonType?: 'default' | 'primary' | 'info' | 'success' | 'warning' | 'error';
  ghost?: boolean;
  size?: 'small' | 'medium' | 'large';
  iconSize?: number;

  // 行为配置
  closeOnClickOutside?: boolean;
  closeOnItemClick?: boolean;
  disabled?: boolean;
  loading?: boolean;

  // 样式配置
  maxWidth?: number | string;
  minWidth?: number | string;
  maxHeight?: number | string;
}

const props = withDefaults(defineProps<Props>(), {
  placement: 'bottom-right',
  closeOnClickOutside: true,
  closeOnItemClick: true,
  triggerIcon: DefaultTriggerIcon,
  buttonType: 'default',
  ghost: false,
  size: 'medium',
  iconSize: 18,
  maxWidth: 320,
  minWidth: 200,
  maxHeight: 480
});

// Emits
const emit = defineEmits<{
  'select': [key: string, item: SmartActionItem, event: MouseEvent];
  'open': [];
  'close': [];
  'trigger-click': [event: MouseEvent];
}>();

// 响应式状态
const showDropdown = ref(false);
const isAdjusting = ref(false);

// 处理菜单项
const menuItems = computed(() => {
  return props.items.map(item => ({
    ...item,
    action: item.action || (() => handleSelect(item.key, item))
  }));
});

// 面板样式
const panelStyle = computed(() => {
  const style: Record<string, string> = {};

  if (typeof props.maxWidth === 'number') {
    style.maxWidth = `${props.maxWidth}px`;
  } else if (typeof props.maxWidth === 'string') {
    style.maxWidth = props.maxWidth;
  }

  if (typeof props.minWidth === 'number') {
    style.minWidth = `${props.minWidth}px`;
  } else if (typeof props.minWidth === 'string') {
    style.minWidth = props.minWidth;
  }

  if (typeof props.maxHeight === 'number') {
    style.maxHeight = `${props.maxHeight}px`;
  } else if (typeof props.maxHeight === 'string') {
    style.maxHeight = props.maxHeight;
  }

  return style;
});

// 获取菜单项的CSS类名
const getItemClass = (item: SmartActionItem) => {
  return {
    'disabled': item.disabled,
    'danger': item.type === 'danger',
    'warning': item.type === 'warning',
    'primary': item.type === 'primary',
    'success': item.type === 'success',
    'divider': item.type === 'divider'
  };
};

// 处理触发器点击
const handleTriggerClick = (event: MouseEvent) => {
  if (props.disabled || props.loading) return;

  event.preventDefault();
  event.stopPropagation();

  emit('trigger-click', event);
  toggleDropdown();
};

// 切换下拉菜单显示状态
const toggleDropdown = () => {
  if (showDropdown.value) {
    closeDropdown();
  } else {
    openDropdown();
  }
};

// 打开下拉菜单
const openDropdown = async () => {
  if (props.disabled || props.loading) return;

  showDropdown.value = true;
  emit('open');

  // 等待DOM更新后调整位置
  await nextTick();
  adjustPosition();
};

// 关闭下拉菜单
const closeDropdown = () => {
  showDropdown.value = false;
  emit('close');
};

// 处理菜单项点击
const handleItemClick = (item: SmartActionItem, event: MouseEvent) => {
  if (item.disabled || item.type === 'divider') {
    return;
  }

  // 如果有链接，处理链接跳转
  if (item.href) {
    if (item.target === '_blank') {
      window.open(item.href, '_blank');
    } else {
      window.location.href = item.href;
    }
  }

  // 执行自定义操作
  if (item.action) {
    item.action();
  }

  // 发出选择事件
  handleSelect(item.key, item, event);

  // 根据配置决定是否关闭
  if (props.closeOnItemClick) {
    closeDropdown();
  }
};

// 处理选择事件
const handleSelect = (key: string, item: SmartActionItem, event?: MouseEvent) => {
  emit('select', key, item, event!);
};

// 处理遮罩层点击
const handleOverlayClick = (event: MouseEvent) => {
  event.preventDefault();
  event.stopPropagation();
  showDropdown.value = false;
  emit('close');
};

// 点击外部关闭
const handleClickOutside = (event: MouseEvent) => {
  if (!props.closeOnClickOutside) return;

  const target = event.target as Element;
  const dropdownElement = target.closest('.smart-header-actions');

  // 如果点击的不是当前下拉菜单组件，则关闭
  if (!dropdownElement) {
    showDropdown.value = false;
    emit('close');
  }
};

// 键盘事件处理
const handleKeydown = (event: KeyboardEvent) => {
  if (!showDropdown.value) return;

  if (event.key === 'Escape') {
    showDropdown.value = false;
    emit('close');
  }
};

// 调整位置
const adjustPosition = () => {
  const dropdown = document.querySelector('.smart-header-actions');
  const panel = dropdown?.querySelector('.dropdown-panel') as HTMLElement;

  if (!dropdown || !panel) return;

  isAdjusting.value = true;

  const dropdownRect = dropdown.getBoundingClientRect();
  const panelRect = panel.getBoundingClientRect();
  const viewportHeight = window.innerHeight;
  const viewportWidth = window.innerWidth;

  // 重置位置
  panel.style.top = '';
  panel.style.bottom = '';
  panel.style.left = '';
  panel.style.right = '';
  panel.style.transform = '';

  // 根据placement调整位置
  switch (props.placement) {
    case 'bottom-right':
      panel.style.top = 'calc(100% + 8px)';
      panel.style.right = '0';
      break;
    case 'bottom-left':
      panel.style.top = 'calc(100% + 8px)';
      panel.style.left = '0';
      break;
    case 'bottom-center':
      panel.style.top = 'calc(100% + 8px)';
      panel.style.left = '50%';
      panel.style.transform = 'translateX(-50%)';
      break;
    case 'top-right':
      panel.style.bottom = 'calc(100% + 8px)';
      panel.style.right = '0';
      break;
    case 'top-left':
      panel.style.bottom = 'calc(100% + 8px)';
      panel.style.left = '0';
      break;
    case 'top-center':
      panel.style.bottom = 'calc(100% + 8px)';
      panel.style.left = '50%';
      panel.style.transform = 'translateX(-50%)';
      break;
  }

  // 检查是否超出视窗并调整
  setTimeout(() => {
    try {
      const newPanelRect = panel.getBoundingClientRect();

      // 检查右边界
      if (newPanelRect.right > viewportWidth) {
        panel.style.right = '0';
        panel.style.left = 'auto';
        panel.style.transform = '';
      }

      // 检查左边界
      if (newPanelRect.left < 0) {
        panel.style.left = '0';
        panel.style.right = 'auto';
        panel.style.transform = '';
      }

      // 检查底部边界
      if (newPanelRect.bottom > viewportHeight && props.placement.startsWith('bottom')) {
        panel.style.top = 'auto';
        panel.style.bottom = 'calc(100% + 8px)';
        // 切换到顶部位置
        if (props.placement === 'bottom-right') panel.style.right = '0';
        if (props.placement === 'bottom-left') panel.style.left = '0';
        if (props.placement === 'bottom-center') {
          panel.style.left = '50%';
          panel.style.transform = 'translateX(-50%)';
        }
      }

      // 检查顶部边界
      if (newPanelRect.top < 0 && props.placement.startsWith('top')) {
        panel.style.bottom = 'auto';
        panel.style.top = 'calc(100% + 8px)';
        // 切换到底部位置
        if (props.placement === 'top-right') panel.style.right = '0';
        if (props.placement === 'top-left') panel.style.left = '0';
        if (props.placement === 'top-center') {
          panel.style.left = '50%';
          panel.style.transform = 'translateX(-50%)';
        }
      }
    } catch (error) {
      console.warn('Position adjustment failed:', error);
    } finally {
      isAdjusting.value = false;
    }
  }, 0);
};

// 生命周期
onMounted(() => {
  // 暂时禁用全局点击监听，只使用遮罩层处理
  // document.addEventListener('click', handleClickOutside);
  document.addEventListener('keydown', handleKeydown);
});

onUnmounted(() => {
  // document.removeEventListener('click', handleClickOutside);
  document.removeEventListener('keydown', handleKeydown);
  isAdjusting.value = false;
});

// 监听showDropdown变化
watch(showDropdown, (newValue) => {
  if (newValue) {
    adjustPosition();
  } else {
    // 关闭时重置调整状态
    isAdjusting.value = false;
  }
});
</script>

<style scoped>
.smart-header-actions {
  position: relative;
  display: inline-block;
  /* 移除z-index，避免创建层叠上下文 */
}

.trigger-button {
  display: inline-block;
  cursor: pointer;
  transition: all 0.2s ease;
}

.trigger-button:hover {
  transform: translateY(-1px);
}

.trigger-button.active {
  transform: scale(1.05);
}

.default-trigger {
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  border: 2px solid #e2e8f0;
  color: #64748b;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.default-trigger:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.1);
  border-color: #cbd5e1;
  color: #475569;
  background: linear-gradient(135deg, #ffffff 0%, #f1f5f9 100%);
}

.default-trigger.active {
  transform: translateY(-1px) scale(1.05);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  border-color: #94a3b8;
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
}

/* 下拉面板 */
.dropdown-panel {
  position: absolute;
  z-index: 99999;
  min-width: 200px;
  max-width: 320px;
  max-height: 480px;
  transform-origin: var(--transform-origin, top right);
  /* 尝试突破层叠上下文 */
  isolation: isolate;
}

.placement-bottom-right {
  top: calc(100% + 8px);
  right: 0;
  --transform-origin: top right;
}

.placement-bottom-left {
  top: calc(100% + 8px);
  left: 0;
  --transform-origin: top left;
}

.placement-bottom-center {
  top: calc(100% + 8px);
  left: 50%;
  transform: translateX(-50%);
  --transform-origin: top center;
}

.placement-top-right {
  bottom: calc(100% + 8px);
  right: 0;
  --transform-origin: bottom right;
}

.placement-top-left {
  bottom: calc(100% + 8px);
  left: 0;
  --transform-origin: bottom left;
}

.placement-top-center {
  bottom: calc(100% + 8px);
  left: 50%;
  transform: translateX(-50%);
  --transform-origin: bottom center;
}

.dropdown-backdrop {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-radius: 16px;
  box-shadow:
    0 10px 40px rgba(0, 0, 0, 0.15),
    0 2px 8px rgba(0, 0, 0, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.2);
  overflow: hidden;
}

/* 菜单内容 */
.dropdown-content {
  padding: 8px 0;
  max-height: 480px;
  overflow-y: auto;
}

.dropdown-content::-webkit-scrollbar {
  width: 6px;
}

.dropdown-content::-webkit-scrollbar-track {
  background: transparent;
}

.dropdown-content::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 3px;
}

.dropdown-content::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.3);
}

/* 菜单头部 */
.dropdown-header {
  padding: 12px 16px 8px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  margin-bottom: 4px;
}

.header-title {
  font-size: 12px;
  font-weight: 600;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* 菜单列表 */
.menu-list {
  display: flex;
  flex-direction: column;
}

.menu-item {
  position: relative;
  transition: all 0.2s ease;
}

.menu-item-content {
  display: flex;
  align-items: center;
  padding: 10px 16px;
  min-height: 40px;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
}

.menu-item:hover .menu-item-content {
  background: rgba(102, 126, 234, 0.08);
}

.menu-item:active .menu-item-content {
  background: rgba(102, 126, 234, 0.12);
  transform: scale(0.98);
}

.menu-item.disabled .menu-item-content {
  opacity: 0.5;
  cursor: not-allowed;
}

.menu-item.disabled:hover .menu-item-content {
  background: transparent;
}

.menu-item.danger .menu-item-content:hover {
  background: rgba(244, 67, 54, 0.08);
}

.menu-item.warning .menu-item-content:hover {
  background: rgba(255, 152, 0, 0.08);
}

.menu-item.primary .menu-item-content:hover {
  background: rgba(33, 150, 243, 0.08);
}

.menu-item.success .menu-item-content:hover {
  background: rgba(76, 175, 80, 0.08);
}

/* 菜单项图标 */
.menu-icon {
  flex-shrink: 0;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
  color: #666;
  transition: color 0.2s ease;
}

.menu-item:hover .menu-icon {
  color: #667eea;
}

.menu-item.danger:hover .menu-icon {
  color: #f44336;
}

.menu-item.warning:hover .menu-icon {
  color: #ff9800;
}

.menu-item.primary:hover .menu-icon {
  color: #2196f3;
}

.menu-item.success:hover .menu-icon {
  color: #4caf50;
}

/* 菜单项文本 */
.menu-text {
  flex: 1;
  min-width: 0;
}

.menu-label {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  line-height: 1.4;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.menu-description {
  font-size: 12px;
  color: #666;
  margin-top: 2px;
  line-height: 1.3;
}

/* 菜单项额外信息 */
.menu-extra {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: 12px;
}

.menu-shortcut {
  font-size: 11px;
  color: #999;
  background: rgba(0, 0, 0, 0.05);
  padding: 2px 6px;
  border-radius: 4px;
  font-family: 'SF Mono', 'Monaco', 'Consolas', monospace;
}

.menu-badge {
  font-size: 10px;
  font-weight: 600;
  color: white;
  padding: 2px 6px;
  border-radius: 8px;
  min-width: 16px;
  text-align: center;
}

.menu-badge.primary {
  background: linear-gradient(135deg, #2196f3, #1976d2);
}

.menu-badge.success {
  background: linear-gradient(135deg, #4caf50, #388e3c);
}

.menu-badge.warning {
  background: linear-gradient(135deg, #ff9800, #f57c00);
}

.menu-badge.error {
  background: linear-gradient(135deg, #f44336, #d32f2f);
}

.menu-badge.info {
  background: linear-gradient(135deg, #00bcd4, #0097a7);
}

.menu-status {
  font-size: 10px;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 8px;
  text-align: center;
  min-width: 16px;
}

.menu-status.online {
  background: #e8f5e8;
  color: #4caf50;
}

.menu-status.offline {
  background: #ffebee;
  color: #f44336;
}

.menu-status.busy {
  background: #fff3e0;
  color: #ff9800;
}

.menu-status.away {
  background: #f3e5f5;
  color: #9c27b0;
}

/* 分割线 */
.divider-line {
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(0, 0, 0, 0.08), transparent);
  margin: 4px 16px;
}

.menu-item.divider {
  padding: 0;
  cursor: default;
}

/* 菜单底部 */
.dropdown-footer {
  padding: 8px 16px 12px;
  border-top: 1px solid rgba(0, 0, 0, 0.08);
  margin-top: 4px;
}

.footer-text {
  font-size: 12px;
  color: #999;
  text-align: center;
}

/* 遮罩层 */
.dropdown-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9999; /* 遮罩层级，在容器之上但低于菜单面板 */
  background: transparent;
}

/* 动画 */
.dropdown-bounce-enter-active,
.dropdown-bounce-leave-active {
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.dropdown-bounce-enter-from,
.dropdown-bounce-leave-to {
  opacity: 0;
  transform: scale(0.8) translateY(-10px);
}

/* 深色主题 */
.dark .dropdown-backdrop {
  background: rgba(24, 24, 28, 0.95);
  border-color: rgba(255, 255, 255, 0.1);
}

.dark .dropdown-header {
  border-bottom-color: rgba(255, 255, 255, 0.1);
}

.dark .header-title {
  color: #ccc;
}

.dark .menu-label {
  color: #fff;
}

.dark .menu-description {
  color: #aaa;
}

.dark .menu-icon {
  color: #ccc;
}

.dark .divider-line {
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
}

.dark .dropdown-footer {
  border-top-color: rgba(255, 255, 255, 0.1);
}

.dark .menu-shortcut {
  background: rgba(255, 255, 255, 0.1);
  color: #aaa;
}

.dark .default-trigger {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.2);
  color: #ccc;
}

.dark .default-trigger:hover {
  background: rgba(255, 255, 255, 0.15);
  border-color: rgba(255, 255, 255, 0.3);
  color: #fff;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .dropdown-panel {
    position: fixed;
    top: 50%;
    left: 50%;
    right: auto;
    bottom: auto;
    transform: translate(-50%, -50%) !important;
    min-width: 280px;
    max-width: 90vw;
    max-height: 70vh;
  }

  .dropdown-backdrop {
    border-radius: 20px;
  }

  .dropdown-content {
    padding: 12px 0;
  }

  .menu-item-content {
    padding: 12px 20px;
    min-height: 48px;
  }

  .menu-label {
    font-size: 16px;
  }

  .menu-description {
    font-size: 14px;
  }
}
</style>