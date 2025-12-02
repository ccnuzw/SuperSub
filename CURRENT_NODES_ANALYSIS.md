# 🔍 当前Nodes模块组件使用情况分析

## 📊 **现状分析**

### ❌ **当前Nodes模块使用的是独立组件**

从代码分析可以看出，当前Nodes模块**并没有**使用通用组件库：

```vue
<!-- NodesModernLayout.vue 中使用的是独立组件 -->
<PerfectDropdown              <!-- 独立的下拉组件 -->
<SmartActions                 <!-- nodes目录下的智能操作 -->
<!-- 以及自定义的统计卡片和样式 -->
```

### 📁 **当前文件结构**

```
src/
├── views/
│   └── NodesView.vue           -> 导入 NodesModernLayout
├── components/
│   ├── nodes/                  -> Nodes专用组件
│   │   ├── NodesModernLayout.vue
│   │   ├── SmartActions.vue
│   │   ├── SmartToolbar.vue
│   │   └── ...
│   └── PerfectDropdown.vue     -> 独立的通用下拉组件
└── common/                     -> 新建的通用组件库
    ├── StatsCard.vue
    ├── ActionButtonGroup.vue
    ├── SmartDropdown.vue
    ├── SmartActions.vue
    └── ...
```

## 🚀 **迁移方案**

### **步骤1: 更新NodesModernLayout.vue引���**

```vue
<!-- 旧的导入 -->
import SmartActions from './SmartActions.vue';
import PerfectDropdown from '../PerfectDropdown.vue';

<!-- 新的导入 -->
import SmartActions from '@/components/common/SmartActions.vue';
import SmartDropdown from '@/components/common/SmartDropdown.vue';
```

### **步骤2: 替换统计卡片**

```vue
<!-- 旧的统计卡片 -->
<div class="stat-card">
  <div class="stat-icon">
    <n-icon :component="NodesIcon" />
  </div>
  <div class="stat-content">
    <div class="stat-number">{{ nodeStats.totalCount }}</div>
    <div class="stat-label">全部节点</div>
  </div>
</div>

<!-- 新的统计卡片 -->
<StatsCard
  title="全部节点"
  :value="nodeStats.totalCount"
  :icon="NodesIcon"
  color="primary"
  :clickable="true"
  @click="handleViewChange('all')"
/>
```

### **步骤3: 完整迁移示例**

让我创建一个迁移后的完整示例：
