<template>
  <div class="space-y-10 p-4">
    <!-- Telegram Settings -->
    <section>
      <div class="mb-6">
        <h3 class="text-lg font-semibold text-slate-900 dark:text-white">Telegram 通知</h3>
        <p class="text-sm text-slate-500 dark:text-slate-400">配置您的 Telegram 机器人以接收系统通知。</p>
      </div>
      
      <n-form ref="formRef" :model="formState" label-placement="top">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <n-form-item label="机器人 Token" path="telegram_bot_token">
            <n-input
              v-model:value="formState.telegram_bot_token"
              placeholder="请输入 Telegram Bot Token"
              size="large"
            />
          </n-form-item>
          <n-form-item label="会话 ID (Chat ID)" path="telegram_chat_id">
            <n-input
              v-model:value="formState.telegram_chat_id"
              placeholder="请输入 Chat ID"
              size="large"
            />
          </n-form-item>
        </div>
        
        <div class="mt-4 flex gap-3">
          <Button variant="primary" @click="handleSave" :loading="saveLoading">
            保存更改
          </Button>
          <Button variant="secondary" @click="handleTestTelegram" :loading="testLoading">
            发送测试消息
          </Button>
        </div>
      </n-form>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { NForm, NFormItem, NInput, useMessage } from 'naive-ui';
import Button from '@/components/ui/Button.vue';
import { settingsApi } from '@/api/settings';
import { adminApi } from '@/api/admin';
import { useAuthStore } from '@/stores/auth';

const message = useMessage();
const authStore = useAuthStore();
const formRef = ref<any>(null);
const saveLoading = ref(false);
const testLoading = ref(false);

const formState = ref({
  telegram_bot_token: '',
  telegram_chat_id: '',
});

const fetchSettings = async () => {
  if (!authStore.isAuthenticated) {
    return;
  }
  try {
    const userSettingsResponse = await settingsApi.fetchSettings();
    if (userSettingsResponse.data.success && Array.isArray(userSettingsResponse.data.data)) {
      const settings = userSettingsResponse.data.data.reduce((acc: Record<string, any>, setting: { key: string, value: any }) => {
        acc[setting.key] = setting.value;
        return acc;
      }, {});
      formState.value.telegram_bot_token = settings.telegram_bot_token || '';
      formState.value.telegram_chat_id = settings.telegram_chat_id || '';
    }
  } catch (error) {
    console.warn('Could not fetch settings.', error);
    message.error('加载设置失败');
  }
};

const handleSave = async () => {
  saveLoading.value = true;
  try {
    const userSettingsPayload = [
      {
        key: 'telegram_bot_token',
        value: formState.value.telegram_bot_token,
        type: 'string',
        category: 'telegram',
        description: 'Telegram Bot Token'
      },
      {
        key: 'telegram_chat_id',
        value: formState.value.telegram_chat_id,
        type: 'string',
        category: 'telegram',
        description: 'Telegram Chat ID'
      }
    ];
    await settingsApi.updateSettings(userSettingsPayload);
    message.success('设置已保存');
  } catch (error) {
    message.error('保存设置失败');
    console.error('Failed to save settings:', error);
  } finally {
    saveLoading.value = false;
  }
};

const handleTestTelegram = async () => {
  testLoading.value = true;
  try {
    await adminApi.testTelegram();
    message.success('测试消息已发送，请检查您的 Telegram');
  } catch (error: any) {
    message.error(error.response?.data?.message || '发送测试消息失败');
    console.error('Failed to send test message:', error);
  } finally {
    testLoading.value = false;
  }
};

onMounted(() => {
  fetchSettings();
});
</script>
