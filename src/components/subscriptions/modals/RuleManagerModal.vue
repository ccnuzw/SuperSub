<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useMessage, useDialog, NModal, NButton, NSpin, NEmpty, NList, NListItem, NThing, NTag, NSpace, NSwitch } from 'naive-ui'
import { subscriptionsApi } from '@/api/subscriptions';
import { subscriptionGroupsApi } from '@/api/subscriptionGroups';
import type { SubscriptionRule } from '@/types'
import RuleFormModal from './RuleFormModal.vue'

const props = defineProps<{
  show: boolean
  type: 'subscription' | 'group'
  entityId: string
  entityName: string
}>()

const emit = defineEmits<{
  (e: 'update:show', value: boolean): void
}>()

const message = useMessage()
const dialog = useDialog()

const rules = ref<SubscriptionRule[]>([])
const rulesLoading = ref(false)
const showRuleFormModal = ref(false)
const editingRule = ref<SubscriptionRule | null>(null)

const ruleModalTitle = computed(() => {
  const contextName = props.type === 'subscription' ? '订阅' : '分组'
  return `${contextName}规则 - ${props.entityName}`
})

const ruleTypeOptions = [
  { label: '按名称关键词过滤 (保留)', value: 'filter_by_name_keyword' },
  { label: '按名称关键词排除', value: 'exclude_by_name_keyword' },
  { label: '按名称正则过滤', value: 'filter_by_name_regex' },
  { label: '按正则重命名', value: 'rename_by_regex' },
]

const fetchRules = async () => {
    if (!props.entityId) return
    rulesLoading.value = true
    try {
        const response = props.type === 'subscription' 
          ? await subscriptionsApi.fetchRules(props.entityId)
          : await subscriptionGroupsApi.fetchRules(props.entityId)
          
        if (response.data.success && response.data.data) {
          rules.value = response.data.data
        } else {
          message.error(response.data.message || '获取规则失败')
        }
    } catch (err) {
        message.error('请求失败，请稍后重试')
    } finally {
        rulesLoading.value = false
    }
}

// Fetch rules when modal opens
watch(() => props.show, (val) => {
    if (val) {
        fetchRules()
    }
})

const handleAddRule = () => {
  editingRule.value = null
  showRuleFormModal.value = true
}

const handleEditRule = (rule: SubscriptionRule) => {
  editingRule.value = rule
  showRuleFormModal.value = true
}

const handleDeleteRule = async (rule: SubscriptionRule) => {
    dialog.warning({
        title: '确认删除',
        content: `确定要删除规则 "${rule.name}" 吗？`,
        positiveText: '确定',
        negativeText: '取消',
        onPositiveClick: async () => {
            try {
                const response = props.type === 'subscription'
                    ? await subscriptionsApi.deleteRule(props.entityId, rule.id)
                    : await subscriptionGroupsApi.deleteRule(props.entityId, rule.id)
                
                if (response.data.success) {
                    message.success('规则删除成功')
                    fetchRules()
                } else {
                    message.error(response.data.message || '删除失败')
                }
            } catch (error: any) {
                 message.error(error.message || '删除失败')
            }
        }
    })
}

const handleRuleSaved = () => {
    fetchRules()
}

</script>

<template>
    <n-modal
      :show="show"
      @update:show="(val) => emit('update:show', val)"
      preset="card"
      :title="ruleModalTitle"
      style="width: 800px; max-width: 95%;"
    >
        <template #header-extra>
            <n-button type="primary" size="small" @click="handleAddRule">新增规则</n-button>
        </template>
        
        <n-spin :show="rulesLoading">
             <n-empty v-if="rules.length === 0" description="暂无规则" class="py-8" />
             <n-list v-else hoverable clickable>
                 <n-list-item v-for="rule in rules" :key="rule.id">
                     <template #prefix>
                         <n-switch :value="rule.enabled === 1" size="small" disabled />
                     </template>
                     <n-thing :title="rule.name">
                         <template #description>
                             <n-tag size="small" :type="rule.type.includes('exclude') ? 'error' : 'info'" class="mr-2">
                                 {{ ruleTypeOptions.find(o => o.value === rule.type)?.label || rule.type }}
                             </n-tag>
                             <span class="text-xs text-gray-500 truncate inline-block max-w-xs align-bottom">
                                 {{ rule.value }}
                             </span>
                         </template>
                     </n-thing>
                     <template #suffix>
                         <n-space>
                             <n-button size="small" @click="handleEditRule(rule)">编辑</n-button>
                             <n-button size="small" type="error" ghost @click="handleDeleteRule(rule)">删除</n-button>
                         </n-space>
                     </template>
                 </n-list-item>
             </n-list>
        </n-spin>
        <template #footer>
             <n-space justify="end">
                 <n-button @click="emit('update:show', false)">关闭</n-button>
             </n-space>
        </template>
    </n-modal>
    
    <RuleFormModal
        v-model:show="showRuleFormModal"
        :type="type"
        :entity-id="entityId"
        :rule-to-edit="editingRule"
        @saved="handleRuleSaved"
    />
</template>
