<script setup lang="ts">
import { h, computed, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import type { Component } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useThemeStore } from '@/stores/theme'
import { useLayoutStore } from '@/stores/layout'
import { NIcon, NLayout, NLayoutSider, NLayoutContent, NMenu, NSwitch, NSpace, NDrawer, NButton, NTooltip } from 'naive-ui'
import {
  HomeOutline as HomeIcon,
  CloudDownloadOutline as SubscriptionIcon,
  HardwareChipOutline as NodeIcon,
  PersonCircleOutline as ProfileIcon,
  FilterOutline as FilterIcon,
  CodeSlashOutline as CodeIcon,
  SettingsOutline as SettingsIcon,
  LogOutOutline as LogoutIcon,
  PeopleOutline as PeopleIcon,
  MenuOutline as MenuIcon,
  ConstructOutline as ComponentIcon,
  ResizeOutline as LayoutIcon,
  SunnyOutline as LightIcon,
  MoonOutline as DarkIcon,
  GridOutline as VerticalIcon,
  ReorderFourOutline as HorizontalIcon,
} from '@vicons/ionicons5'
import { useIsMobile } from '@/composables/useMediaQuery'

const isMobile = useIsMobile()
const showDrawer = ref(false)
const collapsed = ref(false)

function renderIcon(icon: Component) {
  return () => h(NIcon, null, { default: () => h(icon) })
}

const authStore = useAuthStore()
const themeStore = useThemeStore()
const layoutStore = useLayoutStore()
const router = useRouter()

const handleLogout = async () => {
  await authStore.logout();
  router.push({ name: 'login' });
}

const menuOptions = computed(() => {
  const baseMenu = [
    {
      label: () => h(RouterLink, { to: { name: 'home' } }, { default: () => '仪表盘' }),
      key: 'home',
      icon: renderIcon(HomeIcon)
    },
    {
      label: () => h(RouterLink, { to: { name: 'component-showcase' } }, { default: () => '组件展示' }),
      key: 'component-showcase',
      icon: renderIcon(ComponentIcon)
    },
    {
      label: () => h(RouterLink, { to: { name: 'subscriptions' } }, { default: () => '订阅管理' }),
      key: 'subscriptions',
      icon: renderIcon(SubscriptionIcon)
    },
    {
      label: () => h(RouterLink, { to: { name: 'nodes' } }, { default: () => '节点管理' }),
      key: 'nodes',
      icon: renderIcon(NodeIcon)
    },
    {
      label: () => h(RouterLink, { to: { name: 'profiles' } }, { default: () => '配置管理' }),
      key: 'profiles',
      icon: renderIcon(ProfileIcon)
    },
  ];

  const adminMenu = [
    {
      key: 'divider-admin',
      type: 'divider'
    },
    {
      label: () => h(RouterLink, { to: { name: 'user-management' } }, { default: () => '用户管理' }),
      key: 'user-management',
      icon: renderIcon(PeopleIcon)
    }
  ];

  const finalMenu = [
    {
      key: 'divider-settings',
      type: 'divider'
    },
    {
      label: () => h(RouterLink, { to: { name: 'settings' } }, { default: () => '系统设置' }),
      key: 'settings',
      icon: renderIcon(SettingsIcon)
    },
    {
      key: 'divider-1',
      type: 'divider'
    },
    {
      label: '退出登录',
      key: 'logout',
      icon: renderIcon(LogoutIcon),
      onClick: handleLogout
    }
  ];

  if (authStore.isAdmin) {
    return [...baseMenu, ...adminMenu, ...finalMenu];
  }
  return [...baseMenu, ...finalMenu];
});
</script>

