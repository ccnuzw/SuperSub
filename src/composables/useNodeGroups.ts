import { ref, computed } from 'vue';
import { useMessage, useDialog } from 'naive-ui';
import { useGroupStore, type NodeGroup } from '@/stores/groups';
import { NodeGroupService } from '@/services/nodeGroupService';
import type { Node } from '@/types/entities';

// 标签页配置
export interface TabConfig {
  id: string;
  name: string;
  count: number;
  disabled?: boolean;
}

// 分组操作类型
export type GroupAction = 'rename' | 'delete' | 'toggle' | 'move';

export function useNodeGroups(nodeList: any) {
  const nodeGroupService = new NodeGroupService();
  const groupStore = useGroupStore();
  const message = useMessage();
  const dialog = useDialog();

  // 响应式状态
  const activeTab = ref<string>('all');
  const groupCounts = ref<Record<string, number>>({ all: 0, ungrouped: 0 });
  const activeDropdownGroup = ref<NodeGroup | null>(null);

  // 计算属性
  const tabs = computed<TabConfig[]>(() => {
    const tabs: TabConfig[] = [
      { id: 'all', name: '全部', count: groupCounts.value.all || 0 },
      { id: 'ungrouped', name: '未分组', count: groupCounts.value.ungrouped || 0 },
    ];

    // 添加用户创建的分组
    groupStore.groups.forEach(group => {
      tabs.push({
        id: group.id,
        name: group.name,
        count: groupCounts.value[group.id] || 0,
        disabled: !group.is_enabled,
      });
    });

    return tabs;
  });

  const activeGroupInfo = computed(() => {
    if (activeTab.value === 'all') {
      return { name: '全部', type: 'system' as const };
    }
    if (activeTab.value === 'ungrouped') {
      return { name: '未分组', type: 'system' as const };
    }

    const group = groupStore.groups.find(g => g.id === activeTab.value);
    return group ? { name: group.name, type: 'custom' as const, group } : null;
  });

  // 计算分组计数
  const calculateGroupCounts = (nodes: Node[]): Record<string, number> => {
    const counts: Record<string, number> = {
      all: nodes.length,
      ungrouped: 0,
    };

    nodes.forEach(node => {
      if (node.group_id) {
        counts[node.group_id] = (counts[node.group_id] || 0) + 1;
      } else {
        counts.ungrouped++;
      }
    });

    return counts;
  };

  // 更新分组计数
  const updateGroupCounts = () => {
    if (nodeList?.value) {
      groupCounts.value = calculateGroupCounts(nodeList.value);
    }
  };

  // 过滤节点的分组条件
  const filterNodeByGroup = (node: Node, groupId: string): boolean => {
    if (groupId === 'all') {
      return true;
    }
    if (groupId === 'ungrouped') {
      return !node.group_id;
    }
    return node.group_id === groupId;
  };

  // 标签页操作
  const handleTabClick = (tabId: string) => {
    activeTab.value = tabId;
  };

  const handleGroupTabClick = (group: NodeGroup, event: MouseEvent) => {
    const target = event.target as HTMLElement;
    if (target.closest('.group-actions-button')) {
      // 如果点击的是操作按钮，不切换标签页
      return;
    }
    activeTab.value = group.id;
  };

  // 分组右键菜单
  const handleGroupContextMenu = (group: NodeGroup, event: MouseEvent) => {
    event.preventDefault();
    activeDropdownGroup.value = group;
  };

  // 分组操作菜单
  const getGroupDropdownOptions = (group: NodeGroup) => {
    return [
      { label: group.is_enabled ? '禁用' : '启用', key: 'toggle' },
      { label: '重命名', key: 'rename' },
      { label: '删除', key: 'delete' },
    ];
  };

  const handleGroupAction = async (key: string, group: NodeGroup) => {
    activeDropdownGroup.value = group;

    switch (key) {
      case 'rename':
        // 这里应该通过emit触发重命名模态框
        return { action: 'rename', group };

      case 'toggle':
        await toggleGroup(group.id);
        break;

      case 'delete':
        confirmDeleteGroup(group);
        break;
    }
  };

  // 分组CRUD操作
  const fetchGroups = async () => {
    try {
      await groupStore.fetchGroups();
    } catch (err: any) {
      message.error('获取分组列表失败');
    }
  };

  const createGroup = async (name: string): Promise<void> => {
    try {
      await groupStore.addGroup(name);
      message.success('分组创建成功');
    } catch (err: any) {
      message.error(err.message || '创建分组失败');
    }
  };

  const updateGroup = async (id: string, name: string): Promise<void> => {
    try {
      await groupStore.updateGroup(id, name);
      message.success('分组重命名成功');
    } catch (err: any) {
      message.error(err.message || '重命名分组失败');
    }
  };

  const deleteGroup = async (id: string): Promise<void> => {
    try {
      await groupStore.deleteGroup(id);
      message.success('分组删除成功');

      // 如果删除的是当前激活的分组，切换到"全部"标签页
      if (activeTab.value === id) {
        activeTab.value = 'all';
      }
    } catch (err: any) {
      message.error(err.message || '删除分组失败');
    }
  };

  const toggleGroup = async (id: string): Promise<void> => {
    try {
      await groupStore.toggleGroup(id);
    } catch (err: any) {
      message.error(err.message || '切换分组状态失败');
    }
  };

  const confirmDeleteGroup = (group: NodeGroup) => {
    dialog.warning({
      title: '确认删除分组',
      content: `确定要删除分组 "${group.name}" 吗？分组下的节点将变为"未分组"。`,
      positiveText: '删除',
      negativeText: '取消',
      onPositiveClick: async () => {
        try {
          await deleteGroup(group.id);
        } catch (err) {
          // 错误已在方法内处理
        }
      },
    });
  };

  // 分组排序
  const updateGroupOrder = async (groupIds: string[]): Promise<void> => {
    try {
      await groupStore.updateGroupOrder(groupIds);
      message.success('分组排序更新成功');
    } catch (err: any) {
      message.error(err.message || '更新分组排序失败');
    }
  };

  // 获取移动到分组的选项
  const getMoveToGroupOptions = (): Array<{ label: string; value: string }> => {
    const options = [
      { label: '未分组', value: '' },
    ];

    groupStore.groups
      .filter(group => group.is_enabled)
      .forEach(group => {
        options.push({
          label: group.name,
          value: group.id,
        });
      });

    return options;
  };

  // 验证分组名称
  const validateGroupName = (name: string): { isValid: boolean; error?: string } => {
    if (!name || name.trim() === '') {
      return { isValid: false, error: '分组名称不能为空' };
    }

    if (name.length > 20) {
      return { isValid: false, error: '分组名称不能超过20个字符' };
    }

    // 检查是否与现有分组重名
    const existingGroup = groupStore.groups.find(g => g.name === name.trim());
    if (existingGroup) {
      return { isValid: false, error: '分组名称已存在' };
    }

    return { isValid: true };
  };

  // 获取分组的完整信息
  const getGroupById = (groupId: string): NodeGroup | null => {
    return groupStore.groups.find(g => g.id === groupId) || null;
  };

  // 检查分组是否启用
  const isGroupEnabled = (groupId: string): boolean => {
    if (groupId === 'all' || groupId === 'ungrouped') {
      return true;
    }
    const group = getGroupById(groupId);
    return group?.is_enabled || false;
  };

  // 获取分组的显示名称
  const getGroupDisplayName = (groupId: string): string => {
    if (groupId === 'all') return '全部';
    if (groupId === 'ungrouped') return '未分组';
    const group = getGroupById(groupId);
    return group?.name || '未知分组';
  };

  // 重置状态
  const resetState = () => {
    activeTab.value = 'all';
    groupCounts.value = { all: 0, ungrouped: 0 };
    activeDropdownGroup.value = null;
  };

  // 获取分组计数（用于工具栏显示）
  const getGroupCounts = () => {
    return groupCounts.value;
  };

  // 处理标签页切换（工具栏使用）
  const handleTabChange = (tabId: string) => {
    activeTab.value = tabId;
  };

  return {
    // 响应式状态
    activeTab,
    groupCounts,
    activeDropdownGroup,
    tabs,
    activeGroupInfo,

    // 计算属性方法
    filterNodeByGroup,
    getGroupDropdownOptions,
    getMoveToGroupOptions,
    getGroupCounts,
    validateGroupName,
    getGroupById,
    isGroupEnabled,
    getGroupDisplayName,

    // 核心方法
    updateGroupCounts,
    fetchGroups,
    createGroup,
    updateGroup,
    deleteGroup,
    toggleGroup,
    confirmDeleteGroup,
    updateGroupOrder,

    // 交互方法
    handleTabClick,
    handleTabChange,
    handleGroupTabClick,
    handleGroupContextMenu,
    handleGroupAction,

    // 工具方法
    resetState,
  };
}