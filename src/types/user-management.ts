/**
 * 用户管理相关类型定义
 */

// 用户角色枚举
export enum UserRole {
  USER = 'user',
  ADMIN = 'admin'
}

// 用户表单数据接口
export interface IUserFormData {
  username: string;
  password: string;
  role: UserRole;
}

// 用户表单模态框 Props 接口
export interface IUserFormModalProps {
  visible: boolean;
}

// 用户表单模态框 Emits 接口
export interface IUserFormModalEmits {
  'update:visible': [visible: boolean];
  'success': [];
}

// 用户管理操作类型
export enum UserManagementAction {
  ADD_USER = 'add-user',
  REFRESH = 'refresh',
  EXPORT = 'export'
}

// 用户表单验证规则接口
export interface IUserFormRules {
  username: Array<{
    required: boolean;
    message: string;
    trigger: string | string[];
    min?: number;
    max?: number;
    pattern?: RegExp;
  }>;
  password: Array<{
    required: boolean;
    message: string;
    trigger: string | string[];
    min?: number;
    max?: number;
  }>;
  role: Array<{
    required: boolean;
    message: string;
    trigger: string | string[];
  }>;
}