<template>
  <n-layout style="height: 100vh">
    <n-layout has-sider>
      <!-- 左侧边栏 -->
      <n-layout-sider
        v-if="!isMobile"
        bordered
        collapse-mode="width"
        :collapsed-width="64"
        :width="260"
        show-trigger
        v-model:collapsed="collapsed"
        style="height: 100vh; display: flex; flex-direction: column;"
      >
        <!-- Logo区域 -->
        <div style="height: 64px; padding: 0 16px; display: flex; align-items: center; justify-content: center; border-bottom: 1px solid var(--n-border-color); flex-shrink: 0;">
          <div v-show="!collapsed" style="font-size: 18px; font-weight: bold;">SuperSub</div>
          <div v-show="collapsed" style="font-size: 14px; font-weight: bold; text-align: center;">SS</div>
        </div>

        <!-- 菜单区域 - 占据剩余空间 -->
        <div style="flex: 1; overflow: hidden; position: relative;">
          <n-menu
            :collapsed-width="64"
            :collapsed-icon-size="22"
            :options="menuOptions"
            style="height: 100%;"
          />
        </div>

        <!-- 左下角按钮区域 - 根据折叠状态调整布局 -->
        <div v-if="!isMobile" :style="collapsed ? 'position: absolute; bottom: 8px; left: 0; right: 0; display: flex; flex-direction: column; align-items: center; z-index: 10;' : 'position: absolute; bottom: 16px; left: 16px; display: flex; gap: 8px; z-index: 10;'">
          <!-- 布局切换按钮 -->
          <n-tooltip trigger="hover" :placement="collapsed ? 'right' : 'top'">
            <template #trigger>
              <div
                @click="layoutStore.toggleLayoutMode"
                :style="collapsed
                  ? 'height: 44px; width: 100%; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s ease; border-radius: 0; background: transparent;'
                  : 'height: 36px; width: 36px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s ease; border-radius: 6px; background: var(--n-button-color-2); border: 1px solid var(--n-button-border-color); box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);'"
                :class="collapsed ? 'collapsed-menu-item' : 'sidebar-control-button'"
              >
                <n-icon :component="layoutStore.layoutMode === 'vertical' ? VerticalIcon : HorizontalIcon" :size="collapsed ? 22 : 18" />
              </div>
            </template>
            切换为{{ layoutStore.layoutMode === 'vertical' ? '上下' : '左右' }}布局
          </n-tooltip>

          <!-- 主题切换按钮 -->
          <n-tooltip trigger="hover" :placement="collapsed ? 'right' : 'top'">
            <template #trigger>
              <div
                @click="themeStore.toggleTheme"
                :style="collapsed
                  ? 'height: 44px; width: 100%; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s ease; border-radius: 0; background: transparent;'
                  : 'height: 36px; width: 36px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s ease; border-radius: 6px; background: var(--n-button-color-2); border: 1px solid var(--n-button-border-color); box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);'"
                :class="collapsed ? 'collapsed-menu-item' : 'sidebar-control-button'"
              >
                <n-icon :component="themeStore.theme === 'dark' ? LightIcon : DarkIcon" :size="collapsed ? 22 : 18" />
              </div>
            </template>
            切换为{{ themeStore.theme === 'dark' ? '浅色' : '深色' }}主题
          </n-tooltip>
        </div>

      </n-layout-sider>

      <!-- 移动端抽屉 -->
      <n-drawer v-model:show="showDrawer" :width="260" placement="left">
        <!-- Logo区域 -->
        <div style="height: 64px; padding: 0 16px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--n-border-color);">
          <div style="font-size: 18px; font-weight: bold;">SuperSub</div>
          <n-space :size="12">
            <!-- 布局切换按钮 -->
            <n-tooltip trigger="hover">
              <template #trigger>
                <div class="control-button" @click="layoutStore.toggleLayoutMode" style="display: flex; align-items: center; justify-content: center; width: 32px; height: 32px; border-radius: 8px; background: var(--n-button-color-2); cursor: pointer; transition: all 0.3s ease;">
                  <n-icon :component="layoutStore.layoutMode === 'vertical' ? VerticalIcon : HorizontalIcon" size="16" />
                </div>
              </template>
              切换为{{ layoutStore.layoutMode === 'vertical' ? '上下' : '左右' }}布局
            </n-tooltip>
            <!-- 主题切换按钮 -->
            <n-tooltip trigger="hover">
              <template #trigger>
                <div class="control-button" @click="themeStore.toggleTheme" style="display: flex; align-items: center; justify-content: center; width: 32px; height: 32px; border-radius: 8px; background: var(--n-button-color-2); cursor: pointer; transition: all 0.3s ease;">
                  <n-icon :component="themeStore.theme === 'dark' ? LightIcon : DarkIcon" size="16" />
                </div>
              </template>
              切换为{{ themeStore.theme === 'dark' ? '浅色' : '深色' }}主题
            </n-tooltip>
          </n-space>
        </div>

        <n-menu
          :options="menuOptions"
          @update:value="showDrawer = false"
        />
      </n-drawer>

      <!-- 内容区域 -->
      <n-layout-content style="position: relative;">
        <!-- 移动端顶部操作栏 -->
        <div v-if="isMobile" style="height: 50px; padding: 0 12px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--n-border-color); background: var(--n-color);">
          <n-button text @click="showDrawer = true" style="width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;">
            <n-icon :component="MenuIcon" size="20" />
          </n-button>
          <div style="font-size: 16px; font-weight: bold;">SuperSub</div>
          <n-space :size="8">
            <!-- 布局切换按钮 -->
            <n-tooltip trigger="hover">
              <template #trigger>
                <div class="control-button-mobile" @click="layoutStore.toggleLayoutMode" style="display: flex; align-items: center; justify-content: center; width: 36px; height: 36px; border-radius: 8px; background: var(--n-button-color-2); cursor: pointer; transition: all 0.3s ease;">
                  <n-icon :component="layoutStore.layoutMode === 'vertical' ? VerticalIcon : HorizontalIcon" size="18" />
                </div>
              </template>
              切换布局
            </n-tooltip>
            <!-- 主题切换按钮 -->
            <n-tooltip trigger="hover">
              <template #trigger>
                <div class="control-button-mobile" @click="themeStore.toggleTheme" style="display: flex; align-items: center; justify-content: center; width: 36px; height: 36px; border-radius: 8px; background: var(--n-button-color-2); cursor: pointer; transition: all 0.3s ease;">
                  <n-icon :component="themeStore.theme === 'dark' ? LightIcon : DarkIcon" size="18" />
                </div>
              </template>
              切换主题
            </n-tooltip>
          </n-space>
        </div>

        <!-- 页面内容 -->
        <div :style="isMobile ? 'padding: 12px; height: calc(100vh - 50px); overflow-y: auto;' : 'padding: 24px; height: 100vh; overflow-y: auto;'">
          <RouterView />
        </div>
      </n-layout-content>
    </n-layout>
  </n-layout>
