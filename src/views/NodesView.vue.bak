<script setup lang="ts">
import { ref, onMounted, h, reactive, computed, watch, onBeforeUnmount } from 'vue';
import { useMessage, useDialog, NButton, NSpace, NTag, NIcon, NPageHeader, NDataTable, NModal, NForm, NFormItem, NInput, NInputNumber, NSelect, NSpin, NTabs, NTabPane, NDropdown, NCode, NList, NListItem, NThing, NPagination } from 'naive-ui';
import draggable from 'vuedraggable';
import { debounce } from 'lodash-es';
import type { DataTableColumns } from 'naive-ui';
import { useIsMobile } from '@/composables/useMediaQuery';
import { Node } from '@/types';
import { useAuthStore } from '@/stores/auth';
import { useGroupStore, type NodeGroup } from '@/stores/groups';
import { useNodeStatusStore } from '@/stores/nodeStatus';
import { FlashOutline as FlashIcon, EllipsisVertical as MoreIcon, ReorderFourOutline as DragHandleIcon } from '@vicons/ionicons5';
import { parseNodeLinks, ParsedNode } from '@/utils/nodeParser';
import { getNaiveTagColor } from '@/utils/colors';
import { useApi } from '@/composables/useApi';

const api = useApi();
const message = useMessage();
const dialog = useDialog();
const authStore = useAuthStore();
const groupStore = useGroupStore();
const isMobile = useIsMobile();
const nodeStatusStore = useNodeStatusStore();
const nodes = ref<Node[]>([]);
const loading = ref(true);
const checkingAll = computed(() => nodeStatusStore.loading);
const checkedRowKeys = ref<string[]>([]);
const filterKeyword = ref('');
const activeTab = ref('all');
const isSorting = ref(false);
const orderChanged = ref(false);
const saveOrderLoading = ref(false);

interface MobilePagination {
  page: number;
  pageSize: number;
  itemCount: number;
  pageCount: number;
}

const mobilePagination: MobilePagination = reactive({
  page: 1,
  pageSize: 15,
  itemCount: 0,
  pageCount: computed(() => Math.ceil(mobilePagination.itemCount / mobilePagination.pageSize)),
});

const handleBatchAction = (action: 'sort' | 'deduplicate' | 'clear') => {
  const groupName = activeTab.value === 'all'
    ? '所有'
    : activeTab.value === 'ungrouped'
      ? '未分组'
      : groupStore.groups.find(g => g.id === activeTab.value)?.name || '未知';

  const actionTextMap = {
    sort: '排序',
    deduplicate: '去重',
    clear: '清空',
  };
  const actionText = actionTextMap[action];

  dialog.warning({
    title: `确认${actionText}`,
    content: `确定要对【${groupName}】分组下的节点执行【${actionText}】操作吗？`,
    positiveText: '确定',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        const response = await api.post('/nodes/batch-actions', {
          action,
          groupId: activeTab.value,
        });
        if (response.success) {
          message.success(response.message || '操作成功');
          fetchData();
        } else {
          message.error(response.message || '操作失败');
        }
      } catch (error: any) {
        message.error(error.message || '请求失败');
      }
    },
  });
};

const filteredNodes = computed(() => {
  const keyword = filterKeyword.value.toLowerCase();
  
  return nodes.value.filter(node => {
    const inGroup = activeTab.value === 'all'
      ? true
      : activeTab.value === 'ungrouped'
        ? !node.group_id
        : node.group_id === activeTab.value;

    if (!inGroup) return false;

    if (!keyword) return true;
    return node.name.toLowerCase().includes(keyword);
  });
});

const paginatedNodes = computed(() => {
  const start = (mobilePagination.page - 1) * mobilePagination.pageSize;
  const end = start + mobilePagination.pageSize;
  return filteredNodes.value.slice(start, end);
});

watch(filteredNodes, (value) => {
  mobilePagination.itemCount = value.length;
  mobilePagination.page = 1;
});

