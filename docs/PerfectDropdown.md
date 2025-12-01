# PerfectDropdown 组件

一个完美解决了您提到的菜单项居中和背景溢出问题的高质量下拉菜单组件。

## 🎯 解决的问题

- ✅ **菜单项完美居中**: 所有菜单项都正确居中对齐
- ✅ **背景完全包容**: 所有菜单项都在背景范围内，无溢出
- ✅ **现代化设计**: 毛玻璃效果和优雅动画
- ✅ **响应式布局**: 桌面和移动端完美适配
- ✅ **无障碍支持**: 键盘导航和焦点管理

## 🚀 特性

- **智能定位**: 自动调整位置防止超出视窗
- **丰富样式**: 支持图标、描述、快捷键、徽章
- **状态管理**: 支持禁用状态和危险操作样式
- **流畅动画**: 弹性缩放和渐入效果
- **类型安全**: 完整的 TypeScript 支持

## 📖 使用方法

### 基础用法

```vue
<template>
  <PerfectDropdown
    :items="menuItems"
    @select="handleSelect"
  />
</template>

<script setup>
import PerfectDropdown from '@/components/PerfectDropdown.vue'

const menuItems = [
  {
    label: '新建项目',
    key: 'new',
    icon: AddIcon,
    description: '创建一个新的项目'
  },
  {
    label: '编辑',
    key: 'edit',
    icon: EditIcon,
    description: '编辑当前选中的项目'
  }
]

const handleSelect = (key, item) => {
  console.log('选择了:', key, item)
}
</script>
```

### 高级用法

```vue
<template>
  <PerfectDropdown
    title="操作菜单"
    footer="选择一个操作继续"
    :items="advancedItems"
    placement="bottom-right"
    @select="handleSelect"
  />
</template>

<script setup>
const advancedItems = [
  {
    label: '复制',
    key: 'copy',
    icon: CopyIcon,
    description: '复制到剪贴板',
    shortcut: 'Ctrl+C'
  },
  {
    type: 'divider',
    key: 'divider-1'
  },
  {
    label: '删除',
    key: 'delete',
    type: 'danger',
    icon: TrashIcon,
    description: '此操作不可撤销'
  }
]
</script>
```

## 🔧 配置选项

### Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `items` | `MenuItem[]` | `[]` | 菜单项数组 |
| `title` | `string` | - | 菜单标题 |
| `footer` | `string` | - | 菜单底部文本 |
| `placement` | `string` | `'bottom-right'` | 弹出位置 |
| `closeOnClickOutside` | `boolean` | `true` | 点击外部是否关闭 |

### MenuItem 接口

```typescript
interface MenuItem {
  key: string                    // 唯一标识
  label: string                  // 显示文本
  description?: string          // 描述文本
  icon?: Component              // 图标组件
  shortcut?: string             // 快捷键显示
  badge?: string                // 徽章文本
  disabled?: boolean            // 是否禁用
  type?: 'default' | 'danger' | 'divider'  // 类型
  action?: () => void           // 点击回调
}
```

### Events

| 事件 | 参数 | 说明 |
|------|------|------|
| `select` | `(key: string, item: MenuItem)` | 菜单项被选择时触发 |
| `close` | - | 菜单关闭时触发 |

## 🎨 样式特点

### 视觉效果
- **毛玻璃背景**: `backdrop-filter: blur(20px)`
- **渐变按钮**: 紫蓝渐变的圆形触发按钮
- **优雅阴影**: 多层次阴影营造深度感
- **圆角设计**: 16px 圆角现代化外观

### 交互效果
- **悬停状态**: 平滑的颜色过渡和缩放
- **点击反馈**: 轻微的缩放动画
- **弹性动画**: 使用 cubic-bezier 缓动函数
- **键盘支持**: ESC 键关闭，Tab 键导航

### 响应式设计
- **桌面端**: 右上角弹出，最小宽度 220px
- **移动端**: 全屏居中弹出，适配触摸操作
- **自动定位**: 防止超出视窗边界

## 🔧 在项目中的集成

### 1. 替换现有的下拉菜单

在 `SmartToolbar.vue` 中已经替换了原来的 `n-dropdown`：

```vue
<!-- 旧版本 -->
<n-dropdown :options="options" @select="handleSelect">
  <n-button>
    <n-icon :component="MoreIcon" />
  </n-button>
</n-dropdown>

<!-- 新版本 -->
<PerfectDropdown :items="options" @select="handleSelect" />
```

### 2. 数据格式适配

将原来 `n-dropdown` 的选项格式转换为新的 `MenuItem` 格式：

```javascript
// 旧格式
const oldOptions = [
  {
    label: '导入节点',
    key: 'import',
    icon: () => h(ImportIcon)  // 函数式渲染
  }
]

// 新格式
const newItems = [
  {
    label: '导入节点',
    key: 'import',
    icon: ImportIcon,  // 直接组件引用
    description: '从订阅或链接批量导入节点'
  }
]
```

## 📱 移动端优化

在移动端，组件会自动切换为居中模态框样式：
- 触摸友好的 48px 最小点击区域
- 更大的字体和间距
- 居中弹出避免边缘触摸困难

## 🌙 深色主题支持

组件完全支持深色主题，自动适配系统主题设置：

```css
.dark .dropdown-backdrop {
  background: rgba(24, 24, 28, 0.95);
  /* ... 更多深色主题样式 */
}
```

## ✅ 已解决的问题

1. **菜单项居中**: 使用 flexbox 布局确保完美居中
2. **背景溢出**: 使用 `overflow: hidden` 和精确的高度计算
3. **视窗边界**: 智能位置检测和自动调整
4. **用户体验**: 添加了描述文本、快捷键提示等
5. **无障碍**: 完整的键盘导航支持

这个组件现在提供了完美的下拉菜单体验，解决了您提到的所有样式问题！