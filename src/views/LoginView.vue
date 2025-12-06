<template>
  <div class="modern-page modern-page--gradient">
    <!-- 装饰性背景元素 -->
    <div class="modern-page-bg-elements">
      <div class="bg-element bg-element-1"></div>
      <div class="bg-element bg-element-2"></div>
      <div class="bg-element bg-element-3"></div>
    </div>

    <!-- 登录表单容器 -->
    <div class="modern-form-container animate-scale-in">
      <!-- 表单头部 -->
      <div class="modern-form-header">
        <h1 class="modern-form-title">
          欢迎回来
        </h1>
        <p class="modern-form-subtitle">
          登录到您的 SuperSub 账户
        </p>
      </div>

      <!-- 登录表单 -->
      <n-form
        @submit.prevent="handleLogin"
        :size="isMobile ? 'medium' : 'large'"
        class="modern-login-form"
      >
        <n-form-item-row label="用户名" :show-feedback="false">
          <n-input
            v-model:value="username"
            placeholder="请输入您的用户名"
            size="large"
            class="modern-input"
            :style="{ borderRadius: 'var(--radius-md)' }"
          />
        </n-form-item-row>

        <n-form-item-row label="密码" :show-feedback="false">
          <n-input
            v-model:value="password"
            type="password"
            show-password-on="mousedown"
            placeholder="请输入您的密码"
            size="large"
            class="modern-input"
            :style="{ borderRadius: 'var(--radius-md)' }"
          />
        </n-form-item-row>

        <n-form-item :show-feedback="false">
          <n-button
            type="primary"
            attr-type="submit"
            block
            size="large"
            :loading="loading"
            class="modern-button-primary"
            :style="{
              borderRadius: 'var(--radius-md)',
              height: '48px',
              fontSize: '16px',
              fontWeight: '600'
            }"
          >
            登录
          </n-button>
        </n-form-item>
      </n-form>

      <!-- 注册链接 -->
      <div
        v-if="authStore.isRegistrationAllowed"
        class="modern-form-footer"
      >
        <p class="text-sm text-center">
          还没有账户？
          <router-link
            to="/register"
            class="modern-link"
          >
            立即注册
          </router-link>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { NForm, NFormItemRow, NInput, NButton, useMessage } from 'naive-ui';

const username = ref('');
const password = ref('');
const loading = ref(false);
const router = useRouter();
const authStore = useAuthStore();
const message = useMessage();

// 响应式计算
const isMobile = computed(() => {
  if (typeof window !== 'undefined') {
    return window.innerWidth < 768;
  }
  return false;
});

onMounted(() => {
  authStore.checkRegistrationStatus();
});

