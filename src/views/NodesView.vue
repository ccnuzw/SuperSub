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
import { FlashOutline as FlashIcon, EllipsisVertical as MoreIcon, ReorderFourOutline as DragHandleIcon, AddOutline, EllipsisHorizontal, CreateOutline, TrashOutline as TrashIcon } from '@vicons/ionicons5';
import { parseNodeLinks, ParsedNode } from '@/utils/nodeParser';
import { getNaiveTagColor } from '@/utils/colors';
import { nodesApi } from '@/api/nodes';
import NodeTable from '@/components/nodes/NodeTable.vue';
import NodeFormModal from '@/components/nodes/modals/NodeFormModal.vue';
import NodeImportModal from '@/components/nodes/modals/NodeImportModal.vue';
import NodeMoveToGroupModal from '@/components/nodes/modals/NodeMoveToGroupModal.vue';
import NodeSortGroupsModal from '@/components/nodes/modals/NodeSortGroupsModal.vue';
import NodeGroupFormModal from '@/components/nodes/modals/NodeGroupFormModal.vue';
import { useNodeGroups } from '@/composables/nodes/useNodeGroups';
import Button from '@/components/ui/Button.vue';
import Card from '@/components/ui/Card.vue';
import Badge from '@/components/ui/Badge.vue';

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
    ? 'All'
    : activeTab.value === 'ungrouped'
      ? 'Ungrouped'
      : groupStore.groups.find(g => g.id === activeTab.value)?.name || 'Unknown';

  const actionTextMap = {
    sort: '排序',
    deduplicate: '去重',
    clear: '清空',
  };
  const actionText = actionTextMap[action];

  dialog.warning({
    title: `确认${actionText}`,
    content: `您确定要${actionTextMap[action]} [${groupName}] 中的节点吗?`,
    positiveText: '确认',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        const response = await nodesApi.batchAction(action, activeTab.value);
        if (response.data.success) {
          message.success(response.data.message || '成功');
          fetchData();
        } else {
          message.error(response.data.message || '失败');
        }
      } catch (error: any) {
        message.error(error.message || 'Request failed');
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



const fetchData = async () => {
  if (!authStore.isAuthenticated) return;
  loading.value = true;
  try {
    const response = await nodesApi.fetchNodes();
    if (response.data.success && Array.isArray(response.data.data)) {
      nodes.value = response.data.data || [];
    } else {
      message.error(response.data.message || '获取节点失败');
    }
  } catch (err: any) {
    message.error(err.message || '请求失败');
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
    message.warning('没有可测试的节点');
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
const addFromLinkLoading = ref(false);

const {
  groupFormVisible,
  groupFormName,
  groupFormLoading,
  groupFormTitle,
  openAddGroup,
  openEditGroup,
  submitGroupForm,
  moveModalVisible,
  moveModalLoading,
  openMoveModal,
  submitMove,
  sortModalVisible,
  sortLoading,
  openSortModal,
  submitSort,
  deleteGroup,
  toggleGroup
} = useNodeGroups();

const showDropdown = ref(false);
const dropdownX = ref(0);
const dropdownY = ref(0);
const activeDropdownGroup = ref<NodeGroup | null>(null);

// Group Export
const showExportModal = ref(false);
const exportData = reactive({
  urls: '',
  count: 0,
  groupName: ''
});

const handleExportGroup = (groupId: string) => {
  const group = groupStore.groups.find(g => g.id === groupId);
  const nodesInGroup = nodes.value.filter(n => n.group_id === groupId);
  
  if (nodesInGroup.length === 0) {
    message.warning('没有可导出的节点');
    return;
  }

  // Generate export content (using 'link' field or constructing from details if missing)
  // Assuming 'link' or constructing a standard share link
  const urls = nodesInGroup.map(n => n.link || n.raw || `vmess://${n.id}`).join('\n'); // Fallback might be needed if link is missing

  exportData.urls = urls;
  exportData.count = nodesInGroup.length;
  exportData.groupName = group?.name || '分组';
  showExportModal.value = true;
};

const handleCopyExportUrls = () => {
  if (!exportData.urls) {
    message.warning('没有可复制内容');
    return;
  }
  navigator.clipboard.writeText(exportData.urls).then(() => {
    message.success('已复制到剪贴板!');
  }).catch(err => {
    message.error('复制失败');
  });
};

// Group Deduplicate Wrapper
const handleDeduplicateGroup = (groupId: string) => {
    
    const groupName = groupStore.groups.find(g => g.id === groupId)?.name || 'Unknown';
    dialog.warning({
        title: '确认去重',
        content: `您确定要去重 [${groupName}] 中的节点吗?`,
        positiveText: '确认',
        negativeText: '取消',
        onPositiveClick: async () => {
            try {
                const response = await nodesApi.batchAction('deduplicate', groupId);
                if (response.data.success) {
                    message.success(response.data.message || '成功');
                    fetchData();
                } else {
                    message.error(response.data.message || '失败');
                }
            } catch (error: any) {
                message.error(error.message || '请求失败');
            }
        },
    });
};









const openModal = (node: Node | null = null) => {
  if (node) {
    editingNode.value = node;
    // formState handled by component watcher
    showModal.value = true;
  } else {
    showAddFromLinkModal.value = true;
  }
};

const handleSave = async (payload: { name: string; link: string }) => {
  if (!editingNode.value) {
    message.error('意外错误：未编辑任何节点。');
    return;
  }

  saveLoading.value = true;
  try {
    
    const response = await nodesApi.updateNode(editingNode.value.id, payload);
    if (response.data.success) {
      message.success('更新成功');
      showModal.value = false;
      fetchData();
    } else {
      message.error(response.data.message || '保存失败');
    }
  } catch (err: any) {
    message.error(err.message || '请求失败');
  } finally {
    saveLoading.value = false;
  }
};


const handleBatchImport = async (payload: { nodes: (ParsedNode & { id: string; raw: string })[]; groupId: string | null }) => {
  if (payload.nodes.length === 0) {
    message.warning('没有有效的节点可导入');
    return;
  }
  addFromLinkLoading.value = true;
  try {
    const response = await nodesApi.importNodes(payload.nodes, payload.groupId || null);
    if (response.data.success) {
      message.success(response.data.message || `成功导入 ${payload.nodes.length} 个节点`);
      showAddFromLinkModal.value = false;
      fetchData();
    } else {
      message.error(response.data.message || '导入失败');
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
        content: `确认删除节点 "${row.name}"?`,
        positiveText: '删除',
        negativeText: '取消',
        onPositiveClick: async () => {
            try {
                const response = await nodesApi.deleteNode(row.id);
                if (response.data.success) {
                    message.success('删除成功');
                    fetchData();
                } else {
                    message.error(response.data.message || '删除失败');
                }
            } catch (err: any) {
                message.error(err.message || '请求失败');
            }
        }
    });
};

const handleSaveOrder = async () => {
  saveOrderLoading.value = true;
  try {
    const nodeIds = nodes.value.map(node => node.id);
    const response = await nodesApi.updateOrder(nodeIds);
    if (response.data.success) {
      message.success('排序已保存');
      orderChanged.value = false;
      isSorting.value = false;
      fetchData();
    } else {
      message.error(response.data.message || '保存失败');
    }
  } catch (err: any) {
    message.error(err.message || '请求失败');
  } finally {
    saveOrderLoading.value = false;
  }
};



const handleBatchDelete = () => {
  if (checkedRowKeys.value.length === 0) {
    message.warning('请至少选择一个节点');
    return;
  }
  dialog.warning({
    title: '确认批量删除',
    content: `删除 ${checkedRowKeys.value.length} 个节点?`,
    positiveText: '删除',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        const response = await nodesApi.batchDelete(checkedRowKeys.value);
        if (response.data.success) {
          message.success('批量删除成功');
          fetchData();
          checkedRowKeys.value = [];
        } else {
          message.error(response.data.message || '批量删除失败');
        }
      } catch (err: any) {
        message.error(err.message || '请求失败');
      }
    }
  });
};

const handleMoveToGroup = (groupId: string | null) => {
  submitMove(checkedRowKeys.value, groupId, () => {
      checkedRowKeys.value = []
      fetchData()
  })
}

const getDropdownOptions = (group: NodeGroup) => {
  return [
    { label: '导出节点', key: 'export-group' },
    { label: '去重', key: 'deduplicate-group' },
    { type: 'divider', key: 'd1' },
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
    case 'export-group':
      handleExportGroup(group.id);
      break;
    case 'deduplicate-group':
      handleDeduplicateGroup(group.id);
      break;
    case 'rename':
      openEditGroup(group);
      break;
    case 'toggle':
      toggleGroup(group.id);
      break;
    case 'delete':
      deleteGroup(group, () => {
          if (activeTab.value === group.id) {
            activeTab.value = 'all';
          }
      });
      break;
  }
};

const handleTabClick = (group: NodeGroup, event: MouseEvent) => {
  const target = event.target as HTMLElement;
  if (target.closest('.group-actions-button')) {
    showDropdown.value = true;
    dropdownX.value = event.clientX;
    dropdownY.value = event.clientY;
    activeDropdownGroup.value = group;
  } else {
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


const handleUpdateGroup = async () => {}; // Moved to composable

const handleMoveToProps = async () => {}; // Replaced via composable wrapper

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
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
      <div>
        <h1 class="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">节点管理</h1>
        <p class="text-slate-500 dark:text-slate-400 mt-1">管理你的节点订阅。</p>
      </div>
      <div class="flex flex-wrap gap-2">
           <Button v-if="isSorting" variant="primary" @click="handleSaveOrder" :disabled="!orderChanged" :loading="saveOrderLoading">保存排序</Button>
           <Button v-if="isSorting" variant="secondary" @click="isSorting = false; orderChanged = false; fetchData();">取消排序</Button>

           <div v-else class="flex gap-2">
               <Button variant="primary" @click="openModal(null)" icon>
                   <n-icon :component="AddOutline" class="mr-2" />
                   导入
               </Button>
               <n-dropdown
                    trigger="click"
                    :options="[
                      { label: '手动排序', key: 'manual-sort', disabled: isSorting },
                      { label: '自动排序', key: 'auto-sort' },
                      { label: '分组排序', key: 'sort-groups' },
                      { label: '去重', key: 'deduplicate' },
                      { label: '添加分组', key: 'add-group' },
                      { label: '清空全部', key: 'clear-all' },
                      { label: '移动到分组', key: 'move-to-group', disabled: checkedRowKeys.length === 0 },
                      { label: '批量删除', key: 'batch-delete', disabled: checkedRowKeys.length === 0 },
                      { label: '测试选中', key: 'test-selected', disabled: checkedRowKeys.length === 0 },
                      { label: '测试当前组', key: 'test-current-group' },
                    ]"
                    @select="key => {
                      if (key === 'manual-sort') isSorting = true;
                       if (key === 'auto-sort') handleBatchAction('sort');
                       if (key === 'sort-groups') openSortModal();
                       if (key === 'deduplicate') handleBatchAction('deduplicate');
                       if (key === 'add-group') openAddGroup();
                       if (key === 'clear-all') handleBatchAction('clear');
                       if (key === 'move-to-group') openMoveModal();
                      if (key === 'batch-delete') handleBatchDelete();
                      if (key === 'test-selected') testSelectedNodes();
                      if (key === 'test-current-group') testAllNodes();
                    }"
                >
                    <Button variant="secondary" icon>
                         <n-icon :component="EllipsisHorizontal" />
                         <span v-if="!isMobile" class="ml-2">操作</span>
                    </Button>
                </n-dropdown>
           </div>
      </div>
    </div>

    <n-input
      v-model:value="filterKeyword"
      placeholder="按名称筛选..."
      clearable
      class="max-w-xs"
    />

    <Card :bordered="false" content-style="padding: 0;" class="overflow-hidden rounded-xl shadow-sm border border-gray-100 dark:border-dark-border bg-white dark:bg-dark-surface">
         <n-tabs 
            type="line" 
            animated 
            class="px-4 pt-2"
            v-model:value="activeTab"
        >
            <n-tab-pane name="all" :tab="`全部 (${groupCounts.all})`" />
            <n-tab-pane name="ungrouped" :tab="`未分组 (${groupCounts.ungrouped})`" />
            <n-tab-pane
                v-for="group in groupStore.groups"
                :key="group.id"
                :name="group.id"
            >
             <template #tab>
                <div
                  class="flex items-center group cursor-pointer py-2"
                  @click.prevent="handleTabClick(group, $event)"
                  @contextmenu.prevent="handleContextMenu(group, $event)"
                >
                  <span :class="{'text-slate-400': !group.is_enabled, 'mr-2': true}">
                    {{ group.name }} ({{ groupCounts[group.id] || 0 }})
                  </span>
                   <div class="ml-2 opacity-0 group-hover:opacity-100 transition-opacity" v-if="activeTab === group.id">
                       <n-icon :component="MoreIcon" class="text-slate-400 hover:text-slate-600 group-actions-button" />
                  </div>
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

        <div class="p-0">
             <NodeTable
              v-if="!isSorting && !isMobile"
              :nodes="filteredNodes"
              :loading="loading"
              v-model:checked-row-keys="checkedRowKeys"
              @test="testNode"
              @edit="handleEditNode"
              @delete="handleDeleteNode"
            />

            <!-- Mobile List -->
             <div v-else-if="!isSorting && isMobile" class="p-4 space-y-4 bg-gray-50 dark:bg-dark-bg min-h-[300px]">
                 <Card v-for="node in paginatedNodes" :key="node.id" padding="sm" class="flex flex-col gap-3">
                     <div class="flex items-start justify-between">
                         <div class="flex items-center gap-2">
                             <n-icon v-if="nodeStatusStore.getStatusByNodeId(node.id)?.status === 'healthy'" color="#63e2b7" size="20"><component :is="'div'">●</component></n-icon>
                             <n-icon v-else-if="nodeStatusStore.getStatusByNodeId(node.id)?.status === 'unhealthy'" color="#e88080" size="20"><component :is="'div'">●</component></n-icon>
                             <n-spin v-else-if="nodeStatusStore.getStatusByNodeId(node.id)?.status === 'testing'" size="small" />
                             <n-icon v-else color="#cccccc" size="20"><component :is="'div'">●</component></n-icon>
                             <div class="font-medium text-slate-900 dark:text-white">{{ node.name }}</div>
                         </div>
                         <n-tag size="small" round :color="getNaiveTagColor(node.protocol || node.type || 'N/A', 'protocol')">
                            {{ (node.protocol || node.type || 'N/A').toUpperCase() }}
                        </n-tag>
                     </div>
                     <div class="flex gap-2 text-xs">
                          <n-tag v-if="nodeStatusStore.getStatusByNodeId(node.id)?.latency" size="small" round :type="nodeStatusStore.getStatusByNodeId(node.id)!.latency! < 200 ? 'success' : nodeStatusStore.getStatusByNodeId(node.id)!.latency! < 500 ? 'warning' : 'error'">
                            {{ nodeStatusStore.getStatusByNodeId(node.id)?.latency }}ms
                          </n-tag>
                     </div>
                     <div class="flex justify-end gap-2 pt-2 border-t border-gray-100 dark:border-dark-border">
                         <Button variant="ghost" size="sm" icon @click="testNode(node)" :loading="nodeStatusStore.getStatusByNodeId(node.id)?.status === 'testing'">
                           <n-icon :component="FlashIcon" />
                         </Button>
                         <Button variant="ghost" size="sm" icon @click="handleEditNode(node)">
                            <n-icon :component="CreateOutline" />
                        </Button>
                        <Button variant="ghost" size="sm" icon class="text-red-500" @click="handleDeleteNode(node)">
                            <n-icon :component="TrashIcon" />
                        </Button>
                     </div>
                 </Card>
                 <n-pagination
                  v-if="mobilePagination.pageCount > 1"
                  v-model:page="mobilePagination.page"
                  :page-count="mobilePagination.pageCount"
                  class="flex justify-center mt-4"
                />
             </div>

             <!-- Sorting Table -->
            <div v-if="isSorting" class="n-data-table" :class="{ 'n-data-table--loading': loading }">
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
                        <td class="n-data-table-td" style="text-align: center;">
                          <n-icon class="drag-handle" size="20" style="cursor: move;">
                            <DragHandleIcon />
                          </n-icon>
                        </td>
                        <td class="n-data-table-td">{{ rowData.name }}</td>
                        <td class="n-data-table-td">{{ rowData.server }}</td>
                        <td class="n-data-table-td">{{ rowData.port }}</td>
                        <td class="n-data-table-td">
                          <n-tag size="small" round :color="getNaiveTagColor(rowData.protocol || rowData.type || 'N/A', 'protocol')">
                            {{ (rowData.protocol || rowData.type || 'N/A').toUpperCase() }}
                          </n-tag>
                        </td>
                      </tr>
                    </template>
                  </draggable>
                </table>
              </div>
            </div>

        </div>
    </Card>

    <NodeFormModal
        v-model:show="showModal"
        :node="editingNode"
        :loading="saveLoading"
        @submit="handleSave"
    />

    <NodeImportModal
        v-model:show="showAddFromLinkModal"
        :groups="groupStore.groups"
        :loading="addFromLinkLoading"
        @import="handleBatchImport"
    />

    <NodeMoveToGroupModal
        v-model:show="moveModalVisible"
        :groups="groupStore.groups"
        :loading="moveModalLoading"
        :node-count="checkedRowKeys.length"
        @submit="handleMoveToGroup"
    />

    <NodeGroupFormModal
      v-model:show="groupFormVisible"
      v-model:modelValue="groupFormName"
      :loading="groupFormLoading"
      :title="groupFormTitle"
      @submit="submitGroupForm"
    />

    <NodeSortGroupsModal
      v-model:show="sortModalVisible"
      :groups="groupStore.groups"
      :loading="sortLoading"
      @save="submitSort"
    />

    <n-modal
      v-model:show="showExportModal"
      preset="card"
      :title="`导出节点: '${exportData.groupName}'`"
      style="width: 600px;"
      :mask-closable="false"
    >
      <p class="mb-2">共 {{ exportData.count }} 个节点:</p>
      <n-input
        v-model:value="exportData.urls"
        type="textarea"
        readonly
        :autosize="{ minRows: 10, maxRows: 20 }"
        placeholder="无节点链接"
      />
      <template #footer>
        <div class="flex justify-end gap-2">
           <Button variant="secondary" @click="showExportModal = false">关闭</Button>
           <Button variant="primary" @click="handleCopyExportUrls">复制</Button>
        </div>
      </template>
    </n-modal>

  </div>
</template>

<style scoped>
.sortable-ghost {
  opacity: 0.5;
  background: #c8ebfb;
}

.drag-handle {
    cursor: grab;
}
.drag-handle:active {
    cursor: grabbing;
}
</style>