<template>
  <div class="skeleton-loader">
    <!-- 卡片骨架屏 -->
    <div v-if="type === 'card'" class="skeleton-card">
      <div class="skeleton-avatar"></div>
      <div class="skeleton-content">
        <div class="skeleton-title"></div>
        <div class="skeleton-text"></div>
        <div class="skeleton-text short"></div>
      </div>
    </div>

    <!-- 列表骨架屏 -->
    <div v-else-if="type === 'list'" class="skeleton-list">
      <div v-for="i in rows" :key="i" class="skeleton-item">
        <div class="skeleton-text"></div>
      </div>
    </div>

    <!-- 表格骨架屏 -->
    <div v-else-if="type === 'table'" class="skeleton-table">
      <div class="skeleton-header">
        <div v-for="i in columns" :key="i" class="skeleton-text"></div>
      </div>
      <div v-for="i in rows" :key="i" class="skeleton-row">
        <div v-for="j in columns" :key="j" class="skeleton-text"></div>
      </div>
    </div>

    <!-- 文章骨架屏 -->
    <div v-else-if="type === 'article'" class="skeleton-article">
      <div class="skeleton-title"></div>
      <div class="skeleton-meta">
        <div class="skeleton-text short"></div>
        <div class="skeleton-text short"></div>
      </div>
      <div class="skeleton-content">
        <div v-for="i in rows" :key="i" class="skeleton-text" :class="{ short: i % 3 === 0 }"></div>
      </div>
    </div>

    <!-- 通用骨架屏 -->
    <div v-else class="skeleton-generic">
      <div v-for="i in rows" :key="i" class="skeleton-item">
        <div class="skeleton-text" :class="{ short: i % 2 === 0 }"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  type?: 'card' | 'list' | 'table' | 'article' | 'generic';
  rows?: number;
  columns?: number;
  width?: string;
  height?: string;
  animated?: boolean;
}

withDefaults(defineProps<Props>(), {
  type: 'generic',
  rows: 3,
  columns: 4,
  width: '100%',
  height: 'auto',
  animated: true
});
</script>

<style scoped>
.skeleton-loader {
  width: v-bind(width);
  height: v-bind(height);
}

/* 骨架屏基础样式 */
.skeleton-text,
.skeleton-title,
.skeleton-avatar,
.skeleton-item {
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  border-radius: 4px;
}

.skeleton-text {
  height: 16px;
  margin-bottom: 8px;
}

.skeleton-text.short {
  width: 60%;
}

.skeleton-title {
  height: 24px;
  width: 70%;
  margin-bottom: 16px;
  border-radius: 6px;
}

.skeleton-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  flex-shrink: 0;
}

.skeleton-item {
  height: 20px;
  margin-bottom: 12px;
}

/* 动画 */
@keyframes skeleton-loading {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

.skeleton-text,
.skeleton-title,
.skeleton-avatar,
.skeleton-item {
  animation: skeleton-loading 1.5s ease-in-out infinite;
}

/* 卡片骨架屏 */
.skeleton-card {
  display: flex;
  gap: 12px;
  padding: 16px;
  background: #fff;
  border-radius: 8px;
  border: 1px solid #f0f0f0;
}

.skeleton-content {
  flex: 1;
}

/* 列表骨架屏 */
.skeleton-list {
  padding: 16px 0;
}

.skeleton-list .skeleton-item {
  height: 48px;
  border-radius: 6px;
}

/* 表格骨架屏 */
.skeleton-table {
  width: 100%;
}

.skeleton-header {
  display: flex;
  gap: 16px;
  margin-bottom: 12px;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 6px;
}

.skeleton-header .skeleton-text {
  height: 16px;
  margin: 0;
  flex: 1;
}

.skeleton-row {
  display: flex;
  gap: 16px;
  padding: 12px;
  border-bottom: 1px solid #f0f0f0;
}

.skeleton-row .skeleton-text {
  height: 16px;
  margin: 0;
  flex: 1;
}

/* 文章骨架屏 */
.skeleton-article {
  max-width: 600px;
}

.skeleton-meta {
  display: flex;
  gap: 24px;
  margin-bottom: 24px;
}

.skeleton-meta .skeleton-text {
  margin: 0;
}

.skeleton-article .skeleton-content .skeleton-text {
  height: 18px;
  line-height: 1.6;
}

.skeleton-article .skeleton-content .skeleton-text.short {
  width: 80%;
}

/* 通用骨架屏 */
.skeleton-generic {
  padding: 16px;
}

/* 深色主题支持 */
@media (prefers-color-scheme: dark) {
  .skeleton-text,
  .skeleton-title,
  .skeleton-avatar,
  .skeleton-item {
    background: linear-gradient(90deg, #2d3748 25%, #4a5568 50%, #2d3748 75%);
    background-size: 200% 100%;
  }

  .skeleton-card {
    background: #1a202c;
    border-color: #2d3748;
  }

  .skeleton-header {
    background: #2d3748;
  }

  .skeleton-row {
    border-bottom-color: #2d3748;
  }
}

/* 禁用动画 */
.skeleton-text,
.skeleton-title,
.skeleton-avatar,
.skeleton-item {
  animation-play-state: paused;
}

.skeleton-loader.animated .skeleton-text,
.skeleton-loader.animated .skeleton-title,
.skeleton-loader.animated .skeleton-avatar,
.skeleton-loader.animated .skeleton-item {
  animation-play-state: running;
}
</style>