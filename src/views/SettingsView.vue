/**
 * 系统设置主视图组件
 * 重构为侧边栏导航 + 内容区域的布局
 * 与节点管理保持一致的设计风格
 */

<template>
  <div class="page-container">
    <!-- 主要内容区域 -->
    <div class="main-content">
      <!-- 设置导航区域 -->
      <div class="navigation-section">
        <SettingsNavigation
          v-model:active-tab="activeTab"
          @tab-change="handleTabChangeOnTab"
        />
      </div>

      <!-- 设置内容区域 -->
      <div class="content-section">
        <!-- 加载状态 -->
        <n-spin v-if="isLoading" :show="true" class="loading-spinner">
          <template #description>
            正在加载设置...
          </template>
        </n-spin>

        <!-- 设置内容 -->
        <Transition name="fade-slide" mode="out-in">
          <component :is="currentTabComponent" :key="activeTab" />
        </Transition>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useMessage } from 'naive-ui'
import { useIsMobile } from '@/composables/useMediaQuery'

// 组件导入
import SettingsNavigation from '@/components/settings/SettingsNavigation.vue'
import NotificationSettings from '@/components/settings/NotificationSettings.vue'
import TokenSettings from '@/components/settings/TokenSettings.vue'
import PasswordSettings from '@/components/settings/PasswordSettings.vue'
import ConversionSettings from '@/components/settings/ConversionSettings.vue'
import { useSettings } from '@/composables/useSettings'

const message = useMessage()
const isMobile = useIsMobile()

// 使用设置composable进行统一初始化
const { initializeSettings, isLoading: settingsLoading } = useSettings()

// 响应式状态
const activeTab = ref('notifications')

// 计算属性 - 当前标签页组件
const currentTabComponent = computed(() => {
  const componentMap: Record<string, any> = {
    notifications: NotificationSettings,
    token: TokenSettings,
    password: PasswordSettings,
    conversion: ConversionSettings,
  }
  return componentMap[activeTab.value] || NotificationSettings
})

// 事件处理 - 遵循命名规范：handle + 动作 + On + 目标
const handleTabChangeOnTab = (tab: string) => {
  activeTab.value = tab
  // 移除切换提示，保持简洁的用户体验
}

// 计算加载状态
const isLoading = computed(() => {
  // 从composable获取加载状态
  return settingsLoading.value
})

// 生命周期
onMounted(async () => {
  // 统一初始化设置数据
  try {
    await initializeSettings()
    console.log('Settings initialized successfully')
  } catch (error) {
    console.error('Failed to initialize settings:', error)
    message.error('初始化设置失败，请稍后重试')
  }
})
</script>

<style scoped>
/* 页面容器样式 - 与节点管理保持一致 */
.page-container {
  @apply w-full flex flex-col;
  background: #ffffff;
  width: 100%;
  max-width: none;
  margin: 0;
  /* 与顶部栏的 px-6 保持一致 */
  padding: 16px 24px;
  /* 移除min-h-screen，使用fit-content */
  min-height: calc(100vh - 200px);
}

/* 主要内容区域 */
.main-content {
  @apply transition-all duration-300;
  display: flex;
  flex-direction: column;
  flex: 1;
  gap: 1rem;
}

/* 导航区域 */
.navigation-section {
  @apply w-full;
}

/* 内容区域 */
.content-section {
  @apply w-full flex-1;
  position: relative;
  /* 移除固定的min-height，让内容自适应 */
}

/* 加载样式 */
.loading-spinner {
  @apply flex items-center justify-center py-12;
}

/* 过渡动画 */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.fade-slide-enter-from {
  opacity: 0;
  transform: translateX(20px);
}

.fade-slide-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}

/* 响应式设计 - 与节点管理保持一致 */
@media (max-width: 640px) {
  .page-container {
    @apply py-2;
    padding-left: 16px;
    padding-right: 16px;
  }

  .main-content {
    @apply space-y-3;
  }
}

@media (min-width: 641px) and (max-width: 1024px) {
  .page-container {
    @apply py-3;
    padding-left: 20px;
    padding-right: 20px;
  }

  .main-content {
    @apply space-y-4;
  }
}

@media (min-width: 1025px) and (max-width: 1440px) {
  .page-container {
    @apply py-4;
    width: 100%;
    max-width: none;
    margin: 0;
    padding-left: 24px;
    padding-right: 24px;
  }

  .main-content {
    @apply space-y-4;
  }
}

@media (min-width: 1441px) and (max-width: 1920px) {
  .page-container {
    @apply py-5;
    width: 100%;
    max-width: none;
    margin: 0;
    padding-left: 24px;
    padding-right: 24px;
  }

  .main-content {
    @apply space-y-5;
  }
}

@media (min-width: 1921px) {
  .page-container {
    @apply py-6;
    width: 100%;
    max-width: none;
    margin: 0;
    padding-left: 24px;
    padding-right: 24px;
  }

  .main-content {
    @apply space-y-6;
  }
}

/* 桌面端响应式布局 */
@media (min-width: 1200px) {
  .page-container {
    @apply block;
  }

  .main-content {
    @apply flex-col space-x-0 space-y-1.5;
  }

  .navigation-section {
    @apply w-full;
    height: auto;
  }

  .content-section {
    @apply w-full;
  }
}

/* 更大屏幕，比例调整 */
@media (min-width: 1600px) {
  .page-container {
    @apply block;
  }

  .main-content {
    @apply space-y-2;
  }
}

/* 超大屏幕，进一步优化比例 */
@media (min-width: 1920px) {
  .page-container {
    @apply block;
  }

  .main-content {
    @apply space-y-3;
  }
}

/* 深色模式适配 */
.dark .page-container {
  background: linear-gradient(135deg, #1f2937 0%, #111827 100%);
}

/* 页面加载动画 */
.page-container {
  animation: fadeIn 0.5s ease-out;
}

@keyframes fadeIn {
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