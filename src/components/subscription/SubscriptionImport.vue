<template>
  <n-modal
    v-model:show="showModal"
    preset="card"
    title="批量导入订阅"
    style="width: 600px;"
    :mask-closable="false"
  >
    <n-form
      ref="formRef"
      :model="form"
      :rules="formRules"
      label-placement="left"
      label-width="auto"
      require-mark-placement="right-hanging"
    >
      <n-form-item label="订阅链接" path="urls">
        <n-input
          v-model:value="form.urls"
          type="textarea"
          placeholder="每行一个订阅链接，支持多个链接"
          :rows="6"
          :disabled="loading"
        />
      </n-form-item>

      <n-form-item label="目标分组" path="groupId">
        <n-select
          v-model:value="form.groupId"
          :options="groupOptions"
          placeholder="选择分组（可选）"
          clearable
          :disabled="loading"
        />
      </n-form-item>

      <n-space justify="end">
        <n-button @click="handleCancel" :disabled="loading">取消</n-button>
        <n-button type="primary" @click="handleImport" :loading="loading">
          导入 ({{ urlCount }}个)
        </n-button>
      </n-space>
    </n-form>
  </n-modal>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { NModal, NForm, NFormItem, NInput, NSelect, NSpace, NButton, type FormInst, type FormRules } from 'naive-ui';
import { useMessage } from 'naive-ui';
import type { SubscriptionGroup } from '@/types';
import { api } from '@/utils/api';

interface Props {
  show: boolean;
  groups: SubscriptionGroup[];
}

interface Emits {
  (e: 'update:show', value: boolean): void;
  (e: 'success'): void;
}

const props = withDefaults(defineProps<Props>(), {
  show: false,
  groups: () => []
});

const emit = defineEmits<Emits>();

const message = useMessage();
const formRef = ref<FormInst | null>(null);

// 表单数据
const form = ref({
  urls: '',
  groupId: undefined as string | undefined
});

const loading = ref(false);
const showModal = computed({
  get: () => props.show,
  set: (value) => emit('update:show', value)
});

// 计算URL数量
const urlCount = computed(() => {
  if (!form.value.urls.trim()) return 0;
  return form.value.urls
    .split('\n')
    .map(url => url.trim())
    .filter(url => url.length > 0)
    .length;
});

// 分组选项
const groupOptions = computed(() =>
  props.groups.map(g => ({ label: g.name, value: g.id }))
);

// 表单验证规则
const formRules: FormRules = {
  urls: [
    { required: true, message: '请输入至少一个订阅链接', trigger: ['input', 'blur'] },
    {
      validator: (rule, value) => {
        if (!value || !value.trim()) {
          return new Error('请输入至少一个订阅链接');
        }

        const urls = value.split('\n').map((url: string) => url.trim()).filter((url: string) => url.length > 0);
        if (urls.length === 0) {
          return new Error('请输入至少一个有效的订阅链接');
        }

        if (urls.length > 100) {
          return new Error('一次最多导入100个订阅链接');
        }

        // 简单的URL格式验证
        const invalidUrls = urls.filter((url: string): boolean => {
          try {
            new URL(url);
            return false;
          } catch {
            return true;
          }
        });

        if (invalidUrls.length > 0) {
          return new Error(`发现 ${invalidUrls.length} 个无效的链接格式`);
        }

        return true;
      },
      trigger: ['input', 'blur']
    }
  ]
};

// 监听显示状态，重置表单
watch(() => props.show, (newShow) => {
  if (newShow) {
    resetForm();
  }
});

const resetForm = () => {
  form.value = {
    urls: '',
    groupId: undefined
  };
  formRef.value?.restoreValidation();
};

const handleCancel = () => {
  showModal.value = false;
};

const handleImport = async () => {
  try {
    await formRef.value?.validate();

    loading.value = true;

    const urls = form.value.urls
      .split('\n')
      .map((url: string) => url.trim())
      .filter((url: string) => url.length > 0);

    const response = await api.post('/subscriptions/batch-import', {
      subscriptions: urls.map(url => ({
        name: new URL(url).hostname || '未知订阅',
        url: url
      })),
      groupId: form.value.groupId
    });

    if (response.data.success) {
      message.success(
        response.data.data?.message ||
        `成功导入 ${response.data.data?.created || 0} 个订阅`
      );
      showModal.value = false;
      emit('success');
    } else {
      message.error(response.data.message || '导入失败');
    }
  } catch (error: any) {
    console.error('批量导入失败:', error);
    if (error.message) {
      message.error(`导入失败: ${error.message}`);
    } else {
      message.error('导入失败，请检查网络连接或联系管理员');
    }
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
/* 组件样式 */
</style>