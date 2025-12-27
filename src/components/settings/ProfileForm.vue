<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from 'vue';
import { useMessage, NButton, NSpace, NForm, NFormItem, NInput, NIcon, NSelect, NDivider, NCard, NGrid, NGi, NCheckboxGroup, NCheckbox, NScrollbar, NTabs, NTabPane, NCollapse, NCollapseItem, NSwitch, NInputNumber, NRadioGroup, NRadioButton } from 'naive-ui';
import { CopyOutline as CopyIcon } from '@vicons/ionicons5';
import { useIsMobile } from '@/composables/useMediaQuery';
import type { FormInst } from 'naive-ui';
import type { Profile, Subscription } from '@/types';
import { subscriptionsApi } from '@/api/subscriptions';
import { nodesApi } from '@/api/nodes';
import { assetsApi } from '@/api/assets';
import { usersApi } from '@/api/users';
import { profilesApi } from '@/api/profiles';
import { useAuthStore } from '@/stores/auth';
import ProfileRulesManager from './ProfileRulesManager.vue';

const props = defineProps<{
  profileId?: string | null;
}>();

const emit = defineEmits(['save-success']);

const message = useMessage();
const authStore = useAuthStore();
const isMobile = useIsMobile();

const formRef = ref<FormInst | null>(null);
const saveLoading = ref(false);
const loadingData = ref(false);

const allGroupedSubscriptions = ref<{ group_name: string; subscriptions: { id: string; name: string }[] }[]>([]);
const allManualNodes = ref<Record<string, { id: string; name: string }[]>>({});
const allBackends = ref<any[]>([]);
const allConfigs = ref<any[]>([]);
const subToken = computed(() => authStore.user?.sub_token || '');

const subFilter = ref('');
const nodeFilter = ref('');

const defaultFormState = () => ({
  id: '',
  name: '',
  alias: '',
  subscription_ids: [] as string[],
  node_ids: [] as string[],
  airport_subscription_options: {
    strategy: 'all' as 'all' | 'polling' | 'random',
    polling_mode: 'hourly' as 'hourly' | 'request' | 'group_request',
    use_all: true,
    random: false,
    timeout: 10 as number | null,
    polling_threshold: 5 as number | null,
    polling_interval: 200 as number | null,
  },
  node_prefix_settings: {
    enable_subscription_prefix: false,
    manual_node_prefix: '',
    enable_group_name_prefix: false,
    manual_nodes_first: false,
  },
  subconverter_backend_id: null as number | null,
  subconverter_config_id: null as number | null,
  generation_mode: 'local' as 'local' | 'remote',
  rules: [] as any[],
});

const formState = reactive(defaultFormState());

const rules = {
  name: { required: true, message: '请输入名称', trigger: ['input', 'blur'] },
};

const generatedUrl = computed(() => {
  if (!subToken.value || !formState.alias) return '';
  return `${window.location.origin}/api/public/${subToken.value}/${formState.alias}`;
});

const copyGeneratedUrl = () => {
  if (generatedUrl.value) {
    navigator.clipboard.writeText(generatedUrl.value).then(() => message.success('链接已复制'));
  }
};

// --- Data Fetching ---
const fetchAllSources = async () => {
  if (!authStore.isAuthenticated) return;
  try {
    const [subsRes, nodesRes, backendRes, configRes] = await Promise.all([
      subscriptionsApi.fetchGroupedSubscriptions(),
      nodesApi.fetchGroupedNodes(),
      assetsApi.fetchAssets('backend'),
      assetsApi.fetchAssets('config'),
    ]);
    if (subsRes.data.success) allGroupedSubscriptions.value = subsRes.data.data || [];
    if (nodesRes.data.success) allManualNodes.value = (nodesRes.data.data as any) || {};
    if (backendRes.data.success) allBackends.value = backendRes.data.data || [];
    if (configRes.data.success) allConfigs.value = configRes.data.data || [];
  } catch (err) {
    message.error("获取订阅、节点或模板资源失败");
  }
};

const fetchProfileData = async (id: string) => {
  loadingData.value = true;
  try {
    const response = await profilesApi.fetchProfile(id);
    if (response.data.success && response.data.data) {
      const profile = response.data.data;
      formState.id = profile.id;
      formState.name = profile.name;
      formState.alias = profile.alias || '';
      
      formState.subscription_ids = profile.subscription_ids || [];
      formState.node_ids = profile.node_ids || [];
      // Rules will be loaded by the ProfileRulesManager component itself
      formState.rules = [];
      formState.node_prefix_settings = { ...defaultFormState().node_prefix_settings, ...profile.node_prefix_settings };
      const opts = profile.airport_subscription_options || {};
      if (opts.strategy) {
        formState.airport_subscription_options.strategy = opts.strategy;
      } else if (opts.use_all) {
        formState.airport_subscription_options.strategy = 'all';
      } else if (opts.random) {
        formState.airport_subscription_options.strategy = 'random';
      } else {
        formState.airport_subscription_options.strategy = 'all';
      }
      formState.airport_subscription_options.polling_mode = opts.polling_mode || 'hourly';
      formState.airport_subscription_options.timeout = opts.timeout || 10;
      formState.airport_subscription_options.polling_threshold = opts.polling_threshold || 5;
      formState.airport_subscription_options.polling_interval = opts.polling_interval || 200;
      formState.subconverter_backend_id = profile.subconverter_backend_id || null;
      formState.subconverter_config_id = profile.subconverter_config_id || null;
      formState.generation_mode = profile.generation_mode || 'local';
    } else {
      message.error('获取配置详情失败');
    }
  } catch (error) {
    message.error('请求配置详情失败');
  } finally {
    loadingData.value = false;
  }
};

