/**
 * 订阅/分组规则管理模态框组件
 */

<template>
  <n-modal
    :show="show"
    @update:show="$emit('update:show', $event)"
    preset="card"
    :title="modalTitle"
    style="width: 900px;"
    :mask-closable="false"
  >
    <n-space justify="end" class="mb-4">
      <n-button type="primary" @click="handleClickOnAddRule">
        <template #icon>
          <n-icon><AddOutline /></n-icon>
        </template>
        添加规则
      </n-button>
    </n-space>

    <n-data-table
      :columns="columns"
      :data="rules"
      :loading="loading"
      :bordered="false"
      :pagination="paginationConfig"
    />

    <!-- 规则表单模态框 -->
    <RuleFormModal
      v-model:show="showFormModal"
      :rule="editingRule"
      :rule-types="ruleTypes"
      :common-keywords="commonKeywords"
      @save="handleSaveOnRule"
    />
  </n-modal>
</template>

<script setup lang="ts">
import { ref, computed, h } from 'vue'
import { NModal, NDataTable, NSpace, NButton, NIcon, NSwitch, NTag, type DataTableColumns } from 'naive-ui'
import { AddOutline } from '@vicons/ionicons5'
import type { ISubscriptionRule, IRuleContext } from '@/types'
import type { IListComponentProps } from '@/utils/componentApiStandards'
import httpClient from '@/services/http/HttpClient'
import { useMessage, useDialog } from 'naive-ui'
import RuleFormModal from './RuleFormModal.vue'

interface IProps {
  show: boolean
  context: IRuleContext | null
  loading?: boolean
  rules: ISubscriptionRule[]
}

const props = withDefaults(defineProps<IProps>(), {
  loading: false,
  rules: () => []
})

interface IEmits {
  'update:show': [value: boolean]
  'save': [rule: ISubscriptionRule | Omit<ISubscriptionRule, 'id'>]
  'delete': [rule: ISubscriptionRule]
  'update': [rule: ISubscriptionRule]
  'refresh': []
}

const emit = defineEmits<IEmits>()

const message = useMessage()
const dialog = useDialog()

// 表单模态框状态
const showFormModal = ref(false)
const editingRule = ref<ISubscriptionRule | null>(null)

// 规则类型选项
const ruleTypes = [
  { label: '按名称关键词过滤 (保留)', value: 'filter_by_name_keyword' },
  { label: '按名称关键词排除', value: 'exclude_by_name_keyword' },
  { label: '按名称正则过滤', value: 'filter_by_name_regex' },
  { label: '按正则重命名', value: 'rename_by_regex' }
]

// 常用关键词标签
const commonKeywords = [
  '香港', 'HK', '🇭🇰',
  '台湾', 'TW', '🇹🇼',
  '日本', 'JP', '🇯🇵',
  '美国', 'US', '🇺🇸',
  '新加坡', 'SG', '🇸🇬',
  '韩国', 'KR', '🇰🇷',
  '英国', 'UK', '🇬🇧',
  'IEPL', 'IPLC', '专线', 'BGP'
]

// 计算属性
const modalTitle = computed(() => {
  if (!props.context || !props.context.entity) return '规则管理'
  const contextName = props.context.type === 'subscription' ? '订阅' : '分组'
  const entityName = props.context.entity.name
  return `${contextName}规则 - ${entityName}`
})

const paginationConfig = computed(() => ({
  pageSize: 10
}))

// 表格列定义
const columns: DataTableColumns<ISubscriptionRule> = [
  {
    title: '名称',
    key: 'name',
    width: 150
  },
  {
    title: '类型',
    key: 'type',
    width: 200,
    render: (row) => {
      const option = ruleTypes.find(o => o.value === row.type)
      return h(NTag, { type: 'info' }, { default: () => option?.label || row.type })
    }
  },
  {
    title: '规则值',
    key: 'value',
    ellipsis: { tooltip: true },
    render: (row) => {
      try {
        const parsed = JSON.parse(row.value)
        if (parsed.keywords) {
          return h('span', null, parsed.keywords.join(', '))
        } else if (parsed.regex && parsed.format) {
          return h('span', null, `${parsed.regex} → ${parsed.format}`)
        } else if (parsed.regex) {
          return h('span', null, parsed.regex)
        }
        return row.value
      } catch {
        return row.value
      }
    }
  },
  {
    title: '启用',
    key: 'enabled',
    width: 80,
    align: 'center',
    render: (row) => {
      return h(NSwitch, {
        value: row.enabled === 1,
        onUpdateValue: async (value) => {
          row.enabled = value ? 1 : 0
          await handleClickOnToggleRule(row, value)
        }
      })
    }
  },
  {
    title: '操作',
    key: 'actions',
    width: 150,
    render: (row) => {
      return h('div', { class: 'flex gap-2' }, [
        h(NButton, {
          size: 'small',
          onClick: () => handleClickOnEditRule(row)
        }, { default: () => '编辑' }),
        h(NButton, {
          size: 'small',
          type: 'error',
          ghost: true,
          onClick: () => handleClickOnDeleteRule(row)
        }, { default: () => '删除' })
      ])
    }
  }
]

/**
 * 处理添加规则按钮点击
 */
const handleClickOnAddRule = () => {
  editingRule.value = null
  showFormModal.value = true
}

/**
 * 处理编辑规则
 */
const handleClickOnEditRule = (rule: ISubscriptionRule) => {
  editingRule.value = rule
  showFormModal.value = true
}

/**
 * 处理切换规则启用状态
 */
const handleClickOnToggleRule = async (rule: ISubscriptionRule, enabled: boolean) => {
  if (!props.context) return

  const { type, entity } = props.context
  const baseUrl = type === 'subscription' ? '/subscriptions' : '/subscription-groups'

  try {
    await httpClient.put(`${baseUrl}/${entity.id}/rules/${rule.id}`, {
      enabled: enabled ? 1 : 0
    })
    message.success('状态更新成功')
    emit('update', { ...rule, enabled: enabled ? 1 : 0 })
  } catch (error: any) {
    message.error(error?.response?.data?.message || '状态更新失败')
    // Note: We can't revert the UI state here since the switch already changed
    // The user would need to refresh to see the actual state
  }
}

/**
 * 处理删除规则
 */
const handleClickOnDeleteRule = (rule: ISubscriptionRule) => {
  dialog.warning({
    title: '确认删除规则',
    content: `确定要删除规则 "${rule.name}" 吗？`,
    positiveText: '确定',
    negativeText: '取消',
    onPositiveClick: async () => {
      if (!props.context) return

      const { type, entity } = props.context
      const baseUrl = type === 'subscription' ? '/subscriptions' : '/subscription-groups'

      try {
        await httpClient.delete(`${baseUrl}/${entity.id}/rules/${rule.id}`)
        message.success('规则删除成功')
        emit('delete', rule)
      } catch (error: any) {
        message.error(error?.response?.data?.message || '删除失败')
      }
    }
  })
}

/**
 * 处理保存规则
 */
const handleSaveOnRule = (rule: ISubscriptionRule | Omit<ISubscriptionRule, 'id'>) => {
  emit('save', rule)
}
</script>

<style scoped>
.mb-4 {
  margin-bottom: 1rem;
}
</style>
