<template>
  <div class="component-showcase">
    <!-- 页面头部 -->
    <div class="showcase-header">
      <div class="header-content">
        <div class="header-text">
          <h1 class="page-title">
            <n-icon :component="ConstructOutline" size="32" />
            通用组件展示
          </h1>
          <p class="page-description">
            探索我们精心设计的通用组件库，享受一致的用户体验和高效的开发流程
          </p>
        </div>
      </div>
    </div>

    <!-- 统计信息 -->
    <div class="stats-section">
      <div class="stats-grid">
        <StatsCard
          title="组件总数"
          :value="14"
          :icon="CubeOutline"
          color="primary"
        />
        <StatsCard
          title="原子组件"
          :value="8"
          :icon="GridOutline"
          color="success"
        />
        <StatsCard
          title="分子组件"
          :value="6"
          :icon="LayersOutline"
          color="info"
        />
        <StatsCard
          title="稳定版本"
          :value="14"
          :icon="CheckmarkCircleOutline"
          color="success"
        />
      </div>
    </div>

    <!-- 组件展示区域 -->
    <div class="components-display">
      <h2 class="display-title">组件预览</h2>

      <!-- 原有组件展示 -->
      <div class="category-section">
        <h3 class="category-title">🔧 基础组件</h3>

        <!-- 统计卡片预览 -->
        <div class="preview-section">
          <h4>1. StatsCard - 统计卡片</h4>
          <div class="component-demo">
            <StatsCard
              title="总节点数"
              :value="1234"
              unit="个"
              :icon="ServerOutline"
              color="primary"
              :trend="'up'"
              trend-value="+12%"
              :hoverable="true"
            />
            <StatsCard
              title="在线节点"
              :value="856"
              unit="个"
              :icon="CheckmarkCircleOutline"
              color="success"
              :trend="'up'"
              trend-value="+5%"
              :hoverable="true"
            />
            <StatsCard
              title="离线节点"
              :value="378"
              unit="个"
              :icon="CloseCircleOutline"
              color="error"
              :trend="'down'"
              trend-value="-3%"
              :hoverable="true"
            />
          </div>
        </div>

        <!-- 按钮组预览 -->
        <div class="preview-section">
          <h4>2. ActionButtonGroup - 按钮组</h4>
          <div class="component-demo">
            <ActionButtonGroup
              :actions="[
                { key: 'save', label: '保存', type: 'primary' as const, handler: () => {} },
                { key: 'edit', label: '编辑', type: 'default' as const, handler: () => {} },
                { key: 'delete', label: '删除', type: 'error' as const, handler: () => {} }
              ]"
              @action="handleAction"
            />
            <ActionButtonGroup
              :actions="[
                { key: 'test', label: '测试', type: 'success' as const, priority: 'high', handler: () => {} },
                { key: 'export', label: '导出', type: 'default' as const, handler: () => {} },
                { key: 'settings', label: '设置', priority: 'low', handler: () => {} }
              ]"
              @action="handleAction"
            />
          </div>
        </div>

        <!-- 下拉菜单预览 -->
        <div class="preview-section">
          <h4>3. SmartDropdown - 下拉菜单</h4>
          <div class="component-demo">
            <SmartDropdown
              :items="[
                { key: 'settings', label: '设置', icon: SettingsOutline },
                { key: 'export', label: '导出', icon: DownloadOutline },
                { key: 'divider', type: 'divider' },
                { key: 'delete', label: '删除', icon: TrashOutline, type: 'danger' }
              ]"
              title="操作菜单"
              @select="handleDropdownSelect"
            />
            <SmartDropdown
              :items="[
                { key: 'user-profile', label: '个人资料', icon: PersonCircleOutline },
                { key: 'preferences', label: '偏好设置', icon: SettingsOutline }
              ]"
              placement="bottom-right"
              @select="handleDropdownSelect"
            >
              <template #trigger>
                <n-button type="primary">
                  自定义触发器
                </n-button>
              </template>
            </SmartDropdown>
          </div>
        </div>

        <!-- 智能操作预览 -->
        <div class="preview-section">
          <h4>4. SmartActions - 智能操作</h4>
          <div class="component-demo">
            <div class="smart-actions-context">
              <p>SmartActions 组件暂时跳过展示，需要复杂的上下文配置</p>
              <p>请参考节点管理页面查看实际效果</p>
            </div>
          </div>
        </div>
      </div>

      <!-- 新增：从 nodes 提取的组件 -->
      <div class="category-section">
        <h3 class="category-title">🎯 原子组件 (从 /nodes 提取)</h3>

        <!-- StatusBadge 预览 -->
        <div class="preview-section">
          <h4>5. StatusBadge - 状态徽章 (全新美化版)</h4>

          <!-- 基础变体 -->
          <div class="demo-group">
            <h5>基础变体</h5>
            <div class="demo-row">
              <StatusBadge
                :status="'online'"
                :text="'在线'"
                :variant="'default'"
                :size="'small'"
              />
              <StatusBadge
                :status="'offline'"
                :text="'离线'"
                :variant="'default'"
                :size="'medium'"
              />
              <StatusBadge
                :status="'testing'"
                :text="'测试中'"
                :variant="'default'"
                :size="'large'"
              />
              <StatusBadge
                :status="'error'"
                :text="'错误'"
                :variant="'default'"
                :size="'medium'"
              />
            </div>
          </div>

          <!-- 极简变体 -->
          <div class="demo-group">
            <h5>极简变体</h5>
            <div class="demo-row">
              <StatusBadge
                :status="'online'"
                :text="'在线'"
                :variant="'minimal'"
                :show-indicator="true"
                :pulse="true"
              />
              <StatusBadge
                :status="'offline'"
                :text="'离线'"
                :variant="'minimal'"
              />
              <StatusBadge
                :status="'warning'"
                :text="'警告'"
                :variant="'minimal'"
              />
            </div>
          </div>

          <!-- 胶丸变体 -->
          <div class="demo-group">
            <h5>胶丸变体</h5>
            <div class="demo-row">
              <StatusBadge
                :status="'online'"
                :text="'连接成功'"
                :variant="'pills'"
                :round="true"
                :pulse="true"
              />
              <StatusBadge
                :status="'offline'"
                :text="'连接失败'"
                :variant="'pills'"
                :round="true"
              />
              <StatusBadge
                :status="'loading'"
                :text="'处理中'"
                :variant="'pills'"
                :round="true"
              />
            </div>
          </div>

          <!-- 玻璃变体 -->
          <div class="demo-group">
            <h5>玻璃变体</h5>
            <div class="demo-row" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 8px;">
              <StatusBadge
                :status="'online'"
                :text="'在线'"
                :variant="'glass'"
                :glow="true"
              />
              <StatusBadge
                :status="'offline'"
                :text="'离线'"
                :variant="'glass'"
              />
              <StatusBadge
                :status="'testing'"
                :text="'测试中'"
                :variant="'glass'"
                :show-indicator="true"
                :pulse="true"
              />
            </div>
          </div>

          <!-- 霓虹变体 -->
          <div class="demo-group">
            <h5>霓虹变体</h5>
            <div class="demo-row" style="background: #1a1a1a; padding: 20px; border-radius: 8px;">
              <StatusBadge
                :status="'online'"
                :text="'ACTIVE'"
                :variant="'neon'"
                :pulse="true"
              />
              <StatusBadge
                :status="'error'"
                :text="'ERROR'"
                :variant="'neon'"
              />
              <StatusBadge
                :status="'warning'"
                :text="'WARNING'"
                :variant="'neon'"
              />
            </div>
          </div>

          <!-- 渐变变体 -->
          <div class="demo-group">
            <h5>渐变变体</h5>
            <div class="demo-row">
              <StatusBadge
                :status="'online'"
                :text="'在线'"
                :variant="'gradient'"
              />
              <StatusBadge
                :status="'testing'"
                :text="'测试中'"
                :variant="'gradient'"
                :show-indicator="true"
                :pulse="true"
              />
              <StatusBadge
                :status="'warning'"
                :text="'警告'"
                :variant="'gradient'"
              />
            </div>
          </div>

          <!-- 进度条变体 -->
          <div class="demo-group">
            <h5>进度条变体</h5>
            <div class="demo-row">
              <StatusBadge
                :status="'online'"
                :text="'上传中'"
                :variant="'default'"
                :progress="75"
                :tooltip="'上传进度: 75%'"
                :tooltip-description='"/path/to/file.jpg"'
              />
              <StatusBadge
                :status="'testing'"
                :text="'检测中'"
                :variant="'default'"
                :progress="45"
                :show-indicator="true"
              />
              <StatusBadge
                :status="'offline'"
                :text="'下载失败'"
                :variant="'default'"
                :progress="100"
                :tooltip="'下载失败，请重试'"
              />
            </div>
          </div>

          <!-- 颜色方案对比 -->
          <div class="demo-group">
            <h5>颜色方案对比</h5>
            <div class="demo-row">
              <div style="display: flex; flex-direction: column; gap: 8px;">
                <StatusBadge
                  :status="'online'"
                  :text="'Default'"
                  :variant="'pills'"
                  :color-scheme="'default'"
                />
                <StatusBadge
                  :status="'online'"
                  :text="'Health'"
                  :variant="'pills'"
                  :color-scheme="'health'"
                />
                <StatusBadge
                  :status="'online'"
                  :text="'Connection'"
                  :variant="'pills'"
                  :color-scheme="'connection'"
                />
                <StatusBadge
                  :status="'online'"
                  :text="'Modern'"
                  :variant="'pills'"
                  :color-scheme="'modern'"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- LatencyIndicator 预览 -->
        <div class="preview-section">
          <h4>6. LatencyIndicator - 延迟指示器</h4>
          <div class="component-demo">
            <div class="demo-row">
              <LatencyIndicator
                :latency="45"
                :unit="'ms'"
                :color-scheme="'network'"
                :show-icon="true"
              />
              <LatencyIndicator
                :latency="156"
                :unit="'ms'"
                :color-scheme="'network'"
                :show-icon="true"
              />
              <LatencyIndicator
                :latency="623"
                :unit="'ms'"
                :color-scheme="'network'"
                :show-icon="true"
              />
              <LatencyIndicator
                :latency="null"
                :unit="'ms'"
                :color-scheme="'network'"
                :show-icon="true"
              />
              <LatencyIndicator
                :latency="-1"
                :unit="'ms'"
                :color-scheme="'network'"
                :show-icon="true"
              />
            </div>
            <div class="demo-row">
              <LatencyIndicator
                :latency="0.045"
                :unit="'s'"
                :color-scheme="'performance'"
                :size="'small'"
              />
              <LatencyIndicator
                :latency="0.156"
                :unit="'s'"
                :color-scheme="'performance'"
                :size="'medium'"
              />
              <LatencyIndicator
                :latency="1.623"
                :unit="'s'"
                :color-scheme="'performance'"
                :size="'large'"
                :precision="3"
              />
            </div>
          </div>
        </div>

        <!-- ProtocolTag 预览 -->
        <div class="preview-section">
          <h4>7. ProtocolTag - 协议标签</h4>
          <div class="component-demo">
            <div class="demo-row">
              <ProtocolTag
                :protocol="'vmess'"
                :show-icon="true"
                :variant="'colorful'"
              />
              <ProtocolTag
                :protocol="'vless'"
                :show-icon="true"
                :variant="'colorful'"
              />
              <ProtocolTag
                :protocol="'trojan'"
                :show-icon="true"
                :variant="'colorful'"
              />
              <ProtocolTag
                :protocol="'ss'"
                :show-icon="true"
                :variant="'colorful'"
              />
              <ProtocolTag
                :protocol="'ssr'"
                :show-icon="true"
                :variant="'colorful'"
              />
            </div>
            <div class="demo-row">
              <ProtocolTag
                :protocol="'http'"
                :color-scheme="'dark'"
                :size="'small'"
              />
              <ProtocolTag
                :protocol="'socks5'"
                :color-scheme="'pastel'"
                :size="'medium'"
              />
              <ProtocolTag
                :protocol="'ws'"
                :color-scheme="'vibrant'"
                :size="'large'"
              />
            </div>
          </div>
        </div>

        <!-- ActionTrigger 预览 -->
        <div class="preview-section">
          <h4>8. ActionTrigger - 动作触发器</h4>
          <div class="component-demo">
            <div class="demo-row">
              <ActionTrigger
                icon="edit"
                :tooltip="'编辑'"
                :size="'small'"
              />
              <ActionTrigger
                icon="delete"
                :tooltip="'删除'"
                :type="'error'"
                :size="'small'"
              />
              <ActionTrigger
                icon="star"
                :tooltip="'收藏'"
                :size="'medium'"
                :hover-scale="true"
              />
              <ActionTrigger
                icon="share"
                :tooltip="'分享'"
                :size="'medium'"
                :type="'primary'"
              />
              <ActionTrigger
                icon="setting"
                :tooltip="'设置'"
                :size="'large'"
                :rotate="true"
              />
            </div>
            <div class="demo-row">
              <ActionTrigger
                icon="edit"
                :text="'编辑'"
                :size="'small'"
              />
              <ActionTrigger
                icon="delete"
                :text="'删除'"
                :type="'error'"
                :size="'medium'"
              />
              <ActionTrigger
                icon="star"
                :text="'收藏'"
                :size="'large'"
                :pulse="true"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- 新增：分子组件 -->
      <div class="category-section">
        <h3 class="category-title">🧩 分子组件 (从 /nodes 提取)</h3>

        <!-- SmartFilterPanel 预览 -->
        <div class="preview-section">
          <h4>9. SmartFilterPanel - 智能过滤面板</h4>
          <div class="component-demo">
            <div class="filter-demo-container">
              <SmartFilterPanel
                v-model="filterModel"
                :title="'节点过滤器'"
                :search-config="{
                  placeholder: '搜索节点名称或服务器地址...',
                  clearable: true
                }"
                :protocol-filter="{
                  label: '协议类型',
                  options: [
                    { value: 'vmess', label: 'VMess' },
                    { value: 'vless', label: 'VLESS' },
                    { value: 'trojan', label: 'Trojan' },
                    { value: 'ss', label: 'Shadowsocks' }
                  ]
                }"
                :status-filter="{
                  label: '连接状态',
                  options: [
                    { value: 'online', label: '在线' },
                    { value: 'offline', label: '离线' },
                    { value: 'testing', label: '测试中' }
                  ]
                }"
                :quick-filters="quickFilters"
                :collapsible="true"
                @change="handleFilterChange"
              />
            </div>
          </div>
        </div>

        <!-- BulkActionsBar 预览 -->
        <div class="preview-section">
          <h4>10. BulkActionsBar - 批量操作栏</h4>
          <div class="component-demo">
            <div class="bulk-actions-demo">
              <n-button @click="simulateSelection(0)" size="small">无选中</n-button>
              <n-button @click="simulateSelection(3)" size="small">选中3项</n-button>
              <n-button @click="simulateSelection(10)" size="small">选中10项</n-button>

              <BulkActionsBar
                :selected-count="mockSelectedCount"
                :total-count="100"
                :common-actions="bulkActions"
                :smart-suggestions="mockSelectedCount > 0 ? smartSuggestions : []"
                :show-select-all="true"
                :is-all-selected="mockSelectedCount === 100"
                @action="handleBulkAction"
                @select-all="handleSelectAll"
                @clear-selection="handleClearSelection"
              />
            </div>
          </div>
        </div>

        <!-- StatsCardGrid 预览 -->
        <div class="preview-section">
          <h4>11. StatsCardGrid - 统计卡片网格</h4>
          <div class="component-demo">
            <div class="stats-grid-demo">
              <StatsCardGrid
                :stats="nodeStats"
                :columns="4"
                :size="'medium'"
                :clickable="true"
                :animated="true"
                :show-icons="true"
                :show-trend="true"
                @card-click="handleStatClick"
              />
            </div>
            <div class="stats-grid-demo">
              <StatsCardGrid
                :stats="performanceStats"
                :columns="3"
                :size="'large'"
                :show-progress="true"
                :animated="true"
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 使用指南 -->
    <div class="usage-guide">
      <h2 class="guide-title">📖 使用指南</h2>
      <div class="guide-content">
        <div class="guide-section">
          <h3>导入组件</h3>
          <n-code
            language="typescript"
            :code="importCode"
            show-line-numbers
          />
        </div>
        <div class="guide-section">
          <h3>快速开始</h3>
          <n-code
            language="vue"
            :code="usageExample"
            show-line-numbers
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { NIcon, NButton, NCode } from 'naive-ui'
import {
  ConstructOutline,
  CubeOutline,
  GridOutline,
  LayersOutline,
  CheckmarkCircleOutline,
  ServerOutline,
  CloseCircleOutline,
  SettingsOutline,
  DownloadOutline,
  TrashOutline,
  PersonCircleOutline
} from '@vicons/ionicons5'

