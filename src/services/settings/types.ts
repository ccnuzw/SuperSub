/**
 * Settings Service Types - 基础设施层
 * 设置服务相关的类型定义
 */

export interface SettingsState {
  telegram_bot_token: string;
  telegram_chat_id: string;
}

export interface PasswordState {
  password: string;
}

export interface SettingsApiResponse {
  success: boolean;
  data: Array<{
    key: string;
    value: any;
    type?: string;
    category?: string;
    description?: string;
  }>;
}