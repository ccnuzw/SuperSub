# SuperSub 组件库文档

## 概述

这是SuperSub项目中使用的通用Vue 3组件库，基于TypeScript和Naive UI构建。

## 组件列表

### 通用组件 (src/components/common/)

#### ActionButtonGroup

操作按钮组组件，用于展示一系列相关操作按钮。

**Props:**
- `actions: ActionButton[]` - 按钮配置数组
- `size?: 'small' | 'medium' | 'large'` - 按钮大小，默认 'medium'
- `vertical?: boolean` - 垂直排列，默认 false
- `compact?: boolean` - 紧凑模式，默认 false

**事件:**
- `action: (key: string) => void` - 按钮点击事件

**示例:**
```vue
<ActionButtonGroup
  :actions="[
    { key: 'add', label: '新增', type: 'primary', icon: AddOutline },
    { key: 'delete', label: '删除', type: 'error', icon: TrashOutline }
  ]"
  @action="handleAction"
/>
```

#### StatsCard

统计卡片组件，用于显示关键指标数据。

**Props:**
- `title: string` - 卡片标题
- `value: number | string` - 主要显示值
- `unit?: string` - 单位
- `subtitle?: string` - 副标题
- `icon?: any` - 图标组件
- `color?: 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info'` - 颜色主题
- `size?: 'small' | 'medium' | 'large'` - 尺寸

**示例:**
```vue
<StatsCard
  title="总用户数"
  :value="1000"
  unit="人"
  icon="PeopleOutline"
  color="primary"
/>
```

#### ConfirmDialog

确认对话框组件，用于需要用户确认的操作。

**Props:**
- `show: boolean` - 是否显示
- `title: string` - 对话框标题
- `message?: string` - 确认消息
- `type?: 'info' | 'success' | 'warning' | 'error'` - 对话框类型
- `positiveText?: string` - 确认按钮文本
- `negativeText?: string` - 取消按钮文本
- `loading?: boolean` - 加载状态

**事件:**
- `confirm: () => void | Promise<void>` - 确认回调
- `cancel: () => void` - 取消回调

**示例:**
```vue
<ConfirmDialog
  :show="showConfirm"
  title="删除确认"
  message="确定要删除这个项目吗？"
  type="warning"
  @confirm="handleDelete"
  @cancel="showConfirm = false"
/>
```

#### DataTable

增强的数据表格组件，基于Naive UI DataTable封装。

**Props:**
- `columns: DataTableColumns<T>[]` - 表格列配置
- `data: T[]` - 表格数据
- `loading?: boolean` - 加载状态
- `pagination?: PaginationProps` - 分页配置
- ` bordered?: boolean` - 边框
- `scrollX?: number` - 横向滚动宽度

#### ErrorBoundary

错误边界组件，用于捕获和处理组件树中的错误。

**Props:**
- `fallback?: Component` - 错误时显示的组件
- `onError?: (error: Error) => void` - 错误处理回调

#### LoadingSpinner

加载动画组件，显示旋转的加载指示器。

**Props:**
- `size?: 'small' | 'medium' | 'large'` - 尺寸
- `text?: string` - 加载文本

#### SkeletonLoader

骨架屏组件，在内容加载时显示占位符。

**Props:**
- `rows?: number` - 骨架屏行数
- `animated?: boolean` - 是否启用动画

### 订阅管理组件 (src/components/subscription/)

#### SubscriptionImport

订阅批量导入组件，支持多种格式的订阅链接导入。

**Props:**
- `show: boolean` - 是否显示
- `groups: SubscriptionGroup[]` - 可用分组列表

**事件:**
- `success: () => void` - 导入成功回调
- `cancel: () => void` - 取消回调

### 节点管理组件 (src/components/nodes/)

#### NodeForm

节点表单组件，用于创建和编辑节点信息。

**Props:**
- `show: boolean` - 是否显示
- `node?: Node` - 编辑的节点数据
- `groups: NodeGroup[]` - 可用分组列表

**事件:**
- `success: (node: Node) => void` - 保存成功回调
- `cancel: () => void` - 取消回调

## 工具函数

### 性能监控 (src/utils/performance.ts)

提供简单的性能监控功能：

```typescript
import { performanceMonitor } from '@/utils/performance'

// 开始计时
performanceMonitor.start('operation-name')

// 执行操作...

// 结束计时
const duration = performanceMonitor.end('operation-name')

// 获取统计信息
const stats = performanceMonitor.getStats('operation-name')
console.log(`平均耗时: ${stats.avg}ms`)
```

### Composables

#### useIsMobile

响应式媒体检测Hook：

```typescript
import { useIsMobile } from '@/composables/useMediaQuery'

const isMobile = useIsMobile()
```

## 开发指南

### 组件开发规范

1. **TypeScript**: 所有组件必须使用TypeScript和Composition API
2. **命名**: 组件使用PascalCase命名，文件名与组件名一致
3. **Props**: 必须定义明确的接口和类型
4. **文档**: 复杂组件需要添加JSDoc注释
5. **样式**: 优先使用Tailwind CSS类

### 组件结构模板

```vue
<template>
  <!-- 组件模板 -->
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

interface Props {
  // Props 定义
}

const props = withDefaults(defineProps<Props>(), {
  // 默认值
})

interface Emits {
  (e: 'event-name', payload: any): void
}

const emit = defineEmits<Emits>()

// 组件逻辑
</script>

<style scoped>
/* 组件样式 */
</style>
```

## 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/new-component`)
3. 提交更改 (`git commit -am 'Add new component'`)
4. 推送到分支 (`git push origin feature/new-component`)
5. 创建 Pull Request

## 版本历史

- **v1.0.0** - 初始版本，包含基础组件库
- **v1.1.0** - 添加性能监控和增强组件