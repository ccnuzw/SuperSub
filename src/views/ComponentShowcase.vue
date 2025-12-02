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

        <!-- 智能头部操作预览 -->
        <div class="preview-section">
          <h4>5. SmartHeaderActions - 智能头部操作</h4>
          <div class="component-demo">
            <div class="demo-row">
              <SmartHeaderActions
                :items="basicHeaderActions"
                @select="handleHeaderActionSelect"
              />
              <SmartHeaderActions
                :items="advancedHeaderActions"
                button-type="primary"
                @select="handleHeaderActionSelect"
              />
              <SmartHeaderActions
                :items="statusHeaderActions"
                button-type="success"
                size="large"
                @select="handleHeaderActionSelect"
              />
            </div>
            <div class="demo-row" style="background: #f0f9ff; padding: 20px; border-radius: 8px;">
              <SmartHeaderActions
                :items="specialHeaderActions"
                title="智能操作"
                placement="bottom-left"
                @select="handleHeaderActionSelect"
              />
              <SmartHeaderActions
                :items="badgeHeaderActions"
                button-type="warning"
                @select="handleHeaderActionSelect"
              />
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

        <!-- SmartPagination 预览 -->
        <div class="preview-section">
          <h4>12. SmartPagination - 智能分页组件</h4>
          <div class="component-demo">
            <div class="demo-description">
              <p>基于 Naive UI 的二次封装分页组件，提供丰富的功能和灵活的配置选项。</p>
            </div>

            <!-- 标准分页 -->
            <div class="demo-row">
              <div class="pagination-demo">
                <h5>标准分页</h5>
                <SmartPagination
                  :current-page="currentPage"
                  :page-size="pageSize"
                  :total-items="totalItems"
                  :show-size-picker="true"
                  :show-quick-jumper="true"
                  :show-info="true"
                  @page-change="handlePageChange"
                  @page-size-change="handlePageSizeChange"
                />
              </div>
            </div>

            <!-- 简单分页 -->
            <div class="demo-row">
              <div class="pagination-demo">
                <h5>简单分页</h5>
                <SmartPagination
                  :current-page="currentPage"
                  :page-size="pageSize"
                  :total-items="totalItems"
                  :show-size-picker="false"
                  :show-quick-jumper="false"
                  :simple="true"
                  @page-change="handlePageChange"
                />
              </div>
            </div>

            <!-- 带信息的分页 -->
            <div class="demo-row">
              <div class="pagination-demo">
                <h5>显示信息</h5>
                <SmartPagination
                  :current-page="currentPage"
                  :page-size="pageSize"
                  :total-items="totalItems"
                  :show-info="true"
                  :layout="'left'"
                  @page-change="handlePageChange"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- SmartGroupTabs 预览 -->
        <div class="preview-section">
          <h4>13. SmartGroupTabs - 智能分组标签组件</h4>
          <div class="component-demo">
            <div class="demo-description">
              <p>基于 Naive UI 的二次封装分组标签组件，提供丰富的分组管理功能和灵活的配置选项。</p>
            </div>

            <!-- 标准分组标签 -->
            <div class="demo-row">
              <div class="group-tabs-demo">
                <h5>标准分组标签</h5>
                <SmartGroupTabs
                  :groups="mockGroups"
                  :group-counts="mockGroupCounts"
                  :active-tab="activeGroupTab"
                  :show-add-button="true"
                  @update:active-tab="handleGroupTabChange"
                  @group-action="handleGroupAction"
                  @add-action="handleAddGroup"
                />
              </div>
            </div>

            <!-- 卡片式分组标签 -->
            <div class="demo-row">
              <div class="group-tabs-demo">
                <h5>卡片式分组标签</h5>
                <SmartGroupTabs
                  :groups="mockGroups.slice(0, 4)"
                  :group-counts="mockGroupCounts"
                  :active-tab="activeGroupTab"
                  :tab-type="'card'"
                  :show-add-button="false"
                  @update:active-tab="handleGroupTabChange"
                />
              </div>
            </div>

            <!-- 带禁用状态的分组标签 -->
            <div class="demo-row">
              <div class="group-tabs-demo">
                <h5>带禁用状态的分组</h5>
                <SmartGroupTabs
                  :groups="mockGroupsWithDisabled"
                  :group-counts="mockGroupCounts"
                  :active-tab="activeGroupTab"
                  :tab-type="'segment'"
                  @update:active-tab="handleGroupTabChange"
                />
              </div>
            </div>

            <!-- 自定义右键菜单的分组标签 -->
            <div class="demo-row">
              <div class="group-tabs-demo">
                <h5>自定义右键菜单（右键点击分组查看）</h5>
                <SmartGroupTabs
                  :groups="mockGroupsWithCustomMenu"
                  :group-counts="mockGroupCounts"
                  :active-tab="activeGroupTab"
                  :tab-type="'segment'"
                  :enable-inline-actions="false"
                  :show-add-button="true"
                  :custom-context-menu-options="getCustomMenuOptions"
                  @update:active-tab="handleGroupTabChange"
                  @group-action="handleCustomGroupAction"
                  @add-action="handleAddGroup"
                />
              </div>
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

        <div class="guide-section">
          <h3>SmartGroupTabs 详细使用</h3>
          <div class="sub-section">
            <h4>基础用法</h4>
            <n-code
              language="vue"
              :code="smartGroupTabsBasic"
              show-line-numbers
            />
            <p class="section-desc">最基础的分组标签使用方式，包含"全部"和"未分组"标签。</p>
          </div>

          <div class="sub-section">
            <h4>带新增分组功能</h4>
            <n-code
              language="vue"
              :code="smartGroupTabsWithAdd"
              show-line-numbers
            />
            <p class="section-desc">启用新增分组功能，用户可以通过新增分组标签或右键菜单创建新分组。</p>
          </div>

          <div class="sub-section">
            <h4>自定义右键菜单</h4>
            <n-code
              language="vue"
              :code="smartGroupTabsCustomMenu"
              show-line-numbers
            />
            <p class="section-desc">自定义分组右键菜单选项，支持添加业务特定的操作。</p>
          </div>
        </div>

        <div class="guide-section">
          <h3>API 参考</h3>
          <div class="sub-section">
            <h4>Props</h4>
            <div class="api-table">
              <table class="props-table">
                <thead>
                  <tr>
                    <th>属性名</th>
                    <th>类型</th>
                    <th>默认值</th>
                    <th>说明</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td>groups</td><td>GroupItem[]</td><td>[]</td><td>分组数据列表</td></tr>
                  <tr><td>groupCounts</td><td>GroupCount</td><td>{}</td><td>各分组数量统计</td></tr>
                  <tr><td>activeTab</td><td>string</td><td>'all'</td><td>当前激活的标签</td></tr>
                  <tr><td>showAddButton</td><td>boolean</td><td>false</td><td>是否显示新增分组按钮</td></tr>
                  <tr><td>tabType</td><td>string</td><td>'segment'</td><td>标签类型：'line' | 'card' | 'segment'</td></tr>
                  <tr><td>size</td><td>string</td><td>'medium'</td><td>标签大小：'small' | 'medium' | 'large'</td></tr>
                  <tr><td>enableContextMenu</td><td>boolean</td><td>true</td><td>是否启用右键菜单</td></tr>
                  <tr><td>enableInlineActions</td><td>boolean</td><td>true</td><td>是否启用内联操作按钮</td></tr>
                  <tr><td>customContextMenuOptions</td><td>function</td><td>null</td><td>自定义右键菜单选项</td></tr>
                </tbody>
              </table>
            </div>
          </div>

          <div class="sub-section">
            <h4>Events</h4>
            <div class="api-table">
              <table class="events-table">
                <thead>
                  <tr>
                    <th>事件名</th>
                    <th>参数</th>
                    <th>说明</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td>update:activeTab</td><td>(tabId: string)</td><td>标签切换时触发</td></tr>
                  <tr><td>group-tab-click</td><td>(group: GroupItem, event: MouseEvent)</td><td>点击分组标签时触发</td></tr>
                  <tr><td>group-action</td><td>(key: string, group: GroupItem)</td><td>分组操作时触发</td></tr>
                  <tr><td>add-action</td><td>(key: string, data?: object)</td><td>新增分组时触发</td></tr>
                </tbody>
              </table>
            </div>
          </div>

          <div class="sub-section">
            <h4>类型定义</h4>
            <n-code
              language="typescript"
              :code="typeDefinitions"
              show-line-numbers
            />
          </div>
        </div>

        <div class="guide-section">
          <h3>最佳实践</h3>
          <div class="best-practices">
            <div class="practice-item">
              <h5>1. 数据管理</h5>
              <p>建议使用响应式数据管理分组和计数，确保视图实时更新。</p>
            </div>
            <div class="practice-item">
              <h5>2. 事件处理</h5>
              <p>合理处理各种事件，特别是新增分组时的表单验证和状态管理。</p>
            </div>
            <div class="practice-item">
              <h5>3. 自定义菜单</h5>
              <p>根据业务需求自定义右键菜单，提供更丰富的操作选项。</p>
            </div>
            <div class="practice-item">
              <h5>4. 响应式设计</h5>
              <p>组件已内置响应式支持，在不同屏幕尺寸下都能良好显示。</p>
            </div>
          </div>
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
  PersonCircleOutline,
  CloudUpload,
  Flash,
  Refresh,
  Bulb,
  CheckmarkCircle,
  Create,
  InformationCircle
} from '@vicons/ionicons5'

