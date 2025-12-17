/**
 * 节点服务层
 * 处理节点相关的所有服务逻辑
 */

import { ServiceBase } from './base/ServiceBase'
import type { INode, INodeGroup, IPaginatedResponse } from '@/types'
import type { ApiResponse } from '@/types/api'

/**
 * 节点创建DTO接口
 */
export interface ICreateNodeDto {
  name: string
  server: string
  port: number
  protocol: string
  link: string
  protocol_params: any
  group_id?: string | null
  region?: string
}

/**
 * 节点更新DTO接口
 */
export interface IUpdateNodeDto {
  name?: string
  server?: string
  port?: number
  protocol?: string
  link?: string
  protocol_params?: any
  group_id?: string | null
  region?: string
  status?: string
}

/**
 * 节点查询参数接口
 */
export interface INodeQueryParams {
  search?: string
  protocol?: string
  status?: string
  group_id?: string | null
  region?: string
  is_premium?: boolean
}

/**
 * 节点健康检查响应接口
 */
export interface INodeHealthCheck {
  node_id: string
  status: 'healthy' | 'unhealthy' | 'testing'
  latency?: number
  error?: string
}

/**
 * 节点统计信息接口
 */
export interface INodeStats {
  total: number
  healthy: number
  unhealthy: number
  by_protocol: Record<string, number>
  by_region: Record<string, number>
  by_group: Record<string, number>
}

/**
 * 批量操作请求接口
 */
export interface IBatchNodeOperation {
  node_ids: string[]
  action: 'delete' | 'move_group' | 'health_check' | 'sort' | 'deduplicate'
  data?: any
}

/**
 * 批量导入请求接口
 */
export interface IBatchImportRequest {
  links?: string[]
  nodes?: ICreateNodeDto[]
  group_id?: string | null
}

/**
 * 节点移动分组请求接口
 */
export interface IMoveToGroupRequest {
  node_ids: string[]
  group_id: string | null
}

/**
 * 节点服务类
 * 继承自ServiceBase，提供节点特定的业务逻辑
 */
export class NodeServiceClass extends ServiceBase<INode, ICreateNodeDto, IUpdateNodeDto> {
  constructor() {
    super('nodes')
  }

  /**
   * 获取节点列表（支持复杂的查询条件）
   */
  async getNodes(params?: INodeQueryParams & {
    page?: number
    page_size?: number
    sort_by?: string
    sort_order?: 'asc' | 'desc'
  }): Promise<IPaginatedResponse<INode>> {
    try {
      const response = await this.http.get<IPaginatedResponse<INode>>(
        this.getBaseUrl(),
        { params }
      )
      return this.handleResponse(response)
    } catch (error) {
      throw this.handleError(error)
    }
  }

  /**
   * 根据分组获取节点
   */
  async getNodesByGroup(groupId: string | null): Promise<INode[]> {
    try {
      const response = await this.http.get<INode[]>(
        `${this.getBaseUrl()}/group/${groupId || 'default'}`
      )
      return this.handleResponse(response)
    } catch (error) {
      throw this.handleError(error)
    }
  }

  /**
   * 获取分组节点数据
   */
  async getGroupedNodes(): Promise<{
    groups: INodeGroup[]
    nodes: INode[]
  }> {
    try {
      const response = await this.http.get<{
        groups: INodeGroup[]
        nodes: INode[]
      }>(`${this.getBaseUrl()}/grouped`)
      return this.handleResponse(response)
    } catch (error) {
      throw this.handleError(error)
    }
  }

  /**
   * 节点健康检查
   */
  async healthCheck(nodeIds: string[]): Promise<{
    started: number
    message: string
  }> {
    this.validateIds(nodeIds)

    try {
      const response = await this.http.post<{
        started: number
        message: string
      }>(`${this.getBaseUrl()}/health-check`, { node_ids: nodeIds })
      return this.handleResponse(response)
    } catch (error) {
      throw this.handleError(error)
    }
  }

  /**
   * 批量操作
   */
  async batchOperation(operation: IBatchNodeOperation): Promise<{
    success: boolean
    message: string
    affected?: number
  }> {
    try {
      const response = await this.http.post<{
        success: boolean
        message: string
        affected?: number
      }>(`${this.getBaseUrl()}/batch-actions`, operation)
      return this.handleResponse(response)
    } catch (error) {
      throw this.handleError(error)
    }
  }