// 导入所有组件
import {
  StatsCard,
  ActionButtonGroup,
  SmartDropdown
} from '@/components/common'

// 导入从 nodes 提取的新组件
import {
  StatusBadge,
  LatencyIndicator,
  ProtocolTag,
  ActionTrigger,
  SmartFilterPanel,
  BulkActionsBar,
  StatsCardGrid
} from '@/components/common'

// 导入原有的 nodes 组件以避免冲突
import SmartActions from '@/components/nodes/SmartActions.vue'

// 响应式数据
const selectedCount = ref(0)
const mockSelectedCount = ref(0)

// 过滤器模型
const filterModel = ref({
  search: '',
  protocols: [],
  statuses: []
})

// 快速过滤器
const quickFilters = [
  {
    key: 'online-only',
    label: '仅在线',
    filters: { statuses: ['online'] }
  },
  {
    key: 'vmess-vless',
    label: 'VMess+VLESS',
    filters: { protocols: ['vmess', 'vless'] }
  }
]

// 批量操作配置
const bulkActions = [
  {
    key: 'test',
    label: '测试连接',
    type: 'primary' as const,
    icon: 'reload'
  },
  {
    key: 'export',
    label: '导出选中',
    type: 'default' as const,
    icon: 'download'
  },
  {
    key: 'delete',
    label: '批量删除',
    type: 'error' as const,
    icon: 'delete',
    danger: true
  }
]