const handleLogin = async () => {
  loading.value = true;
  try {
    await authStore.login({ username: username.value, password: password.value });
    router.push('/'); // 登录后重定向到仪表盘
  } catch (error: any) {
    console.error('Login failed:', error);
    message.error(error.response?.data?.message || '登录失败，请检查您的凭据');
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
/* ===== 登录页面样式 ===== */
.modern-page {
  min-height: 100vh;
  background: var(--gradient-primary);
  padding: var(--spacing-xl);
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

/* 装饰性背景元素 */
.modern-page-bg-elements {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: 1;
  overflow: hidden;
}

.bg-element {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.6;
  animation: float 6s ease-in-out infinite;
}

.bg-element-1 {
  top: 10%;
  left: 15%;
  width: 300px;
  height: 300px;
  background: radial-gradient(circle, rgba(102, 126, 234, 0.4) 0%, transparent 70%);
  animation-delay: 0s;
}

.bg-element-2 {
  top: 60%;
  right: 10%;
  width: 250px;
  height: 250px;
  background: radial-gradient(circle, rgba(118, 75, 162, 0.3) 0%, transparent 70%);
  animation-delay: 2s;
}

.bg-element-3 {
  bottom: 20%;
  left: 60%;
  width: 200px;
  height: 200px;
  background: radial-gradient(circle, rgba(255, 182, 193, 0.2) 0%, transparent 70%);
  animation-delay: 4s;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0px) rotate(0deg);
  }
  33% {
    transform: translateY(-20px) rotate(1deg);
  }
  66% {
    transform: translateY(10px) rotate(-1deg);
  }
}

/* 表单容器 */
.modern-form-container {
  background: var(--bg-overlay);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-radius: var(--radius-xl);
  padding: var(--spacing-2xl);
  box-shadow: var(--shadow-xl);
  border: 1px solid rgba(255, 255, 255, 0.15);
  max-width: 400px;
  width: 100%;
  margin: 0 auto;
  position: relative;
  z-index: 2;
}

/* 表单头部 */
.modern-form-header {
  text-align: center;
  margin-bottom: var(--spacing-2xl);
}

.modern-form-title {
  font-size: 2rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: var(--spacing-sm);
  background: var(--gradient-primary);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.modern-form-subtitle {
  color: var(--text-secondary);
  font-size: 1rem;
  margin: 0;
  line-height: 1.5;
}

/* 表单样式 */
.modern-login-form {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
  margin-bottom: var(--spacing-xl);
}

/* 深度选择器用于Naive UI组件样式覆盖 */
:deep(.n-form-item-label) {
  color: var(--text-primary);
  font-weight: 500;
  font-size: 0.875rem;
}

:deep(.n-input__input-el) {
  color: var(--text-primary);
  font-size: 1rem;
}

:deep(.n-input__placeholder) {
  color: var(--text-tertiary);
}

:deep(.n-button--primary-type) {
  background: var(--gradient-primary);
  border: none;
  transition: all var(--transition-normal) var(--ease-out-cubic);
}

:deep(.n-button--primary-type:hover) {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
}

/* 表单底部 */
.modern-form-footer {
  text-align: center;
  padding-top: var(--spacing-lg);
  border-top: 1px solid var(--border-secondary);
}

.modern-link {
  color: var(--primary-500);
  text-decoration: none;
  font-weight: 600;
  transition: color var(--transition-fast) var(--ease-out-cubic);
}

.modern-link:hover {
  color: var(--primary-600);
  text-decoration: underline;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .modern-page {
    padding: var(--spacing-md);
  }

  .modern-form-container {
    padding: var(--spacing-xl);
    margin: var(--spacing-md);
    max-width: none;
  }

  .modern-form-title {
    font-size: 1.75rem;
  }

  .modern-form-subtitle {
    font-size: 0.875rem;
  }

  .bg-element {
    filter: blur(60px);
    opacity: 0.4;
  }

  .bg-element-1 {
    width: 200px;
    height: 200px;
  }

  .bg-element-2 {
    width: 180px;
    height: 180px;
  }

  .bg-element-3 {
    width: 150px;
    height: 150px;
  }
}

@media (max-width: 480px) {
  .modern-page {
    padding: var(--spacing-sm);
  }

  .modern-form-container {
    padding: var(--spacing-lg);
    margin: var(--spacing-sm);
  }

  .modern-form-title {
    font-size: 1.5rem;
  }
}

/* 深色主题 */
.dark .modern-form-container {
  background: rgba(24, 24, 28, 0.95);
  border-color: rgba(255, 255, 255, 0.1);
}

.dark :deep(.n-form-item-label) {
  color: var(--text-primary);
}

.dark :deep(.n-input__input-el) {
  color: var(--text-primary);
}

.dark :deep(.n-input) {
  background: rgba(255, 255, 255, 0.05);
  border-color: var(--border-primary);
}

.dark .modern-form-footer {
  border-color: var(--border-primary);
}

/* 无障碍支持 */
@media (prefers-reduced-motion: reduce) {
  .modern-form-container {
    backdrop-filter: none;
    -webkit-backdrop-filter: none;
  }

  .bg-element {
    animation: none;
  }
}

/* 高对比度模式 */
@media (prefers-contrast: high) {
  .modern-form-container {
    border: 2px solid var(--border-primary);
  }
}
</style>