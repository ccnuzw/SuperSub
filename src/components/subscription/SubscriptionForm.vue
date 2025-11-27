<template>
  <n-modal
    :show="visible"
    @update:show="handleClose"
    :mask-closable="false"
    preset="dialog"
    style="width: 600px; max-width: 90vw"
  >
    <template #header>
      <div class="flex items-center gap-2">
        <n-icon :component="CreateOutline" />
        <span>{{ isEditing ? '编辑订阅' : '添加订阅' }}</span>
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
      <n-form-item label="订阅名称" path="name">
        <n-input
          v-model:value="formData.name"
          placeholder="请输入订阅名称"
          clearable
        />
      </n-form-item>

      <n-form-item label="订阅链接" path="url">
        <n-input
          v-model:value="formData.url"
          type="textarea"
          placeholder="请输入订阅链接"
          :rows="3"
          clearable
        />
      </n-form-item>

      <n-form-item label="订阅分组" path="group_id">
        <n-select
          v-model:value="formData.group_id"
          :options="groupOptions"
          placeholder="选择分组（可选）"
          clearable
        />
      </n-form-item>

      <n-form-item label="包含关键词" path="include_keywords">
        <n-input
          v-model:value="formData.include_keywords"
          placeholder="关键词，用逗号分隔（可选）"
          clearable
        />
      </n-form-item>

      <n-form-item label="排除关键词" path="exclude_keywords">
        <n-input
          v-model:value="formData.exclude_keywords"
          placeholder="关键词，用逗号分隔（可选）"
          clearable
        />
      </n-form-item>

      <n-form-item label="启用状态">
        <n-switch v-model:value="formData.enabled" />
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
  NModal, NForm, NFormItem, NInput, NSelect, NSwitch,
  NButton, NIcon
} from 'naive-ui';
import { CreateOutline } from '@vicons/ionicons5';
import type { FormInst, FormRules } from 'naive-ui';
import type { Subscription } from '@/types/entities';
import type { SubscriptionGroup } from '@/types/entities';
import type { ApiResponse } from '@/types/common';
import { useSubscriptionGroupStore } from '@/stores/newSubscriptionGroups';

// Props
const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  editingData: {
    type: Object as PropType<Subscription | null>,
    default: null
  },
  loading: {
    type: Boolean,
    default: false
  }
});

// Emits
const emit = defineEmits([
  'update:visible',
  'submit',
  'cancel'
]);

// Stores
const subscriptionGroupStore = useSubscriptionGroupStore();

// 响应式状态
const formRef = ref<FormInst | null>(null);
const formData = ref<Partial<Subscription>>({});

// 计算属性
const modalTitle = computed(() => {
  return props.editingData ? '编辑订阅' : '添加订阅';
});

const isEditing = computed(() => !!props.editingData);

const groupOptions = computed(() => {
  const groups = subscriptionGroupStore.getEnabledGroups();
  return groups.map(group => ({
    label: group.name,
    value: group.id
  }));
});

// 表单验证规则
const formRules: FormRules = {
  name: [
    {
      required: true,
      message: '请输入订阅名称',
      trigger: ['input', 'blur']
    },
    {
      min: 1,
      max: 100,
      message: '订阅名称长度应在1-100个字符之间',
      trigger: ['input', 'blur']
    }
  ],
  url: [
    {
      required: true,
      message: '请输入订阅链接',
      trigger: ['input', 'blur']
    },
    {
      validator: (_rule, value) => {
        try {
          new URL(value);
          return true;
        } catch {
          return new Error('请输入有效的URL地址');
        }
      },
      trigger: ['input', 'blur']
    }
  ]
};

// 方法
const initializeFormData = () => {
  if (props.editingData) {
    // 编辑模式
    formData.value = {
      name: props.editingData.name,
      url: props.editingData.url,
      group_id: props.editingData.group_id,
      include_keywords: props.editingData.include_keywords,
      exclude_keywords: props.editingData.exclude_keywords,
      enabled: props.editingData.enabled
    };
  } else {
    // 创建模式
    formData.value = {
      name: '',
      url: '',
      group_id: undefined,
      include_keywords: '',
      exclude_keywords: '',
      enabled: true
    };
  }
};

const handleSubmit = async () => {
  if (!formRef.value) return;

  try {
    // 表单验证
    await formRef.value.validate();

    // 准备提交数据
    const submitData = {
      ...formData.value,
      enabled: formData.value.enabled ? 1 : 0
    };

    emit('submit', submitData);
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
    // 确保分组数据已加载
    if (subscriptionGroupStore.groups.length === 0) {
      subscriptionGroupStore.fetchGroups();
    }
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

:deep(.n-input, .n-select) {
  width: 100%;
}
</style>