/**
 * 订阅统计信息组件
 */

<template>
  <div class="subscription-stats">
    <div class="mini-cards-container">
      <div class="mini-card total">
        <div class="card-icon">
          <n-icon color="#18a058" size="16">
            <BookOutline />
          </n-icon>
        </div>
        <div class="card-content">
          <div class="card-value">{{ total }}</div>
          <div class="card-label">总订阅数</div>
        </div>
      </div>

      <div class="mini-card healthy">
        <div class="card-icon">
          <n-icon color="#18a058" size="16">
            <CheckmarkCircleOutline />
          </n-icon>
        </div>
        <div class="card-content">
          <div class="card-value">{{ healthy }}</div>
          <div class="card-label">正常</div>
        </div>
      </div>

      <div class="mini-card failed">
        <div class="card-icon">
          <n-icon color="#d03050" size="16">
            <WarningOutline />
          </n-icon>
        </div>
        <div class="card-content">
          <div class="card-value">{{ failed }}</div>
          <div class="card-label">失败</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { NIcon } from 'naive-ui'
import {
  BookOutline,
  CheckmarkCircleOutline,
  WarningOutline
} from '@vicons/ionicons5'

interface IProps {
  total: number
  healthy: number
  failed: number
}

const props = defineProps<IProps>()
</script>

<style scoped>
.subscription-stats {
  @apply py-1;
}

/* 迷你卡片容器 */
.mini-cards-container {
  @apply flex items-center justify-center gap-2;
}

/* 迷你卡片基础样式 */
.mini-card {
  @apply flex items-center gap-2 px-2 py-1.5 rounded-lg border transition-all duration-200 hover:shadow-md;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(8px);
  min-width: 75px;
  height: 32px;
}

/* 卡片图标 */
.card-icon {
  @apply flex-shrink-0;
}

/* 卡片内容 */
.card-content {
  @apply flex flex-col justify-center;
}

.card-value {
  @apply text-sm font-bold;
  line-height: 1.2;
}

.card-label {
  @apply text-xs text-gray-600;
  line-height: 1.2;
}

/* 不同类型卡片的颜色 */
.mini-card.total {
  @apply border-emerald-200;
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.05), rgba(255, 255, 255, 0.9));
}

.mini-card.total .card-value {
  color: #10b981;
}

.mini-card.healthy {
  @apply border-emerald-200;
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.05), rgba(255, 255, 255, 0.9));
}

.mini-card.healthy .card-value {
  color: #10b981;
}

.mini-card.updating {
  @apply border-blue-200;
  background: linear-gradient(135deg, rgba(32, 126, 236, 0.05), rgba(255, 255, 255, 0.9));
}

.mini-card.updating .card-value {
  color: #2080f0;
}

.mini-card.failed {
  @apply border-red-200;
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.05), rgba(255, 255, 255, 0.9));
}

.mini-card.failed .card-value {
  color: #d03050;
}

.mini-card.selected {
  @apply border-blue-200;
  background: linear-gradient(135deg, rgba(32, 126, 236, 0.05), rgba(255, 255, 255, 0.9));
}

.mini-card.selected .card-value {
  color: #2080f0;
}

/* 响应式设计 */
@media (max-width: 640px) {
  .subscription-stats {
    @apply p-2;
  }

  .mini-cards-container {
    @apply gap-1.5;
  }

  .mini-card {
    @apply px-2 py-1.5;
    min-width: 70px;
    height: 36px;
  }

  .card-value {
    @apply text-sm;
  }

  .card-label {
    @apply text-xs;
  }
}

@media (min-width: 641px) and (max-width: 768px) {
  .mini-cards-container {
    @apply gap-1.5;
  }

  .mini-card {
    min-width: 75px;
    height: 38px;
  }
}

/* 深色模式适配 */
.dark .mini-card {
  background: rgba(31, 41, 55, 0.9);
  border-color: rgba(75, 85, 99, 0.3);
}

.dark .card-label {
  @apply text-gray-400;
}

.dark .mini-card.total {
  border-color: rgba(16, 185, 129, 0.3);
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(31, 41, 55, 0.9));
}

.dark .mini-card.healthy {
  border-color: rgba(16, 185, 129, 0.3);
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(31, 41, 55, 0.9));
}

.dark .mini-card.updating {
  border-color: rgba(32, 126, 236, 0.3);
  background: linear-gradient(135deg, rgba(32, 126, 236, 0.1), rgba(31, 41, 55, 0.9));
}

.dark .mini-card.failed {
  border-color: rgba(239, 68, 68, 0.3);
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(31, 41, 55, 0.9));
}

.dark .mini-card.selected {
  border-color: rgba(32, 126, 236, 0.3);
  background: linear-gradient(135deg, rgba(32, 126, 236, 0.1), rgba(31, 41, 55, 0.9));
}

/* 悬停动画 */
.mini-card:hover {
  transform: translateY(-1px);
}

/* 加载动画 */
.mini-cards-container {
  animation: fadeInUp 0.5s ease-out;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>