const groupCounts = computed(() => {
  const counts: { all: number; ungrouped: number; [key: string]: number } = {
    all: nodes.value.length,
    ungrouped: 0,
  };
  nodes.value.forEach(node => {
    if (node.group_id) {
      counts[node.group_id] = (counts[node.group_id] || 0) + 1;
    } else {
      counts.ungrouped++;
    }
  });
  return counts;
});

const createColumns = ({ onTest, onEdit, onDelete }: {
    onTest: (row: Node) => void,
    onEdit: (row: Node) => void,
    onDelete: (row: Node) => void,
}): DataTableColumns<Node> => {
  return [
    {
      type: 'selection',
    },
    {
      title: '状态',
      key: 'status',
      width: 80,
      align: 'center',
      render(row) {
        const status = nodeStatusStore.getStatusByNodeId(row.id);
        switch (status?.status) {
          case 'healthy':
            return h(NIcon, { color: '#63e2b7', size: 20 }, { default: () => '●' });
          case 'unhealthy':
            return h(NIcon, { color: '#e88080', size: 20 }, { default: () => '●' });
          case 'testing':
            return h(NSpin, { size: 'small' });
          default:
            return h(NIcon, { color: '#cccccc', size: 20 }, { default: () => '●' });
        }
      }
    },
    { title: '名称', key: 'name', sorter: 'default', ellipsis: { tooltip: true } },
    { title: '服务器', key: 'server', sorter: 'default', ellipsis: { tooltip: true } },
    { title: '端口', key: 'port', sorter: 'default', width: 100 },
    {
      title: '类型',
      key: 'protocol',
      sorter: 'default',
      width: 120,
      render(row) {
        const protocol = row.protocol || row.type || 'N/A';
        return h(NTag, {
            size: 'small',
            round: true,
            color: getNaiveTagColor(protocol, 'protocol')
        }, { default: () => protocol.toUpperCase() });
      }
    },
    {
      title: '延迟',
      key: 'latency',
      width: 100,
      sorter: (a, b) => (a.latency ?? Infinity) - (b.latency ?? Infinity),
      render(row) {
        const status = nodeStatusStore.getStatusByNodeId(row.id);
        const latency = status?.latency;
        if (latency === undefined || latency === null) {
          return h(NTag, { type: 'default', size: 'small', round: true }, { default: () => 'N/A' });
        }
        const type = latency < 200 ? 'success' : latency < 500 ? 'warning' : 'error';
        return h(NTag, { type, size: 'small', round: true }, { default: () => `${latency}ms` });
      }
    },
    {
      title: '操作',
      key: 'actions',
      width: 220,
      render(row) {
        return h(NSpace, null, {
          default: () => [
            h(NButton, { size: 'small', circle: true, tertiary: true, onClick: () => testNode(row), loading: nodeStatusStore.getStatusByNodeId(row.id)?.status === 'testing' }, { icon: () => h(NIcon, null, { default: () => h(FlashIcon) }) }),
            h(NButton, { size: 'small', onClick: () => handleEditNode(row) }, { default: () => '编辑' }),
            h(NButton, { size: 'small', type: 'error', ghost: true, onClick: () => handleDeleteNode(row) }, { default: () => '删除' }),
          ]
        });
      }
    }
  ];
};

const fetchData = async () => {
  if (!authStore.isAuthenticated) return;
  loading.value = true;
  try {
    const response = await api.get<Node[]>('/nodes');
    if (response.success && Array.isArray(response.data)) {
      nodes.value = response.data;
    } else {
      message.error(response.message || '获取节点列表失败');
    }
  } catch (err: any) {
    message.error(err.message || '请求失败，请稍后重试');
  } finally {
    loading.value = false;
  }
};

const testNode = async (node: Node) => {
  const result = await nodeStatusStore.checkNodesHealth([node.id]);
  if (result.success) {
    message.info(result.message);
  } else {
    message.error(result.message);
  }
};

