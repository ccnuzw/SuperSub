<template>
  <transition name="slide-in">
    <div v-if="selectedCount > 0" class="bulk-actions-bar" :class="barClasses">
      <!-- 背景装饰 -->
      <div class="bulk-actions-bar__background">
        <div class="bg-pattern"></div>
        <div class="bg-glow"></div>
      </div>

      <div class="bulk-actions-bar__content">
        <!-- 左侧：选择信息和智能建议 -->
        <div class="bulk-actions-bar__selection">
          <div class="selection-info">
            <div class="selection-icon">
              <n-icon :component="CheckSquareOutlined" />
              <div class="icon-glow"></div>
            </div>
            <div class="selection-text-group">
              <span class="selection-text">
                已选择 <span class="selection-count">{{ selectedCount }}</span> 项
              </span>
              <span v-if="totalCount" class="selection-total">
                共 {{ totalCount }} 项
              </span>
            </div>
          </div>

          <!-- 智能建议 -->
          <div v-if="smartSuggestions && smartSuggestions.length" class="smart-suggestions">
            <div class="suggestions-divider">
              <n-icon :component="BulbOutlined" size="12" />
            </div>
            <div class="suggestions-content">
              <span class="suggestions-label">智能建议</span>
              <div class="suggestions-buttons">
                <n-button
                  v-for="suggestion in smartSuggestions.slice(0, 3)"
                  :key="suggestion.key"
                  type="primary"
                  size="small"
                  ghost
                  :bordered="false"
                  class="suggestion-btn"
                  @click="handleSuggestion(suggestion)"
                >
                  <template #icon>
                    <n-icon :component="suggestion.icon || StarOutlined" size="12" />
                  </template>
                  {{ suggestion.label }}
                </n-button>
              </div>
            </div>
          </div>
        </div>

        <!-- 右侧：操作按钮组 -->
        <div class="bulk-actions-bar__actions">
          <div class="actions-group">
            <!-- 主要操作 -->
            <div class="primary-actions">
              <n-button
                v-for="action in commonActions.slice(0, 3)"
                :key="action.key"
                :type="action.type || 'default'"
                :size="size"
                :disabled="action.disabled"
                :loading="action.loading"
                :class="['action-btn', `action-btn--${action.type || 'default'}`]"
                @click="handleAction(action)"
              >
                <template v-if="action.icon" #icon>
                  <n-icon :component="action.icon" />
                </template>
                {{ action.label }}
              </n-button>
            </div>

            <!-- 更多操作 -->
            <div class="secondary-actions">
              <n-dropdown
                v-if="moreActions && moreActions.length"
                :options="moreActionOptions"
                placement="top-end"
                trigger="click"
                :show-arrow="true"
              >
                <n-button :size="size" quaternary class="more-btn">
                  <template #icon>
                    <n-icon :component="MoreOutlined" />
                  </template>
                  <span class="more-text">更多</span>
                </n-button>
              </n-dropdown>

              <!-- 选择控制按钮 -->
              <div v-if="showSelectAll" class="selection-controls">
                <n-divider vertical />
                <n-button
                  text
                  :size="size"
                  class="control-btn"
                  @click="handleSelectAll"
                >
                  <template #icon>
                    <n-icon :component="isAllSelected ? CloseSquareOutlined : SelectOutlined" />
                  </template>
                  {{ isAllSelected ? '取消全选' : '全选' }}
                </n-button>

                <n-button
                  text
                  :size="size"
                  class="control-btn clear-btn"
                  @click="handleClearSelection"
                >
                  <template #icon>
                    <n-icon :component="CloseCircleOutlined" />
                  </template>
                  清除
                </n-button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 顶部进度指示器 -->
      <div class="progress-indicator">
        <div class="progress-bar" :style="{ width: `${selectionPercentage}%` }"></div>
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { computed, h } from 'vue'
import {
  NButton,
  NIcon,
  NSpace,
  NDivider,
  NDropdown,
  NTag,
  NTooltip
} from 'naive-ui'
import {
  CheckSquareOutlined,
  DeleteOutlined,
  EditOutlined,
  CopyOutlined,
  DownloadOutlined,
  UploadOutlined,
  ShareAltOutlined,
  MoreOutlined,
  ExportOutlined,
  ImportOutlined,
  ReloadOutlined,
  StopOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  SettingOutlined,
  StarOutlined,
  StarFilled,
  BulbOutlined,
  SelectOutlined,
  CloseSquareOutlined,
  CloseCircleOutlined
} from '@vicons/antd'

