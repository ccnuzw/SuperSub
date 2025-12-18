/**
 * 转换设置组件
 * 重构为使用统一的设置组件和布局
 * 遵循单一职责原则
 */

<template>
  <SettingsContentContainer
    title="转换设置"
    description="管理订阅转换的后端服务和配置模板"
  >
    <div class="conversion-settings">
      <!-- 后端管理 -->
      <div class="settings-section">
        <AssetManager
          asset-type="backend"
          title="订阅转换后端管理"
          asset-name="后端"
          class="asset-manager"
          @assets-uploaded="handleAssetsUpdatedOnBackend"
        />
      </div>

      <!-- 配置管理 -->
      <div class="settings-section">
        <AssetManager
          asset-type="config"
          title="订阅转换配置管理"
          asset-name="配置"
          class="asset-manager"
          @assets-uploaded="handleAssetsUpdatedOnConfig"
        />
      </div>

      <!-- 使用说明 -->
      <n-card class="mt-6" size="small">
        <template #header>
          <n-space align="center">
            <n-icon color="#6b7280">
              <InformationCircleOutline />
            </n-icon>
            <span>使用说明</span>
          </n-space>
        </template>

        <div class="space-y-3 text-sm text-gray-600">
          <div class="flex items-start space-x-2">
            <n-icon class="mt-0.5" size="16" color="#22c55e">
              <CheckmarkCircleOutline />
            </n-icon>
            <span>后端服务：添加和管理订阅转换的远程后端地址</span>
          </div>
          <div class="flex items-start space-x-2">
            <n-icon class="mt-0.5" size="16" color="#22c55e">
              <CheckmarkCircleOutline />
            </n-icon>
            <span>配置模板：管理不同客户端的配置模板文件</span>
          </div>
          <div class="flex items-start space-x-2">
            <n-icon class="mt-0.5" size="16" color="#f59e0b">
              <WarningOutline />
            </n-icon>
            <span>请确保添加的后端服务地址可正常访问</span>
          </div>
          <div class="flex items-start space-x-2">
            <n-icon class="mt-0.5" size="16" color="#3b82f6">
              <InformationCircleOutline />
            </n-icon>
            <span>标记为默认的资源将优先使用</span>
          </div>
        </div>
      </n-card>

      <!-- 状态信息 -->
      <div class="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <n-card size="small" class="status-card">
          <n-statistic label="后端服务数量" :value="backendCount">
            <template #prefix>
              <n-icon color="#22c55e">
                <ServerOutline />
              </n-icon>
            </template>
          </n-statistic>
        </n-card>

        <n-card size="small" class="status-card">
          <n-statistic label="配置模板数量" :value="configCount">
            <template #prefix>
              <n-icon color="#3b82f6">
                <DocumentTextOutline />
              </n-icon>
            </template>
          </n-statistic>
        </n-card>
      </div>
    </div>
  </SettingsContentContainer>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useMessage } from 'naive-ui'
import {
  NCard,
  NSpace,
  NIcon,
  NStatistic
} from 'naive-ui'
import {
  InformationCircleOutline,
  CheckmarkCircleOutline,
  WarningOutline,
  ServerOutline,
  DocumentTextOutline
} from '@vicons/ionicons5'

// 组件导入
import SettingsContentContainer from '@/components/settings/SettingsContentContainer.vue'
import AssetManager from '@/components/AssetManager.vue'

const message = useMessage()

// 响应式状态
const backendCount = ref(0)
const configCount = ref(0)

// 事件处理方法
const handleAssetsUpdatedOnBackend = (assets: any[]) => {
  backendCount.value = assets.length
  console.log('Backend assets updated:', assets.length)
}

const handleAssetsUpdatedOnConfig = (assets: any[]) => {
  configCount.value = assets.length
  console.log('Config assets updated:', assets.length)
}

// 生命周期
onMounted(() => {
  // 初始化统计数据
  console.log('ConversionSettings mounted')
})
</script>

<style scoped>
/* 转换设置容器样式 */
.conversion-settings {
  @apply space-y-6;
}

/* 设置区块样式 */
.settings-section {
  @apply w-full;
}

.asset-manager {
  @apply w-full;
}

/* 状态卡片样式 */
.status-card {
  @apply bg-gray-50 border-gray-200;
}

.status-card :deep(.n-card-body) {
  @apply py-4;
}

/* 说明卡片样式 */
.conversion-settings :deep(.n-card:not(.status-card)) {
  @apply bg-gray-50 border-gray-200;
}

.conversion-settings :deep(.n-card .n-card-header) {
  @apply pb-3;
}

.conversion-settings :deep(.n-card .n-card-body) {
  @apply pt-0;
}

/* 统计数字样式 */
.conversion-settings :deep(.n-statistic) {
  @apply text-center;
}

.conversion-settings :deep(.n-statistic .n-statistic-value) {
  @apply font-bold text-xl;
}

.conversion-settings :deep(.n-statistic .n-statistic-label) {
  @apply text-sm text-gray-600;
}

/* 响应式调整 */
@media (max-width: 640px) {
  .conversion-settings .grid {
    @apply grid-cols-1;
  }

  .asset-manager {
    @apply mb-4;
  }
}

/* 深色模式适配 */
.dark .conversion-settings :deep(.n-card) {
  @apply bg-gray-800 border-gray-700;
}

.dark .conversion-settings .space-y-3 span {
  @apply text-gray-400;
}

.dark .status-card {
  @apply bg-gray-800 border-gray-700;
}

.dark .conversion-settings :deep(.n-statistic-label) {
  @apply text-gray-400;
}

/* AssetManager 样式调整 */
.conversion-settings :deep(.asset-manager) {
  @apply bg-white rounded-lg;
}

.conversion-settings :deep(.asset-manager .n-data-table) {
  @apply border rounded-lg;
}

/* 动画效果 */
.conversion-settings {
  animation: fadeInUp 0.4s ease-out;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>