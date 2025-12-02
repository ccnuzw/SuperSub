# 使用新组件重构节点管理示例

这个示例展示了如何将现有的节点管理界面重构为使用我们新的公共组件库。

## 重构前后对比

### 原有的节点表格实现

```vue
<template>
  <!-- 复杂的统计显示 -->
  <div class="stats-container">
    <div class="stat-item">
      <span class="stat-number">{{ totalNodes }}</span>
      <span class="stat-label">总节点</span>
    </div>
    <div class="stat-item">
      <span class="stat-number online">{{ onlineNodes }}</span>
      <span class="stat-label">在线</span>
    </div>
    <div class="stat-item">
      <span class="stat-number offline">{{ offlineNodes }}</span>
      <span class="stat-label">离线</span>
    </div>
  </div>

  <!-- 分散的过滤器 -->
  <div class="filters">
    <input v-model="searchText" placeholder="搜索节点..." />
    <select v-model="selectedProtocol">
      <option value="">所有协议</option>
      <option value="vmess">VMess</option>
      <option value="vless">VLESS</option>
    </select>
  </div>

  <!-- 复杂的表格行 -->
  <table>
    <tr v-for="node in nodes" :key="node.id">
      <td>
        <div class="status-badge" :class="node.status">
          {{ node.status === 'online' ? '在线' : '离线' }}
        </div>
      </td>
      <td>{{ node.name }}</td>
      <td>
        <span :style="getLatencyStyle(node.latency)">
          {{ node.latency }}ms
        </span>
      </td>
      <td>
        <span class="protocol-tag" :style="getProtocolStyle(node.protocol)">
          {{ node.protocol.toUpperCase() }}
        </span>
      </td>
      <td>
        <button @click="editNode(node)">
          <EditIcon />
        </button>
        <button @click="deleteNode(node)">
          <DeleteIcon />
        </button>
      </td>
    </tr>
  </table>
</template>

<style scoped>
.status-badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.status-badge.online {
  background-color: #52c41a;
  color: white;
}

.status-badge.offline {
  background-color: #ff4d4f;
  color: white;
}

.protocol-tag {
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: bold;
}

/* 大量重复的样式... */
</style>

<script>
// 复杂的样式计算逻辑
const getLatencyStyle = (latency) => {
  if (latency < 100) return { color: '#52c41a' }
  if (latency < 300) return { color: '#faad14' }
  return { color: '#ff4d4f' }
}

const getProtocolStyle = (protocol) => {
  const colors = {
    vmess: '#FF6B6B',
    vless: '#4ECDC4',
    trojan: '#9B59B6'
  }
  return { backgroundColor: colors[protocol] || '#999' }
}
</script>
```

### 重构后的实现

