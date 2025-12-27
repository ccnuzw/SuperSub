<script setup lang="ts">
import { h, watch } from 'vue';
import { ref, onMounted, computed } from 'vue';
import { NCard, NDataTable, NSpace, NSwitch, useMessage, NModal, NForm, NFormItem, NInput, NSelect, NInputNumber, NAlert, NP, NUl, NLi, NText, NIcon } from 'naive-ui';
import type { DataTableColumns, FormInst, FormRules } from 'naive-ui';
import { profileRulesApi } from '@/api/profileRules';
import Button from '@/components/ui/Button.vue';
import { AddOutline } from '@vicons/ionicons5';

const props = defineProps<{
  profileId?: string | null;
  modelValue: any[];
}>();

const emit = defineEmits(['update:modelValue']);

const message = useMessage();
const rules = ref<any[]>([]);
const loading = ref(false);
const showModal = ref(false);
const isEditing = ref(false);
const formRef = ref<FormInst | null>(null);
const currentRule = ref<any>(null);
const editingIndex = ref(-1);

const isLocalMode = computed(() => !props.profileId);

interface RuleHintExample {
  label: string;
  value: string;
  explanation?: string;
}

interface RuleHint {
  title: string;
  description: string;
  format: string;
  examples: RuleHintExample[];
}

const ruleHints: Record<string, RuleHint> = {
  filter_by_name_keyword: {
    title: '按名称关键字过滤',
    description: '仅保留名称中包含指定关键字的节点。',
    format: '输入一个或多个关键字，多个关键字之间用 | (竖线)、, (逗号) 或换行分隔。',
    examples: [
      { label: '单个关键字', value: '香港' },
      { label: '多个关键字', value: '香港|日本' }
    ]
  },
  filter_by_name_regex: {
    title: '按名称正则表达式过滤',
    description: '使用正则表达式匹配节点名称，只保留匹配成功的节点。',
    format: '输入一个有效的正则表达式。',
    examples: [
      { label: '匹配开头', value: '^HK' },
      { label: '匹配特定模式', value: '(香港|澳门)\\sIPLC' }
    ]
  },
  exclude_by_name_keyword: {
    title: '按名称关键字排除',
    description: '从列表中移除名称中包含指定关键字的节点。',
    format: '输入一个或多个关键字，多个关键字之间用 | (竖线)、, (逗号) 或换行分隔。',
    examples: [
      { label: '单个关键字', value: '过期' },
      { label: '多个关键字', value: '测试|beta' }
    ]
  },
  rename_by_regex: {
    title: '按正则表达式重命名',
    description: '根据正则表达式查找并替换节点名称。这是最强大的功能，可以用来批量修改、添加前后缀等。',
    format: '格式为 `正则表达式===替换内容`。',
    examples: [
      { label: '简单替换', value: '^\\[V2\\]===[VIP]', explanation: '将所有节点名称开头的 `[V2]` 替换为 `[VIP]`。' },
      { label: '添加前缀', value: '^(.*)===MyPrefix-$1', explanation: '给所有节点名称前加上 `MyPrefix-`。`(.*)` 匹配整个原始名称并将其放入第一个捕获组 `$1`。' },
      { label: '提取并重组', value: '^香港\\sIPLC\\s专线\\s(\\d+)===HK-$1', explanation: '将 `香港 IPLC 专线 01` 简化为 `HK-01`。`(\\d+)` 捕获数字，然后在替换内容中通过 `$1` 使用它。' }
    ]
  }
};

const currentRuleHint = computed(() => {
  if (currentRule.value && currentRule.value.type) {
    return ruleHints[currentRule.value.type as keyof typeof ruleHints];
  }
  return null;
});

watch(() => props.modelValue, (newValue) => {
  if (isLocalMode.value) {
    rules.value = JSON.parse(JSON.stringify(newValue));
  }
}, { deep: true, immediate: true });


const ruleTypes = [
  { label: '按名称关键字过滤', value: 'filter_by_name_keyword' },
  { label: '按名称正则表达式过滤', value: 'filter_by_name_regex' },
  { label: '按名称关键字排除', value: 'exclude_by_name_keyword' },
  { label: '按正则表达式重命名', value: 'rename_by_regex' },
];

const formRules: FormRules = {
  name: { required: true, message: '请输入规则名称', trigger: 'blur' },
  type: { required: true, message: '请选择规则类型', trigger: 'change' },
  value: { required: true, message: '请输入规则值', trigger: 'blur' },
};

const fetchRules = async () => {
  if (isLocalMode.value || !props.profileId) return;
  loading.value = true;
  try {
    const response = await profileRulesApi.fetchRules(props.profileId);
    if (response.data.success) {
      rules.value = response.data.data || [];
      emit('update:modelValue', JSON.parse(JSON.stringify(rules.value)));
    } else {
      message.error('获取规则失败');
    }
  } catch (error) {
    message.error('请求规则列表失败');
  } finally {
    loading.value = false;
  }
};

