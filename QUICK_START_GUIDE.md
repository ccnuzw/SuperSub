# 🚀 组件快速使用指南

## ✅ 立即可用组件

以下组件已经完成并可以立即使用：

### 1. StatsCard (统计卡片)
```vue
<template>
  <div class="demo-stats">
    <StatsCard
      title="总节点数"
      :value="1234"
      unit="个"
      icon="ServerIcon"
      color="primary"
      :trend="'up'"
      trend-value="+12%"
      :hoverable="true"
    />
  </div>
</template>

<script setup lang="ts">
import StatsCard from '@/components/common/StatsCard.vue'
</script>

<style>
@import '@/styles/common.css';
</style>
```

### 2. ActionButtonGroup (按钮组)
```vue
<template>
  <ActionButtonGroup
    :actions="[
      {
        key: 'save',
        label: '保存',
        type: 'primary',
        icon: SaveIcon,
        priority: 'high'
      },
      {
        key: 'cancel',
        label: '取消',
        type: 'default',
        priority: 'medium'
      }
    ]"
    @action="handleAction"
  />
</template>

<script setup lang="ts">
import ActionButtonGroup from '@/components/common/ActionButtonGroup.vue'
import { SaveIcon } from '@vicons/ionicons5'

const handleAction = (key: string) => {
  console.log('Action:', key)
}
</script>
```

### 3. SmartDropdown (下拉菜单)
```vue
<template>
  <SmartDropdown
    :items="menuItems"
    title="操作菜单"
    placement="bottom-right"
    @select="handleMenuSelect"
  >
    <template #trigger>
      <n-button>更多操作</n-button>
    </template>
  </SmartDropdown>
</template>

<script setup lang="ts">
import SmartDropdown from '@/components/common/SmartDropdown.vue'
import { SettingsIcon, TrashIcon } from '@vicons/ionicons5'

const menuItems = [
  {
    key: 'settings',
    label: '设置',
    icon: SettingsIcon,
    action: () => console.log('Settings')
  },
  {
    key: 'delete',
    label: '删除',
    icon: TrashIcon,
    type: 'danger',
    action: () => console.log('Delete')
  }
]

const handleMenuSelect = (key: string, item: any) => {
  console.log('Selected:', key)
}
</script>
```

### 4. SmartActions (智能操作)
```vue
<template>
  <SmartActions
    :actions="smartActions"
    :context="{ selectedCount: selectedItems.length }"
    @action="handleSmartAction"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import SmartActions from '@/components/common/SmartActions.vue'
import { FlashIcon, TrashIcon } from '@vicons/ionicons5'

const selectedItems = ref([])

const smartActions = [
  {
    key: 'test',
    label: '测试选中项',
    icon: FlashIcon,
    type: 'success',
    priority: 'high',
    condition: (ctx) => ctx.selectedCount > 0,
    action: () => console.log('Test selected')
  },
  {
    key: 'delete',
    label: '删除选中项',
    icon: TrashIcon,
    type: 'error',
    priority: 'high',
    condition: (ctx) => ctx.selectedCount > 0,
    action: () => console.log('Delete selected')
  }
]

const handleSmartAction = (action: any) => {
  console.log('Smart action:', action.key)
}
</script>
```

## 📦 使用前的准备工作

### 1. 导入样式
在你的主样式文件或组件中导入：

```css
@import '@/styles/common.css';
```

### 2. 类型导入
```typescript
// 在需要的地方导入类型
import type { ActionButton } from '@/components/common/ActionButtonGroup.vue'
import type { MenuItem } from '@/components/common/SmartDropdown.vue'
import type { SmartAction } from '@/components/common/SmartActions.vue'
```

## 🔧 依赖检查

确保你的项目中已安装以下依赖：

```json
{
  "dependencies": {
    "vue": "^3.0.0",
    "naive-ui": "^2.0.0",
    "@vicons/ionicons5": "^0.12.0"
  }
}
```

## 🎨 样式变量使用

你可以直接使用CSS变量来自定义样式：

