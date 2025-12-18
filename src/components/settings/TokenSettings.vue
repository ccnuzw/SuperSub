/**
 * 令牌设置组件
 * 专门管理订阅令牌相关功能
 * 遵循单一职责原则
 */

<template>
  <SettingsContentContainer
    title="令牌设置"
    description="管理您的订阅令牌，用于生成订阅链接"
  >
    <div class="token-settings">
      <!-- 订阅令牌管理 - 紧凑布局 -->
      <n-card class="token-form-card" size="small">
        <template #header>
          <n-space align="center">
            <n-icon color="#f59e0b" size="18">
              <KeyOutline />
            </n-icon>
            <span class="font-medium">订阅令牌管理</span>
          </n-space>
        </template>

        <div class="token-content">
          <!-- 令牌输入区域 -->
          <div class="token-input-section">
            <div class="token-input-wrapper">
              <n-input
                v-model:value="subToken"
                placeholder="正在加载..."
                :disabled="saveTokenLoading || resetLoading"
                type="password"
                show-password-on="click"
                readonly
                size="small"
                class="token-input"
              >
                <template #prefix>
                  <n-icon color="#f59e0b" size="14">
                    <KeyOutline />
                  </n-icon>
                </template>
              </n-input>
            </div>

            <!-- 快速操作按钮 -->
            <div class="quick-actions">
              <n-button
                @click="handleCopyTokenOnClick"
                type="primary"
                ghost
                :disabled="!subToken"
                size="small"
                class="action-btn"
              >
                <template #icon>
                  <n-icon size="14">
                    <CopyOutline />
                  </n-icon>
                </template>
                复制
              </n-button>

              <n-button
                @click="handleSaveTokenOnClick"
                type="primary"
                :loading="saveTokenLoading"
                :disabled="!subToken"
                size="small"
                class="action-btn"
              >
                <template #icon>
                  <n-icon size="14">
                    <SaveOutline />
                  </n-icon>
                </template>
                保存
              </n-button>

              <n-button
                @click="handleResetTokenOnClick"
                type="error"
                ghost
                :loading="resetLoading"
                size="small"
                class="action-btn"
              >
                <template #icon>
                  <n-icon size="14">
                    <RefreshOutline />
                  </n-icon>
                </template>
                重置
              </n-button>
            </div>
          </div>

          <!-- 状态指示器 -->
          <div class="token-status">
            <n-space align="center" justify="center">
              <n-icon :color="subToken ? '#22c55e' : '#f59e0b'" size="16">
                <component :is="subToken ? CheckmarkCircleOutline : WarningOutline" />
              </n-icon>
              <span class="text-sm font-medium" :class="subToken ? 'text-green-600' : 'text-yellow-600'">
                {{ subToken ? '令牌已配置' : '令牌未配置' }}
              </span>
            </n-space>
          </div>
        </div>
      </n-card>

      <!-- 快速提示和使用说明 -->
      <div class="token-info">
        <div class="info-grid">
          <div class="info-card">
            <div class="info-header">
              <n-icon color="#22c55e" size="16">
                <CheckmarkCircleOutline />
              </n-icon>
              <span class="text-sm font-medium">使用说明</span>
            </div>
            <ul class="info-list">
              <li class="text-xs text-gray-600">令牌用于生成专属订阅链接</li>
              <li class="text-xs text-gray-600">点击保存可固定当前令牌</li>
              <li class="text-xs text-gray-600">重置令牌将使旧链接失效</li>
            </ul>
          </div>

          <div class="info-card">
            <div class="info-header">
              <n-icon color="#3b82f6" size="16">
                <InformationCircleOutline />
              </n-icon>
              <span class="text-sm font-medium">安全建议</span>
            </div>
            <ul class="info-list">
              <li class="text-xs text-gray-600">定期更换令牌确保安全</li>
              <li class="text-xs text-gray-600">不要将令牌泄露给他人</li>
              <li class="text-xs text-gray-600">保存令牌避免频繁重置</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </SettingsContentContainer>
</template>

<script setup lang="ts">
import {
  NInput,
  NButton,
  NIcon,
  NCard,
  NSpace
} from 'naive-ui'
import {
  KeyOutline,
  CopyOutline,
  SaveOutline,
  RefreshOutline,
  InformationCircleOutline,
  CheckmarkCircleOutline,
  WarningOutline
} from '@vicons/ionicons5'

// 组件导入
import SettingsContentContainer from '@/components/settings/SettingsContentContainer.vue'
import { useSettings } from '@/composables/useSettings'

// 使用设置 composable
const {
  subToken,
  saveTokenLoading,
  resetLoading,
  copyToken,
  saveToken,
  resetToken
} = useSettings()

// 事件处理方法
const handleCopyTokenOnClick = () => {
  copyToken()
}

const handleSaveTokenOnClick = async () => {
  await saveToken()
}

const handleResetTokenOnClick = async () => {
  await resetToken()
}
</script>

<style scoped>
/* 令牌设置容器样式 - 紧凑布局 */
.token-settings {
  @apply space-y-4;
}

/* 表单卡片样式 */
.token-form-card {
  @apply bg-white border-gray-200;
}

.token-form-card :deep(.n-card-body) {
  @apply p-4;
}

/* 令牌内容布局 */
.token-content {
  @apply space-y-4;
}

/* 令牌输入区域 */
.token-input-section {
  @apply space-y-3;
}

.token-input-wrapper {
  @apply w-full;
}

.token-input {
  @apply w-full;
}

/* 快速操作按钮 */
.quick-actions {
  @apply flex items-center justify-center space-x-2;
}

.action-btn {
  @apply min-w-[60px];
}

/* 令牌状态指示器 */
.token-status {
  @apply py-2 px-3 bg-gray-50 rounded-lg;
}

/* 信息卡片区域 */
.token-info {
  @apply px-1;
}

.info-grid {
  @apply grid grid-cols-2 gap-3;
}

.info-card {
  @apply p-3 bg-gray-50 rounded-lg border border-gray-200;
}

.info-header {
  @apply flex items-center space-x-2 mb-2;
}

.info-list {
  @apply space-y-1 ml-6;
}

.info-list li {
  @apply leading-relaxed;
}

/* 响应式设计 */
@media (max-width: 640px) {
  .info-grid {
    @apply grid-cols-1 gap-2;
  }

  .quick-actions {
    @apply flex-wrap gap-2;
  }

  .action-btn {
    @apply flex-1 min-w-0;
  }

  .token-settings {
    @apply space-y-3;
  }
}

@media (max-width: 480px) {
  .token-form-card :deep(.n-card-body) {
    @apply p-3;
  }

  .info-card {
    @apply p-2;
  }

  .quick-actions {
    @apply grid grid-cols-2 gap-2;
  }

  .quick-actions .n-button:last-child {
    @apply col-span-2;
  }
}

/* 深色模式适配 */
.dark .token-form-card {
  @apply bg-gray-800 border-gray-700;
}

.dark .token-status {
  @apply bg-gray-700;
}

.dark .info-card {
  @apply bg-gray-700 border-gray-600;
}

.dark .info-list li {
  @apply text-gray-400;
}

/* 动画效果 */
.token-settings {
  animation: fadeInUp 0.3s ease-out;
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