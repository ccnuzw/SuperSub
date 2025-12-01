import { api } from '@/utils/api';
import { parseNodeLinks, type ParsedNode } from '@/utils/nodeParser';
import type { Node, CreateNodeData } from '@/types/entities';

// 导入结果类型
export interface ImportResult {
  success: boolean;
  message: string;
  data?: {
    total: number;
    imported: number;
    skipped: number;
    errors: string[];
    nodes?: Node[];
  };
}

// 节点导入数据类型（包含分组信息）
export interface ImportNodeData extends CreateNodeData {
  // 继承 CreateNodeData 的所有字段
}

// 节点预览数据类型
export interface PreviewNode {
  name: string;
  protocol: string;
  server?: string;
  port?: number;
  isValid: boolean;
  errorMessage?: string;
  raw: string;
}

export class NodeImportService {
  /**
   * 解析节点链接
   */
  parseNodeLinks(links: string): ParsedNode[] {
    try {
      const parsedNodes = parseNodeLinks(links);
      return parsedNodes.map(node => ({
        name: node.name,
        link: node.link,
        protocol: node.protocol,
        protocol_params: node.protocol_params,
        server: node.server,
        port: node.port,
        password: node.password,
        type: node.type,
        params: node.params,
      }));
    } catch (error) {
      throw new Error(`解析节点链接失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 验证节点数据
   */
  validateNodeData(node: ParsedNode): { isValid: boolean; error?: string } {
    // 检查必需字段
    if (!node.name || node.name.trim() === '') {
      return { isValid: false, error: '节点名称不能为空' };
    }

    if (!node.protocol || node.protocol.trim() === '') {
      return { isValid: false, error: '协议类型不能为空' };
    }

    // 检查服务器地址
    if (!node.server || node.server.trim() === '') {
      return { isValid: false, error: '服务器地址不能为空' };
    }

    // 检查端口
    if (!node.port || node.port < 1 || node.port > 65535) {
      return { isValid: false, error: '端口号必须在1-65535范围内' };
    }

    // 检查特定协议的必需字段
    switch (node.protocol) {
      case 'vmess':
        const vmessParams = node.protocol_params;
        if (!vmessParams?.id) {
          return { isValid: false, error: 'VMess协议缺少用户ID' };
        }
        break;

      case 'ss':
        const ssParams = node.protocol_params;
        if (!ssParams?.method || !ssParams?.password) {
          return { isValid: false, error: 'Shadowsocks协议缺少加密方法或密码' };
        }
        break;

      case 'trojan':
        if (!node.password) {
          return { isValid: false, error: 'Trojan协议缺少密码' };
        }
        break;

      case 'vless':
        const vlessParams = node.protocol_params;
        if (!vlessParams?.id) {
          return { isValid: false, error: 'VLESS协议缺少用户ID' };
        }
        break;

      case 'hysteria2':
        if (!node.password) {
          return { isValid: false, error: 'Hysteria2协议缺少认证信息' };
        }
        break;

      case 'tuic':
        const tuicParams = node.protocol_params;
        if (!tuicParams?.uuid || !tuicParams?.password) {
          return { isValid: false, error: 'TUIC协议缺少UUID或密码' };
        }
        break;

      case 'anytls':
        if (!node.password) {
          return { isValid: false, error: 'AnyTLS协议缺少用户ID' };
        }
        break;

      case 'ssr':
        const ssrParams = node.protocol_params;
        if (!ssrParams?.method || !ssrParams?.password || !ssrParams?.protocol || !ssrParams?.obfs) {
          return { isValid: false, error: 'SSR协议缺少必需参数' };
        }
        break;
    }

    return { isValid: true };
  }

  /**
   * 从URL预览节点
   */
  async previewNodes(url: string): Promise<PreviewNode[]> {
    try {
      const response = await api.post<any>('/nodes/preview', { url });
      if (!response.data.success) {
        throw new Error(response.data.message || '预览失败');
      }

      const linksText = response.data.data;
      const parsedNodes = this.parseNodeLinks(linksText);

      return parsedNodes.map(node => {
        const validation = this.validateNodeData(node);
        return {
          name: node.name,
          protocol: node.protocol,
          server: node.server,
          port: node.port,
          isValid: validation.isValid,
          errorMessage: validation.error,
          raw: node.link || '',
        };
      });
    } catch (error) {
      throw new Error(`预览节点失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 批量导入节点
   */
  async importNodes(nodes: ParsedNode[], groupId?: string): Promise<ImportResult> {
    try {
      // 验证所有节点
      const validationResults = nodes.map(node => ({
        node,
        validation: this.validateNodeData(node)
      }));

      const validNodes = validationResults
        .filter(result => result.validation.isValid)
        .map(result => result.node);

      const invalidNodes = validationResults
        .filter(result => !result.validation.isValid)
        .map(result => ({
          name: result.node.name,
          error: result.validation.error || '未知错误'
        }));

      if (validNodes.length === 0) {
        return {
          success: false,
          message: '没有有效的节点可以导入',
          data: {
            total: nodes.length,
            imported: 0,
            skipped: nodes.length,
            errors: invalidNodes.map(n => `${n.name}: ${n.error}`)
          }
        };
      }

      // 转换为导入数据格式
      const importData: ImportNodeData[] = validNodes.map(node => ({
        name: node.name,
        link: node.link,
        protocol: node.protocol,
        protocol_params: node.protocol_params,
        server: node.server,
        port: node.port,
        password: node.password,
        type: node.type,
        params: node.params,
        group_id: groupId,
      }));

      const response = await api.post<ImportResult>('/nodes/batch-import', {
        nodes: importData,
        groupId
      });

      if (response.data.success) {
        return {
          ...response.data,
          data: {
            total: response.data.data?.total || validNodes.length,
            imported: response.data.data?.imported || 0,
            skipped: response.data.data?.skipped || 0,
            errors: [
              ...(response.data.data?.errors || []),
              ...invalidNodes.map(n => `${n.name}: ${n.error}`)
            ],
            nodes: response.data.data?.nodes
          }
        };
      } else {
        throw new Error(response.data.message || '导入失败');
      }
    } catch (error) {
      throw new Error(`批量导入节点失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 从文本导入节点（原组件的批量导入功能）
   */
  async importFromText(linksText: string, groupId?: string): Promise<ImportResult> {
    try {
      const parsedNodes = this.parseNodeLinks(linksText);
      return await this.importNodes(parsedNodes, groupId);
    } catch (error) {
      throw new Error(`从文本导入节点失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }
}