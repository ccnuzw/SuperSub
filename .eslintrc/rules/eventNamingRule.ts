/**
 * 事件命名ESLint规则
 * 强制执行 handle + action + on + target 模式
 */

import type { ESLint } from 'eslint'

const rule: ESLint.Rule.RuleModule = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Enforce consistent event naming pattern',
      category: 'Best Practices',
      recommended: true
    },
    fixable: 'code',
    messages: {
      invalidEventName: 'Event handler "{{name}}" should follow pattern: handle + action + on + target (e.g., handleClickOnSave)'
    }
  },

  create(context) {
    return {
      // 检查Vue模板中的事件处理器
      'VElement[kind="directive"][key.name.name="on"] > VExpressionContainer[expression.type="Identifier"]'(
        node: any
      ) {
        const handlerName = node.expression.name

        if (handlerName.startsWith('handle')) {
          if (!handlerName.includes('on')) {
            context.report({
              node: node.expression,
              messageId: 'invalidEventName',
              data: { name: handlerName },
              fix(fixer) {
                // 提供修复建议
                const action = handlerName.replace('handle', '')
                const newName = `handleClickOn${action.charAt(0).toUpperCase() + action.slice(1)}`
                return fixer.replaceText(node.expression, newName)
              }
            })
          }
        }
      },

      // 检查methods中的事件处理函数
      'Property[key.name=/^handle/]'(node: any) {
        const functionName = node.key.name

        if (functionName.startsWith('handle') && !functionName.includes('on')) {
          // 验证是否遵循 handle + action + on + target 模式
          const parts = functionName.replace('handle', '').split(/(?=[A-Z])/)

          if (parts.length < 3 || !parts.includes('on')) {
            context.report({
              node: node.key,
              messageId: 'invalidEventName',
              data: { name: functionName }
            })
          }
        }
      }
    }
  }
}

export default rule