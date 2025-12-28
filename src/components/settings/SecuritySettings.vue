<template>
  <div class="space-y-10 p-4">
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
import { NForm, NFormItem, NInput, useMessage, type FormInst, type FormRules } from 'naive-ui';
import Button from '@/components/ui/Button.vue';
import Card from '@/components/ui/Card.vue';
import { usersApi } from '@/api/users';
import { useAuthStore } from '@/stores/auth';
import { LogoutInProgressError } from '@/utils/errors';

const message = useMessage();
const authStore = useAuthStore();
const subToken = ref('');
const saveTokenLoading = ref(false);
const resetLoading = ref(false);
const passwordChangeLoading = ref(false);
const passwordFormRef = ref<FormInst | null>(null);

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
  fetchSubToken();
});
</script>