// 智能建议
const smartSuggestions = [
  {
    key: 'test-offline',
    label: '测试离线节点',
    priority: 1,
    handler: () => console.log('测试离线节点')
  },
  {
    key: 'reorganize',
    label: '重新组织',
    priority: 2,
    handler: () => console.log('重新组织')
  }
]

// 节点统计数据
const nodeStats = [
  {
    key: 'total',
    label: '总节点数',
    value: 1234,
    icon: 'database',
    type: 'primary' as const,
    trend: 'up' as const,
    trendValue: 5.2
  },
  {
    key: 'online',
    label: '在线节点',
    value: 856,
    icon: 'wifi',
    type: 'success' as const,
    trend: 'up' as const,
    trendValue: 3.1
  },
  {
    key: 'offline',
    label: '离线节点',
    value: 378,
    icon: 'disconnect',
    type: 'error' as const,
    trend: 'down' as const,
    trendValue: 1.8
  },
  {
    key: 'health',
    label: '健康率',
    value: 69.4,
    icon: 'heart',
    type: 'warning' as const,
    unit: '%',
    trend: 'up' as const,
    trendValue: 2.3
  }
]

// 性能统计数据
const performanceStats = [
  {
    key: 'avg-latency',
    label: '平均延迟',
    value: 156,
    icon: 'clock',
    type: 'info' as const,
    unit: 'ms',
    progress: 62
  },
  {
    key: 'success-rate',
    label: '成功率',
    value: 94.2,
    icon: 'check',
    type: 'success' as const,
    unit: '%',
    progress: 94
  },
  {
    key: 'throughput',
    label: '吞吐量',
    value: 2.4,
    icon: 'thunderbolt',
    type: 'primary' as const,
    unit: 'GB/s',
    progress: 78
  }
]

