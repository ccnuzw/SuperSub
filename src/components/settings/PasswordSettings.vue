/**
 * 密码修改组件
 * 专门管理密码修改功能
 * 遵循单一职责原则
 */

<template>
  <SettingsContentContainer
    title="密码修改"
    description="更新您的账户密码，确保账户安全"
  >
    <div class="password-settings">
      <!-- 密码修改表单 - 紧凑布局 -->
      <n-card class="password-form-card" size="small">
        <template #header>
          <n-space align="center">
            <n-icon color="#3b82f6" size="18">
              <LockClosedOutline />
            </n-icon>
            <span class="font-medium">修改登录密码</span>
          </n-space>
        </template>

        <div class="compact-password-form">
          <!-- 密码输入区域 -->
          <div class="password-inputs">
            <div class="form-row">
              <div class="form-field">
                <label class="form-label">新密码</label>
                <n-input
                  v-model:value="passwordFormState.password"
                  type="password"
                  placeholder="请输入新密码"
                  show-password-on="click"
                  :disabled="passwordChangeLoading"
                  clearable
                  maxlength="50"
                  size="small"
                >
                  <template #prefix>
                    <n-icon color="#3b82f6" size="14">
                      <LockClosedOutline />
                    </n-icon>
                  </template>
                </n-input>
              </div>

              <div class="form-field">
                <label class="form-label">确认密码</label>
                <n-input
                  v-model:value="confirmPassword"
                  type="password"
                  placeholder="请再次输入新密码"
                  show-password-on="click"
                  :disabled="passwordChangeLoading"
                  clearable
                  maxlength="50"
                  size="small"
                >
                  <template #prefix>
                    <n-icon color="#10b981" size="14">
                      <LockClosedOutline />
                    </n-icon>
                  </template>
                </n-input>
              </div>
            </div>
          </div>

          <!-- 密码强度检查（只在有密码时显示） -->
          <div v-if="passwordFormState.password" class="password-strength-compact">
            <div class="strength-row">
              <span class="strength-label">密码强度</span>
              <div class="strength-bar-container">
                <div class="strength-bar">
                  <div
                    class="strength-fill"
                    :class="passwordStrengthClass"
                    :style="{ width: `${passwordStrengthPercentage}%` }"
                  ></div>
                </div>
                <span class="strength-text" :class="passwordStrengthTextColor">
                  {{ passwordStrengthText }}
                </span>
              </div>
            </div>

            <!-- 密码要求检查 - 紧凑显示 -->
            <div class="requirements-compact">
              <span class="requirements-label">要求：</span>
              <div class="requirements-list">
                <span
                  v-for="requirement in passwordRequirements"
                  :key="requirement.key"
                  class="requirement-item"
                  :class="{ 'requirement-met': requirement.met }"
                >
                  {{ requirement.text }}
                </span>
              </div>
            </div>
          </div>

          <!-- 操作按钮 -->
          <div class="form-actions">
            <n-button
              type="primary"
              @click="handlePasswordChangeOnSubmit"
              :loading="passwordChangeLoading"
              :disabled="!passwordFormState.password || !confirmPassword"
              size="small"
            >
              <template #icon>
                <n-icon size="14">
                  <ShieldCheckmarkOutline />
                </n-icon>
              </template>
              修改密码
            </n-button>
          </div>
        </div>
      </n-card>

      <!-- 安全提示 - 紧凑版 -->
      <div class="security-tips">
        <div class="tips-compact">
          <div class="tip-category">
            <div class="tip-header">
              <n-icon color="#22c55e" size="14">
                <CheckmarkCircleOutline />
              </n-icon>
              <span class="text-xs font-medium">建议</span>
            </div>
            <div class="tip-items">
              <span class="text-xs">至少8位，包含大小写字母、数字和特殊字符</span>
              <span class="text-xs">避免使用与其他网站相同的密码</span>
            </div>
          </div>

          <div class="tip-category">
            <div class="tip-header">
              <n-icon color="#f59e0b" size="14">
                <WarningOutline />
              </n-icon>
              <span class="text-xs font-medium">注意</span>
            </div>
            <div class="tip-items">
              <span class="text-xs">修改后需重新登录所有设备</span>
              <span class="text-xs">请妥善保管新密码</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 密码匹配状态 -->
      <div v-if="passwordFormState.password && confirmPassword" class="match-status">
        <n-card size="small" class="status-card">
          <n-space align="center" justify="center">
            <n-icon :color="passwordMatch ? '#22c55e' : '#ef4444'" size="16">
              <component :is="passwordMatch ? CheckmarkCircleOutline : WarningOutline" />
            </n-icon>
            <span class="text-sm font-medium" :class="passwordMatch ? 'text-green-600' : 'text-red-600'">
              {{ passwordMatch ? '密码匹配' : '密码不匹配' }}
            </span>
          </n-space>
        </n-card>
      </div>
    </div>
  </SettingsContentContainer>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  NInput,
  NButton,
  NIcon,
  NCard,
  NSpace
} from 'naive-ui'
import {
  LockClosedOutline,
  ShieldCheckmarkOutline,
  CheckmarkCircleOutline,
  WarningOutline,
  InformationCircleOutline
} from '@vicons/ionicons5'

// 组件导入
import SettingsContentContainer from '@/components/settings/SettingsContentContainer.vue'
import { useSettings } from '@/composables/useSettings'

// 使用设置 composable
const {
  passwordFormState,
  passwordChangeLoading,
  handlePasswordChange
} = useSettings()

// 确认密码
const confirmPassword = ref('')

