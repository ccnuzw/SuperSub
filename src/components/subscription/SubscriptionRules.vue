<template>
  <n-modal
    :show="showRulesModal"
    @update:show="$emit('update:showRulesModal', $event)"
    preset="card"
    :title="ruleModalTitle"
    style="width: 900px;"
    :mask-closable="false"
  >
    <n-space justify="end" class="mb-4">
      <n-button type="primary" @click="$emit('openRuleFormModal', null)">添加规则</n-button>
    </n-space>
    <n-data-table
      :columns="ruleColumns"
      :data="rules"
      :loading="rulesLoading"
      :bordered="false"
    />
  </n-modal>

  <!-- 规则表单模态框 -->
  <n-modal
    :show="showRuleFormModal"
    @update:show="$emit('update:showRuleFormModal', $event)"
    :mask-closable="false"
    preset="dialog"
    :title="ruleFormTitle"
    positive-text="保存"
    negative-text="取消"
    :positive-button-props="{ loading: ruleSaveLoading }"
    @positive-click="handleSaveRule"
  >
    <n-form ref="ruleFormRef">
      <n-form-item label="规则名称" required>
        <n-input v-model:value="ruleFormState.name" placeholder="为规则起个名字" />
      </n-form-item>
      <n-form-item label="规则类型" required>
        <n-select v-model:value="ruleFormState.type" :options="ruleTypeOptions" />
      </n-form-item>

      <!-- 关键词类型规则 -->
      <n-form-item v-if="ruleFormState.type === 'filter_by_name_keyword' || ruleFormState.type === 'exclude_by_name_keyword'" label="关键词" required>
        <n-dynamic-tags v-model:value="ruleFormState.keywords" />
        <template #feedback>
          <span v-if="ruleFormState.type === 'filter_by_name_keyword'">保留节点名包含任意一个关键词的节点。输入后按回车确认。</span>
          <span v-else>排除节点名包含任意一个关键词的��点。输入后按回车确认。</span>
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
              @click="addKeyword(keyword)"
            >
              {{ keyword }}
            </n-tag>
          </n-space>
        </div>
      </n-form-item>

      <!-- 正则重命名规则 -->
      <n-form-item v-else-if="ruleFormState.type === 'rename_by_regex'" label="重命名规则" required>
        <n-space vertical style="width: 100%;">
          <n-input v-model:value="ruleFormState.renameRegex" placeholder="匹配规则 (Regex)" />
          <div class="text-xs text-gray-400 mt-1">
            <p>示例 1: 从 "[HK] Node 01" 提取 "HK" 和 "01", 可用 `^\[(.*)\]\s.*(\\d+)$`</p>
            <p>示例 2: 提取 "HK-专线-01" 中的 "HK" 和 "专线", 可用 `(HK)-(专线)`</p>
          </div>
          <n-input v-model:value="ruleFormState.renameFormat" placeholder="重命名格式" class="mt-2" />
          <div class="text-xs text-gray-400 mt-1">
            <p>用法: `$1`, `$2` 代表上方匹配规则中的第1、2个括号捕获的内容。</p>
            <p>示例 1: `NewName-$1-$2` 会得到 "NewName-HK-01"。</p>
            <p>示例 2: `[$2] $1` 会得到 "[专线] HK"。</p>
          </div>
        </n-space>
      </n-form-item>

      <!-- 正则过滤规则 -->
      <n-form-item v-else-if="ruleFormState.type === 'filter_by_name_regex'" label="正则表达式" required>
        <n-input
          v-model:value="ruleFormState.regex"
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

      <!-- 通用JSON规则 -->
      <n-form-item v-else label="规则值 (JSON)" required>
        <n-input
          v-model:value="ruleFormState.value"
          type="textarea"
          placeholder='这是一个兼容旧版或未知规则类型的输入框'
          :autosize="{ minRows: 3, maxRows: 5 }"
        />
      </n-form-item>

      <n-form-item label="启用">
        <n-switch v-model:value="ruleFormState.enabled" :checked-value="1" :unchecked-value="0" />
      </n-form-item>
    </n-form>
  </n-modal>
</template>

<script setup lang="ts">
import { ref, computed, h } from 'vue'
import {
  NModal, NSpace, NButton, NDataTable, NForm, NFormItem, NInput,
  NSelect, NDynamicTags, NTag, NIcon, NSwitch, type DataTableColumns
} from 'naive-ui'
import type { FormInst, DropdownOption } from 'naive-ui'
import { Subscription, SubscriptionGroup, SubscriptionRule } from '@/types'

