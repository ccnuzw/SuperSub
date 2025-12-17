/**
 * 组件API设计规范
 * 统一所有组件的Props和Emits接口设计，提供一致的开发体验
 */

export interface IComponentStandard<TProps = any, TEmits = any> {
  // 组件标识
  name: string
  description: string

  // Props定义
  props: TProps

  // Emits定义
  emits: TEmits

  // 设计模式
  pattern: 'controlled' | 'uncontrolled' | 'hybrid'

  // 版本信息
  version: string

  // 兼容性
  compatibility: {
    vue: string[]
    browsers: string[]
  }
}

/**
 * 标准Props接口
 */
export interface IStandardProps {
  // 基础属性
  id?: string
  class?: string
  style?: string | Record<string, any>
  testId?: string

  // 状态属性
  loading?: boolean
  disabled?: boolean
  readonly?: boolean
  required?: boolean

  // 尺寸属性
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  width?: string | number
  height?: string | number

  // 主题属性
  variant?: string
  theme?: 'light' | 'dark' | 'auto'

  // 行为属性
  autofocus?: boolean
  tabIndex?: number
  role?: string
  'aria-label'?: string
  'aria-labelledby'?: string

  // 事件属性
  onClick?: (event: MouseEvent) => void
  onFocus?: (event: FocusEvent) => void
  onBlur?: (event: FocusEvent) => void
  onChange?: (value: any) => void
  onInput?: (value: string) => void
}

/**
 * 标准Emits接口
 */
export interface IStandardEmits {
  // 通用事件
  click: [event: MouseEvent]
  focus: [event: FocusEvent]
  blur: [event: FocusEvent]

  // 状态事件
  change: [value: any]
  input: [value: string]
  update: [value: any]

  // 生命周期事件
  mounted: []
  unmounted: []
  beforeDestroy: []

  // 错误事件
  error: [error: Error]
  loading: [loading: boolean]
}

/**
 * 表单组件Props
 */
export interface IFormComponentProps extends IStandardProps {
  modelValue: any
  name?: string
  placeholder?: string
  label?: string
  description?: string
  errorMessage?: string
  validationRules?: any[]
  autofocus?: boolean
}

/**
 * 表单组件Emits
 */
export interface IFormComponentEmits extends IStandardEmits {
  'update:modelValue': [value: any]
  validate: [result: boolean]
  reset: []
  input: [value: string]
  change: [value: any]
}

/**
 * 列表组件Props
 */
export interface IListComponentProps<T = any> extends IStandardProps {
  items: T[]
  loading?: boolean
  empty?: boolean
  emptyText?: string
  selectable?: boolean
  multiple?: boolean
  virtual?: boolean
  itemHeight?: number
}

/**
 * 列表组件Emits
 */
export interface IListComponentEmits<T = any> extends IStandardEmits {
  select: [item: T, index: number]
  deselect: [item: T, index: number]
  'update:selected': [selectedItems: T[]]
  scroll: [scrollTop: number]
  reachEnd: []
}

/**
 * 模态框组件Props
 */
export interface IModalComponentProps extends IStandardProps {
  show: boolean
  title?: string
  closable?: boolean
  maskClosable?: boolean
  keyboard?: boolean
  width?: string | number
  height?: string | number
  zIndex?: number
  centered?: boolean
  destroyOnClose?: boolean
}

/**
 * 模态框组件Emits
 */
export interface IModalComponentEmits extends IStandardEmits {
  'update:show': [show: boolean]
  open: []
  close: []
  confirm: []
  cancel: []
}

/**
 * 组件API设计指南
 */
export const COMPONENT_API_GUIDELINES = {
  /**
   * Props设计原则
   */
  propsPrinciples: {
    // 1. 命名一致性
    naming: `
- 使用camelCase命名props
- 布尔值props以is、has、can、should等前缀开头
- 事件处理器props以on开头
- 尺寸props使用标准值：xs, sm, md, lg, xl
    `,

    // 2. 类型安全
    types: `
- 所有props必须有明确的TypeScript类型
- 使用联合类型限制可选值
- 为复杂props提供接口定义
- 使用泛型提高复用性
    `,

    // 3. 默认值设计
    defaults: `
- 为所有可选props提供合理的默认值
- 避免使用undefined作为默认值
- 考虑组件的独立性和可预测性
    `
  },

  /**
   * Emits设计原则
   */
  emitsPrinciples: {
    // 1. 事件命名
    naming: `
- 使用kebab-case命名事件
- 描述事件的行为而不是触发条件
- 避免过于通用的事件名
    `,

    // 2. 参数设计
    parameters: `
- 事件参数应该是明确的，避免传递整个对象
- 使用元组类型定义事件参数
- 提供足够的信息让父组件做出决策
    `
  },

  /**
   * 组件分类API模板
   */
  apiTemplates: {
    // 基础组件模板
    base: `
interface Props extends IStandardProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  disabled?: boolean
}

interface Emits extends IStandardEmits {
  click: [event: MouseEvent]
}
    `,

    // 表单组件模板
    form: `
interface Props extends IFormComponentProps {
  type?: 'text' | 'email' | 'password' | 'number'
  maxLength?: number
  clearable?: boolean
}

interface Emits extends IFormComponentEmits {
  focus: [event: FocusEvent]
  blur: [event: FocusEvent]
}
    `,

    // 列表组件模板
    list: `
interface Props<T> extends IListComponentProps<T> {
  keyField?: string
  labelField?: string
  searchable?: boolean
  sortable?: boolean
}

interface Emits<T> extends IListComponentEmits<T> {
  sort: [field: string, direction: 'asc' | 'desc']
  search: [keyword: string]
}
    `,

    // 模态框组件模板
    modal: `
interface Props extends IModalComponentProps {
  type?: 'info' | 'success' | 'warning' | 'error'
  showClose?: boolean
  showConfirm?: boolean
  showCancel?: boolean
  confirmText?: string
  cancelText?: string
}

interface Emits extends IModalComponentEmits {
  confirm: []
  cancel: []
}
    `
  },

  /**
   * 向后兼容性
   */
  compatibility: {
    // 版本控制
    versioning: `
- 使用语义化版本控制
- 破坏性变更需要主版本号升级
- 提供迁移指南和废弃警告
    `,

    // 渐进式升级
    migration: `
- 保留旧API的同时提供新API
- 使用@deprecated标记废弃的API
- 提供自动迁移工具
    `
  }
}