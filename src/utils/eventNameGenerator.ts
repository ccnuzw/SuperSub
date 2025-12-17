/**
 * 事件命名规范实用工具
 * 帮助生成符合规范的事件名称
 */

// 标准动作类型
export const EVENT_ACTIONS = {
  CLICK: 'Click',
  SUBMIT: 'Submit',
  CHANGE: 'Change',
  INPUT: 'Input',
  FOCUS: 'Focus',
  BLUR: 'Blur',
  KEY_DOWN: 'KeyDown',
  KEY_UP: 'KeyUp',
  MOUSE_ENTER: 'MouseEnter',
  MOUSE_LEAVE: 'MouseLeave',
  SCROLL: 'Scroll',
  RESIZE: 'Resize',
  LOAD: 'Load',
  ERROR: 'Error',
  SUCCESS: 'Success',
  CANCEL: 'Cancel',
  CONFIRM: 'Confirm',
  EDIT: 'Edit',
  DELETE: 'Delete',
  ADD: 'Add',
  CREATE: 'Create',
  UPDATE: 'Update',
  SAVE: 'Save',
  RESET: 'Reset',
  CLEAR: 'Clear',
  REFRESH: 'Refresh',
  RELOAD: 'Reload',
  TOGGLE: 'Toggle',
  SELECT: 'Select',
  COPY: 'Copy',
  PASTE: 'Paste',
  CUT: 'Cut',
  UNDO: 'Undo',
  REDO: 'Redo',
  VALIDATE: 'Validate',
  SORT: 'Sort',
  FILTER: 'Filter',
  RETRY: 'Retry'
} as const

