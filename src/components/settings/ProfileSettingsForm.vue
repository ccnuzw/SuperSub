<script setup lang="ts">
import { watch, computed, onMounted } from 'vue';
import { useMessage, NButton, NSpace, NForm, NFormItem, NInput, NIcon, NSelect, NDivider, NCard, NGrid, NGi, NCheckboxGroup, NCheckbox, NScrollbar, NTabs, NTabPane, NCollapse, NCollapseItem, NSwitch, NInputNumber, NRadioGroup, NRadioButton } from 'naive-ui';
import { CopyOutline as CopyIcon } from '@vicons/ionicons5';
import { useIsMobile } from '@/composables/useMediaQuery';
import { useProfileForm } from '@/composables/useProfileForm';
import httpClient from '@/services/http/HttpClient';
import type { FormInst } from 'naive-ui';
import ProfileRulesManager from './ProfileRulesManager.vue';

const props = defineProps<{
  profileId?: string | null;
}>();

const emit = defineEmits(['save-success']);

// Rename component to avoid naming conflict
// This component should now be called ProfileSettingsForm to avoid conflict with the refactored ProfileForm

const message = useMessage();
const isMobile = useIsMobile();

const {
  formRef,
  saveLoading,
  loadingData,
  formState,
  rules,
  allGroupedSubscriptions,
  allManualNodes,
  allBackends,
  allConfigs,
  subFilter,
  nodeFilter,
  generatedUrl,
  backendOptions,
  configOptions,
  strategyHelpText,
  handleSubscriptionGroupSelectAll,
  isSubscriptionGroupSelected,
  isSubscriptionGroupIndeterminate,
  handleNodeGroupSelectAll,
  isNodeGroupSelected,
  isNodeGroupIndeterminate,
  copyGeneratedUrl,
  initializeForm,
} = useProfileForm(props.profileId);

// --- Watchers ---
watch(() => formState.node_prefix_settings.enable_group_name_prefix, (newValue: boolean) => {
  if (newValue) formState.node_prefix_settings.manual_node_prefix = '';
});
watch(() => formState.airport_subscription_options.strategy, (strategy) => {
  formState.airport_subscription_options.use_all = strategy === 'all';
  formState.airport_subscription_options.random = strategy === 'random';
});

