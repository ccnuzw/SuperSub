/**
 * useSettings Composable - 组件层
 * 提供设置相关的组合式API，连接视图层和业务逻辑层
 * 遵循分层架构：视图层 → 组件层 → 业务逻辑层 → 服务层 → 基础设施层
 */

import { ref, computed, watch } from 'vue';
import { useMessage } from 'naive-ui';
import type { FormInst, FormRules } from 'naive-ui';
import { useSettingsStore } from '@/stores/settings';
import { useAuthStore } from '@/stores/auth';
import { AppError, AppErrorType } from '@/utils/errorHandler';

// 持久化表单引用，避免在组件重新渲染时丢失
const formRefGlobal = ref<FormInst | null>(null);
const passwordFormRefGlobal = ref<FormInst | null>(null);

// 初始化状态标记
let isInitializing = false;
let initializationPromise: Promise<void> | null = null;

export function useSettings() {
  const message = useMessage();
  const settingsStore = useSettingsStore();
  const authStore = useAuthStore();

  // 本地加载状态
  const saveLoading = ref(false);
  const testLoading = ref(false);
  const resetLoading = ref(false);
  const saveTokenLoading = ref(false);
  const passwordChangeLoading = ref(false);

  // 表单引用 - 使用全局引用保持状态
  const formRef = computed({
    get: () => formRefGlobal.value,
    set: (value) => {
      formRefGlobal.value = value;
    }
  });

  const passwordFormRef = computed({
    get: () => passwordFormRefGlobal.value,
    set: (value) => {
      passwordFormRefGlobal.value = value;
    }
  });

  // 表单状态 - 从store获取
  const formState = computed(() => settingsStore.formState);
  const passwordFormState = computed(() => settingsStore.passwordFormState);
  const subToken = computed(() => settingsStore.subToken);

  // 密码表单验证规则
  const passwordRules: FormRules = {
    password: [
      { required: true, message: '请输入新密码', trigger: 'blur' },
      { min: 6, message: '密码长度至少6位', trigger: 'blur' },
    ]
  };

  // 计算属性
  const isLoading = computed(() => settingsStore.loading);
  const hasError = computed(() => !!settingsStore.error);
  const errorMessage = computed(() => settingsStore.error);
  const hasSettings = computed(() => {
    // 检查是否有保存的设置
    return !!(formState.value.telegram_bot_token || formState.value.telegram_chat_id)
  });

  // 监听store加载状态，同步到本地loading状态
  watch(isLoading, (loading) => {
    if (!loading) {
      // 当store加载完成时，重置所有本地loading状态
      saveLoading.value = false;
      testLoading.value = false;
      resetLoading.value = false;
      saveTokenLoading.value = false;
      passwordChangeLoading.value = false;
    }
  });

  // 监听store错误，显示错误消息
  watch(hasError, (hasErr) => {
    if (hasErr && errorMessage.value) {
      message.error(errorMessage.value);
    }
  });

  // 初始化设置
  const initializeSettings = async () => {
    // 防止重复初始化
    if (isInitializing) {
      return initializationPromise;
    }

    if (settingsStore.isInitialized) {
      return; // 已经初始化过了
    }

    isInitializing = true;
    initializationPromise = (async () => {
      if (!authStore.isAuthenticated) {
        return;
      }

      try {
        await settingsStore.initializeSettings();
      } catch (error) {
        if (error instanceof AppError && error.type === AppErrorType.USER_CANCEL) {
          return;
        }
        message.error('初始化设置失败');
      } finally {
        isInitializing = false;
        initializationPromise = null;
      }
    })();

    return initializationPromise;
  };

  // 保存设置
  const handleSave = async () => {
    if (!authStore.isAuthenticated) {
      message.error('请先登录');
      return;
    }

    saveLoading.value = true;
    try {
      await settingsStore.saveSettings();
      message.success('设置已保存');
    } catch (error: any) {
      console.error('Failed to save settings:', error);
      // 错误消息已通过watch监听器处理
    } finally {
      saveLoading.value = false;
    }
  };

  // 测试Telegram通知
  const handleTestTelegram = async () => {
    if (!authStore.isAuthenticated) {
      message.error('请先登录');
      return;
    }

    testLoading.value = true;
    try {
      await settingsStore.testTelegram();
      message.success('测试消息已发送，请检查您的 Telegram');
    } catch (error: any) {
      console.error('Failed to send test message:', error);
      // 错误消息已通过watch监听器处理
    } finally {
      testLoading.value = false;
    }
  };

  // 复制令牌
  const copyToken = () => {
    try {
      settingsStore.copyToken();
      message.success('已复制到剪贴板');
    } catch (error: any) {
      console.error('Failed to copy token:', error);
      message.error(error.message || '复制失败');
    }
  };

  // 重置令牌
  const resetToken = async () => {
    if (!authStore.isAuthenticated) {
      message.error('请先登录');
      return;
    }

    resetLoading.value = true;
    try {
      const result = await settingsStore.resetSubToken();
      // 更新认证信息
      authStore.updateTokenAndUser(result.user, result.token);
      message.success('订阅令牌已重置');
    } catch (error: any) {
      console.error('Failed to reset token:', error);
      // 错误消息已通过watch监听器处理
    } finally {
      resetLoading.value = false;
    }
  };

  // 保存令牌
  const saveToken = async () => {
    if (!authStore.isAuthenticated) {
      message.error('请先登录');
      return;
    }

    saveTokenLoading.value = true;
    try {
      const result = await settingsStore.saveSubToken();
      // 更新认证信息（注意：这里可能需要更新token）
      authStore.updateTokenAndUser(result.user, authStore.token || '');
      message.success('订阅令牌已保存');
    } catch (error: any) {
      console.error('Failed to save token:', error);
      // 错误消息已通过watch监听器处理
    } finally {
      saveTokenLoading.value = false;
    }
  };

  // 修改密码
  const handlePasswordChange = async () => {
    if (!authStore.isAuthenticated) {
      message.error('请先登录');
      return;
    }

    // 表单验证
    if (!passwordFormRef.value) {
      message.error('表单引用未找到');
      return;
    }

    passwordFormRef.value.validate(async (errors) => {
      if (!errors) {
        passwordChangeLoading.value = true;
        try {
          await settingsStore.changePassword();
          message.success('密码修改成功');
          // 密码表单已在store中清空
        } catch (error: any) {
          console.error('Failed to change password:', error);
          // 错误消息已通过watch监听器处理
        } finally {
          passwordChangeLoading.value = false;
        }
      }
    });
  };

  return {
    // 状态
    saveLoading,
    testLoading,
    resetLoading,
    saveTokenLoading,
    passwordChangeLoading,

    // 表单引用
    formRef,
    passwordFormRef,

    // 表单数据
    formState,
    passwordFormState,
    subToken,

    // 验证规则
    passwordRules,

    // 方法
    handleSave,
    handleTestTelegram,
    copyToken,
    resetToken,
    saveToken,
    handlePasswordChange,
    initializeSettings,

    // 计算属性
    isLoading,
    hasError,
    errorMessage,
    hasSettings,
  };
}