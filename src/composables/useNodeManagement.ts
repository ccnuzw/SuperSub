import { ref, reactive, computed } from 'vue';
import { useMessage, useDialog } from 'naive-ui';
import type { Node } from '@/types/entities';
import { NodeService } from '@/services/nodeService';
import { NodeImportService } from '@/services/nodeImportService';
import { type CreateNodeData, type UpdateNodeData } from '@/services/nodeService';
import { type ImportResult } from '@/services/nodeImportService';

// 移动端分页接口
export interface MobilePagination {
  page: number;
  pageSize: number;
  itemCount: number;
  pageCount: number;
}

// 模态框状态接口
export interface ModalStates {
  addNode: boolean;
  editNode: boolean;
  batchImport: boolean;
  addGroup: boolean;
  renameGroup: boolean;
  moveToGroup: boolean;
}

// 节点表单状态接口
export interface NodeFormState {
  id: string;
  name: string;
  link: string;
  protocol: string;
  server: string;
  port: number;
  password: string;
  type: string;
  params: string;
  group_id?: string;
}

export function useNodeManagement() {
  // Service实例
  const nodeService = new NodeService();
  const nodeImportService = new NodeImportService();

  // UI插件
  const message = useMessage();
  const dialog = useDialog();

  // 核心数据状态
  const nodes = ref<Node[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  // UI状态
  const checkedRowKeys = ref<string[]>([]);
  const isSorting = ref(false);
  const orderChanged = ref(false);
  const saveOrderLoading = ref(false);

  // 移动端分页状态
  const mobilePagination: MobilePagination = reactive({
    page: 1,
    pageSize: 15,
    itemCount: 0,
    pageCount: computed(() => Math.ceil(mobilePagination.itemCount / mobilePagination.pageSize)),
  });

  // 模态框状态
  const modalStates = ref<ModalStates>({
    addNode: false,
    editNode: false,
    batchImport: false,
    addGroup: false,
    renameGroup: false,
    moveToGroup: false,
  });

  // 表单状态
  const nodeFormState = ref<NodeFormState>({
    id: '',
    name: '',
    link: '',
    protocol: '',
    server: '',
    port: 8080,
    password: '',
    type: '',
    params: '',
    group_id: '',
  });

  // 编辑中的节点
  const editingNode = ref<Node | null>(null);

  // 导入相关状态
  const addLink = ref('');
  const importPreview = ref<any[]>([]);
  const importGroupId = ref<string>('');

  // 分组相关状态
  const editingGroup = ref<any>(null);
  const editingGroupName = ref('');
  const newGroupName = ref('');
  const moveToGroupId = ref<string>('');

  // 计算属性
  const modalTitle = computed(() => {
    if (modalStates.value.editNode) return '编辑节点';
    if (modalStates.value.addNode) return '新增节点';
    return '';
  });

  const hasCheckedNodes = computed(() => checkedRowKeys.value.length > 0);

  // 核心CRUD操作
  const fetchNodes = async () => {
    loading.value = true;
    error.value = null;

    try {
      const data = await nodeService.fetchNodes();
      nodes.value = data;
    } catch (err: any) {
      error.value = err.message;
      message.error('获取节点列表失败');
    } finally {
      loading.value = false;
    }
  };

  const createNode = async (data: CreateNodeData): Promise<Node> => {
    try {
      const node = await nodeService.createNode(data);
      message.success('节点创建成功');
      await fetchNodes();
      return node;
    } catch (err: any) {
      message.error(err.message || '创建节点失败');
      throw err;
    }
  };

  const updateNode = async (id: string, data: UpdateNodeData): Promise<void> => {
    try {
      await nodeService.updateNode(id, data);
      message.success('节点更新成功');
      await fetchNodes();
    } catch (err: any) {
      message.error(err.message || '更新节点失败');
      throw err;
    }
  };

  const deleteNode = async (id: string): Promise<void> => {
    try {
      await nodeService.deleteNode(id);
      message.success('节点删除成功');
      await fetchNodes();
    } catch (err: any) {
      message.error(err.message || '删除节点失败');
      throw err;
    }
  };

  // 批量操作
  const batchDeleteNodes = async (ids: string[]): Promise<void> => {
    try {
      const result = await nodeService.batchDeleteNodes(ids);
      message.success(result.message || '批量删除成功');
      checkedRowKeys.value = [];
      await fetchNodes();
    } catch (err: any) {
      message.error(err.message || '批量删除失败');
      throw err;
    }
  };

  const batchUpdateGroup = async (nodeIds: string[], groupId: string): Promise<void> => {
    try {
      const result = await nodeService.batchUpdateGroup(nodeIds, groupId);
      message.success(result.message || '批量移动分组成功');
      checkedRowKeys.value = [];
      await fetchNodes();
    } catch (err: any) {
      message.error(err.message || '批量移动分组失败');
      throw err;
    }
  };

  const batchActions = async (action: 'sort' | 'deduplicate' | 'clear', groupId: string): Promise<void> => {
    try {
      const result = await nodeService.batchActions(action, groupId);
      message.success(result.message || '批量操作成功');
      await fetchNodes();
    } catch (err: any) {
      message.error(err.message || '批量操作失败');
      throw err;
    }
  };

  // 健康检查
  const checkNodeHealth = async (nodeIds: string[]): Promise<void> => {
    try {
      const result = await nodeService.checkNodeHealth(nodeIds);
      message.success(result.message || '健康检查已启动');
      // 这里可以触发状态更新
    } catch (err: any) {
      message.error(err.message || '健康检查失败');
      throw err;
    }
  };

  // 排序管理
  const updateNodeOrder = async (nodeIds: string[]): Promise<void> => {
    try {
      await nodeService.updateNodeOrder(nodeIds);
      orderChanged.value = false;
      message.success('节点排序保存成功');
      await fetchNodes();
    } catch (err: any) {
      message.error(err.message || '保存排序失败');
      throw err;
    }
  };

  // 模态框管理
  const openModal = (modal: keyof ModalStates, data?: any) => {
    // 关闭所有模态框
    Object.keys(modalStates.value).forEach(key => {
      modalStates.value[key as keyof ModalStates] = false;
    });

    // 打开指定模态框
    modalStates.value[modal] = true;

    // 根据不同模态框初始化数据
    if (modal === 'editNode' && data) {
      editingNode.value = data;
      nodeFormState.value = {
        id: data.id,
        name: data.name || '',
        link: data.link || '',
        protocol: data.protocol || '',
        server: data.server || '',
        port: data.port || 8080,
        password: data.password || '',
        type: data.type || '',
        params: data.params || '',
        group_id: data.group_id || '',
      };
    } else if (modal === 'addNode') {
      editingNode.value = null;
      nodeFormState.value = {
        id: '',
        name: '',
        link: '',
        protocol: '',
        server: '',
        port: 8080,
        password: '',
        type: '',
        params: '',
        group_id: '',
      };
    } else if (modal === 'renameGroup' && data) {
      editingGroup.value = data;
      editingGroupName.value = data.name;
    }
  };

  const closeModal = (modal?: keyof ModalStates) => {
    if (modal) {
      modalStates.value[modal] = false;
    } else {
      // 关闭所有模态框
      Object.keys(modalStates.value).forEach(key => {
        modalStates.value[key as keyof ModalStates] = false;
      });
    }
  };

  // 节点保存（新增/编辑）
  const handleSaveNode = async () => {
    try {
      if (modalStates.value.editNode && editingNode.value) {
        await updateNode(editingNode.value.id, nodeFormState.value);
      } else if (modalStates.value.addNode) {
        await createNode(nodeFormState.value);
      }
      closeModal();
    } catch (err) {
      // 错误已在方法内处理
    }
  };

  // 节点删除确认
  const confirmDeleteNode = (node: Node) => {
    dialog.warning({
      title: '确认删除',
      content: `确定要删除节点 "${node.name}" 吗？`,
      positiveText: '删除',
      negativeText: '取消',
      onPositiveClick: async () => {
        try {
          await deleteNode(node.id);
        } catch (err) {
          // 错误已在方法内处理
        }
      },
    });
  };

  // 批量删除确认
  const confirmBatchDelete = () => {
    dialog.warning({
      title: '确认批量删除',
      content: `确定要删除选中的 ${checkedRowKeys.value.length} 个节点吗？`,
      positiveText: '删除',
      negativeText: '取消',
      onPositiveClick: async () => {
        try {
          await batchDeleteNodes(checkedRowKeys.value);
        } catch (err) {
          // 错误已在方法内处理
        }
      },
    });
  };

  // 导入节点
  const handleBatchImport = async (): Promise<ImportResult> => {
    try {
      const result = await nodeImportService.importFromText(addLink.value, importGroupId.value);
      if (result.success) {
        message.success(`成功导入 ${result.data?.imported || 0} 个节点`);
        addLink.value = '';
        importPreview.value = [];
        await fetchNodes();
      } else {
        message.error(result.message || '导入失败');
      }
      return result;
    } catch (err: any) {
      message.error(err.message || '导入失败');
      throw err;
    }
  };

  // 重置状态
  const resetState = () => {
    checkedRowKeys.value = [];
    isSorting.value = false;
    orderChanged.value = false;
    addLink.value = '';
    importPreview.value = [];
    importGroupId.value = '';
  };

  return {
    // 数据状态
    nodes,
    loading,
    error,
    checkedRowKeys,
    isSorting,
    orderChanged,
    saveOrderLoading,
    mobilePagination,
    modalStates,
    nodeFormState,
    editingNode,
    addLink,
    importPreview,
    importGroupId,
    editingGroup,
    editingGroupName,
    newGroupName,
    moveToGroupId,

    // 计算属性
    modalTitle,
    hasCheckedNodes,

    // 核心方法
    fetchNodes,
    createNode,
    updateNode,
    deleteNode,
    batchDeleteNodes,
    batchUpdateGroup,
    batchActions,
    checkNodeHealth,
    updateNodeOrder,

    // 模态框方法
    openModal,
    closeModal,
    handleSaveNode,
    confirmDeleteNode,
    confirmBatchDelete,

    // 导入方法
    handleBatchImport,

    // 工具方法
    resetState,
  };
}