const testNodes = async (nodesToTest: Node[]) => {
  if (nodesToTest.length === 0) {
    message.warning('没有需要测试的节点。');
    return;
  }
  const nodeIds = nodesToTest.map(n => n.id);
  const result = await nodeStatusStore.checkNodesHealth(nodeIds);
  if (result.success) {
    message.info(result.message);
  } else {
    message.error(result.message);
  }
};

const testAllNodes = () => {
  testNodes(filteredNodes.value);
};

const testSelectedNodes = () => {
  const selectedNodes = nodes.value.filter(n => checkedRowKeys.value.includes(n.id));
  testNodes(selectedNodes);
};

const showModal = ref(false);
const editingNode = ref<Node | null>(null);
const saveLoading = ref(false);

const showAddFromLinkModal = ref(false);
const addLink = ref('');
const addFromLinkLoading = ref(false);
const previewNodes = ref<(ParsedNode & { id: string; raw: string; })[]>([]);
const importGroupId = ref<string | undefined>(undefined);

const showMoveToGroupModal = ref(false);
const moveToGroupId = ref<string | null>(null);
const moveToGroupLoading = ref(false);

const showAddGroupModal = ref(false);
const newGroupName = ref('');
const addGroupLoading = ref(false);

const showEditGroupModal = ref(false);
const editingGroup = ref<NodeGroup | null>(null);
const editingGroupName = ref('');
const editGroupLoading = ref(false);

const showDropdown = ref(false);
const dropdownX = ref(0);
const dropdownY = ref(0);
const activeDropdownGroup = ref<NodeGroup | null>(null);

const previewColumns: DataTableColumns<ParsedNode> = [
    {
        type: 'expand',
        renderExpand: (rowData) => {
            return h(NCode, {
                code: JSON.stringify(rowData.protocol_params, null, 2),
                language: 'json',
                class: 'my-2'
            });
        }
    },
  { title: '名称', key: 'name', ellipsis: { tooltip: true } },
  { title: '协议', key: 'protocol', width: 80 },
  { title: '服务器', key: 'server', ellipsis: { tooltip: true } },
  { title: '端口', key: 'port', width: 70 },
];

watch(addLink, debounce((newVal: string) => {
  if (newVal.trim()) {
    previewNodes.value = parseNodeLinks(newVal);
  } else {
    previewNodes.value = [];
  }
}, 300));


const defaultFormState: Partial<Node> = {
  name: '',
  link: '',
};

const formState = reactive({ ...defaultFormState });

const modalTitle = computed(() => (editingNode.value ? '编辑节点' : '新增节点'));

const openModal = (node: Node | null = null) => {
  if (node) {
    editingNode.value = node;
    formState.name = node.name;
    formState.link = node.link;
    showModal.value = true;
  } else {
    handleOpenAddFromLinkModal();
  }
};

const handleSave = async () => {
  if (!editingNode.value) {
    message.error('发生意外错误：没有正在编辑的节点。');
    return;
  }

  saveLoading.value = true;
  try {
    const payload = {
      name: formState.name,
      link: formState.link,
    };
    
    const response = await api.put(`/nodes/${editingNode.value.id}`, payload);
    if (response.success) {
      message.success('节点更新成功');
      showModal.value = false;
      fetchData();
    } else {
      message.error(response.message || '保存失败');
    }
  } catch (err: any) {
    message.error(err.message || '请求失败，请稍后重试');
  } finally {
    saveLoading.value = false;
  }
};


const handleOpenAddFromLinkModal = () => {
  addLink.value = '';
  previewNodes.value = [];
  showAddFromLinkModal.value = true;
};

const handleBatchImport = async () => {
  if (previewNodes.value.length === 0) {
    message.warning('没有可导入的有效节点。');
    return;
  }
  addFromLinkLoading.value = true;
  try {
    const response = await api.post('/nodes/batch-import', {
        nodes: previewNodes.value,
        groupId: importGroupId.value || null,
    });
    if (response.success) {
      message.success(response.message || `成功导入 ${previewNodes.value.length} 个节点`);
      showAddFromLinkModal.value = false;
      fetchData();
    } else {
      message.error(response.message || '导入失败');
    }
  } catch (error: any) {
    message.error(error.message || '请求失败');
  } finally {
    addFromLinkLoading.value = false;
  }
};

