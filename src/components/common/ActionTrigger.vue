<template>
  <div class="action-trigger" :class="triggerClasses">
    <n-tooltip :disabled="!tooltip" :placement="tooltipPlacement">
      <template #trigger>
        <n-button
          :type="type"
          :size="size"
          :circle="circle"
          :bordered="bordered"
          :disabled="disabled"
          :loading="loading"
          :quaternary="quaternary"
          :tertiary="tertiary"
          :secondary="secondary"
          :ghost="ghost"
          :dashed="dashed"
          :color="color"
          :block="block"
          :class="buttonClasses"
          @click="handleClick"
          @mouseenter="handleMouseEnter"
          @mouseleave="handleMouseLeave"
        >
          <template v-if="showIcon && iconComponent" #icon>
            <n-icon :component="iconComponent" :size="iconSize" />
          </template>
          <n-badge v-if="badge && badgeValue" :value="badgeValue" :max="badgeMax" :dot="badgeDot" :type="badgeType" />
          <span v-if="displayText" class="trigger-text">{{ displayText }}</span>
        </n-button>
      </template>
      {{ tooltip }}
    </n-tooltip>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { NButton, NIcon, NTooltip, NBadge } from 'naive-ui'
import {
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
  MoreOutlined,
  ReloadOutlined,
  DownloadOutlined,
  UploadOutlined,
  CopyOutlined,
  ShareAltOutlined,
  StarOutlined,
  StarFilled,
  HeartOutlined,
  HeartFilled,
  EyeOutlined,
  EyeInvisibleOutlined,
  LockOutlined,
  UnlockOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  StopOutlined,
  SettingOutlined,
  CheckOutlined,
  CloseOutlined,
  WarningOutlined,
  InfoCircleOutlined,
  QuestionCircleOutlined,
  SearchOutlined,
  FilterOutlined,
  SortAscendingOutlined,
  SortDescendingOutlined,
  FullscreenOutlined,
  FullscreenExitOutlined,
  ExpandOutlined,
  ShrinkOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  DoubleLeftOutlined,
  DoubleRightOutlined,
  UpOutlined,
  DownOutlined,
  LeftOutlined,
  RightOutlined,
  VerticalAlignTopOutlined,
  VerticalAlignBottomOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  ArrowLeftOutlined,
  ArrowRightOutlined,
  CaretUpOutlined,
  CaretDownOutlined,
  CaretLeftOutlined,
  CaretRightOutlined
} from '@vicons/antd'

interface Props {
  icon?: string
  text?: string
  size?: 'tiny' | 'small' | 'medium' | 'large'
  type?: 'default' | 'tertiary' | 'primary' | 'info' | 'success' | 'warning' | 'error'
  variant?: 'solid' | 'outlined' | 'text' | 'ghost' | 'quaternary' | 'secondary'
  disabled?: boolean
  loading?: boolean
  circle?: boolean
  bordered?: boolean
  quaternary?: boolean
  tertiary?: boolean
  secondary?: boolean
  ghost?: boolean
  dashed?: boolean
  color?: string
  block?: boolean
  tooltip?: string
  tooltipPlacement?: 'top' | 'bottom' | 'left' | 'right'
  showIcon?: boolean
  badge?: boolean
  badgeValue?: number | string
  badgeMax?: number
  badgeDot?: boolean
  badgeType?: 'default' | 'info' | 'success' | 'warning' | 'error'
  hoverScale?: boolean
  activeScale?: boolean
  pulse?: boolean
  rotate?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  size: 'medium',
  type: 'default',
  variant: 'solid',
  disabled: false,
  loading: false,
  circle: false,
  text: undefined,
  bordered: false,
  quaternary: false,
  tertiary: false,
  secondary: false,
  ghost: false,
  dashed: false,
  block: false,
  tooltipPlacement: 'top',
  showIcon: true,
  badge: false,
  badgeMax: 99,
  badgeDot: false,
  badgeType: 'error',
  hoverScale: false,
  activeScale: false,
  pulse: false,
  rotate: false
})

const emit = defineEmits<{
  click: [event: MouseEvent]
  mouseenter: [event: MouseEvent]
  mouseleave: [event: MouseEvent]
}>()

const isHovered = ref(false)
const isActive = ref(false)