// 标准目标类型
export const EVENT_TARGETS = {
  BUTTON: 'Button',
  INPUT: 'Input',
  FORM: 'Form',
  MODAL: 'Modal',
  DIALOG: 'Dialog',
  DROPDOWN: 'Dropdown',
  MENU: 'Menu',
  TAB: 'Tab',
  LINK: 'Link',
  CARD: 'Card',
  TABLE: 'Table',
  ROW: 'Row',
  CELL: 'Cell',
  COLUMN: 'Column',
  HEADER: 'Header',
  FOOTER: 'Footer',
  SIDEBAR: 'Sidebar',
  NAVBAR: 'Navbar',
  SEARCH: 'Search',
  LOAD: 'Load',
  SETTINGS: 'Settings',
  FILTER: 'Filter',
  SORT: 'Sort',
  PAGINATION: 'Pagination',
  TOOLBAR: 'Toolbar',
  PANEL: 'Panel',
  SECTION: 'Section',
  CONTAINER: 'Container',
  WRAPPER: 'Wrapper',
  OVERLAY: 'Overlay',
  BACKDROP: 'Backdrop',
  TOOLTIP: 'Tooltip',
  POPOVER: 'Popover',
  NOTIFICATION: 'Notification',
  ALERT: 'Alert',
  LOADING: 'Loading',
  SPINNER: 'Spinner',
  ICON: 'Icon',
  IMAGE: 'Image',
  VIDEO: 'Video',
  AUDIO: 'Audio',
  CANVAS: 'Canvas',
  MAP: 'Map',
  CHART: 'Chart',
  GRAPH: 'Graph',
  LIST: 'List',
  ITEM: 'Item',
  NODE: 'Node',
  SUBSCRIPTION: 'Subscription',
  PROFILE: 'Profile',
  GROUP: 'Group',
  USER: 'User',
  GUEST: 'Guest',
  ADMIN: 'Admin',
  CONFIG: 'Config',
  PREFERENCE: 'Preference',
  THEME: 'Theme',
  LANGUAGE: 'Language',
  REGION: 'Region',
  COUNTRY: 'Country',
  CITY: 'City',
  ADDRESS: 'Address',
  PHONE: 'Phone',
  EMAIL: 'Email',
  PASSWORD: 'Password',
  USERNAME: 'Username',
  TOKEN: 'Token',
  KEY: 'Key',
  VALUE: 'Value',
  DATA: 'Data',
  CONTENT: 'Content',
  TEXT: 'Text',
  TITLE: 'Title',
  DESCRIPTION: 'Description',
  LABEL: 'Label',
  PLACEHOLDER: 'Placeholder',
  MESSAGE: 'Message',
  COMMENT: 'Comment',
  NOTE: 'Note',
  TAG: 'Tag',
  CATEGORY: 'Category',
  TYPE: 'Type',
  STATUS: 'Status',
  STATE: 'State',
  CONDITION: 'Condition',
  RULE: 'Rule',
  POLICY: 'Policy',
  PERMISSION: 'Permission',
  ROLE: 'Role',
  ACCESS: 'Access',
  LOGIN: 'Login',
  LOGOUT: 'Logout',
  REGISTER: 'Register',
  SIGNUP: 'Signup',
  SIGNIN: 'Signin',
  SIGNOUT: 'Signout',
  AUTHENTICATE: 'Authenticate',
  AUTHORIZE: 'Authorize',
  VALIDATE: 'Validate',
  VERIFY: 'Verify',
  CHECK: 'Check',
  TEST: 'Test',
  DEBUG: 'Debug',
  MONITOR: 'Monitor',
  TRACK: 'Track',
  ANALYZE: 'Analyze',
  OPTIMIZE: 'Optimize',
  UPGRADE: 'Upgrade',
  DOWNGRADE: 'Downgrade',
  INSTALL: 'Install',
  UNINSTALL: 'Uninstall',
  DEPLOY: 'Deploy',
  BUILD: 'Build',
  COMPILE: 'Compile',
  TRANSLATE: 'Translate',
  CONVERT: 'Convert',
  TRANSFORM_DATA: 'Transform',
  ADAPT: 'Adapt',
  CUSTOMIZE: 'Customize',
  PERSONALIZE: 'Personalize',
  LOCALIZE: 'Localize',
  GLOBALIZE: 'Globalize',
  STANDARDIZE: 'Standardize',
  NORMALIZE: 'Normalize',
  FORMAT: 'Format',
  PARSE: 'Parse',
  SERIALIZE: 'Serialize',
  DESERIALIZE: 'Deserialize',
  ENCODE: 'Encode',
  DECODE: 'Decode',
  ENCRYPT: 'Encrypt',
  DECRYPT: 'Decrypt',
  SIGN: 'Sign',
  VERIFY_SIGNATURE: 'VerifySignature',
  HASH: 'Hash',
  COMPRESS: 'Compress',
  DECOMPRESS: 'Decompress',
  BACKUP: 'Backup',
  RESTORE: 'Restore',
  SYNC: 'Sync',
  MIRROR: 'Mirror',
  CLONE: 'Clone',
  DUPLICATE: 'Duplicate',
  MOVE: 'Move',
  TRANSFER: 'Transfer',
  UPLOAD: 'Upload',
  DOWNLOAD: 'Download',
  IMPORT: 'Import',
  EXPORT: 'Export',
  SHARE: 'Share',
  COLLABORATE: 'Collaborate',
  CONNECT: 'Connect',
  DISCONNECT: 'Disconnect',
  CREATE_LINK: 'CreateLink',
  UNLINK: 'Unlink',
  BIND: 'Bind',
  UNBIND: 'Unbind',
  ATTACH: 'Attach',
  DETACH: 'Detach',
  MERGE: 'Merge',
  SPLIT: 'Split',
  JOIN: 'Join',
  LEAVE: 'Leave',
  ENTER: 'Enter',
  EXIT: 'Exit',
  OPEN: 'Open',
  CLOSE: 'Close',
  SHOW: 'Show',
  HIDE: 'Hide',
  DISPLAY: 'Display',
  CONCEAL: 'Conceal',
  APPEAR: 'Appear',
  DISAPPEAR: 'Disappear',
  FADE_IN: 'FadeIn',
  FADE_OUT: 'FadeOut',
  SLIDE_IN: 'SlideIn',
  SLIDE_OUT: 'SlideOut',
  EXPAND: 'Expand',
  COLLAPSE: 'Collapse',
  MAXIMIZE: 'Maximize',
  MINIMIZE: 'Minimize',
  RESIZE_WINDOW: 'Resize',
  SCALE: 'Scale',
  ROTATE: 'Rotate',
  ANIMATE: 'Animate',
  TRANSITION: 'Transition',
  TRANSFORM: 'Transform'
} as const

// 事件名称生成器
export class EventNameGenerator {
  /**
   * 生成符合规范的事件名称
   * @param action 动作类型
   * @param target 目标类型
   * @param additionalContext 额外上下文
   * @returns 事件名称
   */
  static generate(
    action: keyof typeof EVENT_ACTIONS,
    target: keyof typeof EVENT_TARGETS,
    additionalContext?: string
  ): string {
    const actionName = EVENT_ACTIONS[action]
    const targetName = EVENT_TARGETS[target]

    let eventName = `handle${actionName}On${targetName}`

    if (additionalContext) {
      eventName += additionalContext.charAt(0).toUpperCase() + additionalContext.slice(1)
    }

    return eventName
  }

