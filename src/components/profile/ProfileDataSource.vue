/**
 * 配置文件数据源选择组件
 * 负责管理订阅源和节点的选择逻辑
 */

<template>
  <div class="profile-data-source">
    <!-- 标签页 -->
    <NTabs v-model:value="activeTab" type="segment">
      <NTabPane name="subscriptions" tab="订阅源">
        <div class="space-y-4">
          <!-- 策略选择 -->
          <div class="strategy-section">
            <h3 class="text-lg font-semibold mb-3">选择策略</h3>
            <NRadioGroup v-model:value="strategy" name="strategy">
              <NSpace vertical>
                <NRadio value="all" label="使用全部" />
                <NRadio value="polling" label="轮询模式" />
                <NRadio value="random" label="随机选择" />
              </NSpace>
            </NRadioGroup>
          </div>

          <!-- 轮询设置 -->
          <div v-if="strategy === 'polling'" class="polling-settings">
            <h3 class="text-lg font-semibold mb-3">轮询设置</h3>
            <div class="space-y-3">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  轮询模式
                </label>
                <NRadioGroup v-model:value="pollingMode" name="pollingMode">
                  <NSpace>
                    <NRadio value="hourly" label="每小时" />
                    <NRadio value="request" label="每次请求" />
                    <NRadio value="group_request" label="分组请求" />
                  </NSpace>
                </NRadioGroup>
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">
                    轮询阈值
                  </label>
                  <SsInput
                    v-model="pollingThreshold"
                    type="number"
                    min="1"
                    size="sm"
                    help-text="连续失败次数后跳过"
                  />
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">
                    轮询间隔(秒)
                  </label>
                  <SsInput
                    v-model="pollingInterval"
                    type="number"
                    min="10"
                    size="sm"
                    help-text="轮询间隔时间"
                  />
                </div>
              </div>
            </div>
          </div>

          <!-- 订阅源列表 -->
          <div class="subscriptions-section">
            <div class="flex justify-between items-center mb-3">
              <h3 class="text-lg font-semibold">选择订阅源</h3>
              <SsButton
                variant="outline"
                size="sm"
                @click="selectAllSubscriptions"
              >
                全选
              </SsButton>
            </div>

            <!-- 搜索框 -->
            <SsInput
              v-model="subscriptionFilter"
              placeholder="搜索订阅源..."
              prefix-icon="Search"
              class="mb-4"
            />

            <!-- 订阅源列表 -->
            <div class="space-y-2 max-h-64 overflow-y-auto">
              <div
                v-for="group in groupedSubscriptions"
                :key="group.group_name"
                class="subscription-group"
              >
                <div class="font-medium text-gray-700 mb-2">
                  {{ group.group_name || '未分组' }}
                </div>
                <div class="space-y-1 pl-4">
                  <label
                    v-for="subscription in group.subscriptions"
                    :key="subscription.id"
                    class="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      :value="subscription.id"
                      v-model="selectedSubscriptionIds"
                      class="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span class="text-sm">{{ subscription.name }}</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      </NTabPane>

      <NTabPane name="nodes" tab="手动节点">
        <div class="space-y-4">
          <div class="flex justify-between items-center mb-3">
            <h3 class="text-lg font-semibold">选择手动节点</h3>
            <SsButton
              variant="outline"
              size="sm"
              @click="selectAllNodes"
            >
              全选
            </SsButton>
          </div>

          <!-- 节点搜索 -->
          <SsInput
            v-model="nodeFilter"
            placeholder="搜索节点..."
            prefix-icon="Search"
          />

          <!-- 节点列表 -->
          <div class="space-y-2 max-h-96 overflow-y-auto">
            <div
              v-for="(nodes, groupName) in groupedNodes"
              :key="groupName"
              class="node-group"
            >
              <div class="font-medium text-gray-700 mb-2 sticky top-0 bg-white">
                {{ groupName || '未分组' }}
              </div>
              <div class="space-y-1 pl-4">
                <label
                  v-for="node in nodes"
                  :key="node.id"
                  class="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
                >
                  <input
                    type="checkbox"
                    :value="node.id"
                    v-model="selectedNodeIds"
                    class="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span class="text-sm">{{ node.name }}</span>
                  <SsStatus
                    :status="getNodeStatus(node.id)"
                    :show-text="false"
                    size="sm"
                  />
                </label>
              </div>
            </div>
          </div>
        </div>
      </NTabPane>
    </NTabs>

    <!-- 选中项统计 -->
    <div class="mt-4 p-3 bg-gray-50 rounded-lg">
      <div class="flex justify-between text-sm">
        <span>已选择:</span>
        <div class="space-x-4">
          <span class="text-primary-600">
            {{ selectedSubscriptionIds.length }} 个订阅源
          </span>
          <span class="text-success-600">
            {{ selectedNodeIds.length }} 个节点
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useMessage } from 'naive-ui';
import { NTabs, NTabPane, NRadioGroup, NRadio, NSpace } from 'naive-ui';
import { SsButton, SsInput, SsStatus } from '@/components/base';
import { useAuthStore } from '@/stores/auth';
import { useNodeStatusStore } from '@/stores/nodeStatus';
import type { Subscription, Node } from '@/types';