// 导入所有组件
import {
  StatsCard,
  ActionButtonGroup,
  SmartDropdown,
  SmartHeaderActions
} from '@/components/common'

// 导入从 nodes 提取的新组件
import {
  StatusBadge,
  LatencyIndicator,
  ProtocolTag,
  ActionTrigger,
  SmartFilterPanel,
  BulkActionsBar,
  StatsCardGrid,
  SmartPagination,
  SmartGroupTabs
} from '@/components/common'

// 导入原有的 nodes 组件以避免冲突
import SmartActions from '@/components/nodes/SmartActions.vue'

// 响应式数据
const selectedCount = ref(0)
const mockSelectedCount = ref(0)

// 分页数据
const currentPage = ref(1)
const pageSize = ref(20)
const totalItems = ref(487)

// 分组标签数据
const activeGroupTab = ref('all')

const mockGroups = ref([
  { id: 'group1', name: '高速节点', description: '速度最快的节点', is_enabled: true },
  { id: 'group2', name: '海外节点', description: '国外服务器节点', is_enabled: true },
  { id: 'group3', name: '游戏节点', description: '游戏专用节点', is_enabled: true },
  { id: 'group4', name: '备用节点', description: '备用服务器', is_enabled: false },
  { id: 'group5', name: '测试节点', description: '测试用节点', is_enabled: true }
])

