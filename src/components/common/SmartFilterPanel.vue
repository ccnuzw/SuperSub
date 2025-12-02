<template>
  <div class="smart-filter-panel" :class="panelClasses">
    <!-- 头部区域 -->
    <div v-if="showHeader" class="filter-panel__header">
      <div class="filter-panel__title">
        <n-icon :component="FilterOutlined" />
        <span>{{ title }}</span>
      </div>
      <div class="filter-panel__actions">
        <n-button
          v-if="hasActiveFilters"
          text
          type="primary"
          size="small"
          @click="handleReset"
        >
          重置
        </n-button>
        <n-button
          text
          size="small"
          @click="handleToggleCollapse"
        >
          <n-icon :component="collapsed ? ExpandOutlined : ShrinkOutlined" />
        </n-button>
      </div>
    </div>

    <!-- 过滤器内容 -->
    <n-collapse-transition :show="!collapsed">
      <div class="filter-panel__content">
        <!-- 搜索框 -->
        <div v-if="searchConfig" class="filter-section">
          <div class="filter-section__label">{{ searchConfig.label || '搜索' }}</div>
          <n-input
            :placeholder="searchConfig.placeholder || '输入关键词搜索...'"
            :value="searchValue"
            :clearable="searchConfig.clearable !== false"
            :size="inputSize"
            @update:value="handleSearchChange"
            @clear="handleSearchClear"
          >
            <template #prefix>
              <n-icon :component="SearchOutlined" />
            </template>
          </n-input>
        </div>

        <!-- 协议过滤器 -->
        <div v-if="protocolFilter" class="filter-section">
          <div class="filter-section__label">{{ protocolFilter.label || '协议类型' }}</div>
          <n-checkbox-group
            :value="selectedProtocols"
            @update:value="handleProtocolChange"
          >
            <n-space size="small">
              <n-checkbox
                v-for="protocol in protocolFilter.options"
                :key="protocol.value"
                :value="protocol.value"
                :label="protocol.label"
              />
            </n-space>
          </n-checkbox-group>
        </div>

        <!-- 状态过滤器 -->
        <div v-if="statusFilter" class="filter-section">
          <div class="filter-section__label">{{ statusFilter.label || '状态' }}</div>
          <n-checkbox-group
            :value="selectedStatuses"
            @update:value="handleStatusChange"
          >
            <n-space size="small">
              <n-checkbox
                v-for="status in statusFilter.options"
                :key="status.value"
                :value="status.value"
                :label="status.label"
              />
            </n-space>
          </n-checkbox-group>
        </div>

        <!-- 自定义过滤器 -->
        <div v-for="filter in customFilters" :key="filter.key" class="filter-section">
          <div class="filter-section__label">{{ filter.label }}</div>

          <!-- 选项框类型 -->
          <n-checkbox-group
            v-if="filter.type === 'checkbox'"
            :value="filterValues[filter.key]"
            @update:value="(value) => handleCustomFilterChange(filter.key, value)"
          >
            <n-space size="small">
              <n-checkbox
                v-for="option in filter.options"
                :key="option.value"
                :value="option.value"
                :label="option.label"
              />
            </n-space>
          </n-checkbox-group>

          <!-- 单选类型 -->
          <n-radio-group
            v-else-if="filter.type === 'radio'"
            :value="filterValues[filter.key]"
            @update:value="(value) => handleCustomFilterChange(filter.key, value)"
          >
            <n-space size="small">
              <n-radio
                v-for="option in filter.options"
                :key="option.value"
                :value="option.value"
                :label="option.label"
              />
            </n-space>
          </n-radio-group>

          <!-- 下拉选择类型 -->
          <n-select
            v-else-if="filter.type === 'select'"
            :value="filterValues[filter.key]"
            :options="(filter.options as any)"
            :placeholder="filter.placeholder || '请选择...'"
            :multiple="filter.multiple"
            :clearable="filter.clearable !== false"
            :size="inputSize"
            @update:value="(value) => handleCustomFilterChange(filter.key, value)"
          />

          <!-- 滑块类型 -->
          <n-slider
            v-else-if="filter.type === 'range'"
            :value="filterValues[filter.key]"
            :min="filter.min"
            :max="filter.max"
            :step="filter.step"
            :range="filter.range !== false"
            :marks="filter.marks"
            @update:value="(value) => handleCustomFilterChange(filter.key, value)"
          />
        </div>

        <!-- 快速过滤器 -->
        <div v-if="quickFilters && quickFilters.length" class="filter-section">
          <div class="filter-section__label">快速筛选</div>
          <n-space size="small">
            <n-button
              v-for="quickFilter in quickFilters"
              :key="quickFilter.key"
              :type="isQuickFilterActive(quickFilter) ? 'primary' : 'default'"
              size="small"
              dashed
              @click="handleQuickFilter(quickFilter)"
            >
              {{ quickFilter.label }}
            </n-button>
          </n-space>
        </div>
      </div>
    </n-collapse-transition>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import {
  NButton,
  NIcon,
  NCollapseTransition,
  NInput,
  NCheckboxGroup,
  NCheckbox,
  NRadioGroup,
  NRadio,
  NSelect,
  NSlider,
  NSpace
} from 'naive-ui'
import {
  FilterOutlined,
  SearchOutlined,
  ExpandOutlined,
  ShrinkOutlined
} from '@vicons/antd'