// 代码示例
const importCode = `// 从通用组件库导入
import {
  // 原子组件
  StatusBadge,
  LatencyIndicator,
  ProtocolTag,
  ActionTrigger,

  // 分子组件
  SmartFilterPanel,
  BulkActionsBar,
  StatsCardGrid,

  // 基础组件
  StatsCard,
  ActionButtonGroup,
  SmartDropdown,
  SmartActions
} from '@/components/common'`

const usageExample = `<template>
  <div class="node-management">
    <!-- 统计卡片网格 -->
    <StatsCardGrid
      :stats="nodeStats"
      :columns="4"
      :clickable="true"
      @card-click="handleStatClick"
    />

    <!-- 智能过滤面板 -->
    <SmartFilterPanel
      v-model="filters"
      :search-config="searchConfig"
      :protocol-filter="protocolFilter"
      @change="handleFiltersChange"
    />

    <!-- 节点列表 -->
    <div class="node-list">
      <div v-for="node in filteredNodes" :key="node.id" class="node-item">
        <StatusBadge :status="node.status" />
        <span class="node-name">{{ node.name }}</span>
        <LatencyIndicator :latency="node.latency" />
        <ProtocolTag :protocol="node.protocol" />
        <ActionTrigger
          icon="edit"
          :tooltip="'编辑节点'"
          @click="editNode(node)"
        />
      </div>
    </div>

    <!-- 批量操作栏 -->
    <BulkActionsBar
      :selected-count="selectedNodes.length"
      :common-actions="bulkActions"
      @action="handleBulkAction"
    />
  </div>
</template>`

