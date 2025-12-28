/**
 * 统一的前端消息通知服务
 * 提供类型安全的通知方法和预定义的中文消息模板
 */
import { useMessage, type MessageOptions, type MessageReactive } from 'naive-ui'

// 资源类型
export type ResourceType =
    | '节点' | '订阅' | '分组' | '配置文件' | '规则'
    | '用户' | '资产' | '设置' | 'Token' | '密码'

// 操作类型
export type ActionType =
    | 'create' | 'update' | 'delete' | 'import' | 'export'
    | 'copy' | 'save' | 'test' | 'reset' | 'enable' | 'disable'

// 通知配置
interface NotifyConfig {
    duration?: number  // 持续时间（毫秒）
    closable?: boolean // 是否可关闭
}

// 默认配置
const defaultConfig: NotifyConfig = {
    duration: 3000,
    closable: true
}

// 操作的中文名称映射
const actionNames: Record<ActionType, string> = {
    create: '创建',
    update: '更新',
    delete: '删除',
    import: '导入',
    export: '导出',
    copy: '复制',
    save: '保存',
    test: '测试',
    reset: '重置',
    enable: '启用',
    disable: '禁用'
}

/**
 * 统一的通知服务 composable
 */
export function useNotification() {
    const message = useMessage()

    // 基础通知方法
    const notify = {
        /**
         * 成功通知
         */
        success(content: string, config?: NotifyConfig) {
            return message.success(content, {
                duration: config?.duration ?? defaultConfig.duration,
                closable: config?.closable ?? defaultConfig.closable,
            })
        },

        /**
         * 错误通知
         */
        error(content: string, config?: NotifyConfig) {
            return message.error(content, {
                duration: config?.duration ?? 5000, // 错误消息显示更久
                closable: config?.closable ?? defaultConfig.closable,
            })
        },

        /**
         * 警告通知
         */
        warning(content: string, config?: NotifyConfig) {
            return message.warning(content, {
                duration: config?.duration ?? 4000,
                closable: config?.closable ?? defaultConfig.closable,
            })
        },

        /**
         * 信息通知
         */
        info(content: string, config?: NotifyConfig) {
            return message.info(content, {
                duration: config?.duration ?? defaultConfig.duration,
                closable: config?.closable ?? defaultConfig.closable,
            })
        },

        /**
         * 加载中通知（返回可关闭的消息）
         */
        loading(content: string): MessageReactive {
            return message.loading(content, { duration: 0 })
        }
    }

    // 便捷的操作成功通知
    const actionSuccess = {
        /**
         * 操作成功通知
         * @param resource 资源类型
         * @param action 操作类型
         * @param detail 额外细节（可选）
         */
        action(resource: ResourceType, action: ActionType, detail?: string) {
            const actionName = actionNames[action]
            let content = `${resource}${actionName}成功`
            if (detail) content += `：${detail}`
            return notify.success(content)
        },

        /**
         * 创建成功
         */
        create(resource: ResourceType, name?: string) {
            const content = name
                ? `${resource}「${name}」创建成功`
                : `${resource}创建成功`
            return notify.success(content)
        },

        /**
         * 更新成功
         */
        update(resource: ResourceType, name?: string) {
            const content = name
                ? `${resource}「${name}」更新成功`
                : `${resource}更新成功`
            return notify.success(content)
        },

        /**
         * 删除成功
         */
        delete(resource: ResourceType, count?: number) {
            const content = count && count > 1
                ? `已删除 ${count} 个${resource}`
                : `${resource}删除成功`
            return notify.success(content)
        },

        /**
         * 导入成功
         */
        import(resource: ResourceType, count: number) {
            return notify.success(`成功导入 ${count} 个${resource}`)
        },

        /**
         * 导出/复制成功
         */
        copy(resource?: string) {
            const content = resource
                ? `${resource}已复制到剪贴板`
                : '已复制到剪贴板'
            return notify.success(content)
        },

        /**
         * 保存成功
         */
        save(resource?: ResourceType) {
            const content = resource
                ? `${resource}保存成功`
                : '保存成功'
            return notify.success(content)
        },

        /**
         * 批量操作成功
         */
        batch(action: ActionType, resource: ResourceType, successCount: number, totalCount?: number) {
            const actionName = actionNames[action]
            const content = totalCount
                ? `成功${actionName} ${successCount}/${totalCount} 个${resource}`
                : `成功${actionName} ${successCount} 个${resource}`
            return notify.success(content)
        }
    }

    // 便捷的操作失败通知
    const actionError = {
        /**
         * 操作失败通知
         * @param resource 资源类型
         * @param action 操作类型
         * @param reason 失败原因（可选）
         */
        action(resource: ResourceType, action: ActionType, reason?: string) {
            const actionName = actionNames[action]
            let content = `${resource}${actionName}失败`
            if (reason) content += `：${reason}`
            return notify.error(content)
        },

        /**
         * 创建失败
         */
        create(resource: ResourceType, reason?: string) {
            let content = `${resource}创建失败`
            if (reason) content += `：${reason}`
            return notify.error(content)
        },

        /**
         * 更新失败
         */
        update(resource: ResourceType, reason?: string) {
            let content = `${resource}更新失败`
            if (reason) content += `：${reason}`
            return notify.error(content)
        },

        /**
         * 删除失败
         */
        delete(resource: ResourceType, reason?: string) {
            let content = `${resource}删除失败`
            if (reason) content += `：${reason}`
            return notify.error(content)
        },

        /**
         * 导入失败
         */
        import(resource: ResourceType, reason?: string) {
            let content = `${resource}导入失败`
            if (reason) content += `：${reason}`
            return notify.error(content)
        },

        /**
         * 保存失败
         */
        save(resource?: ResourceType, reason?: string) {
            let content = resource ? `${resource}保存失败` : '保存失败'
            if (reason) content += `：${reason}`
            return notify.error(content)
        },

        /**
         * 复制失败
         */
        copy(reason?: string) {
            let content = '复制失败'
            if (reason) content += `：${reason}`
            return notify.error(content)
        },

        /**
         * 网络请求失败
         */
        network(reason?: string) {
            let content = '网络请求失败'
            if (reason) content += `：${reason}`
            else content += '，请检查网络连接后重试'
            return notify.error(content)
        },

        /**
         * 权限不足
         */
        permission() {
            return notify.error('操作失败：权限不足')
        },

        /**
         * 服务器错误
         */
        server(detail?: string) {
            let content = '服务器错误'
            if (detail) content += `：${detail}`
            return notify.error(content)
        }
    }

    // 常用场景预设
    const preset = {
        // 登录相关
        loginSuccess(username?: string) {
            const content = username
                ? `欢迎回来，${username}`
                : '登录成功'
            return notify.success(content)
        },
        loginFailed(reason?: string) {
            let content = '登录失败'
            if (reason) content += `：${reason}`
            return notify.error(content)
        },
        registerSuccess() {
            return notify.success('注册成功！请登录')
        },

        // 订阅更新相关
        subscriptionUpdateSuccess(name: string, nodeCount?: number) {
            const content = nodeCount !== undefined
                ? `订阅「${name}」更新成功，获取 ${nodeCount} 个节点`
                : `订阅「${name}」更新成功`
            return notify.success(content)
        },
        subscriptionUpdateFailed(name: string, reason?: string) {
            let content = `订阅「${name}」更新失败`
            if (reason) content += `：${reason}`
            return notify.error(content)
        },

        // 节点测试相关
        nodeTestStart(count: number) {
            return notify.info(`正在测试 ${count} 个节点...`)
        },
        nodeTestComplete(healthyCount: number, totalCount: number) {
            if (healthyCount === totalCount) {
                return notify.success(`测试完成：全部 ${totalCount} 个节点可用`)
            } else if (healthyCount === 0) {
                return notify.error(`测试完成：全部 ${totalCount} 个节点不可用`)
            } else {
                return notify.warning(`测试完成：${healthyCount}/${totalCount} 个节点可用`)
            }
        },

        // 数据加载相关
        loadFailed(resource: ResourceType, reason?: string) {
            let content = `${resource}加载失败`
            if (reason) content += `：${reason}`
            return notify.error(content)
        },

        // 输入验证
        validationError(message: string) {
            return notify.warning(message)
        },

        // 空数据提示
        noData(message: string) {
            return notify.warning(message)
        }
    }

    return {
        // 基础通知方法
        ...notify,
        // 操作成功通知
        actionSuccess,
        // 操作失败通知
        actionError,
        // 预设场景通知
        preset,
        // 原始 message 对象（兼容旧代码）
        message
    }
}

// 导出类型
export type NotificationService = ReturnType<typeof useNotification>
