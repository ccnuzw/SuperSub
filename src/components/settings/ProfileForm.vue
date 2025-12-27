<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from 'vue';
import { useMessage, NSpace, NForm, NFormItem, NInput, NIcon, NSelect, NDivider, NCheckboxGroup, NCheckbox, NScrollbar, NTabs, NTabPane, NCollapse, NCollapseItem, NSwitch, NInputNumber, NRadioGroup, NRadioButton } from 'naive-ui';
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
import Button from '@/components/ui/Button.vue';
import Card from '@/components/ui/Card.vue';

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
  name: { required: true, message: 'Please enter a name', trigger: ['input', 'blur'] },
};

const generatedUrl = computed(() => {
  if (!subToken.value || !formState.alias) return '';
  return `${window.location.origin}/api/public/${subToken.value}/${formState.alias}`;
});

const copyGeneratedUrl = () => {
  if (generatedUrl.value) {
    navigator.clipboard.writeText(generatedUrl.value).then(() => message.success('Copied to clipboard'));
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
    message.error("Failed to fetch resources");
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
      message.error('Failed to get profile details');
    }
  } catch (error) {
    message.error('Request failed');
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
      message.error('Please fill in required fields');
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
        message.success(props.profileId ? 'Updated successfully' : 'Created successfully');
        emit('save-success');
      } else {
        message.error(response.data.message || 'Save failed');
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message || 'Request failed';
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
      all: 'Merge all selected subscriptions into one. The final config will contain all nodes from all subscriptions.',
      polling: 'Use one subscription from the list at a time. Good for load balancing or failover between airports.',
      random: 'Pick one random subscription from each group and combine them. Ensures one exit per group with randomness.'
    },
    polling_mode: {
      hourly: 'Cycles to the next subscription every hour.',
      request: 'Cycles to the next subscription on every request.',
      group_request: 'Cycles through subscriptions within each group sequentially. Provides predictable, round-robin failover per group.'
    }
  };
  
  return {
    strategy: descriptions.strategy[strategy] || '',
    polling_mode: strategy === 'polling' ? (descriptions.polling_mode[pollingMode] || '') : ''
  };
});
</script>

