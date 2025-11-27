<template>
  <n-modal
    v-model:show="showModal"
    preset="card"
    :title="modalTitle"
    style="width: 600px;"
    :mask-closable="false"
  >
    <n-form
      ref="formRef"
      :model="formState"
      :rules="formRules"
      label-placement="left"
      label-width="auto"
      require-mark-placement="right-hanging"
    >
      <n-form-item label="节点名称" path="name">
        <n-input
          v-model:value="formState.name"
          placeholder="为节点起个名字"
          :disabled="loading"
        />
      </n-form-item>

      <n-form-item label="节点链接" path="link">
        <n-input
          v-model:value="formState.link"
          type="textarea"
          placeholder="输入节点链接"
          :rows="4"
          :disabled="loading"
        />
      </n-form-item>

      <n-form-item label="分组" path="group_id">
        <n-select
          v-model:value="formState.group_id"
          :options="groupOptions"
          placeholder="选择分组（可选）"
          clearable
          :disabled="loading"
        />
      </n-form-item>

      <n-form-item label="排序权重" path="sort_order">
        <n-input-number
          v-model:value="formState.sort_order"
          :min="0"
          :max="9999"
          placeholder="数字越大排序越靠前"
          :disabled="loading"
        />
      </n-form-item>

      <n-space justify="end">
        <n-button @click="handleCancel" :disabled="loading">取消</n-button>
        <n-button type="primary" @click="handleSave" :loading="loading">
          {{ isEditing ? '更新' : '添加' }}
        </n-button>
      </n-space>
    </n-form>
  </n-modal>
</template>

<script setup lang="ts">
import { ref, computed, reactive, watch } from 'vue';
import { NModal, NForm, NFormItem, NInput, NSelect, NInputNumber, NSpace, NButton, type FormInst, type FormRules } from 'naive-ui';
import { useMessage } from 'naive-ui';
import type { Node } from '@/types';
import { useApi } from '@/composables/useApi';

interface Props {
  show: boolean;
  node?: Node | null;
  groups: Array<{ id: string; name: string }>;
}

interface Emits {
  (e: 'update:show', value: boolean): void;
  (e: 'success'): void;
}

const props = withDefaults(defineProps<Props>(), {
  show: false,
  node: null,
  groups: () => []
});

const emit = defineEmits<Emits>();

const message = useMessage();
const { post, put } = useApi();
const formRef = ref<FormInst | null>(null);

// 表单状态
const formState = reactive({
  name: '',
  link: '',
  group_id: undefined as string | undefined,
  sort_order: 0
});

const loading = ref(false);
const showModal = computed({
  get: () => props.show,
  set: (value) => emit('update:show', value)
});

const isEditing = computed(() => !!props.node);
const modalTitle = computed(() => (isEditing.value ? '编辑节点' : '添加节点'));

// 分组选项
const groupOptions = computed(() =>
  props.groups.map(g => ({ label: g.name, value: g.id }))
);

// 表单验证规则
const formRules: FormRules = {
  name: [
    { required: true, message: '请输入节点名称', trigger: ['input', 'blur'] },
    { min: 1, max: 100, message: '节点名称长度应在1-100个字符之间', trigger: ['input', 'blur'] }
  ],
  link: [
    { required: true, message: '请输入节点链接', trigger: ['input', 'blur'] },
    {
      validator: (rule, value) => {
        if (!value || !value.trim()) {
          return new Error('请输入节点链接');
        }
        return true;
      },
      trigger: ['input', 'blur']
    }
  ],
  sort_order: [
    { type: 'number', min: 0, max: 9999, message: '排序权重应在0-9999之间', trigger: ['input', 'blur'] }
  ]
};

// 监听节点数据变化，填充表单
watch(() => props.node, (node) => {
  if (node) {
    formState.name = node.name || '';
    formState.link = node.link || '';
    formState.group_id = node.group_id || undefined;
    formState.sort_order = node.sort_order || 0;
  } else {
    resetForm();
  }
});

// 监听显示状态，重置表单
watch(() => props.show, (newShow) => {
  if (newShow && !props.node) {
    resetForm();
  }
});

const resetForm = () => {
  formState.name = '';
  formState.link = '';
  formState.group_id = undefined;
  formState.sort_order = 0;
  formRef.value?.restoreValidation();
};

const handleCancel = () => {
  showModal.value = false;
};

const handleSave = async () => {
  try {
    await formRef.value?.validate();

    loading.value = true;

    const payload = {
      name: formState.name,
      link: formState.link,
      group_id: formState.group_id,
      sort_order: formState.sort_order
    };

    let response;
    if (isEditing.value && props.node) {
      response = await put(`/nodes/${props.node.id}`, payload);
    } else {
      response = await post('/nodes', payload);
    }

    if (response.success) {
      message.success(`节点${isEditing.value ? '更新' : '添加'}成功`);
      showModal.value = false;
      emit('success');
    } else {
      message.error(response.message || `${isEditing.value ? '更新' : '添加'}失败`);
    }
  } catch (err: any) {
    console.error(`${isEditing.value ? '更新' : '添加'}节点失败:`, err);
    if (err.message) {
      message.error(`${isEditing.value ? '更新' : '添加'}失败: ${err.message}`);
    } else {
      message.error(`${isEditing.value ? '更新' : '添加'}失败，请检查网络连接或联系管理员`);
    }
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
/* 组件样式 */
</style>