const mockGroupsWithDisabled = ref([
  { id: 'group1', name: '高速节点', description: '速度最快的节点', is_enabled: true },
  { id: 'group2', name: '海外节点', description: '国外服务器节点', is_enabled: false },
  { id: 'group3', name: '游戏节点', description: '游戏专用节点', is_enabled: true },
  { id: 'group4', name: '备用节点', description: '备用服务器', disabled: true },
  { id: 'group5', name: '测试节点', description: '测试用节点', is_enabled: false }
])

const mockGroupsWithCustomMenu = ref([
  { id: 'custom1', name: '企业分组', description: '企业专用分组', is_enabled: true, type: 'enterprise' },
  { id: 'custom2', name: '个人分组', description: '个人使用分组', is_enabled: true, type: 'personal' },
  { id: 'custom3', name: '共享分组', description: '团队共享分组', is_enabled: false, type: 'shared' }
])

const mockGroupCounts = ref({
  all: 156,
  ungrouped: 23,
  group1: 45,
  group2: 32,
  group3: 28,
  group4: 15,
  group5: 13,
  custom1: 25,
  custom2: 18,
  custom3: 33
})

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
  SmartPagination,
  SmartGroupTabs,

  // 基础组件
  StatsCard,
  ActionButtonGroup,
  SmartDropdown,
  SmartHeaderActions,
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

