# 节点管理组件提取示例

这个文档展示了如何使用新提取的公共组件来重构现有的节点管理界面。

## 原有代码的问题

在 `/nodes` 部分中，我们发现了很多重复的 UI 模式：

1. **状态显示** - 每个节点都有状态徽章，但样式和逻辑分散
2. **延迟显示** - 延迟指示器的颜色编码和格式化逻辑重复
3. **协议标签** - 协议类型标签的样式和颜色配置重复
4. **操作按钮** - 各种操作按钮的样式和交互模式重复
5. **过滤面板** - 搜索、协议过滤、状态过滤的组合模式重复
6. **统计卡片** - 统计数据的展示样式和交互重复
7. **批量操作** - 选择后的批量操作栏模式重复

## 新的组件库

### 原子组件 (Atomic Components)

#### 1. StatusBadge
```vue
<StatusBadge
  :status="'online'"
  :size="'medium'"
  :color-scheme="'health'"
  :show-icon="true"
/>
```

#### 2. LatencyIndicator
```vue
<LatencyIndicator
  :latency="node.latency"
  :unit="'ms'"
  :thresholds="{ good: 100, medium: 300, poor: 500 }"
  :color-scheme="'network'"
/>
```

#### 3. ProtocolTag
```vue
<ProtocolTag
  :protocol="node.protocol"
  :size="'small'"
  :variant="'colorful'"
  :color-scheme="'vibrant'"
  :show-icon="true"
/>
```

#### 4. ActionTrigger
```vue
<ActionTrigger
  icon="edit"
  :size="'small'"
  :tooltip="'编辑节点'"
  :hover-scale="true"
  @click="editNode(node)"
/>
```

### 分子组件 (Molecular Components)

#### 1. SmartFilterPanel
```vue
<SmartFilterPanel
  v-model="filters"
  :title="'节点过滤器'"
  :search-config="{
    placeholder: '搜索节点名称或服���器地址...',
    clearable: true
  }"
  :protocol-filter="{
    label: '协议类型',
    options: protocolOptions
  }"
  :status-filter="{
    label: '连接状态',
    options: statusOptions
  }"
  :quick-filters="quickFilters"
  :collapsible="true"
  @change="handleFiltersChange"
/>
```

#### 2. BulkActionsBar
```vue
<BulkActionsBar
  :selected-count="selectedNodes.length"
  :total-count="nodes.length"
  :common-actions="bulkActions"
  :smart-suggestions="smartSuggestions"
  :show-select-all="true"
  :is-all-selected="isAllSelected"
  @action="handleBulkAction"
  @select-all="selectAllNodes"
  @clear-selection="clearSelection"
/>
```

#### 3. StatsCardGrid
```vue
<StatsCardGrid
  :stats="nodeStats"
  :columns="4"
  :size="'medium'"
  :clickable="true"
  :animated="true"
  :show-icons="true"
  :show-trend="true"
  :show-progress="false"
  @card-click="handleStatClick"
/>
```

## 重构示例

### 重构前的节点表格行
```vue
<!-- 旧版本：分散的样式和逻辑 -->
<tr>
  <td>
    <n-tag
      :type="node.status === 'online' ? 'success' : 'error'"
      size="small"
      :bordered="false"
    >
      <n-icon :component="node.status === 'online' ? CheckIcon : CloseIcon" />
      {{ node.status === 'online' ? '在线' : '离线' }}
    </n-tag>
  </td>
  <td>{{ node.name }}</td>
  <td>
    <span :style="{
      color: node.latency < 100 ? '#52c41a' :
             node.latency < 300 ? '#faad14' : '#ff4d4f'
    }">
      {{ node.latency }}ms
    </span>
  </td>
  <td>
    <n-tag
      :color="getProtocolColor(node.protocol)"
      size="small"
      round
    >
      {{ node.protocol.toUpperCase() }}
    </n-tag>
  </td>
  <td>
    <n-button circle size="small" @click="editNode(node)">
      <n-icon :component="EditIcon" />
    </n-button>
    <n-button circle size="small" type="error" @click="deleteNode(node)">
      <n-icon :component="DeleteIcon" />
    </n-button>
  </td>
</tr>
```

### 重构后的节点表格行
```vue
<!-- 新版本：使用组件化设计 -->
<tr>
  <td>
    <StatusBadge
      :status="node.status"
      :size="'small'"
      :color-scheme="'health'"
    />
  </td>
  <td>{{ node.name }}</td>
  <td>
    <LatencyIndicator
      :latency="node.latency"
      :size="'small'"
      :color-scheme="'network'"
    />
  </td>
  <td>
    <ProtocolTag
      :protocol="node.protocol"
      :size="'small'"
      :variant="'colorful'"
    />
  </td>
  <td>
    <ActionTrigger
      icon="edit"
      :size="'small'"
      :tooltip="'编辑节点'"
      @click="editNode(node)"
    />
    <ActionTrigger
      icon="delete"
      :size="'small'"
      :type="'error'"
      :tooltip="'删除节点'"
      @click="deleteNode(node)"
    />
  </td>
</tr>
```

## 重构优势

### 1. 代码复用
- 状态显示逻辑统一管理
- 延迟颜色编码标准化
- 协议颜色配置集中化
- 操作按钮样式一致性

### 2. 维护性提升
- 统一的组件 API
- 集中的样式管理
- 可预测的组件行为
- 更容易的单元测试

### 3. 一致性改善
- 全局统一的视觉风格
- 标准化的交互模式
- 一致的动画效果
- 统一的可访问性支持

### 4. 开发效率
- 更快的开发速度
- 减少样板代码
- 更容易的组件组合
- 更好的开发体验

## 使用指南

### 1. 导入组件
```typescript
import {
  StatusBadge,
  LatencyIndicator,
  ProtocolTag,
  ActionTrigger,
  SmartFilterPanel,
  BulkActionsBar,
  StatsCardGrid
} from '@/components/common'
```

### 2. 配置组件
```typescript
// 节点统计配置
const nodeStats = [
  {
    key: 'total',
    label: '总节点数',
    value: nodes.length,
    icon: DatabaseOutlined,
    type: 'primary',
    clickable: true
  },
  {
    key: 'online',
    label: '在线节点',
    value: onlineCount,
    icon: WifiOutlined,
    type: 'success',
    trend: 'up',
    trendValue: 5.2
  },
  // ...
]

// 批量操作配置
const bulkActions = [
  {
    key: 'test',
    label: '测试连接',
    icon: ThunderboltOutlined,
    type: 'primary'
  },
  {
    key: 'delete',
    label: '批量删除',
    icon: DeleteOutlined,
    type: 'error',
    danger: true
  }
]
```

### 3. 响应事件
```typescript
const handleFiltersChange = (filters, type) => {
  console.log('过滤器变化:', filters, type)
  // 应用过滤逻辑
}

const handleBulkAction = (action) => {
  console.log('批量操作:', action)
  // 执行批量操作
}

const handleStatClick = (stat) => {
  console.log('统计卡片点击:', stat)
  // 处理统计卡片点击
}
```

## 下一步

1. **逐步迁移**：先迁移最常用的组件，如 StatusBadge 和 ProtocolTag
2. **样式调整**：根据项目设计系统调整组件样式
3. **功能扩展**：根据业务需求扩展组件功能
4. **文档完善**：为每个组件编写详细的 API 文档
5. **测试覆盖**：为每个组件编写单元测试

通过这次重构，我们不仅提升了代码的可维护性和一致性，还为未来的功能扩展奠定了坚实的基础。