/**
 * 规则表单模态框组件
 */

<template>
  <n-modal
    :show="show"
    @update:show="$emit('update:show', $event)"
    :mask-closable="false"
    preset="dialog"
    :title="formTitle"
    positive-text="保存"
    negative-text="取消"
    :positive-button-props="{ loading: saving }"
    @positive-click="handleSubmitOnForm"
  >
    <n-form ref="formRef" :model="formData" :rules="formRules">
      <n-form-item label="规则名称" path="name">
        <n-input v-model:value="formData.name" placeholder="为规则起个名字" />
      </n-form-item>

      <n-form-item label="规则类型" path="type">
        <n-select v-model:value="formData.type" :options="ruleTypes" />
      </n-form-item>

      <!-- 关键词类型 -->
      <n-form-item
        v-if="formData.type === 'filter_by_name_keyword' || formData.type === 'exclude_by_name_keyword'"
        label="关键词"
        path="keywords"
      >
        <n-dynamic-tags v-model:value="formData.keywords" />
        <template #feedback>
          <span v-if="formData.type === 'filter_by_name_keyword'">
            保留节点名包含任意一个关键词的节点。输入后按回车确认。
          </span>
          <span v-else>排除节点名包含任意一个关键词的节点。输入后按回车确认。</span>
        </template>

        <div class="mt-2">
          <p class="text-xs text-gray-500 mb-1">常用标签 (点击添加):</p>
          <n-space :size="'small'" style="flex-wrap: wrap;">
            <n-tag
              v-for="keyword in commonKeywords"
              :key="keyword"
              size="small"
              :bordered="false"
              type="info"
              style="cursor: pointer;"
              @click="handleClickOnAddKeyword(keyword)"
            >
              {{ keyword }}
            </n-tag>
          </n-space>
        </div>
      </n-form-item>

      <!-- 正则重命名类型 -->
      <n-form-item
        v-else-if="formData.type === 'rename_by_regex'"
        label="重命名规则"
        path="renameRules"
      >
        <n-space vertical style="width: 100%;">
          <n-input
            v-model:value="formData.renameRegex"
            placeholder="匹配规则 (Regex)"
          />
          <div class="text-xs text-gray-400 mt-1">
            <p>示例 1: 从 "[HK] Node 01" 提取 "HK" 和 "01", 可用 `^\[(.*)\]\s.*(\d+)$`</p>
            <p>示例 2: 提取 "HK-专线-01" 中的 "HK" 和 "专线", 可用 `(HK)-(专线)`</p>
          </div>
          <n-input
            v-model:value="formData.renameFormat"
            placeholder="重命名格式"
            class="mt-2"
          />
          <div class="text-xs text-gray-400 mt-1">
            <p>用法: `$1`, `$2` 代表上方匹配规则中的第1、2个括号捕获的内容。</p>
            <p>示例 1: `NewName-$1-$2` 会得到 "NewName-HK-01"。</p>
            <p>示例 2: `[$2] $1` 会得到 "[专线] HK"。</p>
          </div>
        </n-space>
      </n-form-item>

      <!-- 正则过滤类型 -->
      <n-form-item
        v-else-if="formData.type === 'filter_by_name_regex'"
        label="正则表达式"
        path="regex"
      >
        <n-input
          v-model:value="formData.regex"
          placeholder="输入用于过滤的正则表达式"
        />
        <template #feedback>
          <p>保留节点名匹配正则表达式的节点。</p>
          <p><b>用法示例:</b></p>
          <ul class="list-disc list-inside">
            <li>匹配多个关键词 (香港或澳门): `香港|澳门`</li>
            <li>匹配IEPL且不含广州: `IEPL.*(?!广州)`</li>
            <li>不区分大小写匹配 "iepl": `(?i)iepl`</li>
            <li>匹配包含 "VIP" 但不包含 "过期" 的节点: `^(?=.*VIP)(?!.*过期)`</li>
          </ul>
        </template>
      </n-form-item>

      <!-- 默认JSON输入 -->
      <n-form-item v-else label="规则值 (JSON)" path="value">
        <n-input
          v-model:value="formData.value"
          type="textarea"
          placeholder='这是一个兼容旧版或未知规则类型的输入框'
          :autosize="{ minRows: 3, maxRows: 5 }"
        />
      </n-form-item>

      <n-form-item label="启用" path="enabled">
        <n-switch v-model:value="formData.enabled" :checked-value="1" :unchecked-value="0" />
      </n-form-item>
    </n-form>
  </n-modal>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import {
  NModal,
  NForm,
  NFormItem,
  NInput,
  NSelect,
  NSwitch,
  NSpace,
  NTag,
  NDynamicTags,
  type FormRules,
  type FormInst
} from 'naive-ui'
import type { ISubscriptionRule } from '@/types'
import type { IListComponentProps } from '@/utils/componentApiStandards'

interface IProps {
  show: boolean
  rule: ISubscriptionRule | null
  ruleTypes: Array<{ label: string; value: string }>
  commonKeywords: string[]
}

const props = withDefaults(defineProps<IProps>(), {
  rule: null,
  ruleTypes: () => [],
  commonKeywords: () => []
})

interface IEmits {
  'update:show': [value: boolean]
  'save': [rule: ISubscriptionRule | Omit<ISubscriptionRule, 'id'>]
}

const emit = defineEmits<IEmits>()

