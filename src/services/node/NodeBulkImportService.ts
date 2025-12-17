/**
 * 节点批量导入业务逻辑
 * 负责处理节点导入的核心业务逻辑
 */

import type { INode } from '@/types'

export interface BulkImportOptions {
  links: string[]
  groupId?: string
  validateLinks?: boolean
  deduplicate?: boolean
}

export interface BulkImportResult {
  success: boolean
  total: number
  imported: number
  failed: number
  duplicates: number
  nodes: INode[]
  errors: string[]
}

export interface LinkValidationResult {
  valid: string[]
  invalid: string[]
  duplicates: Set<string>
}

/**
 * 节点批量导入服务类
 */
export class NodeBulkImportService {
  /**
   * 验证导入链接
   */
  static validateImportLinks(links: string[]): LinkValidationResult {
    const result: LinkValidationResult = {
      valid: [],
      invalid: [],
      duplicates: []
    }

    const seen = new Set<string>()

    links.forEach(link => {
      // 基本验证
      if (!link || typeof link !== 'string') {
        result.invalid.push(link || '')
        return
      }

      const trimmedLink = link.trim()
      if (!trimmedLink) {
        result.invalid.push(link)
        return
      }

      // 检查重复
      if (seen.has(trimmedLink)) {
        result.duplicates.add(trimmedLink)
        return
      }

      seen.add(trimmedLink)

      // 简单的URL格式验证
      if (this.isValidNodeUrl(trimmedLink)) {
        result.valid.push(trimmedLink)
      } else {
        result.invalid.push(trimmedLink)
      }
    })

    return result
  }

  /**
   * 验证节点URL格式
   */
  private static isValidNodeUrl(url: string): boolean {
    try {
      // 支持的协议
      const supportedProtocols = ['vmess://', 'vless://', 'trojan://', 'ss://', 'hysteria2://', 'hysteria://']

      return supportedProtocols.some(protocol => url.startsWith(protocol))
    } catch {
      return false
    }
  }

  /**
   * 清理和标准化链接
   */
  static cleanLinks(links: string[]): string[] {
    return links
      .filter(link => link && typeof link === 'string')
      .map(link => link.trim())
      .filter(link => link.length > 0)
  }

  /**
   * 预处理导入数据
   */
  static prepareImportData(
    links: string[],
    options: Partial<BulkImportOptions> = {}
  ): {
    cleanedLinks: string[]
    validationResult: LinkValidationResult
    canProceed: boolean
  } {
    // 清理链接
    const cleanedLinks = this.cleanLinks(links)

    if (cleanedLinks.length === 0) {
      return {
        cleanedLinks: [],
        validationResult: { valid: [], invalid: [], duplicates: [] },
        canProceed: false
      }
    }

    // 验证链接
    const validationResult = this.validateImportLinks(cleanedLinks)

    // 检查是否有有效链接
    const canProceed = validationResult.valid.length > 0

    return {
      cleanedLinks,
      validationResult,
      canProceed
    }
  }

  /**
   * 生成导入预览信息
   */
  static generateImportPreview(
    validationResult: LinkValidationResult,
    options: Partial<BulkImportOptions> = {}
  ): {
    summary: string
    details: string[]
    warnings: string[]
  } {
    const details: string[] = []
    const warnings: string[] = []

    // 统计信息
    details.push(`有效链接: ${validationResult.valid.length}`)
    details.push(`无效链接: ${validationResult.invalid.length}`)
    details.push(`重复链接: ${validationResult.duplicates.length}`)

    // 警告信息
    if (validationResult.invalid.length > 0) {
      warnings.push(`发现 ${validationResult.invalid.length} 个无效链接，将被忽略`)
    }

    if (validationResult.duplicates.length > 0) {
      warnings.push(`发现 ${validationResult.duplicates.length} 个重复链接，已自动去重`)
    }

    // 生成摘要
    const totalValid = validationResult.valid.length
    const summary = totalValid > 0
      ? `准备导入 ${totalValid} 个有效节点`
      : '没有有效的节点链接可导入'

    return {
      summary,
      details,
      warnings
    }
  }
}