  /**
   * 验证事件名称是否符合规范
   * @param eventName 事件名称
   * @returns 验证结果
   */
  static validate(eventName: string): {
    isValid: boolean
    suggestions?: string[]
  } {
    // 检查是否以 handle 开头
    if (!eventName.startsWith('handle')) {
      return {
        isValid: false,
        suggestions: [`${eventName} should start with 'handle'`]
      }
    }

    // 检查是否包含 on
    if (!eventName.includes('on')) {
      return {
        isValid: false,
        suggestions: [`${eventName} should include 'on' after the action`]
      }
    }

    // 检查格式: handle + Action + on + Target
    const pattern = /^handle([A-Z][a-z]+)On([A-Z][a-z]+(?:[A-Z][a-z]+)*)$/
    const match = eventName.match(pattern)

    if (!match) {
      return {
        isValid: false,
        suggestions: [
          'Format should be: handle + Action + on + Target',
          'Example: handleClickOnSave, handleSubmitOnForm, handleEditOnNode'
        ]
      }
    }

    return { isValid: true }
  }

  /**
   * 从现有事件名称提取动作和目标
   * @param eventName 事件名称
   * @returns 提取的组件
   */
  static parse(eventName: string): {
    action?: string
    target?: string
    isValid: boolean
  } {
    const validation = this.validate(eventName)
    if (!validation.isValid) {
      return { isValid: false }
    }

    const pattern = /^handle([A-Z][a-z]+)On([A-Z][a-z]+(?:[A-Z][a-z]+)*)$/
    const match = eventName.match(pattern)

    if (match) {
      return {
        action: match[1],
        target: match[2],
        isValid: true
      }
    }

    return { isValid: false }
  }

  /**
   * 生成常用事件名称的快速方法
   */
  static readonly common = {
    // 按钮事件
    clickOnAdd: () => this.generate('CLICK', 'BUTTON', 'Add'),
    clickOnSave: () => this.generate('CLICK', 'BUTTON', 'Save'),
    clickOnCancel: () => this.generate('CLICK', 'BUTTON', 'Cancel'),
    clickOnDelete: () => this.generate('CLICK', 'BUTTON', 'Delete'),
    clickOnEdit: () => this.generate('CLICK', 'BUTTON', 'Edit'),
    clickOnSubmit: () => this.generate('SUBMIT', 'FORM'),
    clickOnReset: () => this.generate('CLICK', 'BUTTON', 'Reset'),
    clickOnRefresh: () => this.generate('CLICK', 'BUTTON', 'Refresh'),

    // 输入事件
    inputOnSearch: () => this.generate('INPUT', 'INPUT', 'Search'),
    changeOnFilter: () => this.generate('CHANGE', 'FILTER'),
    focusOnInput: () => this.generate('FOCUS', 'INPUT'),
    blurOnInput: () => this.generate('BLUR', 'INPUT'),

    // 模态框事件
    clickOnOpenModal: () => this.generate('CLICK', 'BUTTON', 'OpenModal'),
    clickOnCloseModal: () => this.generate('CLICK', 'BUTTON', 'CloseModal'),
    clickOnConfirmDialog: () => this.generate('CONFIRM', 'DIALOG'),

    // 导航事件
    clickOnTab: () => this.generate('CLICK', 'TAB'),
    clickOnLink: () => this.generate('CLICK', 'LINK'),

    // 数据操作事件
    clickOnEditNode: () => this.generate('EDIT', 'NODE'),
    clickOnDeleteNode: () => this.generate('DELETE', 'NODE'),
    clickOnCreateSubscription: () => this.generate('CREATE', 'SUBSCRIPTION'),
    clickOnUpdateProfile: () => this.generate('UPDATE', 'PROFILE'),

    // 表单事件
    submitOnForm: () => this.generate('SUBMIT', 'FORM'),
    resetOnForm: () => this.generate('RESET', 'FORM'),
    validateOnForm: () => this.generate('VALIDATE', 'FORM'),

    // 列表事件
    clickOnSelectItem: () => this.generate('SELECT', 'ITEM'),
    clickOnSortColumn: () => this.generate('SORT', 'COLUMN'),
    clickOnFilterTable: () => this.generate('FILTER', 'TABLE'),

    // 设置事件
    changeOnTheme: () => this.generate('CHANGE', 'THEME'),
    changeOnLanguage: () => this.generate('CHANGE', 'LANGUAGE'),
    clickOnSaveSettings: () => this.generate('SAVE', 'SETTINGS'),

    // 错误事件
    clickOnRetry: () => this.generate('RETRY', 'BUTTON'),
    errorOnLoad: () => this.generate('ERROR', 'LOAD'),
    successOnSave: () => this.generate('SUCCESS', 'BUTTON')
  }
}

// 便捷导出
export const generateEventName = EventNameGenerator.generate
export const validateEventName = EventNameGenerator.validate
export const parseEventName = EventNameGenerator.parse
export const commonEvents = EventNameGenerator.common