// 表单引用
const formRef = ref<FormInst | null>(null)
const saving = ref(false)

// 表单标题
const formTitle = computed(() => props.rule ? '编辑规则' : '新增规则')

// 表单数据
interface IFormData {
  name: string
  type: string
  value: string
  enabled: number
  keywords: string[]
  renameRegex: string
  renameFormat: string
  regex: string
}

const formData = ref<IFormData>({
  name: '',
  type: 'filter_by_name_keyword',
  value: '',
  enabled: 1,
  keywords: [],
  renameRegex: '',
  renameFormat: '',
  regex: ''
})

// 表单验证规则
const formRules: FormRules = {
  name: { required: true, message: '请输入规则名称', trigger: 'blur' },
  type: { required: true, type: 'string', message: '请选择规则类型', trigger: 'change' },
  keywords: {
    required: true,
    type: 'array',
    validator: (rule, value) => {
      if ((formData.value.type === 'filter_by_name_keyword' || formData.value.type === 'exclude_by_name_keyword') && (!value || value.length === 0)) {
        return new Error('请至少输入一个关键词')
      }
      return true
    },
    trigger: 'change'
  },
  renameRules: {
    required: true,
    validator: (rule, value) => {
      if (formData.value.type === 'rename_by_regex' && (!formData.value.renameRegex || !formData.value.renameFormat)) {
        return new Error('请输入匹配规则和重命名格式')
      }
      return true
    },
    trigger: 'change'
  },
  regex: {
    required: true,
    validator: (rule, value) => {
      if (formData.value.type === 'filter_by_name_regex' && !formData.value.regex) {
        return new Error('请输入正则表达式')
      }
      return true
    },
    trigger: 'blur'
  },
  value: {
    required: true,
    validator: (rule, value) => {
      if (!['filter_by_name_keyword', 'exclude_by_name_keyword', 'filter_by_name_regex', 'rename_by_regex'].includes(formData.value.type)) {
        if (!value) {
          return new Error('请输入规则值')
        }
        try {
          JSON.parse(value)
        } catch {
          return new Error('规则值必须是有效的JSON格式')
        }
      }
      return true
    },
    trigger: 'blur'
  }
}

// 监听rule prop变化
watch(() => props.rule, (newRule) => {
  if (newRule) {
    formData.value.name = newRule.name
    formData.value.type = newRule.type
    formData.value.value = newRule.value
    formData.value.enabled = newRule.enabled

    // 解析value字段
    try {
      const parsedValue = JSON.parse(newRule.value)
      if ((newRule.type === 'filter_by_name_keyword' || newRule.type === 'exclude_by_name_keyword') && parsedValue.keywords) {
        formData.value.keywords = parsedValue.keywords
      } else if (newRule.type === 'rename_by_regex' && parsedValue.regex && parsedValue.format) {
        formData.value.renameRegex = parsedValue.regex
        formData.value.renameFormat = parsedValue.format
      } else if (newRule.type === 'filter_by_name_regex' && parsedValue.regex) {
        formData.value.regex = parsedValue.regex
      }
    } catch (e) {
      console.error('Failed to parse rule value JSON:', e)
    }
  } else {
    // 重置表单
    formData.value = {
      name: '',
      type: 'filter_by_name_keyword',
      value: '',
      enabled: 1,
      keywords: [],
      renameRegex: '',
      renameFormat: '',
      regex: ''
    }
  }
}, { immediate: true })

/**
 * 处理添加关键词
 */
const handleClickOnAddKeyword = (keyword: string) => {
  if (!formData.value.keywords.includes(keyword)) {
    formData.value.keywords.push(keyword)
  }
}

/**
 * 处理表单提交
 */
const handleSubmitOnForm = async () => {
  if (!formRef.value) return

  try {
    await formRef.value.validate()
  } catch {
    return
  }

  // 构建规则值
  let jsonValue: any = {}
  switch (formData.value.type) {
    case 'filter_by_name_keyword':
    case 'exclude_by_name_keyword':
      jsonValue = { keywords: formData.value.keywords }
      break
    case 'rename_by_regex':
      jsonValue = {
        regex: formData.value.renameRegex,
        format: formData.value.renameFormat
      }
      break
    case 'filter_by_name_regex':
      jsonValue = { regex: formData.value.regex }
      break
    default:
      try {
        jsonValue = JSON.parse(formData.value.value)
      } catch {
        // 使用原始值
        jsonValue = { raw: formData.value.value }
      }
  }

  const rulePayload: ISubscriptionRule | Omit<ISubscriptionRule, 'id'> = {
    name: formData.value.name,
    type: formData.value.type as ISubscriptionRule['type'],
    value: JSON.stringify(jsonValue),
    enabled: formData.value.enabled,
    subscription_id: '',
    created_at: '',
    updated_at: ''
  }

  // If editing, include the id
  if (props.rule?.id) {
    (rulePayload as ISubscriptionRule).id = props.rule.id
  }

  emit('save', rulePayload)
}
</script>

<style scoped>
.mt-1 {
  margin-top: 0.25rem;
}

.mt-2 {
  margin-top: 0.5rem;
}

.text-xs {
  font-size: 0.75rem;
}

.text-gray-400 {
  color: #9ca3af;
}

.text-gray-500 {
  color: #6b7280;
}

.list-disc {
  list-style-type: disc;
}

.list-inside {
  list-style-position: inside;
}
</style>