// 密码要求检查
const passwordRequirements = computed(() => {
  const password = passwordFormState.value.password || ''
  return [
    { key: 'length', text: '至少8位字符', met: password.length >= 8 },
    { key: 'uppercase', text: '包含大写字母', met: /[A-Z]/.test(password) },
    { key: 'lowercase', text: '包含小写字母', met: /[a-z]/.test(password) },
    { key: 'numbers', text: '包含数字', met: /\d/.test(password) },
    { key: 'special', text: '包含特殊字符', met: /[!@#$%^&*(),.?":{}|<>]/.test(password) }
  ]
})

// 计算密码强度
const passwordStrength = computed(() => {
  const password = passwordFormState.value.password || ''
  if (!password) return 0

  let strength = 0
  if (password.length >= 8) strength += 20
  if (password.length >= 12) strength += 10
  if (/[A-Z]/.test(password)) strength += 20
  if (/[a-z]/.test(password)) strength += 20
  if (/\d/.test(password)) strength += 20
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength += 10

  return Math.min(strength, 100)
})

// 密码强度百分比
const passwordStrengthPercentage = computed(() => passwordStrength.value)

// 密码强度类别
const passwordStrengthClass = computed(() => {
  const strength = passwordStrength.value
  if (strength < 40) return 'strength-weak'
  if (strength < 70) return 'strength-medium'
  return 'strength-strong'
})

// 密码强度文本
const passwordStrengthText = computed(() => {
  const strength = passwordStrength.value
  if (strength < 40) return '弱'
  if (strength < 70) return '中等'
  return '强'
})

// 密码强度文本颜色
const passwordStrengthTextColor = computed(() => {
  const strength = passwordStrength.value
  if (strength < 40) return 'text-red-500'
  if (strength < 70) return 'text-yellow-500'
  return 'text-green-500'
})

// 验证密码是否匹配
const passwordMatch = computed(() => {
  return passwordFormState.value.password === confirmPassword.value
})

// 事件处理方法
const handlePasswordChangeOnSubmit = async () => {
  // 基本验证
  if (!passwordFormState.value.password) {
    return
  }
  if (!confirmPassword.value) {
    return
  }
  if (!passwordMatch.value) {
    return
  }
  if (passwordStrength.value < 40) {
    return
  }

  await handlePasswordChange()
  // 清空确认密码
  confirmPassword.value = ''
}
</script>

<style scoped>
/* 密码设置容器样式 - 紧凑布局 */
.password-settings {
  @apply space-y-4;
}

/* 表单卡片样式 */
.password-form-card {
  @apply bg-white border-gray-200;
}

.password-form-card :deep(.n-card-body) {
  @apply p-4;
}

/* 紧凑表单布局 */
.compact-password-form {
  @apply space-y-4;
}

/* 密码输入区域 */
.password-inputs {
  @apply space-y-3;
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
  @apply flex justify-center pt-2;
}

/* 紧凑密码强度检查 */
.password-strength-compact {
  @apply space-y-3 p-3 bg-gray-50 rounded-lg;
}

.strength-row {
  @apply space-y-2;
}

.strength-label {
  @apply text-sm font-medium text-gray-700;
}

.strength-bar-container {
  @apply flex items-center space-x-3;
}

.strength-bar {
  @apply flex-1 h-2 bg-gray-200 rounded-full overflow-hidden;
}

.strength-fill {
  @apply h-full transition-all duration-300 ease-in-out;
}

.strength-weak {
  @apply bg-red-500;
}

.strength-medium {
  @apply bg-yellow-500;
}

.strength-strong {
  @apply bg-green-500;
}

.strength-text {
  @apply text-sm font-medium min-w-[30px];
}

/* 密码要求检查 - 紧凑显示 */
.requirements-compact {
  @apply space-y-1;
}

.requirements-label {
  @apply text-sm font-medium text-gray-700;
}

.requirements-list {
  @apply flex flex-wrap gap-2;
}

.requirement-item {
  @apply text-xs px-2 py-1 rounded-full border;
}

.requirement-item:not(.requirement-met) {
  @apply bg-gray-100 text-gray-500 border-gray-300;
}

.requirement-item.requirement-met {
  @apply bg-green-100 text-green-700 border-green-300;
}

/* 安全提示区域 */
.security-tips {
  @apply px-1;
}

.tips-compact {
  @apply grid grid-cols-2 gap-3;
}

.tip-category {
  @apply p-3 bg-gray-50 rounded-lg border border-gray-200;
}

.tip-header {
  @apply flex items-center space-x-2 mb-2;
}

.tip-items {
  @apply space-y-1;
}

.tip-items .text-xs {
  @apply text-gray-600;
}

/* 密码匹配状态 */
.match-status {
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

  .tips-compact {
    @apply grid-cols-1 gap-2;
  }

  .password-settings {
    @apply space-y-3;
  }

  .requirements-list {
    @apply flex-col gap-1;
  }
}

@media (max-width: 480px) {
  .password-form-card :deep(.n-card-body) {
    @apply p-3;
  }

  .form-actions .n-button {
    @apply w-full;
  }

  .strength-bar-container {
    @apply flex-col items-start space-x-0 space-y-2;
  }

  .strength-bar {
    @apply w-full;
  }
}

/* 深色模式适配 */
.dark .password-form-card {
  @apply bg-gray-800 border-gray-700;
}

.dark .form-label {
  @apply text-gray-300;
}

.dark .password-strength-compact {
  @apply bg-gray-700;
}

.dark .tip-category {
  @apply bg-gray-700 border-gray-600;
}

.dark .tip-items .text-xs {
  @apply text-gray-400;
}

.dark .status-card {
  @apply bg-gray-800 border-gray-700;
}

.dark .requirements-label,
.dark .strength-label {
  @apply text-gray-300;
}

/* 动画效果 */
.password-settings {
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