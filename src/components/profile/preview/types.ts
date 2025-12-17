/**
 * 预览组件类型定义
 */

export interface PreviewData {
  nodes: any[];
  analysis: {
    total: number;
    protocols: Record<string, number>;
    regions: Record<string, number>;
  };
  mode: 'local' | 'remote';
  content?: string;
  logs?: Array<{
    level: string;
    message: string;
    timestamp: string;
  }>;
}

export interface LogEntry {
  level: string;
  message: string;
  timestamp: string;
}

export interface PreviewState {
  generating: boolean;
  refreshing: boolean;
  previewData: PreviewData | null;
}