/**
 * 设置表单组件
 * 统一的设置表单布局和样式
 * 遵循单一职责原则，专注于表单展示
 */

<template>
  <div class="settings-form">
    <n-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-placement="top"
      :show-label="showLabel"
      :size="formSize"
    >
      <!-- 表单标题 -->
      <div v-if="title" class="form-section">
        <n-divider title-placement="left" class="form-divider">
          {{ title }}
        </n-divider>
      </div>

      <!-- 表单内容 -->
      <div class="form-content">
        <n-grid
          :cols="gridCols"
          :x-gap="gridGap"
          :y-gap="gridGap"
          responsive="screen"
        >
          <slot name="form-fields" />
        </n-grid>
      </div>

      <!-- 表单操作 -->
      <div v-if="$slots.actions" class="form-actions">
        <slot name="actions" />
      </div>
    </n-form>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import {
  NForm,
  NGrid,
  NDivider,
  type FormInst,
  type FormRules
} from 'naive-ui'

/**
 * 设置表单属性接口
 */
interface IProps {
  formData: Record<string, any>
  formRules?: FormRules
  title?: string
  showLabel?: boolean
  formSize?: 'small' | 'medium' | 'large'
  gridCols?: number | string
  gridGap?: number
}

const props = withDefaults(defineProps<IProps>(), {
  formRules: () => ({}),
  showLabel: true,
  formSize: 'medium',
  gridCols: 1,
  gridGap: 24
})

/**
 * 表单引用暴露给父组件
 */
const formRef = ref<FormInst | null>(null)

const emit = defineEmits<{
  'update:form-ref': [ref: FormInst | null]
}>()

// 监听ref变化并暴露给父组件
watch(formRef, (newRef) => {
  emit('update:form-ref', newRef)
}, { immediate: true })

defineExpose({
  formRef
})
</script>

<style scoped>
/* 表单容器样式 */
.settings-form {
  @apply w-full;
}

/* 表单分区样式 */
.form-section {
  @apply mb-6;
}

.form-divider {
  @apply font-medium text-gray-900;
}

.form-divider :deep(.n-divider__title) {
  @apply font-semibold;
}

/* 表单内容样式 */
.form-content {
  @apply mb-6;
}

/* 表单操作区域样式 */
.form-actions {
  @apply flex items-center justify-end space-x-3 pt-4 border-t border-gray-200;
}

/* 响应式网格调整 */
@media (max-width: 640px) {
  .form-actions {
    @apply flex-col space-y-2 space-x-0;
  }
}

/* 深色模式适配 */
.dark .form-actions {
  @apply border-gray-700;
}

.dark .form-divider {
  @apply text-gray-100;
}

/* 表单动画 */
.settings-form {
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(-10px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

/* 表单项样式覆盖 */
.settings-form :deep(.n-form-item) {
  @apply mb-4;
}

.settings-form :deep(.n-form-item-label) {
  @apply font-medium text-gray-900;
}

.settings-form :deep(.n-input) {
  @apply transition-all duration-200;
}

.settings-form :deep(.n-input:hover .n-input__input-el) {
  @apply bg-gray-50;
}

.settings-form :deep(.n-input:focus-within) {
  @apply ring-2 ring-primary-500 ring-opacity-20;
}

.dark .settings-form :deep(.n-form-item-label) {
  @apply text-gray-100;
}

.dark .settings-form :deep(.n-input:hover .n-input__input-el) {
  @apply bg-gray-700;
}
</style>