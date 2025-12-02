# BulkActionsBar 美化版使用指南

全新的 BulkActionsBar 批量操作栏组件已经全面美化，现在提供了更加现代化和美观的界面设计！

## 🎨 全新设计特色

### 1. 现代化视觉设计
- **渐变背景** - 使用现代渐变色彩和毛玻璃效果
- **动态背景** - 旋转光晕和几何图案装饰
- **智能配色** - 根据选择率和状态自动调整颜色
- **深度阴影** - 立体感强的投影效果

### 2. 丰富的功能特性
- **智能建议系统** - 基于上下文提供操作建议
- **进度指示器** - 顶部显示选择百分比进度条
- **动态图标** - 脉冲动画和悬浮效果
- **响应式布局** - 完美适配各种屏幕尺寸

### 3. 增强的交互体验
- **流畅动画** - 弹性进入动画和悬浮效果
- **视觉反馈** - 按钮悬浮和点击反馈
- **智能分组** - 主要操作和次要操作分离
- **状态感知** - 根据选择数量调整界面

## 🚀 使用示例

### 基础用法

```vue
<template>
  <BulkActionsBar
    :selected-count="selectedItems.length"
    :total-count="totalItems"
    :common-actions="actions"
    @action="handleAction"
  />
</template>
```

### 完整功能示例

```vue
<template>
  <div class="page-container">
    <!-- 数据表格 -->
    <n-data-table
      :columns="columns"
      :data="tableData"
      :row-key="row => row.id"
      @update:checked-row-keys="handleSelection"
    />

    <!-- 批量操作栏 -->
    <BulkActionsBar
      :selected-count="selectedItems.length"
      :total-count="tableData.length"
      :common-actions="filteredActions"
      :more-actions="moreActions"
      :smart-suggestions="smartSuggestions"
      :show-select-all="true"
      :is-all-selected="isAllSelected"
      :sticky="true"
      :animated="true"
      position="bottom"
      size="medium"
      @action="handleAction"
      @suggestion="handleSuggestion"
      @select-all="handleSelectAll"
      @clear-selection="handleClearSelection"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import BulkActionsBar from '@/components/common/BulkActionsBar.vue'

const selectedItems = ref([])
const tableData = ref([])

// 常用操作
const actions = [
  {
    key: 'export',
    label: '导出数据',
    icon: DownloadOutlined,
    type: 'primary',
    handler: () => exportData()
  },
  {
    key: 'edit',
    label: '批量编辑',
    icon: EditOutlined,
    type: 'default',
    handler: () => batchEdit()
  },
  {
    key: 'delete',
    label: '批量删除',
    icon: DeleteOutlined,
    type: 'error',
    danger: true,
    handler: () => batchDelete()
  }
]

// 更多操作
const moreActions = [
  {
    key: 'duplicate',
    label: '批量复制',
    icon: CopyOutlined,
    handler: () => batchDuplicate()
  },
  {
    key: 'archive',
    label: '批量归档',
    icon: FolderOutlined,
    handler: () => batchArchive()
  },
  {
    key: 'refresh',
    label: '刷新数据',
    icon: ReloadOutlined,
    handler: () => refreshData()
  }
]

// 智能建议
const smartSuggestions = [
  {
    key: 'test-offline',
    label: '测试离线项',
    icon: WifiOutlined,
    priority: 1,
    handler: () => testOfflineItems()
  },
  {
    key: 'reorganize',
    label: '重新组织',
    icon: SortAscendingOutlined,
    priority: 2,
    handler: () => reorganizeItems()
  }
]

// 根据选择情况过滤操作
const filteredActions = computed(() => {
  if (selectedItems.value.length === 0) return []

  return actions.filter(action => {
    if (action.key === 'edit' && selectedItems.value.length > 10) {
      return false // 限制批量编辑数量
    }
    return true
  })
})

// 事件处理
const handleAction = (action) => {
  console.log('执行操作:', action)
  action.handler()
}

const handleSuggestion = (suggestion) => {
  console.log('执行建议:', suggestion)
  suggestion.handler()
}

const handleSelectAll = () => {
  selectedItems.value = [...tableData.value]
}

const handleClearSelection = () => {
  selectedItems.value = []
}
</script>
```

### 不同尺寸示例

```vue
<template>
  <!-- 小尺寸 -->
  <BulkActionsBar
    :selected-count="3"
    :common-actions="actions"
    size="small"
  />

  <!-- 中等尺寸 -->
  <BulkActionsBar
    :selected-count="15"
    :common-actions="actions"
    size="medium"
  />

  <!-- 大尺寸 -->
  <BulkActionsBar
    :selected-count="50"
    :common-actions="actions"
    size="large"
  />
</template>
```

