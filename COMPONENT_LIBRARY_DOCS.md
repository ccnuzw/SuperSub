# SuperSub 组件库文档

## 📖 概述

SuperSub组件库是基于Vue 3 + TypeScript构建的企业级UI组件库，专为代理订阅管理系统设计。

## 🏗️ 组件架构

### **分层结构**

```
src/components/
├── base/              # 基础组件层
│   ├── SsButton.vue    # 通用按钮组件
│   ├── SsInput.vue     # 通用输入框组件
│   ├── SsCard.vue      # 通用卡片组件
│   ├── SsBadge.vue     # 徽章组件
│   └── SsStatus.vue    # 状态指示器组件
├── business/          # 业务组件层
│   ├── NodeCard.vue      # 节点卡片
│   ├── SubscriptionCard.vue # 订阅卡片
│   ├── NodeStatusIndicator.vue # 节点状态
│   └── SubscriptionStatusIndicator.vue # 订阅状态
├── layout/            # 布局组件层
│   ├── AppLayout.vue    # 应用主布局
│   ├── AppHeader.vue    # 应用头部
│   ├── Sidebar.vue      # 侧边栏
│   └── index.ts         # 布局组件导出
├── common/            # 通用组件层
│   ├── GlobalSearchResults.vue # 全局搜索结果
│   └── LoadingSpinner.vue      # 加载动画
├── profile/           # 配置文件组件
│   ├── ProfileForm.vue  # 配置文件表单
│   ├── ProfilePreview.vue # 配置文件预览
│   ├── ProfileBasicForm.vue # 基础信息表单
│   └── ProfileDataSource.vue # 数据源配置
├── settings/          # 设置组件
│   ├── GeneralSettings.vue # 通用设置
│   ├── ConversionSettings.vue # 转换设置
│   └── ProfileRulesManager.vue # 配置规则管理
├── nodes/             # 节点相关组件
│   ├── NodeTable.vue    # 节点表格
│   ├── NodeFormModal.vue # 节点表单弹窗
│   └── NodeSelection.vue # 节点选择器
└── subscriptions/     # 订阅相关组件
    ├── SubscriptionTable.vue # 订阅表格
    ├── SubscriptionFormModal.vue # 订阅表单弹窗
    ├── SubscriptionNodesPreview.vue # 节点预览
    └── SubscriptionGroupTabs.vue # 订阅分组标签
```

## 🎨 设计系统

### **色彩规范**

```typescript
// 主色调
primary: {
  50: '#eff6ff',
  500: '#3b82f6', // 主色
  900: '#1e3a8a'
}

// 语义化颜色
semantic: {
  success: '#16a34a',
  warning: '#d97706',
  error: '#dc2626',
  info: '#2563eb'
}

// 状态颜色
status: {
  healthy: '#10b981',
  unhealthy: '#ef4444',
  pending: '#f59e0b',
  testing: '#3b82f6'
}
```

### **尺寸规范**

| 尺寸 | 值 | 使用场景 |
|------|----|----------|
| xs | 0.75rem | 小型文本、标签 |
| sm | 0.875rem | 小按钮、输入框 |
| base | 1rem | 正文、默认 |
| lg | 1.125rem | 副标题 |
| xl | 1.25rem | 标题 |
| 2xl | 1.5rem | 大标题 |

### **间距规范**

| 间距 | 值 | 使用场景 |
|------|----|----------|
| 1 | 0.25rem | 最小间距 |
| 2 | 0.5rem | 小元素间距 |
| 3 | 0.75rem | 中等间距 |
| 4 | 1rem | 标准间距 |
| 6 | 1.5rem | 大间距 |
| 8 | 2rem | 最大间距 |

## 🧩 基础组件使用指南

### **SsButton 按钮**