const iconMap = {
  plus: PlusOutlined,
  delete: DeleteOutlined,
  edit: EditOutlined,
  more: MoreOutlined,
  reload: ReloadOutlined,
  download: DownloadOutlined,
  upload: UploadOutlined,
  copy: CopyOutlined,
  share: ShareAltOutlined,
  star: StarOutlined,
  'star-filled': StarFilled,
  heart: HeartOutlined,
  'heart-filled': HeartFilled,
  eye: EyeOutlined,
  'eye-invisible': EyeInvisibleOutlined,
  lock: LockOutlined,
  unlock: UnlockOutlined,
  play: PlayCircleOutlined,
  pause: PauseCircleOutlined,
  stop: StopOutlined,
  setting: SettingOutlined,
  check: CheckOutlined,
  close: CloseOutlined,
  warning: WarningOutlined,
  info: InfoCircleOutlined,
  question: QuestionCircleOutlined,
  search: SearchOutlined,
  filter: FilterOutlined,
  'sort-asc': SortAscendingOutlined,
  'sort-desc': SortDescendingOutlined,
  fullscreen: FullscreenOutlined,
  'fullscreen-exit': FullscreenExitOutlined,
  expand: ExpandOutlined,
  shrink: ShrinkOutlined,
  'menu-fold': MenuFoldOutlined,
  'menu-unfold': MenuUnfoldOutlined,
  'double-left': DoubleLeftOutlined,
  'double-right': DoubleRightOutlined,
  up: UpOutlined,
  down: DownOutlined,
  left: LeftOutlined,
  right: RightOutlined,
  'vertical-top': VerticalAlignTopOutlined,
  'vertical-bottom': VerticalAlignBottomOutlined,
  'arrow-up': ArrowUpOutlined,
  'arrow-down': ArrowDownOutlined,
  'arrow-left': ArrowLeftOutlined,
  'arrow-right': ArrowRightOutlined,
  'caret-up': CaretUpOutlined,
  'caret-down': CaretDownOutlined,
  'caret-left': CaretLeftOutlined,
  'caret-right': CaretRightOutlined
}

const iconComponent = computed(() => {
  if (!props.icon) return null

  // 如果传入的已经是组件，直接返回
  if (typeof props.icon === 'function' || (typeof props.icon === 'object' && props.icon !== null)) {
    return props.icon
  }

  // 否则从映射中查找
  const icon = iconMap[props.icon as keyof typeof iconMap]
  return icon || InfoCircleOutlined
})

const displayText = computed(() => {
  return props.text || ''
})

const buttonClasses = computed(() => [
  'action-trigger__button',
  `action-trigger__button--${props.variant}`,
  `action-trigger__button--${props.size}`,
  {
    'action-trigger__button--circle': props.circle,
    'action-trigger__button--loading': props.loading,
    'action-trigger__button--disabled': props.disabled,
    'action-trigger__button--hover-scale': props.hoverScale,
    'action-trigger__button--active-scale': props.activeScale,
    'action-trigger__button--pulse': props.pulse,
    'action-trigger__button--rotate': props.rotate,
    'action-trigger__button--hovered': isHovered.value,
    'action-trigger__button--active': isActive.value
  }
])

const triggerClasses = computed(() => [
  'action-trigger',
  `action-trigger--${props.size}`,
  {
    'action-trigger--disabled': props.disabled,
    'action-trigger--loading': props.loading
  }
])

const iconSize = computed(() => {
  const sizeMap = {
    tiny: 12,
    small: 14,
    medium: 16,
    large: 18
  }
  return sizeMap[props.size]
})

const handleClick = (event: MouseEvent) => {
  if (!props.disabled && !props.loading) {
    isActive.value = true
    setTimeout(() => {
      isActive.value = false
    }, 200)
    emit('click', event)
  }
}

const handleMouseEnter = (event: MouseEvent) => {
  isHovered.value = true
  emit('mouseenter', event)
}

const handleMouseLeave = (event: MouseEvent) => {
  isHovered.value = false
  emit('mouseleave', event)
}
</script>

<style scoped>
.action-trigger {
  display: inline-block;
  position: relative;
}

.action-trigger__button {
  position: relative;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.action-trigger__button--hover-scale:hover {
  transform: scale(1.05);
}

.action-trigger__button--active-scale:active {
  transform: scale(0.95);
}

.action-trigger__button--pulse {
  animation: pulse 2s ease-in-out infinite;
}

.action-trigger__button--rotate .n-icon {
  transition: transform 0.3s ease;
}

.action-trigger__button--rotate:hover .n-icon {
  transform: rotate(180deg);
}

.action-trigger__button--hovered {
  z-index: 1;
}

.action-trigger__button--active {
  z-index: 2;
}

.trigger-text {
  margin-left: 6px;
  font-weight: 500;
}

.action-trigger__button--circle .trigger-text {
  margin-left: 0;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
}

/* 特殊变体样式 */
.action-trigger__button--ghost {
  background-color: transparent !important;
  border-color: currentColor !important;
  color: currentColor !important;
}

.action-trigger__button--ghost:hover {
  background-color: rgba(0, 0, 0, 0.05) !important;
}

.action-trigger__button--quaternary {
  background-color: rgba(0, 0, 0, 0.02) !important;
}

.action-trigger__button--quaternary:hover {
  background-color: rgba(0, 0, 0, 0.08) !important;
}

.action-trigger__button--secondary {
  background-color: rgba(0, 0, 0, 0.06) !important;
  border-color: transparent !important;
}

.action-trigger__button--secondary:hover {
  background-color: rgba(0, 0, 0, 0.12) !important;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .trigger-text {
    display: none;
  }
}

/* 加载状态样式 */
.action-trigger__button--loading {
  pointer-events: none;
  opacity: 0.7;
}

/* 禁用状态样式 */
.action-trigger__button--disabled {
  cursor: not-allowed;
  opacity: 0.5;
}
</style>