</template>

<style scoped>
.control-button:hover {
  background: var(--n-button-color-2-hover) !important;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.control-button-mobile:hover {
  background: var(--n-button-color-2-hover) !important;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.control-button:active {
  transform: translateY(0px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.control-button-mobile:active {
  transform: translateY(0px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* 与菜单项一致的悬停效果 */
.menu-item-hover:hover {
  background-color: var(--n-item-color-hover);
  color: var(--n-item-text-color-hover);
}

.menu-item-hover:active {
  background-color: var(--n-item-color-pressed);
  color: var(--n-item-text-color-pressed);
}

/* 确保菜单项与Naive UI菜单完全对齐 */
.menu-item {
  box-sizing: border-box;
  position: relative;
  width: 100%;
  border-radius: 0;
}

.menu-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border-radius: inherit;
  background-color: transparent;
  transition: background-color 0.2s var(--n-bezier);
}

.menu-item:hover::before {
  background-color: var(--n-item-color-hover);
}

.menu-item:active::before {
  background-color: var(--n-item-color-pressed);
}

/* 简单按钮样式 */
.control-button-simple {
  background: var(--n-button-color-2);
  border: 1px solid var(--n-button-border-color);
}

.control-button-simple:hover {
  background: var(--n-button-color-2-hover) !important;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* 侧边栏控制按钮样式 */
.sidebar-control-button:hover {
  background: var(--n-button-color-2-hover) !important;
  transform: translateY(-1px);
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.15);
}

.sidebar-control-button:active {
  transform: translateY(0px);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
  background: var(--n-button-color-2-pressed) !important;
}

/* 折叠状态下的菜单项样式 */
.collapsed-menu-item:hover {
  background-color: var(--n-item-color-hover);
}

.collapsed-menu-item:active {
  background-color: var(--n-item-color-pressed);
}
</style>