```vue
<template>
  <!-- 基础按钮 -->
  <SsButton>默认按钮</SsButton>

  <!-- 不同变体 -->
  <SsButton variant="primary">主要按钮</SsButton>
  <SsButton variant="secondary">次要按钮</SsButton>
  <SsButton variant="danger">危险按钮</SButton>

  <!-- 不同尺寸 -->
  <SsButton size="sm">小按钮</SsButton>
  <SsButton size="lg">大按钮</SsButton>

  <!-- 状态按钮 -->
  <SsButton :loading="true">加载中</SsButton>
  <SsButton :disabled="true">禁用按钮</SsButton>

  <!-- 事件处理 -->
  <SsButton @click="handleClick">点击事件</SsButton>
</template>
```

**Props接口**:
```typescript
interface Props extends IStandardProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success'
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  type?: 'button' | 'submit' | 'reset'
  loading?: boolean
  disabled?: boolean
}
```

**事件**:
```typescript
interface Emits extends IStandardEmits {
  click: [event: MouseEvent]
}
```

### **SsInput 输入框**

```vue
<template>
  <!-- 基础输入框 -->
  <SsInput v-model="value" placeholder="请输入内容" />

  <!-- 不同类型 -->
  <SsInput type="password" v-model="password" />
  <SsInput type="email" v-model="email" />
  <SsInput type="number" v-model="number" />

  <!-- 带标签 -->
  <SsInput label="用户名" placeholder="请输入用户名" />

  <!-- 验证状态 -->
  <SsInput v-model="email" error="请输入有效的邮箱地址" />

  <!-- 可清空 -->
  <SsInput v-model="search" clearable placeholder="搜索..." />
</template>
```

**Props接口**:
```typescript
interface Props extends IFormComponentProps {
  type?: 'text' | 'password' | 'email' | 'number' | 'tel' | 'url' | 'search'
  label?: string
  error?: string
  helpText?: string
  clearable?: boolean
  maxlength?: number
  placeholder?: string
}
```

### **SsCard 卡片**

```vue
<template>
  <!-- 基础卡片 -->
  <SsCard>
    <h3>卡片标题</h3>
    <p>卡片内容</p>
  </SsCard>

  <!-- 带标题的卡片 -->
  <SsCard title="卡片标题" subtitle="副标题">
    <p>卡片内容</p>
  </SsCard>

  <!-- 可点击卡片 -->
  <SsCard clickable @click="handleClick">
    <p>可点击内容</p>
  </SsCard>

  <!-- 加载状态 -->
  <SsCard :loading="true">
    <p>加载中...</p>
  </SCard>
</template>
```

### **SsBadge 徽章**

```vue
<template>
  <!-- 基础徽章 -->
  <SsBadge text="新功能" />

  <!-- 不同类型 -->
  <SsBadge type="success">成功</SsBadge>
  <SsBadge type="warning">警告</SBadge>
  <SsBadge type="error">错误</SsBadge>

  <!-- 不同尺寸 -->
  <SsBadge size="xs">迷你</SsBadge>
  <SsBadge size="lg">大号</SsBadge>
</template>
```

## 🎯 业务组件使用指南

### **NodeCard 节点卡片**

```vue
<template>
  <NodeCard
    :node="node"
    :selected="selected"
    @edit="handleEditNode"
    @test="handleTestNode"
    @delete="handleDeleteNode"
    @select="handleSelectNode"
  />
</template>

<script setup lang="ts">
import type { INode } from '@/types'

interface Props {
  node: INode
  selected?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  selected: false
})

const handleEditNode = (node: INode) => {
  // 编辑节点逻辑
}

const handleTestNode = async (node: INode) => {
  // 测试节点逻辑
}

const handleDeleteNode = async (node: INode) => {
  // 删除节点逻辑
}

const handleSelectNode = (node: INode) => {
  // 选择节点逻辑
}
</script>
```

**Props接口**:
```typescript
interface Props extends IStandardProps {
  node: INode
  selected?: boolean
  showActions?: boolean
  showLatency?: boolean
  clickable?: boolean
}
```

**事件**:
```typescript
interface Emits {
  edit: [node: INode]
  test: [node: INode]
  delete: [node: INode]
  select: [node: INode, selected: boolean]
}
```

### **SubscriptionCard 订阅卡片**