interface RuleFormState {
  id: number
  name: string
  type: SubscriptionRule['type'] | 'exclude_by_name_keyword' | 'filter_by_name_regex' | 'rename_by_regex'
  value: string
  enabled: number
  keywords: string[]
  renameRegex: string
  renameFormat: string
  regex: string
}

interface Props {
  showRulesModal: boolean
  showRuleFormModal: boolean
  ruleSaveLoading: boolean
  rulesLoading: boolean
  ruleModalTitle: string
  ruleFormTitle: string
  currentRuleContext: { type: 'subscription' | 'group', entity: Subscription | SubscriptionGroup } | null
  rules: SubscriptionRule[]
  ruleFormRef: FormInst | null
  ruleFormState: RuleFormState
  editingRule: SubscriptionRule | null
}

interface Emits {
  (e: 'update:showRulesModal', value: boolean): void
  (e: 'update:showRuleFormModal', value: boolean): void
  (e: 'update:ruleFormState', value: RuleFormState): void
  (e: 'openRuleFormModal', rule: SubscriptionRule | null): void
  (e: 'saveRule'): void
  (e: 'deleteRule', rule: SubscriptionRule): void
}

const props = withDefaults(defineProps<Props>(), {})

const emit = defineEmits<Emits>()

// 规则类型选项
const ruleTypeOptions = [
  { label: '按名称关键词过滤 (保留)', value: 'filter_by_name_keyword' },
  { label: '按名称关键词排除', value: 'exclude_by_name_keyword' },
  { label: '按名称正则过滤', value: 'filter_by_name_regex' },
  { label: '按正则重命名', value: 'rename_by_regex' },
]

// 常用关键词
const commonKeywords = [
  '香港', 'HK', '🇭🇰',
  '台湾', 'TW', '🇹🇼',
  '日本', 'JP', '🇯🇵',
  '美国', 'US', '🇺🇸',
  '新加坡', 'SG', '🇸🇬',
  '韩国', 'KR', '🇰🇷',
  '英国', 'UK', '🇬🇧',
  'IEPL', 'IPLC', '专线', 'BGP',
]

// 添加关键词
const addKeyword = (keyword: string) => {
  if (!props.ruleFormState.keywords.includes(keyword)) {
    emit('update:ruleFormState', {
      ...props.ruleFormState,
      keywords: [...props.ruleFormState.keywords, keyword]
    })
  }
}

// 处理操作
const handleShowRulesModal = (value: boolean) => emit('update:showRulesModal', value)
const handleShowRuleFormModal = (value: boolean) => emit('update:showRuleFormModal', value)
const handleOpenRuleFormModal = (rule: SubscriptionRule | null) => emit('openRuleFormModal', rule)
const handleSaveRule = () => emit('saveRule')

// 创建表格列
const ruleColumns = computed((): DataTableColumns<SubscriptionRule> => {
  return [
    { title: '名称', key: 'name', width: 150 },
    {
      title: '类型',
      key: 'type',
      width: 180,
      render(row) {
        const option = ruleTypeOptions.find(o => o.value === row.type)
        return option ? option.label : row.type
      }
    },
    { title: '规则值', key: 'value', ellipsis: { tooltip: true } },
    {
      title: '启用',
      key: 'enabled',
      width: 80,
      align: 'center',
      render(row) {
        return h(NSwitch, {
          value: row.enabled === 1,
          onUpdateValue: async (value) => {
            if (!props.currentRuleContext) return
            const { type, entity } = props.currentRuleContext
            const baseUrl = type === 'subscription' ? '/subscriptions' : '/subscription-groups'

            row.enabled = value ? 1 : 0
            try {
              // 这里应该调用API更新规则状态
              // await api.put(`${baseUrl}/${entity.id}/rules/${row.id}`, { enabled: value })
              // message.success('状态更新成功')
            } catch (e) {
              // message.error('状态更新失败')
              row.enabled = !value ? 1 : 0
            }
          }
        })
      }
    },
    {
      title: '操作',
      key: 'actions',
      width: 150,
      render(row) {
        return h(NSpace, null, {
          default: () => [
            h(NButton, { size: 'small', onClick: () => handleOpenRuleFormModal(row) }, { default: () => '编辑' }),
            h(NButton, { size: 'small', type: 'error', ghost: true, onClick: () => emit('deleteRule', row) }, { default: () => '删除' }),
          ]
        })
      }
    }
  ]
})
</script>