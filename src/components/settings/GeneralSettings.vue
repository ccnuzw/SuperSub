<template>
  <div class="space-y-10">
    
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

    <!-- Subscription Token -->
    <section>
      <div class="mb-6">
        <h3 class="text-lg font-semibold text-slate-900 dark:text-white">订阅 Token</h3>
        <p class="text-sm text-slate-500 dark:text-slate-400">用于生成订阅链接的私有 Token。</p>
      </div>

      <Card variant="elevated">
        <div class="flex flex-col sm:flex-row gap-4 items-center">
          <n-input 
            class="flex-1 font-mono text-sm" 
            v-model:value="subToken" 
            placeholder="加载中..." 
            readonly 
            size="large"
          />
          <div class="flex gap-2 w-full sm:w-auto">
            <Button variant="secondary" @click="copyToken" class="flex-1 sm:flex-none">
              复制
            </Button>
            <Button variant="primary" @click="saveToken" :loading="saveTokenLoading" class="flex-1 sm:flex-none">
              保存
            </Button>
          </div>
        </div>
        <div class="mt-4 border-t border-gray-100 dark:border-dark-border pt-4">
          <Button variant="danger" size="sm" @click="resetToken" :loading="resetLoading">
            重置 Token
          </Button>
        </div>
      </Card>
    </section>

    <!-- Change Password -->
    <section>
      <div class="mb-6">
        <h3 class="text-lg font-semibold text-slate-900 dark:text-white">修改密码</h3>
        <p class="text-sm text-slate-500 dark:text-slate-400">更新您的账户密码。</p>
      </div>

      <n-form ref="passwordFormRef" :model="passwordFormState" :rules="passwordRules" label-placement="top">
        <div class="max-w-md">
          <n-form-item label="新密码" path="password">
             <n-input
              v-model:value="passwordFormState.password"
              type="password"
              placeholder="请输入新密码"
              show-password-on="click"
              size="large"
            />
          </n-form-item>
          <div class="mt-2">
             <Button variant="primary" @click="handlePasswordChange" :loading="passwordChangeLoading">
              更新密码
            </Button>
          </div>
        </div>
      </n-form>
    </section>

  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import {
  NForm, NFormItem, NInput, useMessage, type FormInst, type FormRules
} from 'naive-ui';
import Button from '@/components/ui/Button.vue';
import Card from '@/components/ui/Card.vue';
import { usersApi } from '@/api/users';
import { settingsApi } from '@/api/settings';
import { adminApi } from '@/api/admin';
import { useAuthStore } from '@/stores/auth';
import { LogoutInProgressError } from '@/utils/errors';

const message = useMessage();
const authStore = useAuthStore();
const formRef = ref<any>(null);
const saveLoading = ref(false);
const testLoading = ref(false);
const resetLoading = ref(false);
const saveTokenLoading = ref(false);
const passwordChangeLoading = ref(false);
const subToken = ref('');
const passwordFormRef = ref<FormInst | null>(null);

const formState = ref({
  telegram_bot_token: '',
  telegram_chat_id: '',
});

const passwordFormState = ref({
  password: '',
});

const passwordRules: FormRules = {
  password: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
  ]
};

const fetchSubToken = async () => {
  if (!authStore.isAuthenticated) {
    return;
  }
  try {
    const response = await usersApi.getSubscriptionToken();
    if (response.data.success && response.data.data) {
      subToken.value = response.data.data.token;
    }
  } catch (error) {
    if (error instanceof LogoutInProgressError) {
      console.log('Logout in progress, skipping sub token fetch.');
      return;
    }
    message.error('获取订阅 Token 失败');
  }
};

const copyToken = () => {
  if (subToken.value) {
    navigator.clipboard.writeText(subToken.value);
    message.success('已复制到剪贴板');
  }
};

const resetToken = async () => {
  resetLoading.value = true;
  try {
    const response = await usersApi.resetSubscriptionToken();
    if (response.data.success && response.data.data) {
      subToken.value = response.data.data.token;
      authStore.updateTokenAndUser(response.data.data);
      message.success('Token 重置成功');
    }
  } catch (error) {
    message.error('重置 Token 失败');
  } finally {
    resetLoading.value = false;
  }
};

const saveToken = async () => {
  saveTokenLoading.value = true;
  try {
    const response = await usersApi.updateSubscriptionToken(subToken.value);
    if (response.data.success && response.data.data) {
      authStore.updateTokenAndUser(response.data.data);
      message.success('Token 保存成功');
    }
  } catch (error: any) {
    message.error(error.response?.data?.message || '保存 Token 失败');
  } finally {
    saveTokenLoading.value = false;
  }
};

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

const handlePasswordChange = async () => {
  passwordFormRef.value?.validate(async (errors) => {
    if (!errors) {
      passwordChangeLoading.value = true;
      try {
        await usersApi.updatePassword(passwordFormState.value.password);
        message.success('密码更新成功');
        passwordFormState.value.password = ''; // Clear password field
      } catch (error: any) {
        message.error(error.response?.data?.message || '更新密码失败');
      } finally {
        passwordChangeLoading.value = false;
      }
    }
  });
};

onMounted(() => {
  fetchSettings();
  fetchSubToken();
});
</script>