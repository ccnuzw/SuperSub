/**
 * 生成日志组件
 * 显示配置文件生成过程中的日志信息
 */

<template>
  <div class="preview-section">
    <div class="flex justify-between items-center mb-3">
      <h4 class="text-md font-medium">生成日志</h4>
      <SsButton
        variant="ghost"
        size="sm"
        @click="toggleShow"
      >
        {{ showLogs ? '隐藏' : '显示' }}
      </SsButton>
    </div>

    <div v-if="showLogs && logs" class="logs-preview">
      <div class="space-y-2 max-h-64 overflow-y-auto">
        <div
          v-for="(log, index) in logs"
          :key="index"
          class="log-entry"
          :class="`log-entry--${log.level.toLowerCase()}`"
        >
          <span class="log-time">{{ formatTime(log.timestamp) }}</span>
          <span class="log-level">{{ log.level }}</span>
          <span class="log-message">{{ log.message }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { SsButton } from '@/components/base';

interface LogEntry {
  level: string;
  message: string;
  timestamp: string;
}

interface Props {
  logs?: LogEntry[];
}

const props = withDefaults(defineProps<Props>(), {
  logs: () => []
});

const showLogs = ref(false);

const toggleShow = () => {
  showLogs.value = !showLogs.value;
};

const formatTime = (timestamp: string): string => {
  try {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('zh-CN', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  } catch {
    return timestamp;
  }
};
</script>

<style scoped>
.preview-section {
  @apply bg-white p-4 rounded-lg border border-gray-200;
}

/* 日志样式 */
.log-entry {
  @apply flex items-center space-x-2 p-2 rounded text-sm;
}

.log-entry--info { @apply bg-blue-50 text-blue-800; }
.log-entry--step { @apply bg-gray-50 text-gray-800; }
.log-entry--success { @apply bg-success-50 text-success-800; }
.log-entry--warn { @apply bg-warning-50 text-warning-800; }
.log-entry--error { @apply bg-error-50 text-error-800; }

.log-time {
  @apply font-mono text-xs opacity-75;
}

.log-level {
  @apply font-semibold uppercase;
}

.log-message {
  @apply flex-1;
}

/* 滚动条样式 */
.logs-preview::-webkit-scrollbar {
  @apply w-2 h-2;
}

.logs-preview::-webkit-scrollbar-track {
  @apply bg-gray-100;
}

.logs-preview::-webkit-scrollbar-thumb {
  @apply bg-gray-300 rounded;
}

.logs-preview::-webkit-scrollbar-thumb:hover {
  @apply bg-gray-400;
}
</style>