interface Action {
  key: string
  label: string
  icon?: any
  type?: 'default' | 'primary' | 'info' | 'success' | 'warning' | 'error'
  disabled?: boolean
  loading?: boolean
  danger?: boolean
  tooltip?: string
  handler?: () => void | Promise<void>
}

interface SmartSuggestion extends Action {
  priority: number
  condition?: () => boolean
}

interface Props {
  selectedCount: number
  totalCount?: number
  commonActions?: Action[]
  moreActions?: Action[]
  smartSuggestions?: SmartSuggestion[]
  position?: 'top' | 'bottom'
  size?: 'small' | 'medium' | 'large'
  showSelectAll?: boolean
  isAllSelected?: boolean
  animated?: boolean
  sticky?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  totalCount: 0,
  commonActions: () => [],
  moreActions: () => [],
  smartSuggestions: () => [],
  position: 'bottom',
  size: 'medium',
  showSelectAll: true,
  isAllSelected: false,
  animated: true,
  sticky: false
})

const emit = defineEmits<{
  action: [action: Action]
  'suggestion': [suggestion: SmartSuggestion]
  'select-all': []
  'clear-selection': []
}>()

// 选择百分比计算
const selectionPercentage = computed(() => {
  if (!props.totalCount || props.totalCount === 0) return 0
  return Math.min(100, Math.round((props.selectedCount / props.totalCount) * 100))
})

const barClasses = computed(() => [
  'bulk-actions-bar',
  `bulk-actions-bar--${props.position}`,
  `bulk-actions-bar--${props.size}`,
  {
    'bulk-actions-bar--sticky': props.sticky,
    'bulk-actions-bar--animated': props.animated,
    'bulk-actions-bar--has-suggestions': props.smartSuggestions && props.smartSuggestions.length > 0,
    'bulk-actions-bar--high-selection': selectionPercentage.value > 50
  }
])

const moreActionOptions = computed(() => {
  return props.moreActions.map(action => ({
    label: () => h('div', { class: 'action-option' }, [
      h(NIcon, { component: action.icon, style: { marginRight: '8px' } }),
      action.label,
      action.danger && h(NTag, { type: 'error', size: 'small', style: { marginLeft: '8px' } }, () => '危险')
    ]),
    key: action.key,
    disabled: action.disabled,
    props: {
      style: action.danger ? { color: 'var(--n-error-color)' } : {}
    }
  }))
})

const handleAction = (action: Action) => {
  if (action.handler) {
    action.handler()
  }
  emit('action', action)
}

const handleMoreAction = (key: string) => {
  const action = props.moreActions.find(a => a.key === key)
  if (action) {
    handleAction(action)
  }
}

const handleSuggestion = (suggestion: SmartSuggestion) => {
  if (suggestion.handler) {
    suggestion.handler()
  }
  emit('suggestion', suggestion)
}

const handleSelectAll = () => {
  emit('select-all')
}

const handleClearSelection = () => {
  emit('clear-selection')
}
</script>

<style scoped>
.bulk-actions-bar {
  position: relative;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(102, 126, 234, 0.3);
  z-index: 100;
  overflow: hidden;
  backdrop-filter: blur(20px);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* 背景装饰 */
.bulk-actions-bar__background {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
}

.bg-pattern {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image:
    radial-gradient(circle at 20% 50%, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
    radial-gradient(circle at 80% 80%, rgba(255, 255, 255, 0.08) 0%, transparent 50%),
    linear-gradient(45deg, transparent 30%, rgba(255, 255, 255, 0.05) 50%, transparent 70%);
  opacity: 0.6;
}

.bg-glow {
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.1) 0%, transparent 70%);
  animation: glow-rotate 20s linear infinite;
}

