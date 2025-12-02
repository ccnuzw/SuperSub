# StatusBadge 美化版使用指南

全新的 StatusBadge 状态徽章组件已经全面美化，现在提供了多种现代化的变体和丰富的功能！

## 🎨 全新设计特色

### 1. 多种视觉变体
- **默认变体 (default)** - 经典的徽章样式
- **极简变体 (minimal)** - 简洁的无背景样式
- **胶丸变体 (pills)** - 圆润的胶囊样式
- **玻璃变体 (glass)** - 毛玻璃效果
- **霓虹变体 (neon)** - 赛博朋克风格
- **渐变变体 (gradient)** - 渐变色背景

### 2. 丰富的功能特性
- **状态指示灯** - 可选的脉冲动画效果
- **进度条显示** - 内置进度条支持
- **工具提示** - 丰富的提示信息
- **多种尺寸** - small、medium、large
- **多种颜色方案** - default、health、connection、modern
- **动画效果** - 脉冲、发光、悬浮动画

## 🚀 使用示例

### 基础用法

```vue
<template>
  <!-- 基础状态徽章 -->
  <StatusBadge :status="'online'" text="在线" />
  <StatusBadge :status="'offline'" text="离线" />
  <StatusBadge :status="'testing'" text="测试中" />
  <StatusBadge :status="'error'" text="错误" />
</template>
```

### 变体展示

```vue
<template>
  <!-- 极简变体，带指示灯和脉冲效果 -->
  <StatusBadge
    :status="'online'"
    text="活跃"
    :variant="'minimal'"
    :show-indicator="true"
    :pulse="true"
  />

  <!-- 胶丸变体，圆润设计 -->
  <StatusBadge
    :status="'online'"
    text="连接成功"
    :variant="'pills'"
    :round="true"
    :pulse="true"
  />

  <!-- 玻璃变体，背景适配 -->
  <StatusBadge
    :status="'online'"
    text="在线"
    :variant="'glass'"
    :glow="true"
  />

  <!-- 霓虹变体，暗色背景 -->
  <StatusBadge
    :status="'online'"
    text="ACTIVE"
    :variant="'neon'"
    :pulse="true"
  />

  <!-- 渐变变体 -->
  <StatusBadge
    :status="'online'"
    text="在线"
    :variant="'gradient'"
  />
</template>
```

### 进度条变体

```vue
<template>
  <!-- 带进度条的徽章 -->
  <StatusBadge
    :status="'online'"
    text="上传中"
    :variant="'default'"
    :progress="75"
    :tooltip="'上传进度: 75%'"
    :tooltip-description="'正在上传文件到服务器'"
  />

  <!-- 测试状态，带指示灯和进度 -->
  <StatusBadge
    :status="'testing'"
    text="检测中"
    :variant="'default'"
    :progress="45"
    :show-indicator="true"
    :tooltip="'检测进度: 45%'"
  />
</template>
```

### 颜色方案

```vue
<template>
  <!-- 默认颜色方案 -->
  <StatusBadge
    :status="'online'"
    text="Default"
    :variant="'pills'"
    :color-scheme="'default'"
  />

  <!-- 健康颜色方案 -->
  <StatusBadge
    :status="'online'"
    text="Health"
    :variant="'pills'"
    :color-scheme="'health'"
  />

  <!-- 连接颜色方案 -->
  <StatusBadge
    :status="'online'"
    text="Connection"
    :variant="'pills'"
    :color-scheme="'connection'"
  />

  <!-- 现代颜色方案 -->
  <StatusBadge
    :status="'online'"
    text="Modern"
    :variant="'pills'"
    :color-scheme="'modern'"
  />
</template>
```

### 高级功能