interface FilterOption {
  value: string | number
  label: string
  disabled?: boolean
}

interface CustomFilter {
  key: string
  label: string
  type: 'checkbox' | 'radio' | 'select' | 'range'
  options?: FilterOption[]
  placeholder?: string
  multiple?: boolean
  clearable?: boolean
  min?: number
  max?: number
  step?: number
  range?: boolean
  marks?: Record<number, string>
}

interface QuickFilter {
  key: string
  label: string
  filters: Record<string, any>
}

interface SearchConfig {
  label?: string
  placeholder?: string
  clearable?: boolean
  debounce?: number
}

interface ProtocolFilter {
  label?: string
  options: FilterOption[]
}

interface StatusFilter {
  label?: string
  options: FilterOption[]
}

interface Props {
  title?: string
  collapsed?: boolean
  collapsible?: boolean
  showHeader?: boolean
  size?: 'small' | 'medium' | 'large'
  position?: 'left' | 'right' | 'top'
  searchConfig?: SearchConfig
  protocolFilter?: ProtocolFilter
  statusFilter?: StatusFilter
  customFilters?: CustomFilter[]
  quickFilters?: QuickFilter[]
  modelValue?: {
    search?: string
    protocols?: string[]
    statuses?: string[]
    [key: string]: any
  }
}

const props = withDefaults(defineProps<Props>(), {
  title: '过滤器',
  collapsed: false,
  collapsible: true,
  showHeader: true,
  size: 'medium',
  position: 'left'
})

const emit = defineEmits<{
  'update:modelValue': [value: any]
  'update:collapsed': [value: boolean]
  'reset': []
  'change': [filters: any, type: string]
}>()

const localCollapsed = ref(props.collapsed)
const searchValue = ref(props.modelValue?.search || '')
const selectedProtocols = ref(props.modelValue?.protocols || [])
const selectedStatuses = ref(props.modelValue?.statuses || [])
const filterValues = ref<Record<string, any>>({})

// 初始化自定义过滤器的值
if (props.customFilters) {
  props.customFilters.forEach(filter => {
    filterValues.value[filter.key] = props.modelValue?.[filter.key] ||
      (filter.type === 'range' ? [filter.min, filter.max] :
       filter.type === 'checkbox' ? [] :
       filter.type === 'select' && filter.multiple ? [] : null)
  })
}

const panelClasses = computed(() => [
  'smart-filter-panel',
  `smart-filter-panel--${props.size}`,
  `smart-filter-panel--${props.position}`,
  {
    'smart-filter-panel--collapsed': localCollapsed.value,
    'smart-filter-panel--collapsible': props.collapsible
  }
])

const inputSize = computed(() => {
  const sizeMap = {
    small: 'small' as const,
    medium: 'medium' as const,
    large: 'medium' as const
  }
  return sizeMap[props.size]
})

const hasActiveFilters = computed(() => {
  return Boolean(
    searchValue.value ||
    (selectedProtocols.value && selectedProtocols.value.length > 0) ||
    (selectedStatuses.value && selectedStatuses.value.length > 0) ||
    Object.values(filterValues.value).some(value =>
      Array.isArray(value) ? value.length > 0 : value !== null && value !== undefined
    )
  )
})

const currentFilters = computed(() => ({
  search: searchValue.value,
  protocols: selectedProtocols.value,
  statuses: selectedStatuses.value,
  ...filterValues.value
}))

