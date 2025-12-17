# 内联样式优化建议

## 可以优化的内联样式

### 1. 简单的条件样式

**❌ 当前使用**:
```vue
<div :class="isMobile ? 'w-[90vw]' : 'w-[600px]'">
```

**✅ 优化方案**:
```vue
<div :class="isMobile ? 'w-[90vw]' : 'w-[600px]'"> <!-- 已经是Tailwind，无需优化 -->
```

### 2. 响应式宽度

**❌ 当前使用**:
```vue
<div :style="{ width: '600px' }">
```

**✅ 优化方案**:
```vue
<div class="w-[600px]">
```

### 3. 简单的布尔样式

**❌ 当前使用**:
```vue
<div :style="{ display: visible ? 'block' : 'none' }">
```

**✅ 优化方案**:
```vue
<div :class="visible ? 'block' : 'hidden'">
```

## 不建议优化的内联样式

### 1. 动态百分比计算

**合理使用**:
```vue
<div :style="{ width: `${(count / total) * 100}%` }">
```

**原因**: 动态计算的百分比无法用固定的Tailwind类替代

### 2. 动态值绑定

**合理使用**:
```vue
<div :style="{ transform: `translateX(${offset}px)` }">
```

**原因**: 基于数据的动态计算值需要内联样式

### 3. CSS变量

**合理使用**:
```vue
<div :style="{ '--progress': `${progress}%` }">
```

**原因**: CSS变量提供了更好的性能和可维护性

## 优化建议总结

- **✅ 可以优化**: 固定值、简单布尔条件、基础样式属性
- **⚠️ 谨慎优化**: 复杂的动态计算、需要精确控制的样式
- **❌ 不建议优化**: 动态百分比、数据驱动的样式、CSS变量

**总体评估**: 项目中的内联样式大多是合理使用，优化空间有限。