// 事件处理函数
const handleAction = (action: any) => {
  console.log('操作触发:', action)
}

const handleDropdownSelect = (key: string) => {
  console.log('下拉选择:', key)
}

const toggleSelection = () => {
  selectedCount.value = selectedCount.value === 0 ? 5 : 0
}

const handleSmartAction = (action: any) => {
  console.log('智能操作:', action)
}

const handleFilterChange = (filters: any, type: string) => {
  console.log('过滤器变化:', filters, type)
}

const simulateSelection = (count: number) => {
  mockSelectedCount.value = count
}

const handleBulkAction = (action: any) => {
  console.log('批量操作:', action)
}

const handleSelectAll = () => {
  mockSelectedCount.value = 100
}

const handleClearSelection = () => {
  mockSelectedCount.value = 0
}

const handleStatClick = (stat: any) => {
  console.log('统计卡片点击:', stat)
}
</script>

<style scoped>
.component-showcase {
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px;
}

.showcase-header {
  text-align: center;
  margin-bottom: 40px;
  padding: 40px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 16px;
  color: white;
}

.page-title {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin: 0 0 12px 0;
  font-size: 2.5rem;
  font-weight: 700;
}

.page-description {
  font-size: 1.1rem;
  opacity: 0.9;
  margin: 0;
  max-width: 600px;
  margin: 0 auto;
}