### 位置配置示例

```vue
<template>
  <!-- 顶部固定 -->
  <BulkActionsBar
    :selected-count="selectedCount"
    :common-actions="actions"
    position="top"
    :sticky="true"
  />

  <!-- 底部非固定 -->
  <BulkActionsBar
    :selected-count="selectedCount"
    :common-actions="actions"
    position="bottom"
    :sticky="false"
  />
</template>
```

## 🎯 高级配置

### 操作对象接口

```typescript
interface Action {
  key: string                      // 唯一标识
  label: string                    // 按钮文本
  icon?: any                       // 图标组件
  type?: 'default' | 'primary' | 'info' | 'success' | 'warning' | 'error'
  disabled?: boolean               // 是否禁用
  loading?: boolean                // 是否加载中
  danger?: boolean                 // 是否危险操作
  tooltip?: string                 // 工具提示
  handler?: () => void | Promise<void>  // 处理函数
}

interface SmartSuggestion extends Action {
  priority: number                 // 优先级
  condition?: () => boolean        // 显示条件
}
```

### 组件属性

```typescript
interface Props {
  selectedCount: number            // 已选择数量（必需）
  totalCount?: number              // 总数量
  commonActions?: Action[]         // 常用操作
  moreActions?: Action[]           // 更多操作
  smartSuggestions?: SmartSuggestion[]  // 智能建议
  position?: 'top' | 'bottom'      // 显示位置
  size?: 'small' | 'medium' | 'large'  // 尺寸大小
  showSelectAll?: boolean          // 显示全选按钮
  isAllSelected?: boolean          // 是否已全选
  animated?: boolean               // 启用动画
  sticky?: boolean                 // 是否粘性定位
}
```

### 事件

```typescript
interface Emits {
  action: [action: Action]                        // 操作触发
  suggestion: [suggestion: SmartSuggestion]      // 建议触发
  'select-all': []                               // 全选触发
  'clear-selection': []                          // 清除选择触发
}
```

## 🌈 视觉状态

### 1. 正常状态
- 渐变背景：蓝紫色系
- 选择图标：白色带脉冲效果
- 按钮：半透明毛玻璃效果

### 2. 高选择率状态
- 当选择率 > 50% 时自动切换
- 渐变背景：红橙色系
- 进度条：蓝绿色系

### 3. 有建议状态
- 建议分隔器：脉冲动画
- 智能建议按钮：突出显示

### 4. 悬浮状态
- 整体上移效果
- 阴影加深
- 背景光晕增强

## 📱 响应式设计

### 桌面端 (>1024px)
- 完整的横向布局
- 所有功能按钮可见

### 平板端 (768px-1024px)
- 分组布局
- 按钮自动换行

### 手机端 (<768px)
- 纵向堆叠布局
- 按钮尺寸缩小
- 隐藏次要文字

## 🎭 动画效果

### 进入动画
- 弹性缩放效果
- 从下往上滑入

### 交互动画
- 按钮悬浮上移
- 图标脉冲效果
- 背景光晕旋转

### 状态切换
- 渐变颜色过渡
- 进度条动画
- 阴影深度变化

## 🎨 自定义样式

### 主题色彩

```css
/* 自定义渐变色 */
.bulk-actions-bar {
  background: linear-gradient(135deg, #your-color-1 0%, #your-color-2 100%);
}

/* 自定义按钮样式 */
.action-btn--custom {
  background: rgba(your-color, 0.8) !important;
  border-color: rgba(your-color, 0.9) !important;
}
```

### 动画定制

```css
/* 自定义动画时长 */
.bulk-actions-bar--animated {
  animation: slide-in-bounce 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

/* 自定义悬浮效果 */
.bulk-actions-bar:hover {
  transform: translateY(-4px);
  box-shadow: 0 16px 64px rgba(102, 126, 234, 0.5);
}
```

## 🎉 最佳实践

1. **操作分类**: 将常用操作放在 `commonActions`，次要操作放在 `moreActions`
2. **智能建议**: 基于用户行为提供上下文相关的建议操作
3. **状态管理**: 根据选择数量和类型动态显示/隐藏操作
4. **性能优化**: 大数据量时使用虚拟滚动和防抖处理
5. **可访问性**: 提供键盘导航和屏幕阅读器支持

现在就试试这个全新的批量操作栏，为你的应用带来卓越的用户体验！