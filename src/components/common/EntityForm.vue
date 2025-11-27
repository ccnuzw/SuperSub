<template>
  <n-modal
    :show="visible"
    @update:show="handleClose"
    :mask-closable="false"
    preset="dialog"
    :title="modalTitle"
    style="width: 600px; max-width: 90vw"
  >
    <template #header>
      <div class="flex items-center gap-2">
        <n-icon v-if="icon" :component="icon" />
        <span>{{ modalTitle }}</span>
      </div>
    </template>

    <n-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-placement="left"
      label-width="120px"
      require-mark-placement="right-hanging"
      class="mt-4"
    >
      <n-form-item
        v-for="field in fields"
        :key="String(field.name)"
        :label="field.label"
        :path="String(field.name)"
      >
        <!-- 输入框 -->
        <n-input
          v-if="field.type === 'input'"
          v-model:value="formData[String(field.name)]"
          :placeholder="field.placeholder"
          :disabled="field.disabled"
          clearable
        />

        <!-- 文本域 -->
        <n-input
          v-else-if="field.type === 'textarea'"
          v-model:value="formData[String(field.name)]"
          type="textarea"
          :placeholder="field.placeholder"
          :disabled="field.disabled"
          :rows="4"
          clearable
        />

        <!-- 数字输入框 -->
        <n-input-number
          v-else-if="field.type === 'number'"
          v-model:value="formData[String(field.name)]"
          :placeholder="field.placeholder"
          :disabled="field.disabled"
          style="width: 100%"
        />

        <!-- 选择框 -->
        <n-select
          v-else-if="field.type === 'select'"
          v-model:value="formData[String(field.name)]"
          :placeholder="field.placeholder"
          :disabled="field.disabled"
          :options="field.options"
          clearable
        />

        <!-- 开关 -->
        <n-switch
          v-else-if="field.type === 'switch'"
          v-model:value="formData[String(field.name)]"
          :disabled="field.disabled"
        />

        <!-- 日期选择器 -->
        <n-date-picker
          v-else-if="field.type === 'date'"
          v-model:value="formData[String(field.name)]"
          type="date"
          :placeholder="field.placeholder"
          :disabled="field.disabled"
          style="width: 100%"
        />
      </n-form-item>
    </n-form>

    <template #action>
      <div class="flex justify-end gap-2">
        <n-button @click="handleClose">取消</n-button>
        <n-button
          type="primary"
          :loading="loading"
          @click="handleSubmit"
        >
          {{ isEditing ? '更新' : '创建' }}
        </n-button>
      </div>
    </template>
  </n-modal>
</template>

<script setup lang="ts">
import { ref, computed, watch, type PropType } from 'vue';
import {
  NModal, NForm, NFormItem, NInput, NInputNumber, NSelect,
  NSwitch, NDatePicker, NButton, NIcon, type FormInst, type FormRules
} from 'naive-ui';
import type { FormField } from '@/types/common';
import { validateForm } from '@/utils/validation/rules';

// Props
const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    default: ''
  },
  editingData: {
    type: Object,
    default: null
  },
  fields: {
    type: Array as PropType<FormField[]>,
    required: true
  },
  loading: {
    type: Boolean,
    default: false
  },
  icon: {
    type: [Object, Function] as PropType<any>,
    default: null
  }
});

// Emits
const emit = defineEmits([
  'update:visible',
  'submit',
  'cancel'
]);

// 响应式状态
const formRef = ref<FormInst | null>(null);
const formData = ref<Record<string, any>>({});

// 计算属性
const modalTitle = computed(() => {
  return props.title || (props.editingData ? '编辑' : '创建');
});

const isEditing = computed(() => !!props.editingData);

const formRules = computed(() => {
  const rules: any = {};

  props.fields.forEach(field => {
    const fieldName = String(field.name);
    rules[fieldName] = field.rules || [];

    // 添加必填验证
    if (field.required && (!rules[fieldName] || rules[fieldName].length === 0)) {
      rules[fieldName] = [{
        required: true,
        message: `请输入${field.label}`,
        trigger: ['input', 'blur', 'change']
      }];
    }
  });

  return rules;
});

// 方法
const initializeFormData = () => {
  const data: Record<string, any> = {};

  // 设置默认值
  props.fields.forEach(field => {
    const fieldName = String(field.name);

    if (props.editingData && props.editingData[fieldName] !== undefined) {
      data[fieldName] = props.editingData[fieldName];
    } else {
      // 根据字段类型设置默认值
      switch (field.type) {
        case 'switch':
          data[fieldName] = false;
          break;
        case 'number':
          data[fieldName] = 0;
          break;
        case 'select':
          data[fieldName] = null;
          break;
        default:
          data[fieldName] = '';
      }
    }
  });

  formData.value = data;
};

const handleSubmit = async () => {
  if (!formRef.value) return;

  try {
    // 表单验证
    await formRef.value.validate();

    // 提交数据
    emit('submit', { ...formData.value });
  } catch (error) {
    console.warn('表单验证失败:', error);
  }
};

const handleClose = () => {
  emit('update:visible', false);
  emit('cancel');
};

const validate = () => {
  return formRef.value?.validate();
};

const resetValidation = () => {
  formRef.value?.restoreValidation();
};

// 监听器
watch(() => props.visible, (visible) => {
  if (visible) {
    initializeFormData();
  }
});

watch(() => props.editingData, () => {
  if (props.visible) {
    initializeFormData();
  }
});

// 暴露方法
defineExpose({
  validate,
  resetValidation,
  formData
});
</script>

<style scoped>
:deep(.n-form-item-label) {
  font-weight: 500;
}

:deep(.n-input, .n-select, .n-input-number) {
  width: 100%;
}
</style>