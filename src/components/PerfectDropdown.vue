<template>
  <div class="perfect-dropdown">
    <!-- 自定义触发器按钮 -->
    <div @click="showDropdown = !showDropdown" class="trigger-wrapper">
      <slot name="trigger">
        <!-- 默认触发按钮（如果未提供自定义按钮） -->
        <n-button
          circle
          size="medium"
          class="dropdown-trigger"
          :class="{ 'active': showDropdown }"
        >
          <template #icon>
            <n-icon :component="MoreIcon" size="18" />
          </template>
        </n-button>
      </slot>
    </div>

    <!-- 下拉菜单面板 -->
    <transition name="dropdown-bounce">
      <div
        v-show="showDropdown"
        class="dropdown-panel"
        :class="{ 'show': showDropdown }"
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
                :key="item.key"
                class="menu-item"
                :class="{
                  'disabled': item.disabled,
                  'danger': item.type === 'danger',
                  'divider': item.type === 'divider'
                }"
                @click="handleItemClick(item)"
              >
                <!-- 分割线 -->
                <div v-if="item.type === 'divider'" class="divider-line"></div>

                <!-- 正常菜单项 -->
                <template v-else>
                  <div class="menu-item-content">
                    <!-- 图标 -->
                    <div class="menu-icon" v-if="item.icon">
                      <n-icon :component="item.icon" size="16" />
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
                      <div class="menu-badge" v-if="item.badge">
                        {{ item.badge }}
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
      @click="closeDropdown"
    ></div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { EllipsisHorizontal as MoreIcon } from '@vicons/ionicons5';
import type { Component } from 'vue';

// 定义菜单项接口
interface MenuItem {
  key: string;
  label: string;
  description?: string;
  icon?: Component;
  shortcut?: string;
  badge?: string;
  disabled?: boolean;
  type?: 'default' | 'danger' | 'divider';
  action?: () => void;
}

// Props
interface Props {
  items?: MenuItem[];
  title?: string;
  footer?: string;
  placement?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  closeOnClickOutside?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  items: () => [],
  placement: 'bottom-right',
  closeOnClickOutside: true
});

// Emits
const emit = defineEmits<{
  select: [key: string, item: MenuItem];
  close: [];
}>();

// 响应式数据
const showDropdown = ref(false);

// 处理菜单项
const menuItems = computed(() => {
  return props.items.map(item => ({
    ...item,
    action: item.action || (() => handleSelect(item.key, item))
  }));
});

// 处理菜单项点击
const handleItemClick = (item: MenuItem) => {
  if (item.disabled || item.type === 'divider') {
    return;
  }

  if (item.action) {
    item.action();
  }

  handleSelect(item.key, item);
  closeDropdown();
};

// 处理选择事件
const handleSelect = (key: string, item: MenuItem) => {
  emit('select', key, item);
};

// 关闭下拉菜单
const closeDropdown = () => {
  showDropdown.value = false;
  emit('close');
};

// 点击外部关闭
const handleClickOutside = (event: MouseEvent) => {
  if (!props.closeOnClickOutside) return;

  const target = event.target as Element;
  if (!target.closest('.perfect-dropdown')) {
    closeDropdown();
  }
};

// 键盘事件处理
const handleKeydown = (event: KeyboardEvent) => {
  if (!showDropdown.value) return;

  if (event.key === 'Escape') {
    closeDropdown();
  }
};

// 生命周期
onMounted(() => {
  document.addEventListener('click', handleClickOutside);
  document.addEventListener('keydown', handleKeydown);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
  document.removeEventListener('keydown', handleKeydown);
});

// 监听showDropdown变化
watch(showDropdown, (newValue) => {
  if (newValue) {
    // 防止菜单超出视窗
    setTimeout(() => {
      adjustPosition();
    }, 0);
  }
});

// 调整位置
const adjustPosition = () => {
  const dropdown = document.querySelector('.perfect-dropdown');
  const panel = dropdown?.querySelector('.dropdown-panel') as HTMLElement;

  if (!dropdown || !panel) return;

  const dropdownRect = dropdown.getBoundingClientRect();
  const panelRect = panel.getBoundingClientRect();
  const viewportHeight = window.innerHeight;
  const viewportWidth = window.innerWidth;

  // 检查是否超出底部
  if (dropdownRect.bottom + panelRect.height > viewportHeight) {
    panel.style.top = 'auto';
    panel.style.bottom = '100%';
    panel.style.marginBottom = '8px';
    panel.style.marginTop = '0';
  } else {
    panel.style.top = 'calc(100% + 8px)';
    panel.style.bottom = 'auto';
    panel.style.marginTop = '0';
    panel.style.marginBottom = '0';
  }

  // 检查是否超出右边
  if (dropdownRect.right + panelRect.width > viewportWidth) {
    panel.style.left = 'auto';
    panel.style.right = '0';
  } else {
    panel.style.right = '0';
    panel.style.left = 'auto';
  }
};
</script>

<style scoped>
.perfect-dropdown {
  position: relative;
  display: inline-block;
  /* 确保可以突破容器的 overflow 限制 */
  z-index: 99999;
}

/* 确保下拉菜单能突破所有容器限制 */
.perfect-dropdown .dropdown-panel {
  /* 使用更高的 z-index 确保在最顶层 */
  position: absolute !important;
  z-index: 99999 !important;
}

.trigger-wrapper {
  display: inline-block;
}

.dropdown-trigger {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  color: white;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
}

.dropdown-trigger:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.4);
}

.dropdown-trigger.active {
  transform: scale(1.05);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.5);
}

/* 下拉面板 */
.dropdown-panel {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  z-index: 99999; /* 确保在最上层，突破容器限制 */
  min-width: 220px;
  max-width: 320px;
  transform-origin: top right;
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
  background: linear-gradient(135deg, #667eea, #764ba2);
  padding: 2px 6px;
  border-radius: 8px;
  min-width: 16px;
  text-align: center;
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
  z-index: 99998; /* 在下拉面板之下 */
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

/* 响应式设计 */
@media (max-width: 768px) {
  .dropdown-panel {
    position: fixed;
    top: 50%;
    left: 50%;
    right: auto;
    transform: translate(-50%, -50%);
    min-width: 280px;
    max-width: 90vw;
  }

  .dropdown-backdrop {
    border-radius: 20px;
  }

  .dropdown-content {
    padding: 12px 0;
    max-height: 60vh;
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