// SmartGroupTabs 代码示例
const smartGroupTabsBasic = `<template>
  <div class="group-management">
    <SmartGroupTabs
      :groups="groups"
      :group-counts="groupCounts"
      :active-tab="activeTab"
      @update:active-tab="handleTabChange"
    />
  </div>
</template>

// &lt;script setup lang="ts"&gt;
import { ref } from 'vue'
import { SmartGroupTabs } from '@/components/common'

const activeTab = ref('all')
const groups = ref([
  { id: 'group1', name: '高速节点', is_enabled: true },
  { id: 'group2', name: '海外节点', is_enabled: true }
])

const groupCounts = ref({
  all: 25,
  ungrouped: 5,
  group1: 12,
  group2: 8
})

const handleTabChange = (tabId: string) => {
  activeTab.value = tabId
}
// &lt;/script&gt;`

const smartGroupTabsWithAdd = `<template>
  <div class="group-management">
    <SmartGroupTabs
      :groups="groups"
      :group-counts="groupCounts"
      :active-tab="activeTab"
      :show-add-button="true"
      @update:active-tab="handleTabChange"
      @group-action="handleGroupAction"
      @add-action="handleAddGroup"
    />
  </div>
</template>

// &lt;script setup lang="ts"&gt;
import { ref } from 'vue'
import { SmartGroupTabs } from '@/components/common'

const activeTab = ref('all')
const groups = ref([
  { id: 'group1', name: '高速节点', is_enabled: true },
  { id: 'group2', name: '海外节点', is_enabled: true }
])

const groupCounts = ref({
  all: 25,
  ungrouped: 5,
  group1: 12,
  group2: 8
})

const handleTabChange = (tabId: string) => {
  activeTab.value = tabId
}

const handleGroupAction = (key: string, group: any) => {
  if (key === 'delete') {
    // 删除分组逻辑
    console.log('删除分组:', group.name)
  } else if (key === 'rename') {
    // 重命名分组逻辑
    console.log('重命���分组:', group.name)
  }
}

const handleAddGroup = (key: string, data?: { name: string; description: string }) => {
  if (key === 'add-group' && data) {
    const newGroup = {
      id: \`group\${Date.now()}\`,
      name: data.name,
      description: data.description,
      is_enabled: true
    }
    groups.value.push(newGroup)
    groupCounts.value[newGroup.id] = 0
  }
}
// &lt;/script&gt;`

const smartGroupTabsCustomMenu = `<template>
  <div class="group-management">
    <SmartGroupTabs
      :groups="groups"
      :group-counts="groupCounts"
      :active-tab="activeTab"
      :show-add-button="true"
      :enable-inline-actions="false"
      :custom-context-menu-options="getCustomMenuOptions"
      @update:active-tab="handleTabChange"
      @group-action="handleCustomGroupAction"
      @add-action="handleAddGroup"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { SmartGroupTabs } from '@/components/common'

const activeTab = ref('all')
const groups = ref([
  { id: 'group1', name: '高速节点', type: 'premium', is_enabled: true },
  { id: 'group2', name: '海外节点', type: 'standard', is_enabled: true }
])

const groupCounts = ref({
  all: 25,
  ungrouped: 5,
  group1: 12,
  group2: 8
})

// 自定义右键菜单选项
const getCustomMenuOptions = (group: any) => {
  const options = [
    { label: '查看详情', key: 'view-details', type: 'primary' },
    { label: '复制分组', key: 'copy-group', type: 'default' }
  ]

  // 根据分组类型添加特定选项
  if (group.type === 'premium') {
    options.push(
      { label: '管理权限', key: 'manage-permissions', type: 'warning' },
      { label: '导出报告', key: 'export-report', type: 'info' }
    )
  }

  options.push({ label: '删除分组', key: 'delete', type: 'error', danger: true })

  return options
}

const handleCustomGroupAction = (key: string, group: any) => {
  console.log('自定义操作:', key, group.name)
  // 处理各种自定义操作
}

const handleAddGroup = (key: string, data?: { name: string; description: string }) => {
  if (key === 'add-group' && data) {
    const newGroup = {
      id: \`group\${Date.now()}\`,
      name: data.name,
      description: data.description,
      type: 'standard',
      is_enabled: true
    }
    groups.value.push(newGroup)
    groupCounts.value[newGroup.id] = 0
  }
}
// &lt;/script&gt;`

