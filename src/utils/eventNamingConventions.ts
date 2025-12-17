/**
 * 组件事件命名规范
 *
 * 统一所有组件的事件处理函数命名，提高代码可读性和一致性
 */

/**
 * 事件命名格式：handle + 动作 + On + 目标
 *
 * 常见动作词：
 * - Click: 点击事件
 * - Change: 值变更事件
 * - Submit: 表单提交事件
 * - Input: 输入事件
 * - Focus: 聚焦事件
 * - Blur: 失焦事件
 * - KeyDown/Up: 键盘事件
 * - MouseEnter/Leave: 鼠标悬停事件
 * - Select: 选择事件
 * - Toggle: 切换事件
 * - Expand/Collapse: 展开/收起事件
 * - Load: 加载事件
 * - Error: 错误事件
 * - Success: 成功事件
 *
 * 示例：
 * - handleClickOnSave: 点击保存按钮
 * - handleChangeOnInput: 输入框值变更
 * - handleSubmitOnForm: 表单提交
 * - handleSelectOnDropdown: 下拉框选择
 * - handleToggleOnSwitch: 开关切换
 */

export const EVENT_NAMING_CONVENTIONS = {
  // 标准格式
  STANDARD: 'handle{Action}On{Target}',

  // 常见动作映射
  ACTIONS: {
    click: 'Click',
    change: 'Change',
    submit: 'Submit',
    input: 'Input',
    focus: 'Focus',
    blur: 'Blur',
    keydown: 'KeyDown',
    keyup: 'KeyUp',
    keypress: 'KeyPress',
    mouseenter: 'MouseEnter',
    mouseleave: 'MouseLeave',
    mouseover: 'MouseOver',
    mouseout: 'MouseOut',
    scroll: 'Scroll',
    load: 'Load',
    unload: 'Unload',
    resize: 'Resize',
    select: 'Select',
    toggle: 'Toggle',
    expand: 'Expand',
    collapse: 'Collapse',
    open: 'Open',
    close: 'Close',
    save: 'Save',
    delete: 'Delete',
    edit: 'Edit',
    update: 'Update',
    create: 'Create',
    cancel: 'Cancel',
    confirm: 'Confirm',
    reset: 'Reset',
    clear: 'Clear',
    refresh: 'Refresh',
    reload: 'Reload',
    search: 'Search',
    filter: 'Filter',
    sort: 'Sort',
    export: 'Export',
    import: 'Import',
    upload: 'Upload',
    download: 'Download',
    copy: 'Copy',
    paste: 'Paste',
    cut: 'Cut',
    undo: 'Undo',
    redo: 'Redo',
    play: 'Play',
    pause: 'Pause',
    stop: 'Stop',
    start: 'Start',
    finish: 'Finish',
    complete: 'Complete',
    error: 'Error',
    success: 'Success',
    warning: 'Warning',
    info: 'Info'
  },

  // 常见目标词
  TARGETS: {
    button: 'Button',
    input: 'Input',
    form: 'Form',
    select: 'Select',
    dropdown: 'Dropdown',
    modal: 'Modal',
    dialog: 'Dialog',
    menu: 'Menu',
    item: 'Item',
    option: 'Option',
    tab: 'Tab',
    panel: 'Panel',
    card: 'Card',
    table: 'Table',
    row: 'Row',
    cell: 'Cell',
    header: 'Header',
    footer: 'Footer',
    sidebar: 'Sidebar',
    nav: 'Nav',
    link: 'Link',
    image: 'Image',
    video: 'Video',
    audio: 'Audio',
    file: 'File',
    document: 'Document',
    page: 'Page',
    section: 'Section',
    component: 'Component',
    element: 'Element',
    checkbox: 'Checkbox',
    radio: 'Radio',
    switch: 'Switch',
    slider: 'Slider',
    datepicker: 'DatePicker',
    timepicker: 'TimePicker',
    colorpicker: 'ColorPicker',
    textarea: 'Textarea',
    editor: 'Editor',
    search: 'Search',
    filter: 'Filter',
    sort: 'Sort',
    pagination: 'Pagination'
  }
} as const

/**
 * 标准化事件处理函数名称
 */
export function standardizeEventHandlerName(
  action: string,
  target: string,
  prefix: string = 'handle'
): string {
  const actionKey = action.toLowerCase()
  const targetKey = target.toLowerCase()

  const standardAction = EVENT_NAMING_CONVENTIONS.ACTIONS[actionKey as keyof typeof EVENT_NAMING_CONVENTIONS.ACTIONS] ||
    action.charAt(0).toUpperCase() + action.slice(1)

  const standardTarget = EVENT_NAMING_CONVENTIONS.TARGETS[targetKey as keyof typeof EVENT_NAMING_CONVENTIONS.TARGETS] ||
    target.charAt(0).toUpperCase() + target.slice(1)

  return `${prefix}${standardAction}On${standardTarget}`
}

/**
 * 验证事件处理函数名称是否符合规范
 */
export function isValidEventHandlerName(name: string): boolean {
  return /^handle[A-Z][a-zA-Z]*On[A-Z][a-zA-Z]*$/.test(name)
}

/**
 * 从现有函数名提取动作和目标
 */
export function parseEventHandlerName(name: string): { action: string; target: string } | null {
  const match = name.match(/^handle([A-Z][a-zA-Z]*)On([A-Z][a-zA-Z]*)$/)
  if (!match) return null

  return {
    action: match[1],
    target: match[2]
  }
}