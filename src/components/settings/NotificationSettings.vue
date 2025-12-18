/**
 * 通知设置组件
 * 从GeneralSettings中提取通知相关功能
 * 遵循单一职责原则
 */

<template>
  <SettingsContentContainer
    title="通知设置"
    description="配置系统的通知方式，包括Telegram推送等"
  >
    <div class="notification-settings">
      <!-- Telegram 通知设置 - 紧凑布局 -->
      <n-card class="notification-form-card" size="small">
        <template #header>
          <n-space align="center">
            <n-icon color="#22c55e" size="18">
              <NotificationsOutline />
            </n-icon>
            <span class="font-medium">Telegram 通知设置</span>
          </n-space>
        </template>

        <div class="compact-form">
          <!-- 第一行：Bot Token 和 Chat ID -->
          <div class="form-row">
            <div class="form-field">
              <label class="form-label">Bot Token</label>
              <n-input
                v-model:value="formState.telegram_bot_token"
                placeholder="输入您的 Telegram Bot Token"
                :disabled="saveLoading"
                clearable
                size="small"
              >
                <template #prefix>
                  <n-icon color="#22c55e" size="14">
                    <NotificationsOutline />
                  </n-icon>
                </template>
              </n-input>
            </div>

            <div class="form-field">
              <label class="form-label">Chat ID</label>
              <n-input
                v-model:value="formState.telegram_chat_id"
                placeholder="输入接收通知的频道或用户 Chat ID"
                :disabled="saveLoading"
                clearable
                size="small"
              >
                <template #prefix>
                  <n-icon color="#3b82f6" size="14">
                    <ChatbubbleEllipsesOutline />
                  </n-icon>
                </template>
              </n-input>
            </div>
          </div>

          <!-- 第二行：操作按钮 -->
          <div class="form-actions">
            <n-button @click="handleSaveTest" :loading="testLoading" :disabled="!isTelegramConfigured" size="small">
              <template #icon>
                <n-icon size="14">
                  <SendOutline />
                </n-icon>
              </template>
              发送测试通知
            </n-button>
            <n-button type="primary" @click="handleSaveOnSubmit" :loading="saveLoading" size="small">
              <template #icon>
                <n-icon size="14">
                  <SaveOutline />
                </n-icon>
              </template>
              保存设置
            </n-button>
          </div>
        </div>
      </n-card>

      <!-- 快速提示 - 紧凑版 -->
      <div class="quick-tips">
        <div class="tips-grid">
          <div class="tip-item">
            <n-icon color="#22c55e" size="14">
              <CheckmarkCircleOutline />
            </n-icon>
            <span class="text-xs">Bot Token: 与 @BotFather 对话创建机器人</span>
          </div>
          <div class="tip-item">
            <n-icon color="#22c55e" size="14">
              <CheckmarkCircleOutline />
            </n-icon>
            <span class="text-xs">Chat ID: 发送消息给机器人后查看更新</span>
          </div>
          <div class="tip-item">
            <n-icon color="#f59e0b" size="14">
              <WarningOutline />
            </n-icon>
            <span class="text-xs">确保网络连接正常后再测试通知</span>
          </div>
        </div>
      </div>

      <!-- 状态指示器 -->
      <div class="status-indicator">
        <n-card size="small" class="status-card">
          <n-space justify="space-between" align="center">
            <span class="text-sm font-medium">配置状态</span>
            <n-space align="center">
              <n-icon
                :color="isTelegramConfigured ? '#22c55e' : '#f59e0b'"
                size="16"
              >
                <component :is="isTelegramConfigured ? CheckmarkCircleOutline : WarningOutline" />
              </n-icon>
              <span class="text-sm" :class="isTelegramConfigured ? 'text-green-600' : 'text-yellow-600'">
                {{ isTelegramConfigured ? '已配置' : '未配置' }}
              </span>
            </n-space>
          </n-space>
        </n-card>
      </div>
    </div>
  </SettingsContentContainer>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import {
  NInput,
  NButton,
  NIcon,
  NCard,
  NSpace
} from 'naive-ui'
import {
  NotificationsOutline,
  ChatbubbleEllipsesOutline,
  InformationCircleOutline,
  CheckmarkCircleOutline,
  WarningOutline,
  SendOutline,
  SaveOutline
} from '@vicons/ionicons5'

// 组件导入
import SettingsContentContainer from '@/components/settings/SettingsContentContainer.vue'
import { useSettings } from '@/composables/useSettings'

// 使用设置 composable
const {
  formState,
  saveLoading,
  testLoading,
  handleSave,
  handleTestTelegram
} = useSettings()

// 计算属性 - 检查Telegram是否已配置
const isTelegramConfigured = computed(() => {
  return formState.value.telegram_bot_token && formState.value.telegram_chat_id
})

// 事件处理方法
const handleSaveOnSubmit = async () => {
  await handleSave()
}

const handleSaveTest = async () => {
  if (isTelegramConfigured.value) {
    await handleTestTelegram()
  }
}

// 组件挂载时，数据已由父组件初始化
onMounted(() => {
  // 数据已由父组件加载，无需额外操作
})
</script>

<style scoped>
/* 通知设置容器样式 - 紧凑布局 */
.notification-settings {
  @apply space-y-4;
}

/* 表单卡片样式 */
.notification-form-card {
  @apply bg-white border-gray-200;
}

.notification-form-card :deep(.n-card-body) {
  @apply p-4;
}

/* 紧凑表单布局 */
.compact-form {
  @apply space-y-4;
}

.form-row {
  @apply grid grid-cols-2 gap-4;
}

.form-field {
  @apply space-y-2;
}

.form-label {
  @apply text-sm font-medium text-gray-700;
}

/* 表单操作区域 */
.form-actions {
  @apply flex items-center space-x-3 pt-2;
}

/* 快速提示区域 */
.quick-tips {
  @apply px-1;
}

.tips-grid {
  @apply grid grid-cols-1 gap-2;
}

.tip-item {
  @apply flex items-start space-x-2 p-2 rounded-lg bg-gray-50;
}

.tip-item .text-xs {
  @apply text-gray-600 leading-relaxed;
}

/* 状态指示器 */
.status-indicator {
  @apply px-1;
}

.status-card {
  @apply bg-gray-50 border-gray-200;
}

.status-card :deep(.n-card-body) {
  @apply py-3 px-4;
}

/* 响应式设计 */
@media (max-width: 640px) {
  .form-row {
    @apply grid-cols-1 gap-3;
  }

  .form-actions {
    @apply flex-col space-x-0 space-y-2;
  }

  .notification-settings {
    @apply space-y-3;
  }

  .tips-grid {
    @apply grid-cols-1;
  }
}

@media (max-width: 480px) {
  .notification-form-card :deep(.n-card-body) {
    @apply p-3;
  }

  .form-actions {
    @apply w-full;
  }

  .form-actions .n-button {
    @apply flex-1;
  }
}

/* 深色模式适配 */
.dark .notification-form-card {
  @apply bg-gray-800 border-gray-700;
}

.dark .form-label {
  @apply text-gray-300;
}

.dark .tip-item {
  @apply bg-gray-700;
}

.dark .tip-item .text-xs {
  @apply text-gray-400;
}

.dark .status-card {
  @apply bg-gray-800 border-gray-700;
}

/* 动画效果 */
.notification-settings {
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