```vue
<template>
  <!-- 完整功能示例 -->
  <StatusBadge
    :status="'online'"
    text="服务器就绪"
    :size="'large'"
    :variant="'gradient'"
    :color-scheme="'modern'"
    :show-indicator="true"
    :pulse="true"
    :glow="true"
    :progress="100"
    :tooltip="'服务器状态: 就绪'"
    :tooltip-description='服务器地址: 192.168.1.100&#10;CPU: 45%&#10;内存: 2.1GB/4GB'
    @click="handleStatusClick"
  />
</template>

<script setup lang="ts">
const handleStatusClick = (event: MouseEvent) => {
  console.log('状态徽章被点击')
  // 可以显示详细信息或执行其他操作
}
</script>
```

## 🎯 实际应用场景

### 1. 节点状态显示
```vue
<template>
  <div class="node-list">
    <div v-for="node in nodes" :key="node.id" class="node-item">
      <span class="node-name">{{ node.name }}</span>
      <StatusBadge
        :status="node.status"
        :variant="'minimal'"
        :size="'small'"
        :show-indicator="true"
        :pulse="node.status === 'online'"
        :tooltip="`最后更新: ${node.lastUpdate}`"
      />
    </div>
  </div>
</template>
```

### 2. 任务进度显示
```vue
<template>
  <div class="task-list">
    <div v-for="task in tasks" :key="task.id" class="task-item">
      <span class="task-name">{{ task.name }}</span>
      <StatusBadge
        :status="task.status"
        :text="task.statusText"
        :variant="'pills'"
        :progress="task.progress"
        :tooltip="`任务ID: ${task.id}`"
        :tooltip-description="`创建时间: ${task.createdAt}`"
      />
    </div>
  </div>
</template>
```

### 3. 系统监控面板
```vue
<template>
  <div class="monitoring-panel">
    <div class="panel-section">
      <h3>服务状态</h3>
      <StatusBadge
        :status="'online'"
        text="API 服务"
        :variant="'gradient'"
        :color-scheme="'modern'"
        :show-indicator="true"
        :pulse="true"
        :glow="true"
      />
    </div>

    <div class="panel-section">
      <h3>数据库连接</h3>
      <StatusBadge
        :status="'testing'"
        text="MySQL"
        :variant="'glass'"
        :show-indicator="true"
        :pulse="true"
      />
    </div>
  </div>
</template>
```

## 📱 响应式设计

StatusBadge 完全支持响应式设计：

- **移动端优化**: 在小屏幕设备上自动隐藏进度条
- **触摸友好**: 适当的点击区域大小
- **自适应布局**: 在不同容器中都能很好地显示

## 🌙 深色主题

组件完全支持深色主题：

- 玻璃变体会自动适配深色背景
- 所有颜色方案都有深色主题优化
- 霓虹变体在深色主题下效果更佳

## 🎭 动画效果

### 内置动画
- **脉冲效果**: `pulse` 属性启用图标脉冲动画
- **发光效果**: `glow` 属性启用悬浮发光效果
- **悬浮动画**: 所有变体都有平滑的悬浮过渡效果
- **指示灯动画**: 状态指示灯的脉冲扩散效果

### 自定义动画
```vue
<template>
  <!-- 自定义动画持续时间 -->
  <StatusBadge
    :status="'online'"
    text="自定义动画"
    :pulse="true"
    style="animation-duration: 1s"
  />
</template>
```

## 🛠️ 高级配置

### 所有可用属性
```typescript
interface StatusBadgeProps {
  status: 'online' | 'offline' | 'testing' | 'error' | 'warning' | 'unknown' | 'loading' | 'connecting' | 'disconnecting'
  text?: string
  size?: 'small' | 'medium' | 'large'
  variant?: 'default' | 'minimal' | 'pills' | 'glass' | 'neon' | 'gradient'
  showIcon?: boolean
  showIndicator?: boolean
  bordered?: boolean
  round?: boolean
  colorScheme?: 'default' | 'health' | 'connection' | 'modern'
  pulse?: boolean
  glow?: boolean
  progress?: number
  tooltip?: string
  tooltipDescription?: string
  tooltipPlacement?: 'top' | 'bottom' | 'left' | 'right'
}
```

## 🎉 现在就试试看吧！

访问 **http://localhost:5174/** 查看美化后的 StatusBadge 组件展示页面，体验所有新的变体和功能！