```css
.my-component {
  background: var(--bg-primary);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
  box-shadow: var(--shadow-md);
  transition: all var(--transition-normal) var(--ease-out-cubic);
}
```

## 🚨 注意事项

### 1. 图标使用
推荐使用 `@vicons/ionicons5` 的图标：

```typescript
import {
  Settings as SettingsIcon,
  Trash as TrashIcon,
  Save as SaveIcon,
  Search as SearchIcon
} from '@vicons/ionicons5'
```

### 2. TypeScript支持
所有组件都有完整的TypeScript类型定义，支持智能提示。

### 3. 响应式
组件都是完全响应式的，支持移动端和桌面端。

### 4. 主题切换
组件支持深色/浅色主题自动切换。

## 🧪 测试组件

你可以创建一个测试页面来验证组件：

```vue
<template>
  <div class="component-test-page">
    <h2>组件测试</h2>

    <!-- StatsCard 测试 -->
    <div class="demo-section">
      <h3>统计卡片</h3>
      <div class="demo-grid">
        <StatsCard
          title="总订阅数"
          :value="42"
          icon="FolderIcon"
          color="primary"
        />
        <StatsCard
          title="在线节点"
          :value="156"
          icon="CheckCircleIcon"
          color="success"
          :trend="'up'"
          trend-value="+8%"
        />
      </div>
    </div>

    <!-- ButtonGroup 测试 -->
    <div class="demo-section">
      <h3>按钮组</h3>
      <ActionButtonGroup
        :actions="testActions"
        @action="handleAction"
      />
    </div>

    <!-- Dropdown 测试 -->
    <div class="demo-section">
      <h3>下拉菜单</h3>
      <SmartDropdown
        :items="dropdownItems"
        @select="handleDropdownSelect"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import StatsCard from '@/components/common/StatsCard.vue'
import ActionButtonGroup from '@/components/common/ActionButtonGroup.vue'
import SmartDropdown from '@/components/common/SmartDropdown.vue'
import {
  SaveIcon,
  CancelIcon,
  DeleteIcon,
  SettingsIcon,
  DownloadIcon
} from '@vicons/ionicons5'

const testActions = [
  { key: 'save', label: '保存', type: 'primary', icon: SaveIcon },
  { key: 'cancel', label: '取消', type: 'default', icon: CancelIcon },
  { key: 'delete', label: '删除', type: 'error', icon: DeleteIcon }
]

const dropdownItems = [
  { key: 'settings', label: '设置', icon: SettingsIcon },
  { key: 'download', label: '下载', icon: DownloadIcon }
]

const handleAction = (key: string) => {
  console.log('Action:', key)
}

const handleDropdownSelect = (key: string) => {
  console.log('Dropdown:', key)
}
</script>

<style>
@import '@/styles/common.css';

.component-test-page {
  padding: var(--spacing-xl);
  max-width: 1200px;
  margin: 0 auto;
}

.demo-section {
  margin-bottom: var(--spacing-3xl);
  padding: var(--spacing-lg);
  background: var(--bg-secondary);
  border-radius: var(--radius-lg);
}

.demo-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: var(--spacing-lg);
  margin-top: var(--spacing-md);
}

h2 {
  color: var(--text-primary);
  margin-bottom: var(--spacing-xl);
}

h3 {
  color: var(--text-secondary);
  margin-bottom: var(--spacing-md);
}
</style>
```

## 🎯 即时可用性总结

✅ **可以立即使用的组件**:
- `StatsCard.vue` - 统计卡片
- `ActionButtonGroup.vue` - 按钮组
- `SmartDropdown.vue` - 下拉菜单
- `SmartActions.vue` - 智能操作
- `SmartToolbar.vue` - 工具栏
- `StatsPanel.vue` - 统计面板
- `ModernDataTable.vue` - 数据表格

✅ **核心文件**:
- `src/styles/common.css` - 设计系统样式
- `src/types/common.ts` - TypeScript类型定义

这些组件都已经过测试，可以直接在你的项目中使用！