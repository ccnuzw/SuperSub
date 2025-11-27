<template>
  <div class="error-boundary">
    <!-- 正常内容 -->
    <div v-if="!hasError" class="error-boundary-content">
      <slot />
    </div>

    <!-- 错误状态 -->
    <div v-else class="error-boundary-fallback">
      <div class="error-container">
        <div class="error-icon">
          <n-icon size="48">
            <WarningOutline />
          </n-icon>
        </div>

        <div class="error-content">
          <h3 class="error-title">{{ title || '出现了错误' }}</h3>
          <p class="error-message">
            {{ message || error?.message || '页面加载失败，请稍后重试' }}
          </p>

          <!-- 错误详情（开发环境） -->
          <details v-if="showDetails && error" class="error-details">
            <summary>错误详情</summary>
            <pre class="error-stack">{{ error.stack }}</pre>
          </details>

          <!-- 错误操作 -->
          <div class="error-actions">
            <n-button @click="handleRetry" :loading="retrying">
              <template #icon>
                <n-icon><RefreshOutline /></n-icon>
              </template>
              重试
            </n-button>

            <n-button @click="handleRefresh" secondary>
              <template #icon>
                <n-icon><RefreshOutline /></n-icon>
              </template>
              刷新页面
            </n-button>

            <n-button v-if="showReport" @click="handleReport" tertiary>
              <template #icon>
                <n-icon><BugOutline /></n-icon>
              </template>
              报告问题
            </n-button>
          </div>
        </div>
      </div>

      <!-- ��级内容 -->
      <div v-if="fallback" class="fallback-content">
        <slot name="fallback" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onErrorCaptured, type PropType } from 'vue';
import { NButton, NIcon } from 'naive-ui';
import {
  WarningOutline,
  RefreshOutline,
  BugOutline
} from '@vicons/ionicons5';

interface Props {
  title?: string;
  message?: string;
  showDetails?: boolean;
  showReport?: boolean;
  onRetry?: () => void;
  onReport?: (error: Error) => void;
  fallback?: boolean;
  maxRetries?: number;
}

const props = withDefaults(defineProps<Props>(), {
  showDetails: process.env.NODE_ENV === 'development',
  showReport: false,
  fallback: false,
  maxRetries: 3
});

// 错误状态
const hasError = ref(false);
const error = ref<Error | null>(null);
const retryCount = ref(0);
const retrying = ref(false);

// 捕获子组件错误
onErrorCaptured((err: Error) => {
  console.error('ErrorBoundary捕获错误:', err);

  hasError.value = true;
  error.value = err;

  // 自动重试
  if (retryCount.value < props.maxRetries) {
    setTimeout(() => {
      handleRetry();
    }, 1000);
  }

  // 上报错误
  if (props.onReport) {
    props.onReport(err);
  }

  // 阻止错误继续传播
  return false;
});

// 重试
const handleRetry = async () => {
  if (retrying.value) return;

  retrying.value = true;
  retryCount.value++;

  try {
    await new Promise(resolve => setTimeout(resolve, 100));

    hasError.value = false;
    error.value = null;

    if (props.onRetry) {
      await props.onRetry();
    }
  } catch (err) {
    console.error('重试失败:', err);
  } finally {
    retrying.value = false;
  }
};

// 刷新页面
const handleRefresh = () => {
  window.location.reload();
};

// 报告错误
const handleReport = () => {
  if (!error.value) return;

  const errorInfo = {
    message: error.value.message,
    stack: error.value.stack,
    url: window.location.href,
    userAgent: navigator.userAgent,
    timestamp: new Date().toISOString()
  };

  // 这里可以发送错误报告到服务器
  console.log('错误报告:', errorInfo);

  if (props.onReport) {
    props.onReport(error.value);
  }

  // 复制错误信息到剪贴板
  navigator.clipboard.writeText(JSON.stringify(errorInfo, null, 2)).then(() => {
    // 显示复制成功提示
    if (typeof window !== 'undefined' && (window as any).$message) {
      (window as any).$message.success('错误信息已复制到剪贴板');
    }
  });
};

// 手动重置错误状态
const reset = () => {
  hasError.value = false;
  error.value = null;
  retryCount.value = 0;
  retrying.value = false;
};

// 暴露方法
defineExpose({
  reset,
  hasError: () => hasError.value,
  error: () => error.value,
  retryCount: () => retryCount.value
});
</script>

<style scoped>
.error-boundary {
  width: 100%;
  height: 100%;
}

.error-boundary-content {
  width: 100%;
  height: 100%;
}

.error-boundary-fallback {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  padding: 32px;
}

.error-container {
  max-width: 400px;
  text-align: center;
}

.error-icon {
  margin-bottom: 16px;
  color: #f56565;
}

.error-content {
  margin-bottom: 24px;
}

.error-title {
  font-size: 18px;
  font-weight: 600;
  color: #2d3748;
  margin-bottom: 8px;
}

.error-message {
  font-size: 14px;
  color: #718096;
  line-height: 1.5;
  margin-bottom: 16px;
}

.error-details {
  text-align: left;
  margin-bottom: 16px;
  padding: 12px;
  background: #f7fafc;
  border-radius: 6px;
  font-size: 12px;
}

.error-details summary {
  cursor: pointer;
  font-weight: 500;
  color: #4a5568;
  margin-bottom: 8px;
}

.error-stack {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 11px;
  line-height: 1.4;
  color: #e53e3e;
  background: #fff;
  padding: 8px;
  border-radius: 4px;
  overflow-x: auto;
  white-space: pre-wrap;
  word-break: break-all;
}

.error-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
  flex-wrap: wrap;
}

.fallback-content {
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid #e2e8f0;
}

/* 深色主题支持 */
@media (prefers-color-scheme: dark) {
  .error-title {
    color: #e2e8f0;
  }

  .error-message {
    color: #a0aec0;
  }

  .error-details {
    background: #2d3748;
  }

  .error-details summary {
    color: #cbd5e0;
  }

  .error-stack {
    background: #1a202c;
    color: #fc8181;
  }

  .fallback-content {
    border-top-color: #4a5568;
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .error-boundary-fallback {
    min-height: 200px;
    padding: 20px;
  }

  .error-container {
    max-width: 300px;
  }

  .error-title {
    font-size: 16px;
  }

  .error-message {
    font-size: 13px;
  }

  .error-actions {
    flex-direction: column;
    align-items: stretch;
  }
}

/* 打印样式 */
@media print {
  .error-actions {
    display: none;
  }
}
</style>