// TypeScript 类型定义
const typeDefinitions = `// 分组项目接口
interface GroupItem {
  id: string
  name: string
  description?: string
  is_enabled?: boolean
  disabled?: boolean
  [key: string]: any // 支持扩展属性
}

// 分组计数接口
interface GroupCount {
  all: number
  ungrouped: number
  [groupId: string]: number
}

// 操作选项接口
interface ActionOption {
  label: string
  key: string
  type?: 'default' | 'primary' | 'info' | 'success' | 'warning' | 'error'
  icon?: Component
  description?: string
  danger?: boolean
  disabled?: boolean
}

// 组件 Props 接口
interface SmartGroupTabsProps {
  groups: GroupItem[]
  groupCounts: GroupCount
  activeTab: string
  showAddButton?: boolean
  tabType?: 'line' | 'card' | 'segment'
  size?: 'small' | 'medium' | 'large'
  enableContextMenu?: boolean
  enableInlineActions?: boolean
  customContextMenuOptions?: ((group: GroupItem) => ActionOption[]) | null
  customInlineActionOptions?: ((group: GroupItem) => ActionOption[]) | null
}`

// SmartHeaderActions 演示数据
const basicHeaderActions = [
  {
    key: 'import',
    label: '批量导入',
    icon: CloudUpload,
    description: '从文件或链接批量导入'
  },
  {
    key: 'test-all',
    label: '批量测试',
    icon: Flash,
    description: '测试所有节点的连通性'
  },
  {
    key: 'export-all',
    label: '导出全部',
    icon: DownloadOutline,
    description: '导出所有节点配置'
  },
  {
    type: 'divider' as const,
    key: 'divider-1'
  },
  {
    key: 'refresh',
    label: '刷新数据',
    icon: Refresh,
    description: '重新获取节点数据'
  }
];

const advancedHeaderActions = [
  {
    key: 'smart-filter',
    label: '智能筛选',
    icon: Bulb,
    description: '基于AI的节点筛选',
    badge: 'NEW',
    badgeType: 'success' as const
  },
  {
    key: 'batch-edit',
    label: '批量编辑',
    icon: Create,
    description: '批量编辑节点属性',
    shortcut: 'Ctrl+E'
  },
  {
    key: 'health-check',
    label: '健康检查',
    icon: CheckmarkCircle,
    description: '执行全面的健康检查',
    status: '运行中',
    statusType: 'online' as const
  },
  {
    type: 'divider' as const,
    key: 'divider-2'
  },
  {
    key: 'settings',
    label: '高级设置',
    icon: SettingsOutline,
    description: '配置高级选项',
    type: 'warning' as const
  }
];

const statusHeaderActions = [
  {
    key: 'analytics',
    label: '数据分析',
    icon: ServerOutline,
    description: '查看节点使用分析',
    badge: 'PRO',
    badgeType: 'primary' as const
  },
  {
    key: 'backup',
    label: '备份管理',
    icon: CloudUpload,
    description: '管理数据备份',
    status: '已同步',
    statusType: 'online' as const
  },
  {
    key: 'monitor',
    label: '实时监控',
    icon: CheckmarkCircle,
    description: '监控节点状态',
    type: 'success' as const
  }
];

const specialHeaderActions = [
  {
    key: 'ai-optimizer',
    label: 'AI优化器',
    icon: Bulb,
    description: '智能优化节点选择',
    badge: 'AI',
    badgeType: 'warning' as const
  },
  {
    key: 'template-manager',
    label: '模板管理',
    icon: SettingsOutline,
    description: '管理配置模板',
    shortcut: 'Ctrl+T'
  },
  {
    key: 'export-report',
    label: '导出报告',
    icon: DownloadOutline,
    description: '生成详细报告',
    type: 'primary' as const
  },
  {
    type: 'divider' as const,
    key: 'divider-1'
  },
  {
    key: 'help',
    label: '帮助中心',
    icon: InformationCircle,
    description: '获取使用帮助',
    href: 'https://docs.example.com',
    target: '_blank'
  }
];

const badgeHeaderActions = [
  {
    key: 'notifications',
    label: '通知中心',
    icon: ServerOutline,
    description: '查看系统通知',
    badge: '5',
    badgeType: 'error' as const
  },
  {
    key: 'tasks',
    label: '任务队列',
    icon: Flash,
    description: '查看后台任务',
    status: '处理中',
    statusType: 'busy' as const
  },
  {
    key: 'updates',
    label: '系统更新',
    icon: Refresh,
    description: '检查系统更新',
    badge: '2',
    badgeType: 'warning' as const
  }
];

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

