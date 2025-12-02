<template>
  <div class="smart-bar" v-if="smartActions.length > 0">
    <div class="smart-bar-content">
      <div class="smart-bar-info">
        <n-icon :component="BulbIcon" class="smart-icon" />
        <span class="smart-text">智能推荐操作</span>
      </div>
      <div class="smart-bar-actions">
        <n-space>
          <n-button
            v-for="action in smartActions"
            :key="action.key"
            :type="action.type"
            size="small"
            @click="$emit('smart-action', action)"
            :loading="action.loading"
          >
            <template #icon v-if="action.icon">
              <n-icon :component="action.icon" />
            </template>
            {{ action.label }}
          </n-button>
        </n-space>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Bulb as BulbIcon } from '@vicons/ionicons5';

interface SmartAction {
  key: string;
  label: string;
  type: 'primary' | 'success' | 'warning' | 'error' | 'info' | 'default';
  icon?: any;
  action: () => void;
  loading?: boolean;
}

interface Props {
  smartActions: SmartAction[];
}

defineProps<Props>();

defineEmits<{
  'smart-action': [action: SmartAction];
}>();
</script>

<style scoped>
/* 智能操作栏 */
.smart-bar {
  background: linear-gradient(135deg, #fff7e6 0%, #fef9e7 100%);
  border: 1px solid #ffd591;
  border-radius: 12px;
  padding: 16px 20px;
  color: #d46b08;
  box-shadow: 0 4px 12px rgba(212, 107, 8, 0.1);
  position: relative;
  overflow: hidden;
}

.smart-bar::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, #faad14, #ffc53d, #ffd666);
}

.smart-bar-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.smart-bar-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.smart-icon {
  font-size: 20px;
  color: #fa8c16;
}

.smart-text {
  font-weight: 700;
  font-size: 14px;
  color: #d46b08;
}

.smart-bar-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.smart-bar-actions :deep(.n-button) {
  border-radius: 8px;
  font-weight: 600;
  box-shadow: 0 2px 6px rgba(212, 107, 8, 0.2);
  transition: all 0.3s ease;
  border: 1.5px solid transparent;
}

.smart-bar-actions :deep(.n-button:hover) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(212, 107, 8, 0.3);
}

.smart-bar-actions :deep(.n-button--warning) {
  background: linear-gradient(135deg, #fa8c16 0%, #faad14 100%);
  border-color: #faad14;
  color: white;
}

.smart-bar-actions :deep(.n-button--warning:hover) {
  background: linear-gradient(135deg, #d46b08 0%, #fa8c16 100%);
  box-shadow: 0 4px 12px rgba(212, 107, 8, 0.4);
}

.smart-bar-actions :deep(.n-button--success) {
  background: linear-gradient(135deg, #52c41a 0%, #73d13d 100%);
  border-color: #73d13d;
  color: white;
}

.smart-bar-actions :deep(.n-button--success:hover) {
  background: linear-gradient(135deg, #389e0d 0%, #52c41a 100%);
  box-shadow: 0 4px 12px rgba(82, 196, 26, 0.4);
}

.smart-bar-actions :deep(.n-button--error) {
  background: linear-gradient(135deg, #ff4d4f 0%, #ff7875 100%);
  border-color: #ff7875;
  color: white;
}

.smart-bar-actions :deep(.n-button--error:hover) {
  background: linear-gradient(135deg, #cf1322 0%, #ff4d4f 100%);
  box-shadow: 0 4px 12px rgba(255, 77, 79, 0.4);
}

@media (max-width: 768px) {
  .smart-bar-content {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
    text-align: center;
  }

  .smart-bar-actions {
    justify-content: center;
    flex-wrap: wrap;
  }

  .smart-bar-actions :deep(.n-button) {
    font-size: 12px;
    padding: 0 12px;
  }

  .smart-bar {
    padding: 12px 16px;
  }

  .smart-text {
    font-size: 13px;
  }
}

@media (max-width: 480px) {
  .smart-bar-actions {
    gap: 6px;
  }

  .smart-bar-actions :deep(.n-button) {
    font-size: 11px;
    padding: 0 8px;
  }

  .smart-bar-actions :deep(.n-button .n-button__content) {
    gap: 4px;
  }
}
</style>