interface Props {
  // 选中的订阅ID
  subscriptionIds: string[];
  // 选中的节点ID
  nodeIds: string[];
  // 策略配置
  strategy?: 'all' | 'polling' | 'random';
  pollingMode?: 'hourly' | 'request' | 'group_request';
  pollingThreshold?: number | null;
  pollingInterval?: number | null;
}

const props = withDefaults(defineProps<Props>(), {
  strategy: 'all',
  pollingMode: 'hourly',
  pollingThreshold: null,
  pollingInterval: null
});

const emit = defineEmits<{
  'update:subscriptionIds': [ids: string[]];
  'update:nodeIds': [ids: string[]];
  'update:strategy': [strategy: string];
  'update:pollingMode': [mode: string];
  'update:pollingThreshold': [threshold: number | null];
  'update:pollingInterval': [interval: number | null];
}>();

const message = useMessage();
const authStore = useAuthStore();
const nodeStatusStore = useNodeStatusStore();

// 响应式数据
const activeTab = ref('subscriptions');
const strategy = ref(props.strategy);
const pollingMode = ref(props.pollingMode);
const pollingThreshold = ref(props.pollingThreshold);
const pollingInterval = ref(props.pollingInterval);

const selectedSubscriptionIds = ref<string[]>([...props.subscriptionIds]);
const selectedNodeIds = ref<string[]>([...props.nodeIds]);

const subscriptionFilter = ref('');
const nodeFilter = ref('');

const groupedSubscriptions = ref<any[]>([]);
const groupedNodes = ref<Record<string, Node[]>>({});

// 计算属性
const filteredSubscriptions = computed(() => {
  if (!subscriptionFilter.value) return groupedSubscriptions.value;

  return groupedSubscriptions.value.map(group => ({
    ...group,
    subscriptions: group.subscriptions.filter((sub: any) =>
      sub.name.toLowerCase().includes(subscriptionFilter.value.toLowerCase())
    )
  })).filter(group => group.subscriptions.length > 0);
});

const filteredNodes = computed(() => {
  if (!nodeFilter.value) return groupedNodes.value;

  const filtered: Record<string, Node[]> = {};
  Object.entries(groupedNodes.value).forEach(([groupName, nodes]) => {
    const filteredNodesList = nodes.filter(node =>
      node.name.toLowerCase().includes(nodeFilter.value.toLowerCase())
    );
    if (filteredNodesList.length > 0) {
      filtered[groupName] = filteredNodesList;
    }
  });
  return filtered;
});

