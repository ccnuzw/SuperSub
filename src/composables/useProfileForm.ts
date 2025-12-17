import { ref, reactive, computed, watch } from 'vue';
import { useMessage } from 'naive-ui';
import httpClient from '@/services/http/HttpClient';
import { useAuthStore } from '@/stores/auth';
import type { FormInst } from 'naive-ui';
import type { Profile, Subscription } from '@/types';

interface AirportSubscriptionOptions {
  strategy: 'all' | 'polling' | 'random';
  polling_mode: 'hourly' | 'request' | 'group_request';
  use_all: boolean;
  random: boolean;
  timeout: number | null;
  polling_threshold: number | null;
  polling_interval: number | null;
}

interface NodePrefixSettings {
  enable_subscription_prefix: boolean;
  manual_node_prefix: string;
  enable_group_name_prefix: boolean;
  manual_nodes_first: boolean;
}

interface FormState {
  id: string;
  name: string;
  alias: string;
  subscription_ids: string[];
  node_ids: string[];
  airport_subscription_options: AirportSubscriptionOptions;
  node_prefix_settings: NodePrefixSettings;
  subconverter_backend_id: number | null;
  subconverter_config_id: number | null;
  generation_mode: 'local' | 'remote';
  rules: any[];
}

export function useProfileForm(profileId?: string | null) {
  const message = useMessage();
  const authStore = useAuthStore();
  const formRef = ref<FormInst | null>(null);
  const saveLoading = ref(false);
  const loadingData = ref(false);

  const allGroupedSubscriptions = ref<{ group_name: string; subscriptions: { id: string; name: string }[] }[]>([]);
  const allManualNodes = ref<Record<string, { id: string; name: string }[]>>({});
  const allBackends = ref<any[]>([]);
  const allConfigs = ref<any[]>([]);

  const subFilter = ref('');
  const nodeFilter = ref('');

  const defaultFormState = (): FormState => ({
    id: '',
    name: '',
    alias: '',
    subscription_ids: [],
    node_ids: [],
    airport_subscription_options: {
      strategy: 'all',
      polling_mode: 'hourly',
      use_all: true,
      random: false,
      timeout: 10,
      polling_threshold: 5,
      polling_interval: 200,
    },
    node_prefix_settings: {
      enable_subscription_prefix: false,
      manual_node_prefix: '',
      enable_group_name_prefix: false,
      manual_nodes_first: false,
    },
    subconverter_backend_id: null,
    subconverter_config_id: null,
    generation_mode: 'local',
    rules: [],
  });

  const formState = reactive(defaultFormState());

  const rules = {
    name: { required: true, message: '请输入名称', trigger: ['input', 'blur'] },
  };

  const subToken = computed(() => authStore.user?.sub_token || '');

  const generatedUrl = computed(() => {
    if (!subToken.value || !formState.alias) return '';
    return `${window.location.origin}/api/public/${subToken.value}/${formState.alias}`;
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
        random: '效果: 在每个订阅分组内随机选择一个订阅，然后将它们组合起来。\n简介: 确保每个分组都有一个出口，同时引入随机性。例如，从"香港"分组随机选一个，从"日本"分组随机选一个，最后合并成一个配置。'
      },
      polling_mode: {
        hourly: '每小时自动使用列表中的下一个订阅。',
        request: '每次获取配置文件时，自动使用下一个订阅。',
        group_request: '效果: 在每个订阅分组内按顺序轮流使用订阅。\n简介: 类似"分组随机"，但它不是随机选择，而是在每个分组内部按顺序循环使用订阅。这为每个分组提供了可预测的、轮流的故障转移。'
      }
    };

    return {
      strategy: descriptions.strategy[strategy] || '',
      polling_mode: strategy === 'polling' ? (descriptions.polling_mode[pollingMode] || '') : ''
    };
  });

  // Data fetching methods
  const fetchAllSources = async () => {
    if (!authStore.isAuthenticated) return;
    try {
      const [subsRes, nodesRes, backendRes, configRes] = await Promise.all([
        httpClient.get<any>('/subscriptions/grouped'),
        httpClient.get<any>('/nodes/grouped'),
        httpClient.get<any>('/assets?type=backend'),
        httpClient.get<any>('/assets?type=config'),
      ]);
      if (subsRes.data.success) allGroupedSubscriptions.value = subsRes.data.data || [];
      if (nodesRes.data.success) allManualNodes.value = nodesRes.data.data || {};
      if (backendRes.data.success) allBackends.value = backendRes.data.data || [];
      if (configRes.data.success) allConfigs.value = configRes.data.data || [];
    } catch (err) {
      message.error("获取订阅、节点或模板资源失败");
    }
  };

  const fetchProfileData = async (id: string) => {
    loadingData.value = true;
    try {
      const response = await httpClient.get<any>(`/profiles/${id}`);
      if (response.data.success) {
        const profile = response.data.data;
        formState.id = profile.id;
        formState.name = profile.name;
        formState.alias = profile.alias || '';

        formState.subscription_ids = profile.subscription_ids || [];
        formState.node_ids = profile.node_ids || [];
        formState.rules = [];
        formState.node_prefix_settings = { ...defaultFormState().node_prefix_settings, ...profile.node_prefix_settings };

        const opts = profile.airport_subscription_options || {};
        if (opts.strategy) {
          formState.airport_subscription_options.strategy = opts.strategy;
        } else if (opts.use_all) {
          formState.airport_subscription_options.strategy = 'all';
        } else if (opts.random) {
          formState.airport_subscription_options.strategy = 'random';
        } else if (opts.polling) {
          formState.airport_subscription_options.strategy = 'polling';
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

  const fetchUserDefaults = async () => {
    try {
      const defaultsResponse = await httpClient.get('/user/defaults');
      if (defaultsResponse.data.success && defaultsResponse.data.data) {
        const userDefaults = defaultsResponse.data.data;
        formState.subconverter_backend_id = userDefaults.default_backend_id || null;
        formState.subconverter_config_id = userDefaults.default_config_id || null;
      }
    } catch (error) {
      console.warn('Failed to fetch user defaults:', error);
    }
  };

  // Checkbox group logic
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

  // Utility methods
  const copyGeneratedUrl = () => {
    if (generatedUrl.value) {
      navigator.clipboard.writeText(generatedUrl.value).then(() => message.success('链接已复制'));
    }
  };

  const initializeForm = async () => {
    loadingData.value = true;
    await fetchAllSources();

    if (profileId) {
      await fetchProfileData(profileId);
    } else {
      await fetchUserDefaults();
      formState.rules = [];
    }
    loadingData.value = false;
  };

  return {
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
  };
}