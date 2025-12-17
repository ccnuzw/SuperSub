import { ref, computed, watch, h } from 'vue';
import { useMessage } from 'naive-ui';
import httpClient from '@/services/http/HttpClient';
import type { FormInst, FormRules, DataTableColumns } from 'naive-ui';

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

interface ProfileRule {
  id?: string | number;
  name: string;
  type: string;
  value: string;
  enabled: number;
  sort_order: number;
  profile_id?: string | null;
}

export function useProfileRules(profileId?: string | null) {
  const message = useMessage();
  const rules = ref<ProfileRule[]>([]);
  const loading = ref(false);
  const showModal = ref(false);
  const isEditing = ref(false);
  const formRef = ref<FormInst | null>(null);
  const currentRule = ref<Partial<ProfileRule> | null>(null);
  const editingIndex = ref(-1);

  const isLocalMode = computed(() => !profileId);

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
        { label: '匹配特定模式', value: '(��港|澳门)\\sIPLC' }
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

  const currentRuleHint = computed(() => {
    if (currentRule.value && currentRule.value.type) {
      return ruleHints[currentRule.value.type as keyof typeof ruleHints];
    }
    return null;
  });

  // Data fetching
  const fetchRules = async () => {
    if (isLocalMode.value || !profileId) return;
    loading.value = true;
    try {
      const response = await httpClient.get(`/profile-rules/${profileId}`);
      if (response.data.success) {
        rules.value = response.data.data;
      } else {
        message.error('获取规则失败');
      }
    } catch (error) {
      message.error('请求规则列表失败');
    } finally {
      loading.value = false;
    }
  };

  // CRUD operations
  const handleAdd = () => {
    isEditing.value = false;
    currentRule.value = {
      id: isLocalMode.value ? `temp_${Date.now()}` : undefined,
      name: '',
      type: 'filter_by_name_keyword',
      value: '',
      enabled: 1,
      sort_order: rules.value.length,
      profile_id: profileId
    };
    showModal.value = true;
  };

  const handleEdit = (rule: ProfileRule, index: number) => {
    isEditing.value = true;
    editingIndex.value = index;
    currentRule.value = { ...rule };
    showModal.value = true;
  };

  const handleDelete = async (ruleOrId: ProfileRule, index: number) => {
    if (isLocalMode.value) {
      rules.value.splice(index, 1);
      message.success('规则已删除');
      return rules.value;
    } else {
      try {
        await httpClient.delete(`/profile-rules/${ruleOrId.id}`);
        message.success('规则删除成功');
        await fetchRules();
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
          rules.value[editingIndex.value] = currentRule.value as ProfileRule;
        } else {
          rules.value.push(currentRule.value as ProfileRule);
        }
        showModal.value = false;
        message.success('规则已保存');
        return rules.value;
      } else {
        try {
          if (isEditing.value) {
            await httpClient.put(`/profile-rules/${currentRule.value.id}`, currentRule.value);
            message.success('规则更新成功');
          } else {
            await httpClient.post('/profile-rules', currentRule.value);
            message.success('规则添加成功');
          }
          showModal.value = false;
          await fetchRules();
        } catch (error) {
          message.error('保存规则失败');
        }
      }
    });
  };

  const handleEnabledChange = async (rule: ProfileRule, enabled: boolean) => {
    rule.enabled = enabled ? 1 : 0;
    if (isLocalMode.value) {
      return rules.value;
    } else {
      try {
        await httpClient.put(`/profile-rules/${rule.id}`, { ...rule, enabled: rule.enabled });
        message.success('状态更新成功');
      } catch (error) {
        message.error('更新状态失败');
        rule.enabled = !enabled ? 1 : 0; // Revert on failure
      }
    }
  };

  const closeModal = () => {
    showModal.value = false;
    currentRule.value = null;
    editingIndex.value = -1;
  };

  // DataTable columns
  const columns: DataTableColumns<ProfileRule> = [
    { title: '名称', key: 'name' },
    {
      title: '类型',
      key: 'type',
      render: (row: ProfileRule) => ruleTypes.find(t => t.value === row.type)?.label || row.type
    },
    { title: '值', key: 'value', ellipsis: { tooltip: true } },
    { title: '排序', key: 'sort_order', width: 80, align: 'right' },
    {
      title: '启用',
      key: 'enabled',
      width: 80,
      align: 'right',
      render: (row: ProfileRule) => h('NSwitch', {
        value: row.enabled === 1,
        onUpdateValue: (v: boolean) => handleEnabledChange(row, v),
      }),
    },
    {
      title: '操作',
      key: 'actions',
      width: 150,
      align: 'right',
      render: (row: ProfileRule, index: number) => h('NSpace', null, [
        h('NButton', { size: 'small', onClick: () => handleEdit(row, index) }, '编辑'),
        h('NButton', { size: 'small', type: 'error', onClick: () => handleDelete(row, index) }, '删除'),
      ]),
    }
  ];

  const initializeRules = () => {
    if (!isLocalMode.value) {
      fetchRules();
    }
  };

  return {
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
  };
}