const handleAdd = () => {
  isEditing.value = false;
  currentRule.value = {
    // For local mode, we use a temporary ID for editing purposes
    id: isLocalMode.value ? `temp_${Date.now()}` : undefined,
    name: '',
    type: null,
    value: '',
    enabled: 1,
    sort_order: rules.value.length,
    profile_id: props.profileId
  };
  showModal.value = true;
};

const handleEdit = (rule: any, index: number) => {
  isEditing.value = true;
  editingIndex.value = index;
  currentRule.value = { ...rule };
  showModal.value = true;
};

const handleDelete = async (ruleOrId: any, index: number) => {
  if (isLocalMode.value) {
    rules.value.splice(index, 1);
    emit('update:modelValue', JSON.parse(JSON.stringify(rules.value)));
    message.success('规则已删除');
  } else {
    try {
      await profileRulesApi.deleteRule(props.profileId!, ruleOrId.id);
      message.success('规则删除成功');
      fetchRules();
    } catch (error) {
      message.error('删除规则失败');
    }
  }
};

const handleSave = async () => {
  formRef.value?.validate(async (errors) => {
    if (errors) {
      message.error('请填写所有必填项');
      return;
    }
    if (!currentRule.value) return;

    if (isLocalMode.value) {
      if (isEditing.value) {
        rules.value[editingIndex.value] = currentRule.value;
      } else {
        rules.value.push(currentRule.value);
      }
      emit('update:modelValue', JSON.parse(JSON.stringify(rules.value)));
      showModal.value = false;
      message.success('规则已保存');
    } else {
      try {
        if (isEditing.value) {
          await profileRulesApi.updateRule(props.profileId!, currentRule.value.id, currentRule.value);
          message.success('规则更新成功');
        } else {
          await profileRulesApi.createRule(props.profileId!, currentRule.value);
          message.success('规则添加成功');
        }
        showModal.value = false;
        fetchRules();
      } catch (error) {
        message.error('保存规则失败');
      }
    }
  });
};

const handleEnabledChange = async (rule: any, enabled: boolean) => {
  rule.enabled = enabled ? 1 : 0;
  if (isLocalMode.value) {
    emit('update:modelValue', JSON.parse(JSON.stringify(rules.value)));
    message.success('状态已更新');
  } else {
    try {
      await profileRulesApi.updateRule(props.profileId!, rule.id, { ...rule });
      message.success('状态更新成功');
    } catch (error) {
      message.error('更新状态失败');
      rule.enabled = !enabled ? 1 : 0; // Revert on failure
    }
  }
};

const columns = computed<DataTableColumns<any>>(() => [
  { title: '名称', key: 'name' },
  { title: '类型', key: 'type', render: (row) => ruleTypes.find(t => t.value === row.type)?.label || row.type },
  { title: '值', key: 'value', ellipsis: { tooltip: true } },
  { title: '排序', key: 'sort_order', width: 80, align: 'center' },
  {
    title: '启用',
    key: 'enabled',
    width: 80,
    align: 'center',
    render: (row) => h(NSwitch, {
      value: row.enabled === 1,
      onUpdateValue: (v: boolean) => handleEnabledChange(row, v),
    }),
  },
  {
    title: '操作',
    key: 'actions',
    width: 150,
    align: 'center',
    render: (row, index) => h(NSpace, { justify: 'center' }, {
      default: () => [
        h(Button, { size: 'sm', variant: 'secondary', onClick: () => handleEdit(row, index) }, { default: () => '编辑' }),
        h(Button, { size: 'sm', variant: 'danger', onClick: () => handleDelete(row, index) }, { default: () => '删除' }),
      ],
    }),
  },
]);

onMounted(() => {
  if (!isLocalMode.value) {
    fetchRules();
  }
});
</script>

<template>
  <div class="rounded-lg border border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-bg p-4">
    <div class="flex justify-between items-center mb-4">
      <h3 class="text-base font-medium text-slate-800 dark:text-gray-200">Profile Rules</h3>
      <Button @click="handleAdd" size="sm" icon>
        <n-icon :component="AddOutline" class="mr-1" /> Add Rule
      </Button>
    </div>
    <div class="rounded-lg border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-surface overflow-hidden">
        <n-data-table :columns="columns" :data="rules" :loading="loading" :pagination="false" :bordered="false" />
    </div>
  </div>

  <n-modal v-model:show="showModal" preset="card" :title="isEditing ? '编辑规则' : '添加规则'" style="width: 600px;">
    <n-form ref="formRef" :model="currentRule" :rules="formRules">
      <n-form-item label="规则名称" path="name">
        <n-input v-model:value="currentRule.name" />
      </n-form-item>
      <n-form-item label="规则类型" path="type">
        <n-select v-model:value="currentRule.type" :options="ruleTypes" />
      </n-form-item>
      <n-form-item label="规则值" path="value">
        <n-input v-model:value="currentRule.value" type="textarea" :autosize="{ minRows: 3 }" />
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
        <n-input-number v-model:value="currentRule.sort_order" />
      </n-form-item>
      <div class="flex justify-end gap-2">
        <Button variant="secondary" @click="showModal = false">取消</Button>
        <Button variant="primary" @click="handleSave">保存</Button>
      </div>
    </n-form>
  </n-modal>
</template>