const handleEditNode = (row: Node) => {
    openModal(row);
};

const handleDeleteNode = (row: Node) => {
    dialog.warning({
        title: '确认删除',
        content: `确定要删除节点 "${row.name}" 吗？`,
        positiveText: '确定',
        negativeText: '取消',
        onPositiveClick: async () => {
            try {
                const response = await api.delete(`/nodes/${row.id}`);
                if (response.success) {
                    message.success('节点删除成功');
                    fetchData();
                } else {
                    message.error(response.message || '删除失败');
                }
            } catch (err: any) {
                message.error(err.message || '请求失败，请稍后重试');
            }
        }
    });
};

const handleSaveOrder = async () => {
  saveOrderLoading.value = true;
  try {
    const nodeIds = nodes.value.map(node => node.id);
    const response = await api.post('/nodes/update-order', { nodeIds });
    if (response.success) {
      message.success('节点顺序已保存');
      orderChanged.value = false;
      isSorting.value = false;
      fetchData();
    } else {
      message.error(response.message || '保存顺序失败');
    }
  } catch (err: any) {
    message.error(err.message || '请求失败，请稍后重试');
  } finally {
    saveOrderLoading.value = false;
  }
};

const columns = createColumns({
    onTest: testNode,
    onEdit: handleEditNode,
    onDelete: handleDeleteNode,
});

const handleBatchDelete = () => {
  if (checkedRowKeys.value.length === 0) {
    message.warning('请至少选择一个节点');
    return;
  }
  dialog.warning({
    title: '确认批量删除',
    content: `确定要删除选中的 ${checkedRowKeys.value.length} 个节点吗？`,
    positiveText: '确定',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        const response = await api.post('/nodes/batch-delete', { ids: checkedRowKeys.value });
        if (response.success) {
          message.success('批量删除成功');
          fetchData();
          checkedRowKeys.value = [];
        } else {
          message.error(response.message || '批量删除失败');
        }
      } catch (err: any) {
        message.error(err.message || '请求失败，请稍后重试');
      }
    }
  });
};

const handleSaveGroup = async () => {
  if (!newGroupName.value.trim()) {
    message.warning('分组名称不能为空');
    return;
  }
  addGroupLoading.value = true;
  try {
    const response = await groupStore.addGroup(newGroupName.value);
    if (response.success) {
      message.success('分组创建成功');
      showAddGroupModal.value = false;
      newGroupName.value = '';
    } else {
      message.error(response.message || '创建失败');
    }
  } catch (error: any) {
    message.error(error.message || '创建失败');
  } finally {
    addGroupLoading.value = false;
  }
};

const getDropdownOptions = (group: NodeGroup) => {
  return [
    { label: '重命名', key: 'rename' },
    { label: group.is_enabled ? '禁用' : '启用', key: 'toggle' },
    { label: '删除', key: 'delete', props: { style: 'color: red;' } }
  ];
};

const handleGroupAction = (key: string) => {
  showDropdown.value = false;
  const group = activeDropdownGroup.value;
  if (!group) return;

  switch (key) {
    case 'rename':
      editingGroup.value = group;
      editingGroupName.value = group.name;
      showEditGroupModal.value = true;
      break;
    case 'toggle':
      groupStore.toggleGroup(group.id).catch((err: any) => message.error(err.message || '操作失败'));
      break;
    case 'delete':
      dialog.warning({
        title: '确认删除',
        content: `确定要删除分组 "${group.name}" 吗？分组下的节点将变为“未分组”。`,
        positiveText: '确定',
        negativeText: '取消',
        onPositiveClick: async () => {
          try {
            const response = await groupStore.deleteGroup(group.id);
            if (response.success) {
              message.success('分组删除成功');
              if (activeTab.value === group.id) {
                activeTab.value = 'all';
              }
            } else {
              message.error(response.message || '删除失败');
            }
          } catch (error: any) {
            message.error(error.message || '删除失败');
          }
        }
      });
      break;
  }
};

