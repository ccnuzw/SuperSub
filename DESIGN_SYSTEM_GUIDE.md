# 🎨 通用组件设计系统指南

## 设计理念

以 Nodes 模块的现代、清晰风格为基准，建立统一的设计语言和组件规范。

## 🎯 设计原则

### 1. **现代简约**
- 使用现代圆角设计 (8-16px)
- 统一的阴影系统
- 渐变色彩应用
- 简洁的视觉层次

### 2. **响应式优先**
- 移动端优先设计
- 弹性布局和自适应
- 触摸友好的交互

### 3. **一致性**
- 统一的间距系统 (4/8/12/16/20/24px)
- 标准化的颜色系统
- 一致的动画效果

### 4. **可访问性**
- 键盘导航支持
- 屏幕阅读器友好
- 足够的颜色对比度

## 🎨 设计系统变量

### 间距系统
```css
--spacing-xs: 4px;
--spacing-sm: 8px;
--spacing-md: 12px;
--spacing-lg: 16px;
--spacing-xl: 20px;
--spacing-2xl: 24px;
--spacing-3xl: 32px;
```

### 圆角系统
```css
--radius-sm: 6px;
--radius-md: 8px;
--radius-lg: 12px;
--radius-xl: 16px;
--radius-2xl: 20px;
--radius-full: 50%;
```

### 阴影系统
```css
--shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
--shadow-md: 0 2px 8px rgba(0, 0, 0, 0.08);
--shadow-lg: 0 4px 16px rgba(0, 0, 0, 0.12);
--shadow-xl: 0 10px 40px rgba(0, 0, 0, 0.15);
```

### 渐变色系统
```css
--gradient-primary: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
--gradient-success: linear-gradient(135deg, #52c41a 0%, #73d13d 100%);
--gradient-warning: linear-gradient(135deg, #faad14 0%, #ffc53d 100%);
--gradient-error: linear-gradient(135deg, #ff4d4f 0%, #ff7875 100%);
```

## 📦 组件库总览

### 🧩 原子化组件

#### 1. SmartDropdown (智能下拉菜单)
**用途**: 高度可定制的下拉菜单组件

**特性**:
- 🎨 现代毛玻璃效果
- ⌨️ 键盘导航 (ESC关闭)
- 📱 移动端自适应
- 🎯 智��位置调整
- 🎭 支持分组、分割线、徽章

**使用示例**:
```vue
<SmartDropdown
  :items="menuItems"
  title="操作菜单"
  placement="bottom-right"
  @select="handleMenuSelect"
>
  <template #trigger>
    <n-button>菜单</n-button>
  </template>
</SmartDropdown>
```

#### 2. ActionButtonGroup (操作按钮组)
**用途**: 统一的操作按钮容器

**特性**:
- 🎯 优先级和排序
- 🔄 条件显示
- 📊 溢出指示器
- 🎨 渐变按钮样式
- 🔗 按钮连接效果

**使用示例**:
```vue
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
```

#### 3. StatsCard (统计卡片)
**用途**: 数据统计展示卡片

**特性**:
- 🎨 渐变图标背景
- ✨ 装饰性动画
- 📊 趋势指示器
- 🎯 点击交互
- 📏 多尺寸支持

**使用示例**:
```vue
<StatsCard
  title="总节点数"
  :value="nodeCount"
  icon="ServerIcon"
  color="primary"
  :trend="'up'"
  trend-value="+12%"
  :hoverable="true"
  @click="handleCardClick"
/>
```

### 🧬 分子化组件

#### 1. SmartToolbar (智能工具栏)
**用途**: 集成搜索、筛选、标签页的复合工具栏

**特性**:
- 🔍 智能搜索
- 🎚️ 动态筛选器
- 🏷️ 标签页导航
- 🎯 智能操作推荐
- 📱 响应式布局

**使用示例**:
```vue
<SmartToolbar
  :search-query="searchQuery"
  :filters="filters"
  :tabs="tabs"
  :primary-actions="primaryActions"
  @update:searchQuery="handleSearch"
  @primaryAction="handleAction"
/>
```

#### 2. StatsPanel (统计面板)
**用途**: 统计信息 + 筛选功能的组合面板

**特性**:
- 📊 网格化统计展示
- 🔍 集成搜索筛选
- 🎯 条件显示统计
- 📋 批量操作支持
- 📱 响应式网格

**使用示例**:
```vue
<StatsPanel
  title="数据概览"
  :stats="statsItems"
  :searchable="true"
  :filters="filters"
  :header-actions="headerActions"
  @batchAction="handleBatchAction"
/>
```

#### 3. ModernDataTable (现代数据表格)
**用途**: 功能丰富的数据表格组件

**特性**:
- 🔍 内置搜索功能
- 📋 批量操作栏
- 🎨 现代化样式
- 📱 完全响应式
- ⚙️ 表格设置

**使用示例**:
```vue
<ModernDataTable
  :columns="columns"
  :data="tableData"
  :loading="loading"
  :selectable="true"
  :header-actions="headerActions"
  :bulk-actions="bulkActions"
  @selection-change="handleSelection"
  @bulk-action="handleBulkAction"
/>
```