.stats-section {
  margin-bottom: 40px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 40px;
}

.components-display {
  margin-bottom: 40px;
}

.display-title {
  font-size: 1.8rem;
  margin: 0 0 24px 0;
  color: #333;
  text-align: center;
}

.category-section {
  margin-bottom: 40px;
  padding: 24px;
  background: #f8f9fa;
  border-radius: 12px;
}

.category-title {
  font-size: 1.4rem;
  margin: 0 0 20px 0;
  color: #555;
  border-bottom: 2px solid #e9ecef;
  padding-bottom: 8px;
}

.preview-section {
  margin-bottom: 32px;
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.preview-section h4 {
  font-size: 1.1rem;
  margin: 0 0 16px 0;
  color: #666;
}

.demo-group {
  margin-bottom: 24px;
}

.demo-group h5 {
  font-size: 14px;
  font-weight: 600;
  color: #666;
  margin: 0 0 12px 0;
  padding-bottom: 4px;
  border-bottom: 1px solid #eee;
}

.component-demo {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.demo-row {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 6px;
  border: 1px solid #e9ecef;
}

.filter-demo-container {
  max-width: 400px;
  margin: 0 auto;
}

.bulk-actions-demo {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.bulk-actions-demo > .n-space {
  margin-bottom: 12px;
}

.stats-grid-demo {
  margin-bottom: 24px;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
}

.usage-guide {
  padding: 32px;
  background: #f8f9fa;
  border-radius: 12px;
  margin-top: 40px;
}

.guide-title {
  font-size: 1.6rem;
  margin: 0 0 24px 0;
  color: #333;
  text-align: center;
}

.guide-content {
  display: grid;
  gap: 32px;
}

.guide-section h3 {
  font-size: 1.2rem;
  margin: 0 0 12px 0;
  color: #555;
}

.smart-actions-context {
  padding: 16px;
  background: #f8f9fa;
  border-radius: 6px;
  margin-bottom: 16px;
  text-align: center;
}

.smart-actions-context p {
  margin: 0 0 12px 0;
  color: #666;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .component-showcase {
    padding: 16px;
  }

  .page-title {
    font-size: 2rem;
  }

  .demo-row {
    flex-direction: column;
    align-items: flex-start;
  }

  .stats-grid {
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 16px;
  }

  .category-section {
    padding: 16px;
  }

  .preview-section {
    padding: 16px;
  }
}

/* 深色主题适配 */
.dark .component-showcase {
  background-color: var(--n-color);
}

.dark .category-section {
  background-color: var(--n-color-modal);
}

.dark .preview-section {
  background-color: var(--n-color);
  border-color: var(--n-border-color);
}

.dark .demo-row {
  background-color: var(--n-color-modal);
  border-color: var(--n-border-color);
}
</style>