const handleTabClick = (group: NodeGroup, event: MouseEvent) => {
  const target = event.target as HTMLElement;
  // 如果点击的是图标或其父元素(按钮)，则显示菜单
  if (target.closest('.group-actions-button')) {
    showDropdown.value = true;
    dropdownX.value = event.clientX;
    dropdownY.value = event.clientY;
    activeDropdownGroup.value = group;
  } else {
    // 否则切换 tab
    activeTab.value = group.id;
  }
};

const handleContextMenu = (group: NodeGroup, event: MouseEvent) => {
  event.preventDefault();
  showDropdown.value = false; // Hide any existing dropdown
  setTimeout(() => {
    showDropdown.value = true;
    dropdownX.value = event.clientX;
    dropdownY.value = event.clientY;
    activeDropdownGroup.value = group;
  }, 50);
};


const handleUpdateGroup = async () => {
  if (!editingGroup.value || !editingGroupName.value.trim()) {
    message.warning('分组名称不能为空');
    return;
  }
  editGroupLoading.value = true;
  try {
    const response = await groupStore.updateGroup(editingGroup.value.id, editingGroupName.value);
    if (response.success) {
      message.success('分组更新成功');
      showEditGroupModal.value = false;
    } else {
      message.error(response.message || '更新失败');
    }
  } catch (error: any) {
    message.error(error.message || '更新失败');
  } finally {
    editGroupLoading.value = false;
  }
};

const handleMoveToGroup = async () => {
  if (checkedRowKeys.value.length === 0) {
    message.warning('请至少选择一个节点');
    return;
  }
  moveToGroupLoading.value = true;
  try {
    const response = await api.post('/nodes/batch-update-group', {
      nodeIds: checkedRowKeys.value,
      groupId: moveToGroupId.value,
    });
    if (response.success) {
      message.success('节点分组更新成功');
      showMoveToGroupModal.value = false;
      checkedRowKeys.value = [];
      fetchData();
    } else {
      message.error(response.message || '移动失败');
    }
  } catch (error: any) {
    message.error(error.message || '请求失败');
  } finally {
    moveToGroupLoading.value = false;
  }
};

onMounted(() => {
  fetchData();
  groupStore.fetchGroups();
  nodeStatusStore.fetchStatuses(); // Initial fetch
});

onBeforeUnmount(() => {
  // No more polling timer to clear
});
</script>

