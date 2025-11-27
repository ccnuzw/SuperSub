<template>
  <div class="loading-spinner" :class="[`size-${size}`, { overlay, fixed }]">
    <!-- 圆形加载动画 -->
    <div v-if="type === 'spinner'" class="spinner-container">
      <div class="spinner"></div>
      <div v-if="text" class="loading-text">{{ text }}</div>
    </div>

    <!-- 点状加载动画 -->
    <div v-else-if="type === 'dots'" class="dots-container">
      <div class="dots">
        <div class="dot"></div>
        <div class="dot"></div>
        <div class="dot"></div>
      </div>
      <div v-if="text" class="loading-text">{{ text }}</div>
    </div>

    <!-- 波浪加载动画 -->
    <div v-else-if="type === 'wave'" class="wave-container">
      <div class="wave-bar">
        <div class="wave"></div>
        <div class="wave"></div>
        <div class="wave"></div>
        <div class="wave"></div>
      </div>
      <div v-if="text" class="loading-text">{{ text }}</div>
    </div>

    <!-- 脉冲加载动画 -->
    <div v-else-if="type === 'pulse'" class="pulse-container">
      <div class="pulse"></div>
      <div v-if="text" class="loading-text">{{ text }}</div>
    </div>

    <!-- 默认加载动画 -->
    <div v-else class="default-container">
      <div class="default-spinner">
        <div class="segment"></div>
        <div class="segment"></div>
        <div class="segment"></div>
        <div class="segment"></div>
        <div class="segment"></div>
        <div class="segment"></div>
        <div class="segment"></div>
        <div class="segment"></div>
      </div>
      <div v-if="text" class="loading-text">{{ text }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  type?: 'spinner' | 'dots' | 'wave' | 'pulse' | 'default';
  size?: 'small' | 'medium' | 'large';
  text?: string;
  overlay?: boolean;
  fixed?: boolean;
  color?: string;
}

withDefaults(defineProps<Props>(), {
  type: 'default',
  size: 'medium',
  overlay: false,
  fixed: false
});
</script>

<style scoped>
.loading-spinner {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.loading-text {
  font-size: 14px;
  color: #666;
  text-align: center;
}

/* 尺寸变体 */
.size-small {
  --size: 20px;
}

.size-medium {
  --size: 32px;
}

.size-large {
  --size: 48px;
}

/* 覆盖层样式 */
.overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.8);
  z-index: 1000;
}

.fixed {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 9999;
}

/* 圆形加载器 */
.spinner-container .spinner {
  width: var(--size);
  height: var(--size);
  border: 3px solid #f3f3f3;
  border-top: 3px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 点状加载器 */
.dots-container .dots {
  display: flex;
  gap: 8px;
}

.dot {
  width: calc(var(--size) / 4);
  height: calc(var(--size) / 4);
  background-color: #3498db;
  border-radius: 50%;
  animation: bounce 1.4s ease-in-out infinite both;
}

.dot:nth-child(1) {
  animation-delay: -0.32s;
}

.dot:nth-child(2) {
  animation-delay: -0.16s;
}

@keyframes bounce {
  0%, 80%, 100% {
    transform: scale(0);
  }
  40% {
    transform: scale(1);
  }
}

/* 波浪加载器 */
.wave-container .wave-bar {
  display: flex;
  gap: 4px;
  align-items: flex-end;
  height: var(--size);
}

.wave {
  width: calc(var(--size) / 8);
  background-color: #3498db;
  border-radius: 2px;
  animation: wave 1.2s ease-in-out infinite;
}

.wave:nth-child(1) { animation-delay: -1.2s; }
.wave:nth-child(2) { animation-delay: -1.1s; }
.wave:nth-child(3) { animation-delay: -1.0s; }
.wave:nth-child(4) { animation-delay: -0.9s; }

@keyframes wave {
  0%, 40%, 100% {
    height: 20%;
  }
  20% {
    height: 100%;
  }
}

/* 脉冲加载器 */
.pulse-container .pulse {
  width: var(--size);
  height: var(--size);
  background-color: #3498db;
  border-radius: 50%;
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0% {
    transform: scale(0);
    opacity: 1;
  }
  100% {
    transform: scale(1.5);
    opacity: 0;
  }
}

/* 默认加载器（圆形分段） */
.default-container .default-spinner {
  width: var(--size);
  height: var(--size);
  position: relative;
  animation: rotate 1.2s linear infinite;
}

.default-spinner .segment {
  position: absolute;
  width: 8px;
  height: 100%;
  left: 50%;
  margin-left: -4px;
  transform-origin: center;
}

.default-spinner .segment::before {
  content: '';
  position: absolute;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: #3498db;
  left: 0;
}

.segment:nth-child(1) { transform: rotate(0deg); animation-delay: -1.2s; }
.segment:nth-child(2) { transform: rotate(45deg); animation-delay: -1.05s; }
.segment:nth-child(3) { transform: rotate(90deg); animation-delay: -0.9s; }
.segment:nth-child(4) { transform: rotate(135deg); animation-delay: -0.75s; }
.segment:nth-child(5) { transform: rotate(180deg); animation-delay: -0.6s; }
.segment:nth-child(6) { transform: rotate(225deg); animation-delay: -0.45s; }
.segment:nth-child(7) { transform: rotate(270deg); animation-delay: -0.3s; }
.segment:nth-child(8) { transform: rotate(315deg); animation-delay: -0.15s; }

@keyframes rotate {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.segment::before {
  animation: fade 1.2s linear infinite;
}

@keyframes fade {
  0%, 50% {
    opacity: 0;
  }
  25% {
    opacity: 1;
  }
}

/* 深色主题支持 */
@media (prefers-color-scheme: dark) {
  .loading-text {
    color: #ccc;
  }

  .overlay {
    background: rgba(0, 0, 0, 0.8);
  }

  .spinner-container .spinner {
    border-color: #2d3748;
    border-top-color: #4299e1;
  }

  .dot,
  .wave,
  .pulse {
    background-color: #4299e1;
  }

  .default-spinner .segment::before {
    background-color: #4299e1;
  }
}

/* 响应式调整 */
@media (max-width: 768px) {
  .size-large {
    --size: 36px;
  }

  .loading-text {
    font-size: 12px;
  }
}
</style>