const handleHeaderActionSelect = (key: string, item: any) => {
  console.log('头部操作选择:', key, item)

  // 模拟不同操作的反馈
  switch (key) {
    case 'import':
      console.log('打开批量导入对话框')
      break
    case 'test-all':
      console.log('开始批量测试所有节点')
      break
    case 'export-all':
      console.log('导出所有节点配置')
      break
    case 'refresh':
      console.log('刷新节点数据')
      break
    case 'ai-optimizer':
      console.log('启动AI优化器')
      break
    case 'help':
      console.log('打开帮助中心')
      break
    default:
      console.log(`执行操作: ${item.label}`)
  }
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

const handlePageChange = (page: number) => {
  console.log('页码变化:', page)
  currentPage.value = page
}

const handlePageSizeChange = (size: number) => {
  console.log('页面大小变化:', size)
  pageSize.value = size
  currentPage.value = 1 // 重置到第一页
}

const handleGroupTabChange = (tabId: string) => {
  console.log('分组标签变化:', tabId)
  activeGroupTab.value = tabId
}

const handleGroupAction = (key: string, group: any) => {
  console.log('分组操作:', key, group)

  switch (key) {
    case 'toggle':
      console.log(`切换分组状态: ${group.name}`)
      // 在实际应用中，这里会调用API更新状态
      group.is_enabled = !group.is_enabled
      break
    case 'rename':
      const newName = prompt(`重命名分组 "${group.name}":`, group.name)
      if (newName && newName !== group.name) {
        console.log(`重命名分组: ${group.name} -> ${newName}`)
        group.name = newName
      }
      break
    case 'delete':
      if (confirm(`确定要删除分组 "${group.name}" 吗？`)) {
        console.log(`删除分组: ${group.name}`)
        // 在实际应用中，这里会调用API删除分组
      }
      break
  }
}

const handleAddGroup = (key: string, data?: { name: string; description: string }) => {
  console.log('添加分组操作:', key, data)

  if (key === 'add-group' && data) {
    const newGroup = {
      id: `group${Date.now()}`,
      name: data.name,
      description: data.description,
      is_enabled: true
    }
    mockGroups.value.push(newGroup)
    mockGroupCounts.value[newGroup.id] = 0
    console.log('添加新分组:', data.name, data.description)
  }
}

// 自定义菜单选项处理
const getCustomMenuOptions = (group: any) => {
  const baseOptions: any[] = [
    { label: '查看详情', key: 'view-details', type: 'primary' as const },
    { label: '复制链接', key: 'copy-link', type: 'default' as const }
  ];

  // 根据分组类型添加特定选项
  if (group.type === 'enterprise') {
    baseOptions.push(
      { label: '管理权限', key: 'manage-permissions', type: 'warning' as const },
      { label: '导出报告', key: 'export-report', type: 'info' as const }
    );
  } else if (group.type === 'personal') {
    baseOptions.push(
      { label: '分享设置', key: 'share-settings', type: 'success' as const },
      { label: '隐私模式', key: 'privacy-mode', type: 'warning' as const }
    );
  } else if (group.type === 'shared') {
    baseOptions.push(
      { label: '邀请成员', key: 'invite-members', type: 'primary' as const },
      { label: '查看成员', key: 'view-members', type: 'default' as const }
    );
  }

  // 根据状态添加操作
  if (group.is_enabled) {
    baseOptions.push({ label: '暂停分组', key: 'pause-group', type: 'warning' as const });
  } else {
    baseOptions.push({ label: '启用分组', key: 'enable-group', type: 'success' as const });
  }

  baseOptions.push(
    { type: 'divider' as const, key: `divider-${Date.now()}` },
    { label: '重命名', key: 'rename', type: 'default' as const },
    { label: '删除', key: 'delete', type: 'error' as const, danger: true }
  );

  return baseOptions;
}

const handleCustomGroupAction = (key: string, group: any) => {
  console.log('自定义分组操作:', key, group);

  switch (key) {
    case 'view-details':
      alert(`查看分组详情: ${group.name}`);
      break;
    case 'copy-link':
      navigator.clipboard.writeText(`https://example.com/group/${group.id}`);
      break;
    case 'manage-permissions':
      console.log('管理企业分组权限:', group.name);
      break;
    case 'export-report':
      console.log('导出企业分组报告:', group.name);
      break;
    case 'share-settings':
      console.log('设置个人分组分享:', group.name);
      break;
    case 'privacy-mode':
      console.log('切换个人分组隐私模式:', group.name);
      break;
    case 'invite-members':
      console.log('邀请成员加入共享分组:', group.name);
      break;
    case 'view-members':
      console.log('查看共享分组成员:', group.name);
      break;
    case 'pause-group':
      group.is_enabled = false;
      console.log('暂停分组:', group.name);
      break;
    case 'enable-group':
      group.is_enabled = true;
      console.log('启用分组:', group.name);
      break;
    case 'rename':
      const newName = prompt(`重命名分组 "${group.name}":`, group.name);
      if (newName && newName !== group.name) {
        group.name = newName;
        console.log(`重命名分组: ${group.name} -> ${newName}`);
      }
      break;
    case 'delete':
      if (confirm(`确定要删除分组 "${group.name}" 吗？`)) {
        console.log(`删除分组: ${group.name}`);
      }
      break;
  }
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

.pagination-demo {
  margin-bottom: 24px;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
}

.pagination-demo h5 {
  margin: 0 0 16px 0;
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.group-tabs-demo {
  margin-bottom: 24px;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
}

.group-tabs-demo h5 {
  margin: 0 0 16px 0;
  font-size: 14px;
  font-weight: 600;
  color: #333;
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

/* 子章节样式 */
.sub-section {
  margin-bottom: 24px;
  padding: 20px;
  background: white;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.sub-section h4 {
  font-size: 1.1rem;
  margin: 0 0 16px 0;
  color: #333;
  font-weight: 600;
}

.section-desc {
  margin: 12px 0 0 0;
  color: #666;
  font-size: 0.9rem;
  line-height: 1.5;
}

/* API 表格样式 */
.api-table {
  overflow-x: auto;
  margin: 16px 0;
}

.props-table,
.events-table {
  width: 100%;
  border-collapse: collapse;
  background: white;
  border-radius: 6px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.props-table th,
.events-table th {
  background: #f8f9fa;
  padding: 12px 16px;
  text-align: left;
  font-weight: 600;
  color: #333;
  border-bottom: 2px solid #e2e8f0;
}

.props-table td,
.events-table td {
  padding: 12px 16px;
  border-bottom: 1px solid #e2e8f0;
  color: #555;
}

.props-table tr:last-child td,
.events-table tr:last-child td {
  border-bottom: none;
}

.props-table tr:hover,
.events-table tr:hover {
  background: #f8f9fa;
}

/* 代码表格特殊处理 */
.props-table td:nth-child(2) {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  background: #f1f3f4;
  padding: 8px 12px;
  border-radius: 4px;
  font-size: 0.9rem;
}

.events-table td:nth-child(2) {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  background: #f1f3f4;
  padding: 8px 12px;
  border-radius: 4px;
  font-size: 0.9rem;
}

/* 最佳实践样式 */
.best-practices {
  display: grid;
  gap: 16px;
  margin-top: 16px;
}

.practice-item {
  padding: 16px 20px;
  background: white;
  border-left: 4px solid #1890ff;
  border-radius: 0 6px 6px 0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.practice-item h5 {
  margin: 0 0 8px 0;
  color: #1890ff;
  font-size: 1rem;
  font-weight: 600;
}

.practice-item p {
  margin: 0;
  color: #555;
  line-height: 1.5;
}

/* 响应式优化 */
@media (max-width: 768px) {
  .sub-section {
    padding: 16px;
    margin-bottom: 16px;
  }

  .api-table {
    font-size: 0.9rem;
  }

  .props-table th,
  .props-table td,
  .events-table th,
  .events-table td {
    padding: 8px 12px;
  }

  .best-practices {
    gap: 12px;
  }

  .practice-item {
    padding: 12px 16px;
  }
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