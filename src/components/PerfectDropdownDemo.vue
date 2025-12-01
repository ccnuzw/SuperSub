<template>
  <div class="demo-container">
    <h1>PerfectDropdown 组件演示</h1>

    <div class="demo-section">
      <h2>基础用法</h2>
      <div class="demo-item">
        <PerfectDropdown
          :items="basicActions"
          @select="onActionSelect"
        />
      </div>
    </div>

    <div class="demo-section">
      <h2>带标题的菜单</h2>
      <div class="demo-item">
        <PerfectDropdown
          title="操作菜单"
          :items="detailedActions"
          @select="onActionSelect"
        />
      </div>
    </div>

    <div class="demo-section">
      <h2>带禁用项的菜单</h2>
      <div class="demo-item">
        <PerfectDropdown
          :items="mixedActions"
          @select="onActionSelect"
        />
      </div>
    </div>

    <div class="demo-section">
      <h2>分割线和危险操作</h2>
      <div class="demo-item">
        <PerfectDropdown
          :items="advancedActions"
          @select="onActionSelect"
        />
      </div>
    </div>

    <div class="feedback-section">
      <h2>操作反馈</h2>
      <div class="feedback-display">
        最后操作: {{ lastAction || '无' }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import PerfectDropdown from '../PerfectDropdown.vue';
import {
  Add as AddIcon,
  Create as EditIcon,
  Trash as TrashIcon,
  Copy as CopyIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  Settings as SettingsIcon,
  LogOut as LogOutIcon,
  Warning as WarningIcon
} from '@vicons/ionicons5';

const lastAction = ref('');

const onActionSelect = (key: string, item: any) => {
  lastAction.value = `${key} - ${item.label}`;
  console.log('Action selected:', key, item);
};

// 基础操作
const basicActions = [
  {
    label: '新建',
    key: 'new',
    icon: AddIcon,
    description: '创建新的项目',
  },
  {
    label: '编辑',
    key: 'edit',
    icon: EditIcon,
    description: '编辑选中的项目',
  },
  {
    label: '删除',
    key: 'delete',
    icon: TrashIcon,
    description: '删除选中的项目',
  },
];

// 带详细描述的操作
const detailedActions = [
  {
    label: '复制',
    key: 'copy',
    icon: CopyIcon,
    description: '复制到剪贴板',
    shortcut: 'Ctrl+C',
  },
  {
    label: '导出',
    key: 'export',
    icon: DownloadIcon,
    description: '导出为文件',
    shortcut: 'Ctrl+E',
  },
  {
    label: '刷新',
    key: 'refresh',
    icon: RefreshIcon,
    description: '重新加载数据',
    shortcut: 'F5',
  },
];

// 混合禁用状态的操作
const mixedActions = [
  {
    label: '设置',
    key: 'settings',
    icon: SettingsIcon,
    description: '打开应用设置',
  },
  {
    label: '操作',
    key: 'action',
    disabled: true,
    icon: RefreshIcon,
    description: '暂时不可用',
  },
  {
    label: '特殊操作',
    key: 'special',
    icon: AddIcon,
    description: '特殊功能',
    badge: 'PRO',
  },
];

// 高级操作（包含分割线和危险操作）
const advancedActions = [
  {
    label: '保存',
    key: 'save',
    icon: DownloadIcon,
    description: '保存当前更改',
  },
  {
    label: '重置',
    key: 'reset',
    icon: RefreshIcon,
    description: '重置到默认状态',
  },
  {
    type: 'divider',
    key: 'divider-1',
  },
  {
    label: '警告操作',
    key: 'warning',
    icon: WarningIcon,
    description: '请谨慎操作',
  },
  {
    type: 'divider',
    key: 'divider-2',
  },
  {
    label: '退出登录',
    key: 'logout',
    type: 'danger',
    icon: LogOutIcon,
    description: '安全退出当前账户',
  },
];
</script>

<style scoped>
.demo-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 24px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.demo-section {
  margin-bottom: 48px;
}

.demo-section h2 {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 16px;
  color: #333;
}

.demo-item {
  display: flex;
  gap: 16px;
  align-items: center;
  padding: 24px;
  background: #f8f9fa;
  border-radius: 12px;
  border: 1px solid #e9ecef;
}

.feedback-section {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 24px;
  border-radius: 12px;
  color: white;
}

.feedback-section h2 {
  color: white;
  margin-bottom: 16px;
}

.feedback-display {
  background: rgba(255, 255, 255, 0.2);
  padding: 12px 16px;
  border-radius: 8px;
  font-family: 'SF Mono', 'Monaco', 'Consolas', monospace;
  font-size: 14px;
}

/* 深色主题 */
.dark .demo-container {
  color: #fff;
}

.dark .demo-section h2 {
  color: #fff;
}

.dark .demo-item {
  background: #1a1a1a;
  border-color: #333;
}
</style>