@keyframes glow-rotate {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 位置和尺寸 */
.bulk-actions-bar--sticky {
  position: sticky;
}

.bulk-actions-bar--top {
  top: 0;
  margin-bottom: 16px;
}

.bulk-actions-bar--bottom {
  bottom: 0;
  margin-top: 16px;
}

.bulk-actions-bar--small {
  padding: 12px 20px;
}

.bulk-actions-bar--medium {
  padding: 16px 24px;
}

.bulk-actions-bar--large {
  padding: 20px 28px;
}

/* 主内容区域 */
.bulk-actions-bar__content {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
}

/* 左侧选择信息 */
.bulk-actions-bar__selection {
  display: flex;
  align-items: center;
  gap: 24px;
  flex: 1;
  min-width: 0;
}

.selection-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.selection-icon {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 12px;
  color: white;
  font-size: 18px;
}

.icon-glow {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 100%;
  height: 100%;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.3) 0%, transparent 70%);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  animation: icon-pulse 2s ease-in-out infinite;
}

@keyframes icon-pulse {
  0%, 100% { opacity: 0.5; transform: translate(-50%, -50%) scale(1); }
  50% { opacity: 0.8; transform: translate(-50%, -50%) scale(1.1); }
}

.selection-text-group {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.selection-text {
  color: white;
  font-size: 14px;
  font-weight: 500;
  opacity: 0.9;
}

.selection-count {
  color: #ffd93d;
  font-size: 20px;
  font-weight: 700;
  text-shadow: 0 2px 4px rgba(255, 217, 61, 0.3);
}

.selection-total {
  color: rgba(255, 255, 255, 0.7);
  font-size: 12px;
}

/* 智能建议 */
.smart-suggestions {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-shrink: 0;
}

.suggestions-divider {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: #ffd93d;
}

.suggestions-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.suggestions-label {
  color: rgba(255, 255, 255, 0.8);
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.suggestions-buttons {
  display: flex;
  gap: 8px;
}

.suggestion-btn {
  background: rgba(255, 255, 255, 0.15) !important;
  border: 1px solid rgba(255, 255, 255, 0.2) !important;
  color: white !important;
  backdrop-filter: blur(10px);
  transition: all 0.2s ease !important;
}

.suggestion-btn:hover {
  background: rgba(255, 255, 255, 0.25) !important;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* 右侧操作按钮 */
.bulk-actions-bar__actions {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.actions-group {
  display: flex;
  align-items: center;
  gap: 16px;
}

.primary-actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  background: rgba(255, 255, 255, 0.15) !important;
  border: 1px solid rgba(255, 255, 255, 0.2) !important;
  color: white !important;
  backdrop-filter: blur(10px);
  font-weight: 500;
  transition: all 0.2s ease !important;
}

.action-btn:hover {
  background: rgba(255, 255, 255, 0.25) !important;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.action-btn--primary {
  background: rgba(76, 175, 80, 0.8) !important;
  border-color: rgba(76, 175, 80, 0.9) !important;
}

.action-btn--error {
  background: rgba(244, 67, 54, 0.8) !important;
  border-color: rgba(244, 67, 54, 0.9) !important;
}

.action-btn--warning {
  background: rgba(255, 152, 0, 0.8) !important;
  border-color: rgba(255, 152, 0, 0.9) !important;
}

.secondary-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.more-btn {
  color: rgba(255, 255, 255, 0.8) !important;
  backdrop-filter: blur(10px);
}

.more-btn:hover {
  color: white !important;
  background: rgba(255, 255, 255, 0.1) !important;
}

.more-text {
  margin-left: 4px;
}

.selection-controls {
  display: flex;
  align-items: center;
  gap: 4px;
}

.control-btn {
  color: rgba(255, 255, 255, 0.8) !important;
  font-size: 12px;
  transition: all 0.2s ease !important;
}

.control-btn:hover {
  color: white !important;
  background: rgba(255, 255, 255, 0.1) !important;
}

.clear-btn:hover {
  background: rgba(244, 67, 54, 0.2) !important;
}

/* 进度指示器 */
.progress-indicator {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: rgba(255, 255, 255, 0.2);
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #ffd93d 0%, #ff6b6b 100%);
  transition: width 0.3s ease;
  box-shadow: 0 0 10px rgba(255, 217, 61, 0.5);
}

/* 动画效果 */
.slide-in-enter-active,
.slide-in-leave-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-in-enter-from {
  opacity: 0;
  transform: translateY(30px) scale(0.95);
}

.slide-in-leave-to {
  opacity: 0;
  transform: translateY(30px) scale(0.95);
}

.bulk-actions-bar--animated {
  animation: slide-in-bounce 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

@keyframes slide-in-bounce {
  0% {
    opacity: 0;
    transform: translateY(30px) scale(0.9);
  }
  60% {
    opacity: 1;
    transform: translateY(-8px) scale(1.03);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* 悬停效果 */
.bulk-actions-bar:hover {
  box-shadow: 0 12px 48px rgba(102, 126, 234, 0.4);
  transform: translateY(-2px);
}

.bulk-actions-bar:hover .bg-glow {
  opacity: 0.8;
}

/* 高选择率状态 */
.bulk-actions-bar--high-selection {
  background: linear-gradient(135deg, #ff6b6b 0%, #ffd93d 100%);
}

.bulk-actions-bar--high-selection .progress-bar {
  background: linear-gradient(90deg, #4caf50 0%, #2196f3 100%);
}

/* 有建议的状态 */
.bulk-actions-bar--has-suggestions .suggestions-divider {
  animation: suggestion-pulse 2s ease-in-out infinite;
}

@keyframes suggestion-pulse {
  0%, 100% { transform: scale(1); opacity: 0.8; }
  50% { transform: scale(1.1); opacity: 1; }
}

/* 下拉选项样式 */
.action-option {
  display: flex;
  align-items: center;
  padding: 6px 0;
  font-weight: 500;
}

/* 响应式调整 */
@media (max-width: 1024px) {
  .bulk-actions-bar__content {
    flex-direction: column;
    align-items: stretch;
    gap: 16px;
  }

  .bulk-actions-bar__selection {
    justify-content: space-between;
  }

  .actions-group {
    justify-content: center;
    flex-wrap: wrap;
  }
}

@media (max-width: 768px) {
  .bulk-actions-bar--small {
    padding: 10px 16px;
  }

  .bulk-actions-bar--medium {
    padding: 12px 20px;
  }

  .bulk-actions-bar--large {
    padding: 16px 24px;
  }

  .selection-icon {
    width: 36px;
    height: 36px;
    font-size: 16px;
  }

  .selection-count {
    font-size: 18px;
  }

  .smart-suggestions {
    width: 100%;
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .suggestions-buttons {
    width: 100%;
    justify-content: space-between;
  }

  .suggestion-btn {
    flex: 1;
    font-size: 11px;
    padding: 4px 8px !important;
  }

  .primary-actions {
    flex-wrap: wrap;
    justify-content: center;
  }

  .action-btn {
    font-size: 12px;
  }
}

@media (max-width: 480px) {
  .bulk-actions-bar {
    border-radius: 12px;
    margin: 8px;
  }

  .bulk-actions-bar--small {
    padding: 8px 12px;
  }

  .selection-text {
    font-size: 12px;
  }

  .selection-count {
    font-size: 16px;
  }

  .selection-icon {
    width: 32px;
    height: 32px;
    font-size: 14px;
  }

  .action-btn {
    padding: 4px 8px !important;
    font-size: 11px;
  }

  .control-btn {
    font-size: 11px;
  }

  .more-text {
    display: none;
  }
}

/* 深色主题适配 */
.dark .bulk-actions-bar {
  background: linear-gradient(135deg, #4a5568 0%, #2d3748 100%);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
}

.dark .selection-icon {
  background: rgba(255, 255, 255, 0.1);
}

.dark .action-btn {
  background: rgba(255, 255, 255, 0.1) !important;
  border-color: rgba(255, 255, 255, 0.15) !important;
}

.dark .action-btn:hover {
  background: rgba(255, 255, 255, 0.2) !important;
}

/* 禁用状态样式 */
.bulk-actions-bar .n-button--disabled {
  opacity: 0.4;
  cursor: not-allowed;
  transform: none !important;
}

.bulk-actions-bar .n-button--disabled:hover {
  transform: none !important;
  box-shadow: none !important;
}
</style>