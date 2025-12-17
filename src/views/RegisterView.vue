<template>
  <div class="flex items-center justify-center min-h-screen bg-gray-100">
    <n-card class="w-full max-w-md" title="Register" :bordered="false" size="huge">
      <n-form @submit.prevent="handleRegister">
        <n-form-item-row label="Username">
          <n-input v-model:value="username" placeholder="Choose a username" />
        </n-form-item-row>
        <n-form-item-row label="Password">
          <n-input
            v-model:value="password"
            type="password"
            show-password-on="mousedown"
            placeholder="Choose a password"
          />
        </n-form-item-row>
        <n-button type="primary" attr-type="submit" block :loading="loading">
          Register
        </n-button>
      </n-form>
      <template #footer>
        <p class="text-sm text-center text-gray-600">
          Already have an account?
          <router-link to="/login" class="font-medium text-indigo-600 hover:underline">Login</router-link>
        </p>
      </template>
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { NCard, NForm, NFormItemRow, NInput, NButton, useMessage } from 'naive-ui';

const username = ref('');
const password = ref('');
const loading = ref(false);
const router = useRouter();
const authStore = useAuthStore();
const message = useMessage();

onMounted(async () => {
  try {
    await authStore.checkRegistrationStatus();
    if (!authStore.isRegistrationAllowed) {
      message.warning('User registration is currently disabled.');
      router.push('/login');
    }
  } catch (error) {
    console.error('Failed to check registration status:', error);
  }
});

// Watch for changes in case the status is fetched after the initial mount check
watch(() => authStore.isRegistrationAllowed, (isAllowed) => {
  if (!isAllowed) {
    message.warning('User registration is currently disabled.');
    router.push('/login');
  }
});

const handleRegister = async () => {
  loading.value = true;
  try {
    await authStore.register({ username: username.value, password: password.value });
    message.success('Registration successful! Please login.');
    router.push('/login');
  } catch (error: any) {
    console.error('Registration failed:', error);

    // 根据不同的错误码显示不同的消息
    const errorMessage = error.message || 'Registration failed. Please try again.';

    if (error.code === 'USERNAME_EXISTS' || errorMessage.includes('Username already exists')) {
      message.error('Username already exists. Please choose another one or login.');
    } else if (error.code === 'VALIDATION_ERROR' || errorMessage.includes('must be between') || errorMessage.includes('at least')) {
      message.error(errorMessage); // 显示具体的验证错误
    } else {
      message.error(errorMessage);
    }
  } finally {
    loading.value = false;
  }
};
</script>