```vue
<template>
  <!-- 使用统计卡片网格 -->
  <StatsCardGrid
    :stats="nodeStats"
    :columns="4"
    :clickable="true"
    :animated="true"
    @card-click="handleStatClick"
  />

  <!-- 使用智能过滤面板 -->
  <SmartFilterPanel
    v-model="filters"
    :search-config="{
      placeholder: '搜索节点名称或服务器地址...',
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
    @change="handleFiltersChange"
  />

  <!-- 使用数据表格 -->
  <ModernDataTable
    :data="filteredNodes"
    :columns="tableColumns"
    :selectable="true"
    :selected-row-keys="selectedNodeIds"
    @update:selected-row-keys="handleSelectionChange"
  >
    <!-- 自定义状态列 -->
    <template #status="{ row }">
      <StatusBadge
        :status="row.status"
        :color-scheme="'health'"
        :size="'small'"
      />
    </template>

    <!-- 自定义延迟列 -->
    <template #latency="{ row }">
      <LatencyIndicator
        :latency="row.latency"
        :size="'small'"
        :color-scheme="'network'"
      />
    </template>

    <!-- 自定义协议列 -->
    <template #protocol="{ row }">
      <ProtocolTag
        :protocol="row.protocol"
        :size="'small'"
        :variant="'colorful'"
      />
    </template>

    <!-- 自定义操作列 -->
    <template #actions="{ row }">
      <ActionTrigger
        icon="edit"
        :tooltip="'编辑节点'"
        :size="'small'"
        @click="editNode(row)"
      />
      <ActionTrigger
        icon="delete"
        :tooltip="'删除节点'"
        :type="'error'"
        :size="'small'"
        @click="deleteNode(row)"
      />
    </template>
  </ModernDataTable>

  <!-- 使用批量操作栏 -->
  <BulkActionsBar
    :selected-count="selectedNodeIds.length"
    :total-count="filteredNodes.length"
    :common-actions="bulkActions"
    :smart-suggestions="smartSuggestions"
    @action="handleBulkAction"
    @select-all="selectAllNodes"
    @clear-selection="clearSelection"
  />
</template>

<script setup>
// 导入组件
import {
  StatsCardGrid,
  SmartFilterPanel,
  StatusBadge,
  LatencyIndicator,
  ProtocolTag,
  ActionTrigger,
  BulkActionsBar
} from '@/components/common'

// 响应式数据
const filters = ref({
  search: '',
  protocols: [],
  statuses: []
})

const selectedNodeIds = ref([])

// 统计数据
const nodeStats = computed(() => [
  {
    key: 'total',
    label: '总节点数',
    value: nodes.value.length,
    icon: 'database',
    type: 'primary'
  },
  {
    key: 'online',
    label: '在线节点',
    value: nodes.value.filter(n => n.status === 'online').length,
    icon: 'wifi',
    type: 'success'
  },
  {
    key: 'offline',
    label: '离线节点',
    value: nodes.value.filter(n => n.status === 'offline').length,
    icon: 'disconnect',
    type: 'error'
  },
  {
    key: 'health',
    label: '健康率',
    value: calculateHealthRate(),
    icon: 'heart',
    type: 'warning',
    unit: '%'
  }
])

// 过滤后的节点
const filteredNodes = computed(() => {
  return nodes.value.filter(node => {
    if (filters.value.search && !node.name.includes(filters.value.search)) {
      return false
    }
    if (filters.value.protocols.length && !filters.value.protocols.includes(node.protocol)) {
      return false
    }
    if (filters.value.statuses.length && !filters.value.statuses.includes(node.status)) {
      return false
    }
    return true
  })
})

// 表格列配置
const tableColumns = [
  {
    title: '状态',
    key: 'status',
    width: 100,
    slot: 'status'
  },
  {
    title: '节点名称',
    key: 'name',
    minWidth: 200
  },
  {
    title: '延迟',
    key: 'latency',
    width: 120,
    slot: 'latency',
    sorter: (a, b) => (a.latency || 0) - (b.latency || 0)
  },
  {
    title: '协议',
    key: 'protocol',
    width: 100,
    slot: 'protocol'
  },
  {
    title: '操作',
    key: 'actions',
    width: 120,
    slot: 'actions'
  }
]

// 批量操作配置
const bulkActions = [
  {
    key: 'test',
    label: '测试连接',
    type: 'primary',
    icon: 'reload',
    handler: () => testSelectedNodes()
  },
  {
    key: 'export',
    label: '导出选中',
    type: 'default',
    icon: 'download',
    handler: () => exportSelectedNodes()
  },
  {
    key: 'delete',
    label: '批量删除',
    type: 'error',
    icon: 'delete',
    danger: true,
    handler: () => deleteSelectedNodes()
  }
]

// 智能建议
const smartSuggestions = computed(() => {
  const suggestions = []
  const offlineNodes = selectedNodeIds.value.filter(id => {
    const node = nodes.value.find(n => n.id === id)
    return node?.status === 'offline'
  })

  if (offlineNodes.length > 0) {
    suggestions.push({
      key: 'test-offline',
      label: `测试 ${offlineNodes.length} 个离线节点`,
      priority: 1,
      handler: () => testOfflineNodes()
    })
  }

  if (selectedNodeIds.value.length > 5) {
    suggestions.push({
      key: 'batch-group',
      label: '批量分组',
      priority: 2,
      handler: () => groupSelectedNodes()
    })
  }

  return suggestions
})

// 事件处理函数
const handleFiltersChange = (newFilters, type) => {
  console.log('过滤器变化:', newFilters, type)
  // 过滤逻辑会自动通过 computed 属性应用
}

const handleSelectionChange = (selectedKeys) => {
  selectedNodeIds.value = selectedKeys
}

const handleBulkAction = (action) => {
  if (action.handler) {
    action.handler()
  }
}

const handleStatClick = (stat) => {
  // 点击统计卡片时的筛选逻辑
  switch (stat.key) {
    case 'online':
      filters.value.statuses = ['online']
      break
    case 'offline':
      filters.value.statuses = ['offline']
      break
    default:
      filters.value.statuses = []
  }
}

// 业务逻辑函数
const testSelectedNodes = () => {
  console.log('测试选中的节点:', selectedNodeIds.value)
}

const exportSelectedNodes = () => {
  console.log('导出选中的节点:', selectedNodeIds.value)
}

const deleteSelectedNodes = () => {
  console.log('删除选中的节点:', selectedNodeIds.value)
}

const testOfflineNodes = () => {
  const offlineNodes = selectedNodeIds.value.filter(id => {
    const node = nodes.value.find(n => n.id === id)
    return node?.status === 'offline'
  })
  console.log('测试离线节点:', offlineNodes)
}

const groupSelectedNodes = () => {
  console.log('分组选中的节点:', selectedNodeIds.value)
}
</script>
```

## 重构优势对比

### 代码量减少
- **重构前**: 约 300+ 行代码（包含大量重复的样式和逻辑）
- **重构后**: 约 150 行代码（主要关注业务逻辑）

### 维护性提升
- ✅ 统一的组件 API
- ✅ 集中的样式管理
- ✅ 类型安全的 Props
- ✅ 标准化的事件处理

### 功能增强
- ✅ 响应式设计自动适配
- ✅ 无障碍访问支持
- ✅ 动画效果
- ✅ 深色主题兼容
- ✅ 智能交互提示

### 开发效率
- ✅ 快速复制粘贴组件配置
- ✅ 减少调试时间
- ✅ 统一的设计规范
- ✅ 更好的开发体验

## 实际使用建议

### 1. 渐进式迁移
```typescript
// 第一步：先迁移最简单的组件
import { StatusBadge, ProtocolTag } from '@/components/common'

// 第二步：迁移复杂组件
import { SmartFilterPanel, BulkActionsBar } from '@/components/common'

// 第三步：完全重构布局
import { StatsCardGrid, ModernDataTable } from '@/components/common'
```

### 2. 保持向后兼容
```vue
<template>
  <!-- 新旧组件可以并存 -->
  <StatusBadge v-if="useNewComponent" :status="node.status" />
  <div v-else class="old-status-badge" :class="node.status">
    {{ node.status === 'online' ? '在线' : '离线' }}
  </div>
</template>
```

### 3. 配置驱动开发
```typescript
// 创建配置文件，统一管理组件参数
export const COMPONENT_CONFIG = {
  StatusBadge: {
    colorScheme: 'health',
    showIcon: true,
    size: 'small'
  },
  ProtocolTag: {
    variant: 'colorful',
    showIcon: true,
    size: 'small'
  }
}
```

通过这种重构方式，我们不仅减少了代码量，还获得了更好的用户体验和更高的开发效率。