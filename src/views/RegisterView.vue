<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useNotification } from '@/composables/useNotification';
import Card from '@/components/ui/Card.vue';
import Button from '@/components/ui/Button.vue';
import Input from '@/components/ui/Input.vue';
import { getApiErrorMessage } from '@/utils/errors';

const username = ref('');
const password = ref('');
const loading = ref(false);
const router = useRouter();
const authStore = useAuthStore();
const notify = useNotification();

onMounted(async () => {
  await authStore.checkRegistrationStatus();
  if (!authStore.isRegistrationAllowed) {
    notify.warning('用户注册当前已禁用');
    router.push('/login');
  }
});

// Watch for changes in case the status is fetched after the initial mount check
watch(() => authStore.isRegistrationAllowed, (isAllowed) => {
  if (!isAllowed) {
    notify.warning('用户注册当前已禁用');
    router.push('/login');
  }
});

const handleRegister = async () => {
  loading.value = true;
  try {
    await authStore.register({ username: username.value, password: password.value });
    notify.preset.registerSuccess();
    router.push('/login');
  } catch (error) {
    console.error('Registration failed:', error);
    const err = error as { response?: { status?: number } };
    if (err.response && err.response.status === 409) {
      notify.error('用户名已存在，请选择其他用户名或登录');
    } else {
      notify.error(getApiErrorMessage(error, '注册失败，请重试'));
    }
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div class="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-dark-bg p-4 transition-colors duration-300">
     <!-- Abstract Background Decoration -->
    <div class="absolute inset-0 overflow-hidden pointer-events-none">
        <div class="absolute top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-primary-500/20 blur-[120px] animate-pulse-slow"></div>
        <div class="absolute -bottom-[20%] right-[10%] w-[40%] h-[40%] rounded-full bg-indigo-500/10 blur-[100px] animate-pulse-slow font-delay-1000"></div>
    </div>

    <Card class="w-full max-w-md relative z-10" variant="glass" padding="lg">
      <div class="mb-8 text-center">
        <!-- Logo Placeholder -->
        <div class="w-12 h-12 bg-gradient-to-br from-primary-500 to-indigo-600 rounded-xl mx-auto flex items-center justify-center text-white font-bold text-xl shadow-glow mb-4">
            S
        </div>
        <h1 class="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">创建账号</h1>
        <p class="text-slate-500 dark:text-slate-400 mt-2">加入 SuperSub 以管理您的节点</p>
      </div>

      <form @submit.prevent="handleRegister" class="space-y-6">
        <div class="space-y-2">
            <label class="text-sm font-medium text-slate-700 dark:text-slate-300">用户名</label>
            <Input v-model="username" placeholder="请输入用户名" />
        </div>
        
        <div class="space-y-2">
            <label class="text-sm font-medium text-slate-700 dark:text-slate-300">密码</label>
            <Input 
                v-model="password" 
                type="password" 
                placeholder="请输入密码" 
            />
        </div>

        <Button variant="glow" block size="lg" :loading="loading" @click="handleRegister" class="mt-8">
            注册
        </Button>
      </form>
      
      <div class="mt-8 text-center pt-6 border-t border-slate-200 dark:border-white/10">
        <p class="text-sm text-slate-600 dark:text-slate-400">
          已经有账号?
          <router-link to="/login" class="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300 transition-colors">登录</router-link>
        </p>
      </div>
    </Card>
  </div>
</template>