```vue
<template>
  <SubscriptionCard
    :subscription="subscription"
    :selected="isSelected"
    @edit="handleEdit"
    @preview="handlePreview"
    @update="handleUpdate"
  />
</template>
```

## 🔧 Composables 使用指南

### **useClipboard 剪贴板**

```vue
<script setup lang="ts">
import { useClipboard } from '@/composables/common/useClipboard'

const { copyToClipboard, copyText, isLoading } = useClipboard()

const handleCopy = async (text: string) => {
  await copyToClipboard(text)
}
</script>
```

### **useNotifications 通知**

```vue
<script setup lang="ts">
import { useNotifications } from '@/composables/common/useNotifications'

const {
  success,
  error,
  warning,
  info,
  confirm
} = useNotifications()

const handleSuccess = () => {
  success('操作成功！')
}

const handleError = () => {
  error('操作失败，请重试')
}
</script>
```

### **useDateFormatting 日期格式化**

```vue
<script setup lang="ts">
import { useDateFormatting } from '@/composables/common/useDateFormatting'

const {
  formatDate,
  formatRelative,
  formatSmartDate
} = useDateFormatting()

const formatDate = (date: Date) => {
  return formatDate(date, 'YYYY-MM-DD HH:mm:ss')
}

const getRelativeTime = (date: Date) => {
  return formatRelative(date)
}
</script>
```

## 🧪 测试指南

### **组件测试示例**

```typescript
// tests/components/SsButton.spec.ts
import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import SsButton from '@/components/base/SsButton.vue'

describe('SsButton', () => {
  it('renders correctly', () => {
    const wrapper = mount(SsButton, {
      props: {
        default: 'Test Button'
      }
    })

    expect(wrapper.find('button').exists()).toBe(true)
    expect(wrapper.text()).toContain('Test Button')
  })

  it('emits click event', async () => {
    const wrapper = mount(SsButton)

    await wrapper.find('button').trigger('click')

    expect(wrapper.emitted()).toHaveProperty('click')
  })

  it('applies variant classes correctly', () => {
    const wrapper = mount(SsButton, {
      props: {
        variant: 'primary',
        default: 'Primary Button'
      }
    })

    expect(wrapper.find('button').classes()).toContain('ss-button--primary')
  })
})
```

### **Composable测试示例**

```typescript
// tests/composables/useClipboard.spec.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { nextTick } from 'vue'
import { useClipboard } from '@/composables/common/useClipboard'

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn().mockResolvedValue(undefined)
  }
})

describe('useClipboard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('copies text successfully', async () => {
    const { copyToClipboard, isLoading } = useClipboard()

    expect(isLoading.value).toBe(false)

    await copyToClipboard('test text')

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('test text')
  })
})
```

## 🚀 最佳实践

### **组件开发规范**

1. **单一职责**: 每个组件只负责一个明确的功能
2. **可复用性**: 通过props实现组件的可配置性
3. **可测试性**: 避免直接依赖外部服务
4. **类型安全**: 使用完整的TypeScript类型定义
5. **响应式设计**: 支持不同屏幕尺寸

### **代码组织**

1. **文件命名**: 使用PascalCase命名组件文件
2. **Props设计**: 遵循IStandardProps接口
3. **事件命名**: 遵循handle + 动作 + On + 目标模式
4. **样式组织**: 优先使用Tailwind CSS类

### **性能优化**

1. **懒加载**: 对大型组件使用动态导入
2. **条件渲染**: 使用v-if和v-show合理控制渲染
3. **计算属性**: 避免在模板中进行复杂计算
4. **事件防抖**: 对频繁触发的事件使用防抖

## 📝 更新日志

### **v2.0.0** (2024-01-XX)
- ✅ 完成组件库重构
- ✅ 建立完整的设计系统
- ✅ 实现TypeScript类型安全
- ✅ 添加单元测试覆盖

### **v1.5.0** (2023-12-XX)
- ✅ 添加SsBadge组件
- ✅ 修复API调用问题
- ✅ 优化性能表现

---

**更多信息和示例请查看组件源码和测试文件**