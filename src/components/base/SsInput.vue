/**
 * 基础输入框组件
 * 提供统一的输入框样式和功能
 */

<template>
  <div class="ss-input-container">
    <!-- 标签 -->
    <label
      v-if="label"
      :for="inputId"
      class="ss-input__label"
      :class="{ 'ss-input__label--required': required }"
    >
      {{ label }}
    </label>

    <!-- 输入框包装器 -->
    <div class="ss-input__wrapper" :class="wrapperClasses">
      <!-- 前缀图标 -->
      <div v-if="prefixIcon" class="ss-input__prefix">
        <component :is="prefixIcon" />
      </div>

      <!-- 输入框 -->
      <input
        :id="inputId"
        ref="inputRef"
        :class="inputClasses"
        :type="type"
        :value="modelValue"
        :placeholder="placeholder"
        :disabled="disabled"
        :readonly="readonly"
        :maxlength="maxlength"
        :minlength="minlength"
        :min="min"
        :max="max"
        :step="step"
        :autocomplete="autocomplete"
        v-bind="$attrs"
        @input="handleInput"
        @change="handleChange"
        @focus="handleFocus"
        @blur="handleBlur"
        @keydown="handleKeydown"
      />

      <!-- 后缀图标/内容 -->
      <div class="ss-input__suffix">
        <!-- 清除按钮 -->
        <button
          v-if="clearable && modelValue && !disabled && !readonly"
          type="button"
          class="ss-input__clear"
          @click="handleClear"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        <!-- 自定义后缀 -->
        <div v-if="slots.suffix" class="ss-input__suffix-content">
          <slot name="suffix" />
        </div>

        <!-- 后缀图标 -->
        <div v-if="suffixIcon" class="ss-input__suffix-icon">
          <component :is="suffixIcon" />
        </div>
      </div>
    </div>

    <!-- 帮助文本 -->
    <div v-if="helpText || errorMessage" class="ss-input__help">
      <span v-if="errorMessage" class="ss-input__error">{{ errorMessage }}</span>
      <span v-else-if="helpText" class="ss-input__help-text">{{ helpText }}</span>
    </div>

    <!-- 字符计数 -->
    <div
      v-if="showCount && maxlength"
      class="ss-input__count"
      :class="{ 'ss-input__count--error': modelValue.length > maxlength }"
    >
      {{ modelValue.length }}/{{ maxlength }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, nextTick, useSlots } from 'vue';
import type { IStandardProps, IFormComponentProps, IFormComponentEmits } from '@/utils/componentApiStandards';

interface Props extends IFormComponentProps {
  // 输入框类型
  type?: 'text' | 'password' | 'email' | 'number' | 'tel' | 'url' | 'search';

  // 帮助文本
  helpText?: string;

  // 尺寸选项
  size?: 'sm' | 'md' | 'lg';

  // 验证相关
  maxlength?: number;
  minlength?: number;
  min?: number | string;
  max?: number | string;
  step?: number | string;

  // 功能选项
  clearable?: boolean;
  showCount?: boolean;
  autocomplete?: string;

  // 图标
  prefixIcon?: any;
  suffixIcon?: any;

  // 行为选项
  selectOnFocus?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  type: 'text',
  size: 'md',
  disabled: false,
  readonly: false,
  loading: false,
  required: false,
  clearable: false,
  showCount: false,
  autocomplete: 'off',
  autofocus: false,
  selectOnFocus: false
});

const emit = defineEmits<IFormComponentEmits & {
  // 表单特定事件
  clear: [];
  focus: [event: FocusEvent];
  blur: [event: FocusEvent];
  keydown: [event: KeyboardEvent];
}>();

const slots = useSlots();
const inputRef = ref<HTMLInputElement>();
const isFocused = ref(false);
const inputId = `input-${Math.random().toString(36).substr(2, 9)}`;

// 计算包装器样式类
const wrapperClasses = computed(() => {
  return {
    'ss-input__wrapper--focused': isFocused.value,
    'ss-input__wrapper--disabled': props.disabled,
    'ss-input__wrapper--error': props.errorMessage,
    'ss-input__wrapper--loading': props.loading,
    ['ss-input__wrapper--' + props.size]: true
  };
});

// 计算输入框样式类
const inputClasses = computed(() => {
  return [
    'ss-input',
    'ss-input--' + props.size,
    {
      'ss-input--error': props.errorMessage,
      'ss-input--disabled': props.disabled,
      'ss-input--readonly': props.readonly,
      'ss-input--has-prefix': props.prefixIcon,
      'ss-input--has-suffix': props.suffixIcon || props.clearable || slots.suffix
    }
  ];
});

// 处理输入事件
const handleInput = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const value = target.value;
  emit('update:modelValue', value);
  emit('input', value);
};

// 处理变更事件
const handleChange = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const value = props.type === 'number' ? Number(target.value) : target.value;
  emit('change', value);
};