<template>
  <div>
    <n-page-header>
      <template #title>
        手动节点管理
      </template>
      <template #extra>
        <n-space>
          <n-button type="primary" @click="openModal(null)">导入节点</n-button>
          <n-dropdown
            trigger="click"
            :options="[
              { label: '手动排序', key: 'manual-sort', disabled: isSorting },
              { label: '一键排序', key: 'auto-sort' },
              { label: '一键去重', key: 'deduplicate' },
              { label: '新增分组', key: 'add-group' },
              { label: '一键清空', key: 'clear-all' },
              { label: '移动到分组', key: 'move-to-group', disabled: checkedRowKeys.length === 0 },
              { label: '批量删除', key: 'batch-delete', disabled: checkedRowKeys.length === 0 },
              { label: '检查选中', key: 'test-selected', disabled: checkedRowKeys.length === 0 },
              { label: '检查当前分组', key: 'test-current-group' },
            ]"
            @select="key => {
              if (key === 'manual-sort') isSorting = true;
              if (key === 'auto-sort') handleBatchAction('sort');
              if (key === 'deduplicate') handleBatchAction('deduplicate');
              if (key === 'add-group') showAddGroupModal = true;
              if (key === 'clear-all') handleBatchAction('clear');
              if (key === 'move-to-group') showMoveToGroupModal = true;
              if (key === 'batch-delete') handleBatchDelete();
              if (key === 'test-selected') testSelectedNodes();
              if (key === 'test-current-group') testAllNodes();
            }"
          >
            <n-button>
              <template #icon>
                <n-icon :component="MoreIcon" />
              </template>
            </n-button>
          </n-dropdown>
           <n-button v-if="isSorting" type="success" @click="handleSaveOrder" :disabled="!orderChanged" :loading="saveOrderLoading">保存排序</n-button>
          <n-button v-if="isSorting" @click="isSorting = false; orderChanged = false; fetchData();">取消</n-button>
        </n-space>
      </template>
    </n-page-header>

    <n-input
      v-model:value="filterKeyword"
      placeholder="按名称过滤节点..."
      clearable
      class="mt-4"
      style="max-width: 300px;"
    />

    <n-tabs type="card" class="mt-4" v-model:value="activeTab">
      <n-tab-pane name="all" :tab="`全部 (${groupCounts.all})`" />
      <n-tab-pane name="ungrouped" :tab="`未分组 (${groupCounts.ungrouped})`" />
      <n-tab-pane
        v-for="group in groupStore.groups"
        :key="group.id"
        :name="group.id"
      >
        <template #tab>
          <div
            class="group-tab-wrapper"
            @click.prevent="handleTabClick(group, $event)"
            @contextmenu.prevent="handleContextMenu(group, $event)"
          >
            <span :style="{ color: group.is_enabled ? '' : '#999', marginRight: '8px' }">
              {{ group.name }} ({{ groupCounts[group.id] || 0 }})
            </span>
            <n-button v-if="activeTab === group.id" text class="group-actions-button">
              <n-icon :component="MoreIcon" />
            </n-button>
          </div>
        </template>
      </n-tab-pane>
    </n-tabs>

    <n-dropdown
      placement="bottom-start"
      trigger="manual"
      :x="dropdownX"
      :y="dropdownY"
      :options="activeDropdownGroup ? getDropdownOptions(activeDropdownGroup) : []"
      :show="showDropdown"
      @select="handleGroupAction"
      @clickoutside="showDropdown = false"
    />

    <n-data-table
      v-if="!isSorting && !isMobile"
      :columns="columns"
      :data="filteredNodes"
      :row-key="(row: Node) => row.id"
      v-model:checked-row-keys="checkedRowKeys"
      :loading="loading"
      :pagination="{ pageSize: 15 }"
      :bordered="false"
      class="mt-4"
    />

    <n-list v-if="!isSorting && isMobile" bordered class="mt-4">
      <n-list-item v-for="node in paginatedNodes" :key="node.id">
        <n-thing>
          <template #avatar>
            <n-icon v-if="nodeStatusStore.getStatusByNodeId(node.id)?.status === 'healthy'" color="#63e2b7" size="20">●</n-icon>
            <n-icon v-else-if="nodeStatusStore.getStatusByNodeId(node.id)?.status === 'unhealthy'" color="#e88080" size="20">●</n-icon>
            <n-spin v-else-if="nodeStatusStore.getStatusByNodeId(node.id)?.status === 'testing'" size="small" />
            <n-icon v-else color="#cccccc" size="20">●</n-icon>
          </template>
          <template #header>
            {{ node.name }}
          </template>
          <template #description>
            <n-space>
              <n-tag v-if="nodeStatusStore.getStatusByNodeId(node.id)?.latency" size="small" round :type="nodeStatusStore.getStatusByNodeId(node.id)!.latency! < 200 ? 'success' : nodeStatusStore.getStatusByNodeId(node.id)!.latency! < 500 ? 'warning' : 'error'">
                {{ nodeStatusStore.getStatusByNodeId(node.id)?.latency }}ms
              </n-tag>
               <n-tag size="small" round :color="getNaiveTagColor(node.protocol || node.type || 'N/A', 'protocol')">{{ (node.protocol || node.type || 'N/A').toUpperCase() }}</n-tag>
            </n-space>
          </template>
        </n-thing>
        <template #suffix>
          <n-space>
            <n-button circle quaternary size="small" @click="() => testNode(node)" :loading="nodeStatusStore.getStatusByNodeId(node.id)?.status === 'testing'">
              <template #icon><n-icon :component="FlashIcon" /></template>
            </n-button>
            <n-dropdown
              trigger="click"
              :options="[
                { label: '编辑', key: 'edit' },
                { label: '删除', key: 'delete' },
              ]"
              @select="key => {
                if (key === 'edit') handleEditNode(node);
                if (key === 'delete') handleDeleteNode(node);
              }"
            >
              <n-button text>
                <n-icon :component="MoreIcon" size="24" />
              </n-button>
            </n-dropdown>
          </n-space>
        </template>
      </n-list-item>
    </n-list>

    <n-pagination
      v-if="!isSorting && isMobile && mobilePagination.pageCount > 1"
      v-model:page="mobilePagination.page"
      :page-count="mobilePagination.pageCount"
      class="mt-4"
      style="justify-content: center;"
    />

    <div v-if="isSorting" class="n-data-table mt-4" :class="{ 'n-data-table--loading': loading }">
      <div class="n-data-table-wrapper">
        <table class="n-data-table-table n-data-table-table--bordered n-data-table-table--single-line">
          <thead class="n-data-table-thead">
            <tr class="n-data-table-tr">
              <th class="n-data-table-th" style="width: 60px; text-align: center; padding: 12px;">排序</th>
              <th class="n-data-table-th" style="padding: 12px;">名称</th>
              <th class="n-data-table-th" style="padding: 12px;">服务器</th>
              <th class="n-data-table-th" style="width: 100px; padding: 12px;">端口</th>
              <th class="n-data-table-th" style="width: 120px; padding: 12px;">类型</th>
            </tr>
          </thead>
          <draggable
            :list="nodes"
            item-key="id"
            tag="tbody"
            handle=".drag-handle"
            class="n-data-table-tbody"
            ghost-class="sortable-ghost"
            @end="orderChanged = true"
          >
            <template #item="{ element: rowData }">
              <tr class="n-data-table-tr" :key="rowData.id" v-if="filteredNodes.some(n => n.id === rowData.id)">
                <td class="n-data-table-td drag-handle" style="padding: 12px;">
                  <n-icon :component="DragHandleIcon" size="20" />
                </td>
                <td class="n-data-table-td" style="padding: 12px;">{{ rowData.name }}</td>
                <td class="n-data-table-td" style="padding: 12px;">{{ rowData.server }}</td>
                <td class="n-data-table-td" style="padding: 12px;">{{ rowData.port }}</td>
                <td class="n-data-table-td" style="padding: 12px;">{{ rowData.protocol || rowData.type }}</td>
              </tr>
            </template>
          </draggable>
        </table>
      </div>
      <div v-if="loading" class="n-data-table-loading-wrapper">
        <div class="n-data-table-loading-cover"><n-spin size="medium" /></div>
      </div>
    </div>

    <n-modal
      v-model:show="showModal"
      preset="card"
      :title="modalTitle"
      :style="{ width: isMobile ? '90vw' : '600px' }"
      :mask-closable="false"
    >
      <n-form @submit.prevent="handleSave">
        <n-form-item label="备注" required>
          <n-input v-model:value="formState.name" placeholder="为节点设置一个易于识别的名称" />
        </n-form-item>
        
        <n-form-item label="原始链接" required>
          <n-input
            v-model:value="formState.link"
            type="textarea"
            placeholder="节点的原始分享链接"
            :autosize="{ minRows: 4, maxRows: 8 }"
          />
        </n-form-item>

        <n-space justify="end">
          <n-button @click="showModal = false">取消</n-button>
          <n-button type="primary" @click="handleSave" :loading="saveLoading">保存</n-button>
        </n-space>
      </n-form>
    </n-modal>

    <n-modal
      v-model:show="showAddFromLinkModal"
      preset="card"
      title="批量导入节点"
      :style="{ width: isMobile ? '95vw' : '800px' }"
      :mask-closable="false"
    >
      <n-form @submit.prevent="handleBatchImport">
        <n-form-item label="分享链接">
          <n-input
            v-model:value="addLink"
            type="textarea"
            placeholder="在此处粘贴一个或多个节点分享链接，每行一个..."
            :autosize="{ minRows: 5, maxRows: 10 }"
          />
        </n-form-item>

        <n-form-item label="节点预览" v-if="previewNodes.length > 0">
           <n-data-table
            :columns="previewColumns"
            :data="previewNodes"
            :row-key="(row: any) => row.id"
            :max-height="250"
            :pagination="false"
            :bordered="true"
            size="small"
          />
        </n-form-item>

        <n-form-item label="导入到分组">
          <n-select
            v-model:value="importGroupId"
            placeholder="默认导入到“未分组”"
            :options="groupStore.groups.map(g => ({ label: g.name, value: g.id }))"
            clearable
          />
        </n-form-item>

        <n-space justify="end">
          <n-button @click="showAddFromLinkModal = false">取消</n-button>
          <n-button type="primary" @click="handleBatchImport" :loading="addFromLinkLoading" :disabled="previewNodes.length === 0">
            导入 {{ previewNodes.length > 0 ? `(${previewNodes.length}个节点)`: '' }}
          </n-button>
        </n-space>
      </n-form>
    </n-modal>

    <n-modal
      v-model:show="showAddGroupModal"
      preset="card"
      title="新增分组"
      :style="{ width: isMobile ? '90vw' : '400px' }"
      :mask-closable="false"
    >
      <n-form @submit.prevent="handleSaveGroup">
        <n-form-item label="分组名称" required>
          <n-input v-model:value="newGroupName" placeholder="请输入分组名称" />
        </n-form-item>
        <n-space justify="end">
          <n-button @click="showAddGroupModal = false">取消</n-button>
          <n-button type="primary" @click="handleSaveGroup" :loading="addGroupLoading">保存</n-button>
        </n-space>
      </n-form>
    </n-modal>

    <n-modal
      v-model:show="showEditGroupModal"
      preset="card"
      title="重命名分组"
      :style="{ width: isMobile ? '90vw' : '400px' }"
      :mask-closable="false"
    >
      <n-form @submit.prevent="handleUpdateGroup">
        <n-form-item label="新名称" required>
          <n-input v-model:value="editingGroupName" placeholder="请输入新的分组名称" />
        </n-form-item>
        <n-space justify="end">
          <n-button @click="showEditGroupModal = false">取消</n-button>
          <n-button type="primary" @click="handleUpdateGroup" :loading="editGroupLoading">保存</n-button>
        </n-space>
      </n-form>
    </n-modal>

  </div>

    <n-modal
      v-model:show="showMoveToGroupModal"
      preset="card"
      title="移动节点到分组"
      :style="{ width: isMobile ? '90vw' : '400px' }"
      :mask-closable="false"
    >
      <n-form @submit.prevent="handleMoveToGroup">
        <n-form-item label="目标分组" required>
          <n-select
            v-model:value="moveToGroupId"
            placeholder="请选择目标分组（可清空变为未分组）"
            :options="groupStore.groups.map(g => ({ label: g.name, value: g.id }))"
            clearable
          />
        </n-form-item>
        <n-space justify="end">
          <n-button @click="showMoveToGroupModal = false">取消</n-button>
          <n-button type="primary" @click="handleMoveToGroup" :loading="moveToGroupLoading">确认移动</n-button>
        </n-space>
      </n-form>
    </n-modal>
</template>

<style scoped>
.group-tab-wrapper {
  display: flex;
  align-items: center;
  padding: 0 4px;
}

.group-actions-button {
  transition: opacity 0.2s;
}

.drag-handle {
  cursor: move;
  display: flex;
  align-items: center;
  justify-content: center;
}

.n-data-table-table--single-line .n-data-table-td,
.n-data-table-table--single-line .n-data-table-th {
  padding: 12px;
}

.sortable-ghost {
  opacity: 0.4;
  background-color: #63e2b7 !important;
}
</style>