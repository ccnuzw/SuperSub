<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { useMessage, NModal, NForm, NFormItem, NInput, NSelect, NSwitch, NSpace, NButton, NDynamicTags, NTag } from 'naive-ui'
import { subscriptionsApi } from '@/api/subscriptions';
import { subscriptionGroupsApi } from '@/api/subscriptionGroups';
import type { SubscriptionRule } from '@/types'

const props = defineProps<{
  show: boolean
  type: 'subscription' | 'group'
  entityId: string
  ruleToEdit: SubscriptionRule | null
}>()

const emit = defineEmits<{
  (e: 'update:show', value: boolean): void
  (e: 'saved'): void
}>()

const message = useMessage()
const ruleSaveLoading = ref(false)
const ruleFormRef = ref<any>(null)

const ruleTypeOptions = [
  { label: '按名称关键词过滤 (保留)', value: 'filter_by_name_keyword' },
  { label: '按名称关键词排除', value: 'exclude_by_name_keyword' },
  { label: '按名称正则过滤', value: 'filter_by_name_regex' },
  { label: '按正则重命名', value: 'rename_by_regex' },
]

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

const ruleFormState = reactive({
  name: '',
  type: 'filter_by_name_keyword' as SubscriptionRule['type'] | 'exclude_by_name_keyword',
  value: '',
  enabled: 1,
  keywords: [] as string[],
  renameRegex: '',
  renameFormat: '',
  regex: '',
})

const ruleFormTitle = computed(() => (props.ruleToEdit ? '编辑规则' : '新增规则'))

const addKeyword = (keyword: string) => {
  if (!ruleFormState.keywords.includes(keyword)) {
    ruleFormState.keywords.push(keyword)
  }
}

// Reset or Populate form when show/ruleToEdit changes
watch(() => props.show, (val) => {
    if (val) {
        if (props.ruleToEdit) {
            // Edit mode
            const rule = props.ruleToEdit
            ruleFormState.name = rule.name
            ruleFormState.type = rule.type
            ruleFormState.enabled = rule.enabled
            
            try {
                const parsedValue = JSON.parse(rule.value)
                if (rule.type === 'filter_by_name_keyword' || rule.type === 'exclude_by_name_keyword') {
                    ruleFormState.keywords = parsedValue.keywords || []
                } else if (rule.type === 'rename_by_regex') {
                    ruleFormState.renameRegex = parsedValue.regex || ''
                    ruleFormState.renameFormat = parsedValue.format || ''
                } else {
                    ruleFormState.regex = parsedValue.regex || ''
                }
            } catch (e) {
                console.error('Failed to parse rule value', e)
            }
        } else {
            // Add mode - Reset
            ruleFormState.name = ''
            ruleFormState.type = 'filter_by_name_keyword'
            ruleFormState.value = ''
            ruleFormState.enabled = 1
            ruleFormState.keywords = []
            ruleFormState.renameRegex = ''
            ruleFormState.renameFormat = ''
            ruleFormState.regex = ''
        }
    }
})