// 处理聚焦事件
const handleFocus = async (event: FocusEvent) => {
  isFocused.value = true;

  // 自动全选
  if (props.selectOnFocus) {
    await nextTick();
    (event.target as HTMLInputElement).select();
  }

  emit('focus', event);
};

// 处理失焦事件
const handleBlur = (event: FocusEvent) => {
  isFocused.value = false;
  emit('blur', event);
};

// 处理键盘事件
const handleKeydown = (event: KeyboardEvent) => {
  emit('keydown', event);
};

// 处理清除事件
const handleClear = () => {
  emit('update:modelValue', '');
  emit('clear');
  inputRef.value?.focus();
};

// 聚焦方法
const focus = () => {
  inputRef.value?.focus();
};

// 失焦方法
const blur = () => {
  inputRef.value?.blur();
};

// 选择文本方法
const select = () => {
  inputRef.value?.select();
};

// 自动聚焦
watch(() => props.autofocus, (newValue) => {
  if (newValue) {
    nextTick(() => {
      focus();
    });
  }
}, { immediate: true });

// 暴露方法给父组件
defineExpose({
  focus,
  blur,
  select,
  inputRef
});
</script>

<style scoped>
/* 输入框容器 */
.ss-input-container {
  @apply relative;
}

/* 标签样式 */
.ss-input__label {
  @apply block text-sm font-medium text-gray-700 mb-1;
}

.ss-input__label--required::after {
  @apply text-error-500 ml-1;
  content: '*';
}

/* 输入框包装器 */
.ss-input__wrapper {
  @apply relative flex items-center;
}

/* 输入框样式 */
.ss-input {
  @apply w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 focus:border-primary-500 placeholder-gray-400;

  /* 移除浏览器默认样式 */
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
}

/* 输入框尺寸 */
.ss-input--sm {
  @apply px-2 py-1 text-sm;
}

.ss-input--md {
  @apply px-3 py-2 text-sm;
}

.ss-input--lg {
  @apply px-4 py-3 text-base;
}

/* 输入框状态 */
.ss-input--error {
  @apply border-error-500 focus:ring-error-500 focus:border-error-500;
}

.ss-input--disabled {
  @apply bg-gray-50 text-gray-500 cursor-not-allowed;
}

.ss-input--readonly {
  @apply bg-gray-50 cursor-default;
}

/* 前缀图标 */
.ss-input__prefix {
  @apply absolute left-3 flex items-center text-gray-400;
  z-index: 1;
}

.ss-input--has-prefix {
  @apply pl-10;
}

/* 后缀区域 */
.ss-input__suffix {
  @apply absolute right-3 flex items-center space-x-1;
  z-index: 1;
}

.ss-input--has-suffix {
  @apply pr-10;
}

/* 清除按钮 */
.ss-input__clear {
  @apply p-1 text-gray-400 hover:text-gray-600 focus:outline-none focus:text-gray-600 transition-colors duration-150;
}

.ss-input__clear:hover {
  @apply text-gray-600;
}

/* 后缀内容 */
.ss-input__suffix-content {
  @apply flex items-center;
}

/* 后缀图标 */
.ss-input__suffix-icon {
  @apply text-gray-400;
}

/* 包装器状态 */
.ss-input__wrapper--focused {
  /* 可以添加聚焦时的特殊样式 */
}

.ss-input__wrapper--disabled {
  @apply opacity-50 cursor-not-allowed;
}

.ss-input__wrapper--error {
  /* 错误状态样式已通过input类处理 */
}

.ss-input__wrapper--loading {
  /* 加载状态样式 */
}

/* 帮助文本 */
.ss-input__help {
  @apply mt-1;
}

.ss-input__help-text {
  @apply text-sm text-gray-500;
}

.ss-input__error {
  @apply text-sm text-error-600;
}

/* 字符计数 */
.ss-input__count {
  @apply mt-1 text-xs text-gray-500 text-right;
}

.ss-input__count--error {
  @apply text-error-600;
}

/* 暗色模式适配 */
@media (prefers-color-scheme: dark) {
  .ss-input {
    @apply bg-gray-800 border-gray-600 text-gray-100 placeholder-gray-400;
  }

  .ss-input:focus {
    @apply border-primary-500 ring-primary-500;
  }

  .ss-input--disabled {
    @apply bg-gray-700 text-gray-400;
  }

  .ss-input--readonly {
    @apply bg-gray-700 text-gray-300;
  }

  .ss-input__label {
    @apply text-gray-300;
  }

  .ss-input__help-text {
    @apply text-gray-400;
  }
}

/* 数字输入框特殊处理 */
.ss-input[type="number"]::-webkit-inner-spin-button,
.ss-input[type="number"]::-webkit-outer-spin-button {
  @apply opacity-100 h-auto;
}

/* 搜索输入框特殊处理 */
.ss-input[type="search"]::-webkit-search-decoration,
.ss-input[type="search"]::-webkit-search-cancel-button {
  @apply hidden;
}
</style>