// --- Save Logic ---
const handleSave = async () => {
  formRef.value?.validate(async (errors) => {
    if (errors) {
      message.error('请填写所有必填项');
      return;
    }
    saveLoading.value = true;
    try {
      const allExistingNodeIds = new Set(Object.values(allManualNodes.value).flat().map(node => node.id));
      const validNodeIds = formState.node_ids.filter(id => allExistingNodeIds.has(id));

      const contentPayload = {
        subscription_ids: formState.subscription_ids,
        node_ids: validNodeIds,
        node_prefix_settings: formState.node_prefix_settings,
        airport_subscription_options: {
          strategy: formState.airport_subscription_options.strategy,
          polling_mode: formState.airport_subscription_options.polling_mode,
          timeout: formState.airport_subscription_options.timeout,
          polling_threshold: formState.airport_subscription_options.polling_threshold,
          polling_interval: formState.airport_subscription_options.polling_interval,
        },
        subconverter_backend_id: formState.subconverter_backend_id,
        subconverter_config_id: formState.subconverter_config_id,
        generation_mode: formState.generation_mode,
      };
      const contentPayloadStr = JSON.stringify(contentPayload);

      let payload: any = {
        name: formState.name,
        alias: formState.alias || null,
        content: contentPayloadStr,
      };

      // For new profiles, include the rules in the main payload.
      if (!props.profileId) {
        payload.rules = formState.rules.map(({ id, ...rest }) => rest); // Remove temporary frontend ID
      }

      const response = props.profileId
        ? await httpClient.put<any>(`/profiles/${props.profileId}`, payload)
        : await httpClient.post<any>('/profiles', payload);

      if (response.data.success) {
        message.success(props.profileId ? '配置更新成功' : '配置新增成功');
        emit('save-success');
      } else {
        message.error(response.data.message || '保存失败');
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message || '请求失败';
      message.error(errorMsg);
    } finally {
      saveLoading.value = false;
    }
  });
};

onMounted(async () => {
  await initializeForm();
});
</script>

<template>
  <n-spin :show="loadingData">
    <n-form ref="formRef" :model="formState" :rules="rules" label-placement="top">
      <n-grid cols="1" md:cols="5" :x-gap="24">
        <!-- Left Column -->
        <n-gi span="1" md:span="2">
          <n-space vertical size="large">
            <n-card title="核心定义">
              <n-form-item label="配置名称" path="name">
                <n-input v-model:value="formState.name" />
              </n-form-item>
              <n-form-item label="链接别名">
                <n-input v-model:value="formState.alias" placeholder="例如 my-clash-config" />
              </n-form-item>
              <n-form-item v-if="generatedUrl" label="生成链接">
                <n-input :value="generatedUrl" readonly>
                  <template #suffix>
                    <n-button text @click="copyGeneratedUrl">
                      <n-icon :component="CopyIcon" />
                    </n-button>
                  </template>
                </n-input>
              </n-form-item>
            </n-card>

            <n-card title="输出目标">
              <n-form-item label="生成模式" path="generation_mode">
                <n-radio-group v-model:value="formState.generation_mode" name="generation_mode_group">
                  <n-radio-button value="local" label="本地解析" />
                  <n-radio-button value="remote" label="远程解析" />
                </n-radio-group>
                <template #feedback>
                  本地解析：功能强大，支持节点处理，但受限于本机网络。<br/>
                  远程解析：利用转换后端网络，但无法进行节点处理。
                </template>
              </n-form-item>
              <n-form-item label="转换后端">
                <n-select v-model:value="formState.subconverter_backend_id" :options="backendOptions" placeholder="留空则使用全局默认后端" clearable />
              </n-form-item>
              <n-form-item label="转换配置">
                <n-select v-model:value="formState.subconverter_config_id" :options="configOptions" placeholder="留空则使用全局默认配置" clearable />
              </n-form-item>
            </n-card>
          </n-space>
        </n-gi>

        <!-- Right Column -->
        <n-gi span="1" md:span="3">
          <n-card title="数据源与内容处理">
            <n-tabs type="line" animated>
              <n-tab-pane name="subscriptions" tab="机场订阅">
                <n-card size="small" :bordered="true">
                  <template #header-extra>
                    <n-input v-model:value="subFilter" size="small" placeholder="筛选订阅名称" clearable />
                  </template>
                  <n-scrollbar class="max-h-[300px]">
                    <n-collapse>
                      <n-collapse-item v-for="group in allGroupedSubscriptions" :key="group.group_name" :title="`${group.group_name} (${group.subscriptions.length})`">
                        <template #header-extra>
                          <n-checkbox
                            :checked="isSubscriptionGroupSelected(group.subscriptions)"
                            :indeterminate="isSubscriptionGroupIndeterminate(group.subscriptions)"
                            @update:checked="handleSubscriptionGroupSelectAll(group.subscriptions, $event)"
                            @click.stop
                          >
                            全选
                          </n-checkbox>
                        </template>
                        <n-checkbox-group v-model:value="formState.subscription_ids">
                          <n-space vertical>
                            <n-checkbox v-for="sub in group.subscriptions.filter(s => s.name.toLowerCase().includes(subFilter.toLowerCase()))" :key="sub.id" :value="sub.id" :label="sub.name" />
                          </n-space>
                        </n-checkbox-group>
                      </n-collapse-item>
                    </n-collapse>
                  </n-scrollbar>
                  <template #footer>
                    <n-space :vertical="isMobile" align="center" justify="space-between">
                      <n-form-item label="订阅选择策略" label-placement="left" class="mb-0">
                        <n-select
                          v-model:value="formState.airport_subscription_options.strategy"
                          :options="[
                            { label: '全部使用 (推荐)', value: 'all' },
                            { label: '轮询', value: 'polling' },
                            { label: '分组随机', value: 'random' },
                          ]"
                          class="w-[180px]"
                        />
                        <template #feedback>
                          <div style="white-space: pre-wrap;">{{ strategyHelpText.strategy }}</div>
                        </template>
                      </n-form-item>

                      <n-form-item v-if="formState.airport_subscription_options.strategy === 'polling'" label="轮询模式" label-placement="left" class="mb-0">
                         <n-select
                          v-model:value="formState.airport_subscription_options.polling_mode"
                          :options="[
                            { label: '按小时轮换', value: 'hourly' },
                            { label: '按次访问轮换', value: 'request' },
                            { label: '分组轮询组合', value: 'group_request' },
                          ]"
                          style="width: 150px"
                        />
                        <template #feedback>
                          <div style="white-space: pre-wrap;">{{ strategyHelpText.polling_mode }}</div>
                        </template>
                      </n-form-item>
                      
                      <n-form-item v-if="formState.airport_subscription_options.strategy === 'polling' && formState.airport_subscription_options.polling_mode === 'group_request'" label="分组轮询阈值" label-placement="left" class="mb-0">
                        <n-input-number
                          v-model:value="formState.airport_subscription_options.polling_threshold"
                          :min="1"
                          placeholder="默认5"
                          clearable
                          style="width: 120px"
                        />
                      </n-form-item>

                      <n-form-item v-if="formState.airport_subscription_options.strategy === 'polling' && formState.airport_subscription_options.polling_mode === 'group_request'" label="探测间隔(ms)" label-placement="left" class="mb-0">
                        <n-input-number
                          v-model:value="formState.airport_subscription_options.polling_interval"
                          :min="0"
                          :step="100"
                          placeholder="默认200"
                          clearable
                          style="width: 120px"
                        />
                      </n-form-item>

                      <n-form-item label="请求超时(秒)" label-placement="left" class="mb-0">
                        <n-input-number
                          v-model:value="formState.airport_subscription_options.timeout"
                          :min="1"
                          :max="60"
                          placeholder="默认10"
                          clearable
                          style="width: 120px"
                        />
                      </n-form-item>
                    </n-space>
                  </template>
                </n-card>
              </n-tab-pane>
              <n-tab-pane name="manual-nodes" tab="手工节点">
                <n-card size="small" :bordered="true">
                  <template #header-extra>
                    <n-input v-model:value="nodeFilter" size="small" placeholder="筛选节点名称" clearable />
                  </template>
                  <n-scrollbar class="max-h-[300px]">
                    <n-collapse>
                      <n-collapse-item v-for="(nodes, groupName) in allManualNodes" :key="groupName" :title="`${groupName} (${nodes.length})`">
                        <template #header-extra>
                          <n-checkbox
                            :checked="isNodeGroupSelected(nodes)"
                            :indeterminate="isNodeGroupIndeterminate(nodes)"
                            @update:checked="handleNodeGroupSelectAll(nodes, $event)"
                            @click.stop
                          >
                            全选
                          </n-checkbox>
                        </template>
                        <n-checkbox-group v-model:value="formState.node_ids">
                          <n-space vertical>
                            <n-checkbox v-for="node in nodes.filter(n => n.name.toLowerCase().includes(nodeFilter.toLowerCase()))" :key="node.id" :value="node.id" :label="node.name" />
                          </n-space>
                        </n-checkbox-group>
                      </n-collapse-item>
                    </n-collapse>
                  </n-scrollbar>
                </n-card>
              </n-tab-pane>
              <n-tab-pane name="processing" tab="节点处理">
                <n-form-item label="机场订阅节点前缀">
                  <n-switch v-model:value="formState.node_prefix_settings.enable_subscription_prefix" />
                  <template #feedback>开启后，来自订阅的节点名称将自动变为 "订阅名称 - 节点名称"</template>
                </n-form-item>
                <n-form-item label="使用分组名作为手工节点前缀">
                  <n-switch v-model:value="formState.node_prefix_settings.enable_group_name_prefix" />
                  <template #feedback>开启后，手工节点将使用其所属的分组名作为前缀。此选项优先于下方的自定义前缀。</template>
                </n-form-item>
                <n-form-item label="手工节点排序优先">
                  <n-switch v-model:value="formState.node_prefix_settings.manual_nodes_first" />
                  <template #feedback>开启后，在组合节点时，手工节点将排在机场订阅节点之前。</template>
                </n-form-item>
                <n-form-item label="手工节点自定义前缀">
                  <n-input
                    v-model:value="formState.node_prefix_settings.manual_node_prefix"
                    placeholder="例如 MyNodes"
                    clearable
                    :disabled="formState.node_prefix_settings.enable_group_name_prefix"
                  />
                  <template #feedback>设置后，所有手工添加的节点名称将变为 "前缀 - 节点名称"。当“使用分组名作为前缀”开启时，此项无效。</template>
                </n-form-item>
                <n-divider />
                <profile-rules-manager :profile-id="props.profileId" v-model:modelValue="formState.rules" />
              </n-tab-pane>
            </n-tabs>
          </n-card>
        </n-gi>
      </n-grid>
    </n-form>
    <n-space justify="end" class="mt-6">
      <n-button @click="$router.back()">取消</n-button>
      <n-button type="primary" :loading="saveLoading" @click="handleSave">保存配置</n-button>
    </n-space>
  </n-spin>
</template>