<template>
  <div v-if="loadingData" class="flex justify-center p-12">
      <!-- You could use NSpin here, or a custom spinner -->
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
  </div>
  <n-form v-else ref="formRef" :model="formState" :rules="rules" label-placement="top">
      <div class="grid grid-cols-1 md:grid-cols-5 gap-6">
        <!-- Left Column -->
        <div class="md:col-span-2 space-y-6">
            <Card title="Core Settings">
              <n-form-item label="Profile Name" path="name">
                <n-input v-model:value="formState.name" />
              </n-form-item>
              <n-form-item label="Alias">
                <n-input v-model:value="formState.alias" placeholder="e.g. my-clash-config" />
              </n-form-item>
              <n-form-item v-if="generatedUrl" label="Generated URL">
                <n-input :value="generatedUrl" readonly>
                  <template #suffix>
                    <n-button text @click="copyGeneratedUrl">
                      <n-icon :component="CopyIcon" />
                    </n-button>
                  </template>
                </n-input>
              </n-form-item>
            </Card>

            <Card title="Output Target">
              <n-form-item label="Generation Mode" path="generation_mode">
                <n-radio-group v-model:value="formState.generation_mode" name="generation_mode_group">
                  <n-radio-button value="local" label="Local Parser" />
                  <n-radio-button value="remote" label="Remote Parser" />
                </n-radio-group>
                <template #feedback>
                  Local: Powerful, supports node processing, but limited by local network.<br/>
                  Remote: Uses backend network, but cannot process nodes.
                </template>
              </n-form-item>
              <n-form-item label="Converter Backend">
                <n-select v-model:value="formState.subconverter_backend_id" :options="backendOptions" placeholder="Default Backend" clearable />
              </n-form-item>
              <n-form-item label="Converter Config">
                <n-select v-model:value="formState.subconverter_config_id" :options="configOptions" placeholder="Default Config" clearable />
              </n-form-item>
            </Card>
        </div>

        <!-- Right Column -->
        <div class="md:col-span-3">
          <Card title="Data Sources & Processing" class="h-full">
            <n-tabs type="line" animated>
              <n-tab-pane name="subscriptions" tab="Subscriptions">
                <div class="border border-gray-100 dark:border-dark-border rounded-lg p-3 mb-4">
                    <div class="flex justify-between mb-2">
                         <span class="text-sm font-medium text-gray-500">Filter</span>
                        <n-input v-model:value="subFilter" size="small" placeholder="Filter Name" clearable style="width: 200px" />
                    </div>
                  
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
                            Select All
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
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <n-form-item label="Strategy" class="mb-0">
                        <n-select
                          v-model:value="formState.airport_subscription_options.strategy"
                          :options="[
                            { label: 'Use All (Recommended)', value: 'all' },
                            { label: 'Polling', value: 'polling' },
                            { label: 'Random Group', value: 'random' },
                          ]"
                        />
                        <template #feedback>
                          <div style="white-space: pre-wrap;" class="text-xs text-slate-500 mt-1">{{ strategyHelpText.strategy }}</div>
                        </template>
                      </n-form-item>

                      <n-form-item v-if="formState.airport_subscription_options.strategy === 'polling'" label="Polling Mode" class="mb-0">
                         <n-select
                          v-model:value="formState.airport_subscription_options.polling_mode"
                          :options="[
                            { label: 'Hourly', value: 'hourly' },
                            { label: 'Per Request', value: 'request' },
                            { label: 'Group Round-Robin', value: 'group_request' },
                          ]"
                        />
                        <template #feedback>
                          <div style="white-space: pre-wrap;" class="text-xs text-slate-500 mt-1">{{ strategyHelpText.polling_mode }}</div>
                        </template>
                      </n-form-item>
                      
                      <n-form-item v-if="formState.airport_subscription_options.strategy === 'polling' && formState.airport_subscription_options.polling_mode === 'group_request'" label="Polling Threshold" class="mb-0">
                        <n-input-number
                          v-model:value="formState.airport_subscription_options.polling_threshold"
                          :min="1"
                          placeholder="Default 5"
                          clearable
                        />
                      </n-form-item>

                      <n-form-item v-if="formState.airport_subscription_options.strategy === 'polling' && formState.airport_subscription_options.polling_mode === 'group_request'" label="Interval (ms)" class="mb-0">
                        <n-input-number
                          v-model:value="formState.airport_subscription_options.polling_interval"
                          :min="0"
                          :step="100"
                          placeholder="Default 200"
                          clearable
                        />
                      </n-form-item>

                      <n-form-item label="Timeout (s)" class="mb-0">
                        <n-input-number
                          v-model:value="formState.airport_subscription_options.timeout"
                          :min="1"
                          :max="60"
                          placeholder="Default 10"
                          clearable
                        />
                      </n-form-item>
                </div>
              </n-tab-pane>

              <n-tab-pane name="manual-nodes" tab="Manual Nodes">
                <div class="border border-gray-100 dark:border-dark-border rounded-lg p-3">
                     <div class="flex justify-between mb-2">
                         <span class="text-sm font-medium text-gray-500">Filter</span>
                        <n-input v-model:value="nodeFilter" size="small" placeholder="Filter Name" clearable style="width: 200px" />
                    </div>
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
                            Select All
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
                </div>
              </n-tab-pane>

              <n-tab-pane name="processing" tab="Node Processing">
                <div class="space-y-4">
                    <n-form-item label="Add Subscription Name Prefix">
                      <n-switch v-model:value="formState.node_prefix_settings.enable_subscription_prefix" />
                      <template #feedback>If enabled, node names will be prefixed with "Sub Name - ".</template>
                    </n-form-item>
                    <n-form-item label="Use Group Name as Prefix">
                      <n-switch v-model:value="formState.node_prefix_settings.enable_group_name_prefix" />
                      <template #feedback>If enabled, manual nodes use their group name as prefix.</template>
                    </n-form-item>
                    <n-form-item label="Manual Nodes First">
                      <n-switch v-model:value="formState.node_prefix_settings.manual_nodes_first" />
                      <template #feedback>If enabled, manual nodes appear before subscription nodes.</template>
                    </n-form-item>
                    <n-form-item label="Manual Node Custom Prefix">
                      <n-input
                        v-model:value="formState.node_prefix_settings.manual_node_prefix"
                        placeholder="e.g. MyNodes"
                        clearable
                        :disabled="formState.node_prefix_settings.enable_group_name_prefix"
                      />
                      <template #feedback>Prefix for manual nodes. Ignored if "Use Group Name as Prefix" is enabled.</template>
                    </n-form-item>
                    <n-divider />
                    <profile-rules-manager :profile-id="props.profileId" v-model:modelValue="formState.rules" />
                </div>
              </n-tab-pane>
            </n-tabs>
          </Card>
        </div>
      </div>
    </n-form>
    
    <div class="flex justify-end gap-3 mt-6">
      <Button variant="secondary" @click="$router.back()">Cancel</Button>
      <Button variant="primary" :loading="saveLoading" @click="handleSave">Save Profile</Button>
    </div>
</template>