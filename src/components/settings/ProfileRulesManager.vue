<script setup lang="ts">
import { h, watch, computed, onMounted } from 'vue';
import { NCard, NButton, NDataTable, NSpace, NSwitch, useMessage, NModal, NForm, NFormItem, NInput, NSelect, NInputNumber, NAlert, NP, NUl, NLi, NText } from 'naive-ui';
import type { FormInst, FormRules } from 'naive-ui';
import { useProfileRules } from '@/composables/useProfileRules';

const props = defineProps<{
  profileId?: string | null;
  modelValue: any[];
}>();

const emit = defineEmits(['update:modelValue']);

const {
  rules,
  loading,
  showModal,
  isEditing,
  formRef,
  currentRule,
  editingIndex,
  isLocalMode,
  ruleTypes,
  formRules,
  ruleHints,
  currentRuleHint,
  columns,
  handleAdd,
  handleEdit,
  handleDelete,
  handleSave,
  handleEnabledChange,
  closeModal,
  initializeRules,
} = useProfileRules(props.profileId);

// 当前规则的模型，用于v-model绑定
const currentRuleModel = computed({
  get: () => ({
    name: currentRule.value?.name || '',
    type: currentRule.value?.type || '',
    value: currentRule.value?.value || '',
    sort_order: currentRule.value?.sort_order || 0
  }),
  set: (value) => {
    if (currentRule.value) {
      currentRule.value.name = value.name;
      currentRule.value.type = value.type;
      currentRule.value.value = value.value;
      currentRule.value.sort_order = value.sort_order;
    }
  }
});

// Watch for local mode changes and sync with parent
watch(() => props.modelValue, (newValue) => {
  if (isLocalMode.value) {
    // This is handled in the composable now
  }
}, { deep: true, immediate: true });

onMounted(() => {
  initializeRules();
});
</script>

<template>
  <n-card title="Profile 最终处理规则" :bordered="false" size="small">
    <template #header-extra>
      <n-button @click="handleAdd">添加规则</n-button>
    </template>
    <n-data-table :columns="columns" :data="rules" :loading="loading" :pagination="false" :bordered="false" />
  </n-card>

  <n-modal v-model:show="showModal" preset="card" :title="isEditing ? '编辑规则' : '添加规则'" style="width: 600px;">
    <n-form ref="formRef" :model="currentRule || {}" :rules="formRules">
      <n-form-item label="规则名称" path="name">
        <n-input v-model:value="currentRuleModel.name" />
      </n-form-item>
      <n-form-item label="规则类型" path="type">
        <n-select v-model:value="currentRuleModel.type" :options="ruleTypes" />
      </n-form-item>
      <n-form-item label="规则值" path="value">
        <n-input v-model:value="currentRuleModel.value" type="textarea" :autosize="{ minRows: 3 }" />
      </n-form-item>

      <n-alert v-if="currentRuleHint" :title="currentRuleHint.title" type="info" :bordered="false" style="margin-bottom: 20px;">
        <n-p>{{ currentRuleHint.description }}</n-p>
        <n-p><n-text strong>格式: </n-text>{{ currentRuleHint.format }}</n-p>
        <n-text strong>示例:</n-text>
        <n-ul>
          <n-li v-for="(example, index) in currentRuleHint.examples" :key="index">
            <n-text strong>{{ example.label }}: </n-text>
            <n-text code>{{ example.value }}</n-text>
            <n-p v-if="example.explanation" style="margin-left: 16px; margin-top: 4px; font-size: 12px;">{{ example.explanation }}</n-p>
          </n-li>
        </n-ul>
      </n-alert>
      <n-form-item label="排序" path="sort_order">
        <n-input-number v-model:value="currentRuleModel.sort_order" />
      </n-form-item>
      <n-space justify="end">
        <n-button @click="showModal = false">取消</n-button>
        <n-button type="primary" @click="handleSave">保存</n-button>
      </n-space>
    </n-form>
  </n-modal>
</template>