// 方法
const fetchSubscriptionData = async () => {
  try {
    // 这里需要调用API获取数据
    // 暂时使用模拟数据
    groupedSubscriptions.value = [
      {
        group_name: '默认分组',
        subscriptions: [
          { id: '1', name: '机场订阅A' },
          { id: '2', name: '机场订阅B' }
        ]
      }
    ];
  } catch (error) {
    message.error('获取订阅数据失败');
  }
};

const fetchNodeData = async () => {
  try {
    // 这里需要调用API获取数据
    // 暂时使用模拟数据
    groupedNodes.value = {
      '默认分组': [
        {
          id: 'node1',
          name: '节点A',
          user_id: 'user1',
          group_id: 'group1',
          server: 'example.com',
          port: 443,
          protocol: 'vmess',
          status: 'unknown',
          link: '',
          protocol_params: {},
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 'node2',
          name: '节点B',
          user_id: 'user1',
          group_id: 'group1',
          server: 'example.org',
          port: 8080,
          protocol: 'shadowsocks',
          status: 'unknown',
          link: '',
          protocol_params: {},
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ]
    };
  } catch (error) {
    message.error('获取节点数据失败');
  }
};

const selectAllSubscriptions = () => {
  const allIds = groupedSubscriptions.value.flatMap(group =>
    group.subscriptions.map((sub: any) => sub.id)
  );
  selectedSubscriptionIds.value = allIds;
};

const selectAllNodes = () => {
  const allIds = Object.values(groupedNodes.value).flat().map(node => node.id);
  selectedNodeIds.value = allIds;
};

const getNodeStatus = (nodeId: string) => {
  const status = nodeStatusStore.getStatusByNodeId(nodeId);
  return status?.status || 'unknown';
};

// 监听器
watch(selectedSubscriptionIds, (newValue) => {
  emit('update:subscriptionIds', newValue);
}, { deep: true });

watch(selectedNodeIds, (newValue) => {
  emit('update:nodeIds', newValue);
}, { deep: true });

watch(strategy, (newValue) => {
  emit('update:strategy', newValue);
});

watch(pollingMode, (newValue) => {
  emit('update:pollingMode', newValue);
});

watch(pollingThreshold, (newValue) => {
  emit('update:pollingThreshold', newValue);
});

watch(pollingInterval, (newValue) => {
  emit('update:pollingInterval', newValue);
});

// 获取节点状态数据
const fetchNodeStatusData = async () => {
  try {
    const allNodes = Object.values(groupedNodes.value).flat();
    const nodeIds = allNodes.map((node: Node) => node.id);
    await nodeStatusStore.fetchStatuses(nodeIds);
  } catch (error) {
    console.error('Failed to fetch node statuses:', error);
  }
};

// 生命周期
onMounted(async () => {
  await fetchSubscriptionData();
  await fetchNodeData();
  await fetchNodeStatusData();
});

// 暴露方法
defineExpose({
  refreshData: () => {
    fetchSubscriptionData();
    fetchNodeData();
  },
  clearSelection: () => {
    selectedSubscriptionIds.value = [];
    selectedNodeIds.value = [];
  }
});
</script>

<style scoped>
.profile-data-source {
  @apply space-y-4;
}

.strategy-section,
.polling-settings,
.subscriptions-section {
  @apply bg-white p-4 rounded-lg border border-gray-200;
}

.polling-settings {
  @apply border-t-0 border-l-0 border-r-0 rounded-t-none;
}

.subscriptions-section {
  @apply border-t-0 border-l-0 border-r-0 rounded-t-none;
}

.subscription-group,
.node-group {
  @apply mb-4;
}

.subscription-group:last-child,
.node-group:last-child {
  @apply mb-0;
}

/* 响应式优化 */
@media (max-width: 768px) {
  .grid-cols-2 {
    @apply grid-cols-1 gap-2;
  }
}

/* 动画效果 */
.subscription-group,
.node-group {
  @apply transition-all duration-200;
}

/* 搜索框样式 */
input[type="search"]::-webkit-search-decoration,
input[type="search"]::-webkit-search-cancel-button {
  @apply hidden;
}
</style>