const handleToggleCollapse = () => {
  if (!props.collapsible) return
  localCollapsed.value = !localCollapsed.value
  emit('update:collapsed', localCollapsed.value)
}

const handleSearchChange = (value: string) => {
  searchValue.value = value
  emitChange('search')
}

const handleSearchClear = () => {
  searchValue.value = ''
  emitChange('search')
}

const handleProtocolChange = (value: (string | number)[]) => {
  selectedProtocols.value = value as string[]
  emitChange('protocol')
}

const handleStatusChange = (value: (string | number)[]) => {
  selectedStatuses.value = value as string[]
  emitChange('status')
}

const handleCustomFilterChange = (key: string, value: any) => {
  filterValues.value[key] = value
  emitChange('custom')
}

const handleQuickFilter = (quickFilter: QuickFilter) => {
  // 应用快速过滤器
  Object.assign(filterValues.value, quickFilter.filters)

  // 更新协议和状态选择
  if (quickFilter.filters.protocols) {
    selectedProtocols.value = quickFilter.filters.protocols
  }
  if (quickFilter.filters.statuses) {
    selectedStatuses.value = quickFilter.filters.statuses
  }
  if (quickFilter.filters.search !== undefined) {
    searchValue.value = quickFilter.filters.search
  }

  emitChange('quick')
}

const isQuickFilterActive = (quickFilter: QuickFilter): boolean => {
  return Object.entries(quickFilter.filters).every(([key, value]) => {
    if (key === 'protocols') return JSON.stringify(selectedProtocols.value) === JSON.stringify(value)
    if (key === 'statuses') return JSON.stringify(selectedStatuses.value) === JSON.stringify(value)
    if (key === 'search') return searchValue.value === value
    return JSON.stringify(filterValues.value[key]) === JSON.stringify(value)
  })
}

const handleReset = () => {
  searchValue.value = ''
  selectedProtocols.value = []
  selectedStatuses.value = []

  // 重置自定义过滤器
  if (props.customFilters) {
    props.customFilters.forEach(filter => {
      filterValues.value[filter.key] =
        filter.type === 'range' ? [filter.min, filter.max] :
        filter.type === 'checkbox' ? [] :
        filter.type === 'select' && filter.multiple ? [] : null
    })
  }

  emitChange('reset')
  emit('reset')
}

const emitChange = (type: string) => {
  emit('update:modelValue', currentFilters.value)
  emit('change', currentFilters.value, type)
}

// 监听外部模型值变化
watch(() => props.modelValue, (newValue) => {
  if (newValue) {
    searchValue.value = newValue.search || ''
    selectedProtocols.value = newValue.protocols || []
    selectedStatuses.value = newValue.statuses || []

    Object.keys(filterValues.value).forEach(key => {
      if (newValue[key] !== undefined) {
        filterValues.value[key] = newValue[key]
      }
    })
  }
}, { deep: true })

watch(() => props.collapsed, (newValue) => {
  localCollapsed.value = newValue
})
</script>

<style scoped>
.smart-filter-panel {
  background-color: var(--n-color);
  border: 1px solid var(--n-border-color);
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.2s ease;
}

.smart-filter-panel--small {
  font-size: 12px;
}

.smart-filter-panel--medium {
  font-size: 14px;
}

.smart-filter-panel--large {
  font-size: 16px;
}

.smart-filter-panel--collapsed {
  min-height: auto;
}

.filter-panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background-color: var(--n-color-modal);
  border-bottom: 1px solid var(--n-border-color);
}

.filter-panel__title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: var(--n-text-color);
}

.filter-panel__actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.filter-panel__content {
  padding: 16px;
}

.filter-section {
  margin-bottom: 20px;
}

.filter-section:last-child {
  margin-bottom: 0;
}

.filter-section__label {
  font-size: 12px;
  font-weight: 500;
  color: var(--n-text-color-3);
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* 位置样式 */
.smart-filter-panel--left {
  border-right: 2px solid var(--n-color-primary);
}

.smart-filter-panel--right {
  border-left: 2px solid var(--n-color-primary);
}

.smart-filter-panel--top {
  border-bottom: 2px solid var(--n-color-primary);
}

/* 响应式调整 */
@media (max-width: 768px) {
  .filter-panel__content {
    padding: 12px;
  }

  .filter-section {
    margin-bottom: 16px;
  }
}
</style>