// --- Checkbox Group Logic ---
const handleSubscriptionGroupSelectAll = (group: { id: string; name: string }[], checked: boolean) => {
  const groupSubIds = group.map(sub => sub.id);
  if (checked) {
    formState.subscription_ids = [...new Set([...formState.subscription_ids, ...groupSubIds])];
  } else {
    formState.subscription_ids = formState.subscription_ids.filter(id => !groupSubIds.includes(id));
  }
};

const isSubscriptionGroupSelected = (group: { id: string; name: string }[]) => {
  const groupSubIds = new Set(group.map(sub => sub.id));
  return group.length > 0 && [...groupSubIds].every(id => formState.subscription_ids.includes(id));
};

const isSubscriptionGroupIndeterminate = (group: { id: string; name: string }[]) => {
  const groupSubIds = new Set(group.map(sub => sub.id));
  const selectedCount = formState.subscription_ids.filter(id => groupSubIds.has(id)).length;
  return selectedCount > 0 && selectedCount < groupSubIds.size;
};

const handleNodeGroupSelectAll = (group: { id: string; name: string }[], checked: boolean) => {
  const groupNodeIds = group.map(node => node.id);
  if (checked) {
    formState.node_ids = [...new Set([...formState.node_ids, ...groupNodeIds])];
  } else {
    formState.node_ids = formState.node_ids.filter(id => !groupNodeIds.includes(id));
  }
};

const isNodeGroupSelected = (group: { id: string; name: string }[]) => {
  const groupNodeIds = new Set(group.map(node => node.id));
  return group.length > 0 && [...groupNodeIds].every(id => formState.node_ids.includes(id));
};

const isNodeGroupIndeterminate = (group: { id: string; name: string }[]) => {
  const groupNodeIds = new Set(group.map(node => node.id));
  const selectedCount = formState.node_ids.filter(id => groupNodeIds.has(id)).length;
  return selectedCount > 0 && selectedCount < groupNodeIds.size;
};

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
        ? await profilesApi.updateProfile(props.profileId, payload)
        : await profilesApi.createProfile(payload);

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
  loadingData.value = true;
  await fetchAllSources();

  if (props.profileId) {
    await fetchProfileData(props.profileId);
  } else {
    const defaultsResponse = await usersApi.fetchDefaults();
    if (defaultsResponse.data.success && defaultsResponse.data.data) {
      const userDefaults = defaultsResponse.data.data;
      formState.subconverter_backend_id = userDefaults.default_backend_id ? Number(userDefaults.default_backend_id) : null;
      formState.subconverter_config_id = userDefaults.default_config_id ? Number(userDefaults.default_config_id) : null;
    }
    // Reset rules for new form
    formState.rules = [];
  }
  loadingData.value = false;
});

const backendOptions = computed(() => allBackends.value.map(b => ({ label: b.name, value: b.id })));
const configOptions = computed(() => allConfigs.value.map(c => ({ label: c.name, value: c.id })));

const strategyHelpText = computed(() => {
  const strategy = formState.airport_subscription_options.strategy;
  const pollingMode = formState.airport_subscription_options.polling_mode;

  const descriptions = {
    strategy: {
      all: '效果: 将所有选中的订阅链接合并为一个。\n简介: 这是最简单直接的方式，最终的配置文件会包含所有订阅的所有节点。',
      polling: '效果: 每次只从您选择的订阅列表中拿出一个来使用。\n简介: 适用于在多个机场间轮流切换的场景，可作为负载均衡或故障转移的手段。',
      random: '效果: 在每个订阅分组内随机选择一个订阅，然后将它们组合起来。\n简介: 确保每个分组都有一个出口，同时引入随机性。例如，从“香港”分组随机选一个，从“日本”分组随机选一个，最后合并成一个配置。'
    },
    polling_mode: {
      hourly: '每小时自动使用列表中的下一个订阅。',
      request: '每次获取配置文件时，自动使用下一个订阅。',
      group_request: '效果: 在每个订阅分组内按顺序轮流使用订阅。\n简介: 类似“分组随机”，但它不是随机选择，而是在每个分组内部按顺序循环使用订阅。这为每个分组提供了可预测的、轮流的故障转移。'
    }
  };
  
  return {
    strategy: descriptions.strategy[strategy] || '',
    polling_mode: strategy === 'polling' ? (descriptions.polling_mode[pollingMode] || '') : ''
  };
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
                  <n-scrollbar style="max-height: 300px;">
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
                          style="width: 180px"
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
                  <n-scrollbar style="max-height: 300px;">
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