const handleSaveRule = async () => {
  ruleSaveLoading.value = true
  
  try {
      // Construct value JSON based on type
      let valueObj: any = {}
      if (ruleFormState.type === 'filter_by_name_keyword' || ruleFormState.type === 'exclude_by_name_keyword') {
          if (ruleFormState.keywords.length === 0) {
              message.warning('请至少添加一个关键词')
              ruleSaveLoading.value = false
              return
          }
          valueObj = { keywords: ruleFormState.keywords }
      } else if (ruleFormState.type === 'rename_by_regex') {
          if (!ruleFormState.renameRegex || !ruleFormState.renameFormat) {
              message.warning('请填写正则表达式和替换格式')
               ruleSaveLoading.value = false
              return
          }
          valueObj = { regex: ruleFormState.renameRegex, format: ruleFormState.renameFormat }
      } else {
           if (!ruleFormState.regex) {
              message.warning('请填写正则表达式')
               ruleSaveLoading.value = false
              return
          }
          valueObj = { regex: ruleFormState.regex }
      }
      
      const payload = {
          name: ruleFormState.name,
          type: ruleFormState.type,
          value: JSON.stringify(valueObj),
          enabled: ruleFormState.enabled
      }
      
       const response = props.ruleToEdit
        ? (props.type === 'subscription' 
            ? await subscriptionsApi.updateRule(props.entityId, props.ruleToEdit.id, payload)
            : await subscriptionGroupsApi.updateRule(props.entityId, props.ruleToEdit.id, payload))
        : (props.type === 'subscription'
            ? await subscriptionsApi.addRule(props.entityId, payload)
            : await subscriptionGroupsApi.addRule(props.entityId, payload))
            
      if (response.data.success) {
          message.success(props.ruleToEdit ? '规则更新成功' : '规则新增成功')
          emit('update:show', false)
          emit('saved')
      } else {
          message.error(response.data.message || '保存失败')
      }

  } catch (err: any) {
       message.error(err.message || '请求失败，请稍后重试')
  } finally {
      ruleSaveLoading.value = false
  }
}
</script>

<template>
    <n-modal
        :show="show"
        @update:show="(val) => emit('update:show', val)"
        preset="card"
        :title="ruleFormTitle"
        style="width: 600px;"
        :mask-closable="false"
    >
        <n-form ref="ruleFormRef" :model="ruleFormState" label-placement="left" label-width="100">
            <n-form-item label="规则名称" path="name" required>
                <n-input v-model:value="ruleFormState.name" placeholder="例如：过滤香港节点" />
            </n-form-item>
            <n-form-item label="规则类型" path="type" required>
                <n-select v-model:value="ruleFormState.type" :options="ruleTypeOptions" />
            </n-form-item>
             
            <!-- Dynamic Fields for Keyword Filter -->
            <template v-if="ruleFormState.type === 'filter_by_name_keyword' || ruleFormState.type === 'exclude_by_name_keyword'">
                <n-form-item label="关键词" required>
                     <n-dynamic-tags v-model:value="ruleFormState.keywords" />
                </n-form-item>
                <n-form-item label="常用关键词">
                    <n-space>
                        <n-tag 
                            v-for="kw in commonKeywords" 
                            :key="kw" 
                            clickable 
                            @click="addKeyword(kw)"
                            :type="ruleFormState.keywords.includes(kw) ? 'primary' : 'default'"
                        >
                            {{ kw }}
                        </n-tag>
                    </n-space>
                </n-form-item>
            </template>

            <!-- Dynamic Fields for Regex Rename -->
            <template v-if="ruleFormState.type === 'rename_by_regex'">
                 <n-form-item label="正则表达式" required>
                    <n-input v-model:value="ruleFormState.renameRegex" placeholder="例如：(.*)\s-\s(.*)" />
                 </n-form-item>
                 <n-form-item label="替换格式" required>
                    <n-input v-model:value="ruleFormState.renameFormat" placeholder="例如：$1 | $2 (使用 $1, $2 引用正则组)" />
                 </n-form-item>
            </template>
             
             <!-- Dynamic Fields for Regex Filter -->
             <template v-if="ruleFormState.type === 'filter_by_name_regex'">
                 <n-form-item label="正则表达式" required>
                    <n-input v-model:value="ruleFormState.regex" placeholder="例如：^HK-.*" />
                 </n-form-item>
             </template>
             
             <n-form-item label="是否启用">
                 <n-switch v-model:value="ruleFormState.enabled" :checked-value="1" :unchecked-value="0" />
             </n-form-item>
        </n-form>
        <template #footer>
            <n-space justify="end">
                <n-button @click="emit('update:show', false)">取消</n-button>
                <n-button type="primary" @click="handleSaveRule" :loading="ruleSaveLoading">保存</n-button>
            </n-space>
        </template>
    </n-modal>
</template>