  /**
   * 批量导入节点
   */
  async batchImport(request: IBatchImportRequest): Promise<{
    success: boolean
    message: string
    imported?: INode[]
    failed?: string[]
  }> {
    try {
      const response = await this.http.post<{
        success: boolean
        message: string
        imported?: INode[]
        failed?: string[]
      }>(`${this.getBaseUrl()}/batch-import`, request)
      return this.handleResponse(response)
    } catch (error) {
      throw this.handleError(error)
    }
  }

  /**
   * 批量删除节点
   */
  async batchDelete(nodeIds: string[]): Promise<{
    success: boolean
    message: string
    deleted?: number
  }> {
    this.validateIds(nodeIds)

    try {
      const response = await this.http.post<{
        success: boolean
        message: string
        deleted?: number
      }>(`${this.getBaseUrl()}/batch-delete`, { node_ids: nodeIds })
      return this.handleResponse(response)
    } catch (error) {
      throw this.handleError(error)
    }
  }

  /**
   * 移动节点到分组
   */
  async moveToGroup(request: IMoveToGroupRequest): Promise<{
    success: boolean
    message: string
    moved?: number
  }> {
    this.validateIds(request.node_ids)

    try {
      const response = await this.http.post<{
        success: boolean
        message: string
        moved?: number
      }>(`${this.getBaseUrl()}/batch-update-group`, request)
      return this.handleResponse(response)
    } catch (error) {
      throw this.handleError(error)
    }
  }

  /**
   * 更新节点排序
   */
  async updateOrder(updates: { id: string; sort_order: number }[]): Promise<{
    success: boolean
    message: string
  }> {
    try {
      const response = await this.http.post<{
        success: boolean
        message: string
      }>(`${this.getBaseUrl()}/update-order`, { updates })
      return this.handleResponse(response)
    } catch (error) {
      throw this.handleError(error)
    }
  }

  /**
   * 获取节点统计信息
   */
  async getNodeStats(groupId?: string | null): Promise<INodeStats> {
    try {
      const response = await this.http.get<INodeStats>(
        `${this.getBaseUrl()}/stats`,
        { params: { group_id: groupId || undefined } }
      )
      return this.handleResponse(response)
    } catch (error) {
      throw this.handleError(error)
    }
  }

  /**
   * 搜索节点
   */
  async searchNodes(query: string, filters?: INodeQueryParams): Promise<INode[]> {
    try {
      const response = await this.http.get<INode[]>(
        `${this.getBaseUrl()}/search`,
        {
          params: {
            q: query,
            ...filters
          }
        }
      )
      return this.handleResponse(response)
    } catch (error) {
      throw this.handleError(error)
    }
  }

  /**
   * 验证节点ID数组
   */
  private validateIds(ids: string[]): void {
    if (!Array.isArray(ids) || ids.length === 0) {
      throw new Error('Node IDs array is required and cannot be empty')
    }

    ids.forEach(id => this.validateId(id))
  }

  /**
   * 验证节点创建数据
   */
  protected validateCreateData(data: ICreateNodeDto): void {
    this.validateData(data, {
      name: (value) => value && typeof value === 'string' && value.trim().length > 0,
      server: (value) => value && typeof value === 'string' && value.trim().length > 0,
      port: (value) => typeof value === 'number' && value > 0 && value <= 65535,
      protocol: (value) => value && typeof value === 'string' && value.trim().length > 0,
      link: (value) => value && typeof value === 'string' && value.trim().length > 0
    })
  }

  /**
   * 验证节点更新数据
   */
  protected validateUpdateData(data: IUpdateNodeDto): void {
    if (data.port !== undefined) {
      if (typeof data.port !== 'number' || data.port <= 0 || data.port > 65535) {
        throw new Error('Port must be a number between 1 and 65535')
      }
    }
  }

  /**
   * 重写create方法，添加特定验证
   */
  async create(data: ICreateNodeDto): Promise<INode> {
    this.validateCreateData(data)
    return super.create(data)
  }

  /**
   * 重写update方法，添加特定验证
   */
  async update(id: string, data: IUpdateNodeDto): Promise<INode> {
    this.validateId(id)
    this.validateUpdateData(data)
    return super.update(id, data)
  }
}

// 创建单例实例
export const nodeService = new NodeServiceClass()
export default nodeService