## 🎨 样式规范

### 通用样式类
```css
/* 布局 */
.flex { display: flex; }
.flex-col { flex-direction: column; }
.items-center { align-items: center; }
.justify-between { justify-content: space-between; }

/* 间距 */
.gap-xs { gap: var(--spacing-xs); }
.gap-sm { gap: var(--spacing-sm); }
.gap-md { gap: var(--spacing-md); }
.gap-lg { gap: var(--spacing-lg); }

/* 卡片 */
.modern-card {
  background: var(--bg-primary);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  transition: all var(--transition-normal) var(--ease-out-cubic);
}

/* 按钮 */
.modern-button {
  border-radius: var(--radius-md);
  transition: all var(--transition-normal) var(--ease-out-cubic);
  font-weight: 500;
}
```

### 状态指示器
```css
.status-indicator {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--radius-full);
  font-size: 12px;
  font-weight: 500;
}

.status-online {
  background: rgba(82, 196, 26, 0.1);
  color: var(--success);
  border: 1px solid rgba(82, 196, 26, 0.2);
}
```

## 🚀 使用最佳实践

### 1. **组件组合原则**
- 优先使用分子化组件
- 原子化组件用于定制化需求
- 保持组件接口的一致性

### 2. **性能优化**
- 合理使用 v-show vs v-if
- 避免过度的响应式数据
- 使用计算属性缓存复杂计算

### 3. **响应式设计**
- 移动端优先
- 合理的断点设置
- 触摸友好的交互尺寸

### 4. **可访问性**
- 提供键盘导航
- 语义化HTML结构
- 适当的ARIA标签

## 📱 响应式断点

```css
/* 移动端 */
@media (max-width: 768px) {
  /* 移动端样式 */
}

/* 平板端 */
@media (min-width: 769px) and (max-width: 1024px) {
  /* 平板端样式 */
}

/* 桌面端 */
@media (min-width: 1025px) {
  /* 桌面端样式 */
}
```

## 🎯 组件开发规范

### 1. **命名规范**
- 组件名使用 PascalCase
- 类名使用 kebab-case
- 变量名使用 camelCase

### 2. **Props 定义**
```typescript
interface Props {
  // 必需属性
  title: string;
  // 可选属性
  subtitle?: string;
  // 类型枚举
  size?: 'small' | 'medium' | 'large';
  // 默认值
  bordered?: boolean;
}
```

### 3. **Emits 定义**
```typescript
interface Emits {
  (e: 'click', value: string): void;
  (e: 'change', value: number): void;
}
```

### 4. **样式结构**
```css
/* 组件样式 */
.component-name {
  /* 基础样式 */
}

/* 变体样式 */
.component-name.variant {
  /* 变体特定样式 */
}

/* 状态样式 */
.component-name.is-active {
  /* 激活状态样式 */
}

/* 响应式 */
@media (max-width: 768px) {
  .component-name {
    /* 移动端样式 */
  }
}
```

## 🔄 迁移指南

### 从旧组件迁移到新组件

#### DataTable → ModernDataTable
```vue
<!-- 旧版本 -->
<DataTable
  :columns="columns"
  :data="data"
  @edit="handleEdit"
/>

<!-- 新版本 -->
<ModernDataTable
  :columns="columns"
  :data="data"
  :header-actions="headerActions"
  :bulk-actions="bulkActions"
  @edit="handleEdit"
  @bulk-action="handleBulkAction"
/>
```

#### StatsCard (增强功能)
```vue
<!-- 基础用法 -->
<StatsCard
  title="节点数"
  :value="nodeCount"
  icon="NodeIcon"
  color="primary"
/>

<!-- 增强用法 -->
<StatsCard
  title="节点数"
  :value="nodeCount"
  icon="NodeIcon"
  color="primary"
  :trend="'up'"
  trend-value="+12%"
  :hoverable="true"
  @click="handleCardClick"
/>
```

## 📋 检查清单

### 组件开发
- [ ] 使用设计系统变量
- [ ] 支持深色主题
- [ ] 响应式设计
- [ ] 可访问性支持
- [ ] TypeScript 类型定义
- [ ] 性能优化

### 样式规范
- [ ] 使用 CSS 变量
- [ ] 统一的动画效果
- [ ] 合理的 z-index 层级
- [ ] 移动端适配
- [ ] 焦点样式

### 交互体验
- [ ] Hover 效果
- [ ] Loading 状态
- [ ] Error 状态
- [ ] Empty 状态
- [ ] 键盘导航

## 🎨 设计系统文件结构

```
src/
├── styles/
│   ├── common.css              # 通用样式变量
│   ├── components.css          # 组件样式
│   └── utilities.css           # 工具类
├── components/
│   └── common/
│       ├── atomic/             # 原子化组件
│       ├── molecular/          # 分子化组件
│       └── composables/        # 组合式函数
└── types/
    └── common.ts               # 通用类型定义
```

这套设计系统将确保整个应用的视觉一致性和开发效率，同时提供良好的用户体验和开发者体验。