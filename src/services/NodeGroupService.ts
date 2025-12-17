/**
 * 节点分组服务层
 * 处理节点分组相关的所有服务逻辑
 */

import { ServiceBase } from './base/ServiceBase'
import type { INodeGroup, IPaginatedResponse } from '@/types'
import type { ApiResponse } from '@/types/api'

/**
 * 分组创建DTO接口
 */
export interface ICreateGroupDto {
  name: string
  description?: string
  color?: string
  icon?: string
}

/**
 * 分组更新DTO接口
 */
export interface IUpdateGroupDto {
  name?: string
  description?: string
  color?: string
  icon?: string
  is_enabled?: boolean
}

/**
 * 分组查询参数接口
 */
export interface IGroupQueryParams {
  search?: string
  is_enabled?: boolean
  sort_by?: 'name' | 'created_at' | 'sort_order'
  sort_order?: 'asc' | 'desc'
}

/**
 * 分组排序更新接口
 */
export interface IGroupOrderUpdate {
  id: string
  sort_order: number
}

/**
 * 分组统计信息接口
 */
export interface IGroupStats {
  total_groups: number
  enabled_groups: number
  total_nodes: number
  nodes_by_group: Record<string, number>
}

/**
 * 节点分组服务类
 */
export class NodeGroupService extends ServiceBase<INodeGroup, ICreateGroupDto, IUpdateGroupDto> {
  constructor() {
    super('groups')
  }

  /**
   * 获取所有分组（包含节点数量）
   */
  async getAllWithNodeCount(params?: IGroupQueryParams & {
    page?: number
    page_size?: number
  }): Promise<IPaginatedResponse<INodeGroup & { node_count: number }>> {
    try {
      const response = await this.http.get<IPaginatedResponse<INodeGroup & { node_count: number }>>(
        this.getBaseUrl(),
        { params }
      )
      return this.handleResponse(response)
    } catch (error) {
      throw this.handleError(error)
    }
  }

  /**
   * 切换分组启用状态
   */
  async toggleEnabled(id: string): Promise<{
    success: boolean
    message: string
    group: INodeGroup
  }> {
    this.validateId(id)

    try {
      const response = await this.http.patch<{
        success: boolean
        message: string
        group: INodeGroup
      }>(`${this.getBaseUrl()}/${id}/toggle`)
      return this.handleResponse(response)
    } catch (error) {
      throw this.handleError(error)
    }
  }

  /**
   * 更新分组排序
   */
  async updateOrder(updates: IGroupOrderUpdate[]): Promise<{
    success: boolean
    message: string
  }> {
    if (!Array.isArray(updates) || updates.length === 0) {
      throw new Error('Order updates array is required and cannot be empty')
    }

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
   * 获取分组统计信息
   */
  async getGroupStats(): Promise<IGroupStats> {
    try {
      const response = await this.http.get<IGroupStats>(`${this.getBaseUrl()}/stats`)
      return this.handleResponse(response)
    } catch (error) {
      throw this.handleError(error)
    }
  }

  /**
   * 搜索分组
   */
  async searchGroups(query: string, filters?: IGroupQueryParams): Promise<INodeGroup[]> {
    try {
      const response = await this.http.get<INodeGroup[]>(
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
   * 检查分组名称是否重复
   */
  async checkNameExists(name: string, excludeId?: string): Promise<boolean> {
    try {
      const response = await this.http.get<{ exists: boolean }>(
        `${this.getBaseUrl()}/check-name`,
        {
          params: {
            name: name.trim(),
            exclude_id: excludeId
          }
        }
      )
      const result = this.handleResponse(response)
      return result.exists
    } catch (error) {
      throw this.handleError(error)
    }
  }

  /**
   * 获取分组及其节点
   */
  async getGroupWithNodes(groupId: string): Promise<{
    group: INodeGroup
    nodes: any[]
  }> {
    this.validateId(groupId)

    try {
      const response = await this.http.get<{
        group: INodeGroup
        nodes: any[]
      }>(`${this.getBaseUrl()}/${groupId}/with-nodes`)
      return this.handleResponse(response)
    } catch (error) {
      throw this.handleError(error)
    }
  }

  /**
   * 复制分组
   */
  async duplicateGroup(id: string, newName: string): Promise<INodeGroup> {
    this.validateId(id)

    if (!newName || newName.trim() === '') {
      throw new Error('New group name is required')
    }

    try {
      const response = await this.http.post<INodeGroup>(`${this.getBaseUrl()}/${id}/duplicate`, {
        name: newName.trim()
      })
      return this.handleResponse(response)
    } catch (error) {
      throw this.handleError(error)
    }
  }

  /**
   * 验证分组创建数据
   */
  protected validateCreateData(data: ICreateGroupDto): void {
    this.validateData(data, {
      name: (value) => value && typeof value === 'string' && value.trim().length > 0
    })

    // 验证名称长度
    if (data.name && data.name.trim().length > 50) {
      throw new Error('Group name cannot exceed 50 characters')
    }

    // 验证描述长度
    if (data.description && data.description.length > 200) {
      throw new Error('Group description cannot exceed 200 characters')
    }

    // 验证颜色格式
    if (data.color && !/^#[0-9A-Fa-f]{6}$/.test(data.color)) {
      throw new Error('Color must be a valid hex color code (e.g., #FF0000)')
    }
  }

  /**
   * 验证分组更新数据
   */
  protected validateUpdateData(data: IUpdateGroupDto): void {
    if (data.name !== undefined && data.name.trim().length > 50) {
      throw new Error('Group name cannot exceed 50 characters')
    }

    if (data.description !== undefined && data.description.length > 200) {
      throw new Error('Group description cannot exceed 200 characters')
    }

    if (data.color !== undefined && data.color && !/^#[0-9A-Fa-f]{6}$/.test(data.color)) {
      throw new Error('Color must be a valid hex color code (e.g., #FF0000)')
    }

    if (data.is_enabled !== undefined && typeof data.is_enabled !== 'boolean') {
      throw new Error('is_enabled must be a boolean value')
    }
  }

  /**
   * 重写create方法，添加特定验证
   */
  async create(data: ICreateGroupDto): Promise<INodeGroup> {
    this.validateCreateData(data)
    return super.create({ ...data, name: data.name.trim() })
  }

  /**
   * 重写update方法，添加特定验证
   */
  async update(id: string, data: IUpdateGroupDto): Promise<INodeGroup> {
    this.validateId(id)
    this.validateUpdateData(data)

    const updateData = { ...data }
    if (updateData.name) {
      updateData.name = updateData.name.trim()
    }

    return super.update(id, updateData)
  }

  /**
   * 重写delete方法，检查是否有节点依赖
   */
  async delete(id: string): Promise<void> {
    this.validateId(id)

    try {
      // 先检查分组中是否还有节点
      const groupWithNodes = await this.getGroupWithNodes(id)
      if (groupWithNodes.nodes.length > 0) {
        throw new Error(`Cannot delete group with ${groupWithNodes.nodes.length} nodes. Please move or delete the nodes first.`)
      }

      await super.delete(id)
    } catch (error) {
      throw this.handleError(error)
    }
  }
}

// 创建单例实例
export const nodeGroupService = new NodeGroupService()
export default nodeGroupService