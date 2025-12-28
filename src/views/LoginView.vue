<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useMessage } from 'naive-ui';
import Card from '@/components/ui/Card.vue';
import Button from '@/components/ui/Button.vue';
import Input from '@/components/ui/Input.vue';
import { getApiErrorMessage } from '@/utils/errors';

const username = ref('');
const password = ref('');
const loading = ref(false);
const errorMessage = ref('');
const router = useRouter();
const authStore = useAuthStore();
const message = useMessage();

onMounted(() => {
  authStore.checkRegistrationStatus();
});

const handleLogin = async () => {
  if (!username.value.trim() || !password.value) {
    errorMessage.value = '请输入用户名和密码';
    return;
  }
  
  loading.value = true;
  errorMessage.value = '';
  
  try {
    await authStore.login({ username: username.value, password: password.value });
    router.push('/');
  } catch (error) {
    // Extract error message from response
    errorMessage.value = getApiErrorMessage(error, '登录失败，请稍后重试');
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div class="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-dark-bg p-4 transition-colors duration-300">
     <!-- Abstract Background Decoration -->
    <div class="absolute inset-0 overflow-hidden pointer-events-none">
        <div class="absolute -top-[20%] -right-[10%] w-[50%] h-[50%] rounded-full bg-primary-500/20 blur-[120px] animate-pulse-slow"></div>
        <div class="absolute top-[40%] -left-[10%] w-[40%] h-[40%] rounded-full bg-indigo-500/10 blur-[100px] animate-pulse-slow font-delay-1000"></div>
    </div>

    <Card class="w-full max-w-md relative z-10" variant="glass" padding="lg">
      <div class="mb-8 text-center">
        <!-- Logo Placeholder -->
        <div class="w-12 h-12 bg-gradient-to-br from-primary-500 to-indigo-600 rounded-xl mx-auto flex items-center justify-center text-white font-bold text-xl shadow-glow mb-4">
            S
        </div>
        <h1 class="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">欢迎回来</h1>
        <p class="text-slate-500 dark:text-slate-400 mt-2">登录以管理您的订阅</p>
      </div>

      <form @submit.prevent="handleLogin" class="space-y-6">
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

        <!-- Error Message -->
        <div v-if="errorMessage" class="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
          <p class="text-sm text-red-600 dark:text-red-400 text-center">{{ errorMessage }}</p>
        </div>

        <Button variant="glow" block size="lg" :loading="loading" @click="handleLogin" class="mt-4">
            登录
        </Button>
      </form>
      
      <div v-if="authStore.isRegistrationAllowed" class="mt-8 text-center pt-6 border-t border-slate-200 dark:border-white/10">
        <p class="text-sm text-slate-600 dark:text-slate-400">
          还没有账号?
          <router-link to="/register" class="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300 transition-colors">创建账号</router-link>
        </p>
      </div>
    </Card>
  </div>
</template>