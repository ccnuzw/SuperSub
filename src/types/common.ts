// 通用响应类型
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// 分页相关类型
export interface PaginationParams {
  page: number;
  pageSize: number;
  total?: number;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

// 实体基础接口
export interface BaseEntity {
  id: string;
  created_at: string;
  updated_at: string;
}

// CRUD操作结果
export interface CrudResult<T = any> {
  success: boolean;
  data?: T;
  message?: string;
}

// 表格相关类型
export interface TableColumn<T = any> {
  key: keyof T;
  title: string;
  width?: number;
  sortable?: boolean;
  render?: (value: any, record: T) => any;
}

export interface TableAction<T = any> {
  key: string;
  label: string;
  type?: 'primary' | 'default' | 'error' | 'warning';
  icon?: string;
  handler: (record: T) => void;
  disabled?: (record: T) => boolean;
  show?: (record: T) => boolean;
}

// 表单相关类型
export interface FormField<T = any> {
  name: keyof T;
  label: string;
  type: 'input' | 'select' | 'number' | 'textarea' | 'switch' | 'date';
  required?: boolean;
  placeholder?: string;
  options?: Array<{ label: string; value: any }>;
  rules?: ValidationRule[];
  disabled?: boolean;
}

// 验证规则类型
export interface ValidationRule {
  required?: boolean;
  pattern?: RegExp;
  min?: number;
  max?: number;
  message: string;
  validator?: (value: any) => boolean | string;
  trigger?: string[] | 'blur' | 'change' | 'input';
}

// 搜索和筛选类型
export interface SearchParams {
  query?: string;
  filters?: Record<string, any>;
  sort?: SortParams;
  pagination?: PaginationParams;
}

// 排序参数
export interface SortParams {
  field: string;
  order: 'asc' | 'desc';
}

// 过滤参数
export interface FilterParams {
  [key: string]: any;
}

// 选择器选项
export interface SelectOption {
  label: string;
  value: any;
  disabled?: boolean;
  children?: SelectOption[];
}

// 加载状态
export interface LoadingState {
  loading: boolean;
  error?: string | null;
  retrying?: boolean;
}

// 文件上传相关
export interface UploadFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url?: string;
  status: 'uploading' | 'success' | 'error';
  progress?: number;
  error?: string;
}

// 通知消息类型
export interface NotificationMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  content: string;
  duration?: number;
  timestamp: number;
}

// 分组相关类型
export interface GroupItem extends BaseEntity {
  name: string;
  description?: string;
  sort_order: number;
  is_enabled: boolean;
  user_id: string;
}