<template>
  <div class="p-4">
    <n-form ref="formRef" :model="formState" label-placement="top">
      <!-- 布局设置 -->
      <n-divider title-placement="left">界面布局设置</n-divider>
      <n-form-item label="布局模式">
        <n-radio-group v-model:value="layoutMode" @update:value="handleLayoutChange">
          <n-space>
            <n-radio-button value="vertical">
              <template #icon>
                <n-icon :component="MenuOutline" />
              </template>
              左右布局
            </n-radio-button>
            <n-radio-button value="horizontal">
              <template #icon>
                <n-icon :component="AppsOutline" />
              </template>
              上下布局
            </n-radio-button>
          </n-space>
        </n-radio-group>
      </n-form-item>
      <n-text depth="3" style="font-size: 12px;">
        左右布局：侧边栏导航，适合桌面使用<br>
        上下布局：顶部导航，适合内容展示
      </n-text>

      <n-divider title-placement="left">Telegram 通知设置</n-divider>
      <n-grid cols="1" md:cols="2" :x-gap="24">
        <n-form-item-gi label="Bot Token" path="telegram_bot_token">
          <n-input
            v-model:value="formState.telegram_bot_token"
            placeholder="输入您的 Telegram Bot Token"
          />
        </n-form-item-gi>
        <n-form-item-gi label="Chat ID" path="telegram_chat_id">
          <n-input
            v-model:value="formState.telegram_chat_id"
            placeholder="输入接收通知的频道或用户 Chat ID"
          />
        </n-form-item-gi>
      </n-grid>
      
      <n-form-item>
        <n-space>
          <n-button type="primary" @click="handleSave" :loading="saveLoading">
            保存设置
          </n-button>
          <n-button @click="handleTestTelegram" :loading="testLoading">
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
          <n-input class="flex-grow" v-model:value="subToken" placeholder="正在加载..." />
          <n-button @click="copyToken" type="primary" ghost>
            复制
          </n-button>
          <n-button @click="saveToken" type="primary" :loading="saveTokenLoading">
            保存
          </n-button>
        </div>
        <n-button @click="resetToken" type="error" ghost :loading="resetLoading" class="mt-2">
          重置令牌
        </n-button>
      </n-space>
    </n-card>
  </div>

  <n-divider title-placement="left">修改密码</n-divider>
  <n-form ref="passwordFormRef" :model="passwordFormState" :rules="passwordRules" label-placement="top">
    <n-grid cols="1" md:cols="2" :x-gap="24">
      <n-form-item-gi label="新密码" path="password">
        <n-input
          v-model:value="passwordFormState.password"
          type="password"
          placeholder="输入新密码"
          show-password-on="click"
        />
      </n-form-item-gi>
    </n-grid>
    <n-form-item>
      <n-button type="primary" @click="handlePasswordChange" :loading="passwordChangeLoading">
        修改密码
      </n-button>
    </n-form-item>
  </n-form>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import {
  NForm, NFormItem, NInput, NButton, useMessage, NDivider, NSpace, NGrid, NFormItemGi, NCard, NInputGroup, NText, type FormInst, type FormRules, NRadioGroup, NRadioButton, NIcon
} from 'naive-ui';
import { MenuOutline, AppsOutline } from '@vicons/ionicons5';
import { api } from '@/utils/api';
import { useAuthStore } from '@/stores/auth';
import { useLayoutStore } from '@/stores/layout';
import { LogoutInProgressError } from '@/utils/errors';

const message = useMessage();
const authStore = useAuthStore();
const layoutStore = useLayoutStore();
const formRef = ref<any>(null);
const saveLoading = ref(false);
const testLoading = ref(false);
const resetLoading = ref(false);
const saveTokenLoading = ref(false);
const passwordChangeLoading = ref(false);
const subToken = ref('');
const passwordFormRef = ref<FormInst | null>(null);
const layoutMode = ref(layoutStore.layoutMode);

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
    const response = await api.get('/user/sub-token');
    if (response.data.success) {
      subToken.value = response.data.data.token;
    }
  } catch (error) {
    if (error instanceof LogoutInProgressError) {
      console.log('Logout in progress, skipping sub token fetch.');
      return;
    }
    message.error('获取订阅令牌失败');
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
    const response = await api.post('/user/sub-token/reset');
    if (response.data.success) {
      subToken.value = response.data.data.token;
      authStore.updateTokenAndUser(response.data.data);
      message.success('订阅令牌已重置');
    }
  } catch (error) {
    message.error('重置订阅令牌失败');
  } finally {
    resetLoading.value = false;
  }
};

const saveToken = async () => {
  saveTokenLoading.value = true;
  try {
    const response = await api.put('/user/sub-token', { token: subToken.value });
    if (response.data.success) {
      authStore.updateTokenAndUser(response.data.data);
      message.success('订阅令牌已保存');
    }
  } catch (error: any) {
    message.error(error.response?.data?.message || '保存订阅令牌失败');
  } finally {
    saveTokenLoading.value = false;
  }
};

const fetchSettings = async () => {
  if (!authStore.isAuthenticated) {
    return;
  }
  try {
    const userSettingsResponse = await api.get('/settings');
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
    await api.post('/settings', userSettingsPayload);
    message.success('设置已保存');
  } catch (error) {
    message.error('保存设置失败，请检查后端服务');
    console.error('Failed to save settings:', error);
  } finally {
    saveLoading.value = false;
  }
};

const handleTestTelegram = async () => {
  testLoading.value = true;
  try {
    await api.post('/system/settings/test-telegram');
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
        await api.put('/user/password', { password: passwordFormState.value.password });
        message.success('密码修改成功');
        passwordFormState.value.password = ''; // Clear password field
      } catch (error: any) {
        message.error(error.response?.data?.message || '修改密码失败');
      } finally {
        passwordChangeLoading.value = false;
      }
    }
  });
};

const handleLayoutChange = (value: 'vertical' | 'horizontal') => {
  layoutStore.setLayoutMode(value);
  message.success(`已切换为${value === 'vertical' ? '左右' : '上下'}布局`);
};

onMounted(() => {
  fetchSettings();
  fetchSubToken();
});
</script>