<template>
  <div class="p-4">
    <!-- 加载状态显示 -->
    <n-spin v-if="isLoading" :show="true">
      <template #description>
        正在加载设置...
      </template>
    </n-spin>

    <!-- 设置表单 -->
    <div v-else>
      <n-form ref="formRef" :model="formState" label-placement="top">
        <n-divider title-placement="left">Telegram 通知设置</n-divider>
        <n-grid cols="1" md:cols="2" :x-gap="24">
          <n-form-item-gi label="Bot Token" path="telegram_bot_token">
            <n-input
              v-model:value="formState.telegram_bot_token"
              placeholder="输入您的 Telegram Bot Token"
              :disabled="saveLoading"
            />
          </n-form-item-gi>
          <n-form-item-gi label="Chat ID" path="telegram_chat_id">
            <n-input
              v-model:value="formState.telegram_chat_id"
              placeholder="输入接收通知的频道或用户 Chat ID"
              :disabled="saveLoading"
            />
          </n-form-item-gi>
        </n-grid>

        <n-form-item>
          <n-space>
            <n-button type="primary" @click="handleSave" :loading="saveLoading" :disabled="!hasSettings && !formState.telegram_bot_token && !formState.telegram_chat_id">
              保存设置
            </n-button>
            <n-button @click="handleTestTelegram" :loading="testLoading" :disabled="!formState.telegram_bot_token || !formState.telegram_chat_id">
              发送测试通知
            </n-button>
          </n-space>
        </n-form-item>
      </n-form>

      <n-divider title-placement="left">订阅令牌设置</n-divider>
      <n-card>
        <n-space vertical>
          <n-text>您的私人订阅令牌，用于构建订阅链接。</n-text>
          <div class="flex flex-wrap items-center gap-2">
            <n-input
              class="flex-grow"
              v-model:value="subToken"
              placeholder="正在加载..."
              :disabled="saveTokenLoading || resetLoading"
            />
            <n-button @click="copyToken" type="primary" ghost :disabled="!subToken">
              复制
            </n-button>
            <n-button @click="saveToken" type="primary" :loading="saveTokenLoading" :disabled="!subToken">
              保存
            </n-button>
          </div>
          <n-button @click="resetToken" type="error" ghost :loading="resetLoading" class="mt-2">
            重置令牌
          </n-button>
        </n-space>
      </n-card>

      <n-divider title-placement="left">修改密码</n-divider>
      <n-form ref="passwordFormRef" :model="passwordFormState" :rules="passwordRules" label-placement="top">
        <n-grid cols="1" md:cols="2" :x-gap="24">
          <n-form-item-gi label="新密码" path="password">
            <n-input
              v-model:value="passwordFormState.password"
              type="password"
              placeholder="输入新密码"
              show-password-on="click"
              :disabled="passwordChangeLoading"
            />
          </n-form-item-gi>
        </n-grid>
        <n-form-item>
          <n-button type="primary" @click="handlePasswordChange" :loading="passwordChangeLoading" :disabled="!passwordFormState.password">
            修改密码
          </n-button>
        </n-form-item>
      </n-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onActivated } from 'vue';
import {
  NForm, NFormItem, NInput, NButton, useMessage, NDivider, NSpace, NGrid,
  NFormItemGi, NCard, NText, type FormInst, NSpin
} from 'naive-ui';
import { useSettings } from '@/composables/useSettings';

// 使用设置组合式函数
const {
  saveLoading,
  testLoading,
  resetLoading,
  saveTokenLoading,
  passwordChangeLoading,
  subToken,
  formRef,
  passwordFormRef,
  formState,
  passwordFormState,
  passwordRules,
  handleSave,
  handleTestTelegram,
  copyToken,
  resetToken,
  saveToken,
  handlePasswordChange,
  initializeSettings,
  isLoading,
  hasSettings,
} = useSettings();

// 组件挂载时初始化设置
onMounted(() => {
  initializeSettings();
});

// 组件激活时（从其他tab切换回来）重新初始化设置
onActivated(() => {
  initializeSettings();
});
</script>

<style scoped>
.n-form-item {
  margin-bottom: 16px;
}

.n-card {
  margin-bottom: 16px;
}

.n-divider {
  margin: 24px 0 16px 0;
}
</style>