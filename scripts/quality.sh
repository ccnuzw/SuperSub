#!/bin/bash

# SuperSub 代码质量检查脚本

echo "🔍 SuperSub 代码质量检查工具"

# 检查 ESLint
check_eslint() {
    echo "📋 检查 ESLint 规则..."
    npm run lint:check

    if [ $? -eq 0 ]; then
        echo "✅ ESLint 检查通过"
    else
        echo "❌ ESLint 检查失败，正在自动修复..."
        npm run lint
        echo "🔧 已尝试自动修复 ESLint 问题"
    fi
}

# 检查 Prettier
check_prettier() {
    echo "📝 检查 Prettier 格式..."
    npm run format:check

    if [ $? -eq 0 ]; then
        echo "✅ Prettier 格式检查通过"
    else
        echo "❌ Prettier 格式检查失败，正在自动格式化..."
        npm run format
        echo "🎨 已自动格式化代码"
    fi
}

# 检查 TypeScript 类型
check_typescript() {
    echo "🔷 检查 TypeScript 类型..."
    npm run type-check

    if [ $? -eq 0 ]; then
        echo "✅ TypeScript 类型检查通过"
    else
        echo "❌ TypeScript 类型检查失败"
        return 1
    fi
}

# 运行测试
run_tests() {
    echo "🧪 运行测���套件..."
    npm run test

    if [ $? -eq 0 ]; then
        echo "✅ 所有测试通过"
    else
        echo "❌ 测试失败"
        return 1
    fi
}

# 运行测试覆盖率
check_coverage() {
    echo "📊 运行测试覆盖率..."
    npm run test:coverage

    if [ $? -eq 0 ]; then
        echo "✅ 测试覆盖率检查完成"
        echo "📈 查看 coverage/index.html 获取详细报告"
    else
        echo "❌ 测试覆盖率检查失败"
        return 1
    fi
}

# 修复所有可修复的问题
fix_all() {
    echo "🔧 修复所有可修复的代码问题..."

    echo "  1. 修复 ESLint 问题..."
    npm run lint

    echo "  2. 格式化代码..."
    npm run format

    echo "✅ 修复完成"
}

# 运行完整的质量检查
run_full_check() {
    echo "🔬 运行完整的代码质量检查..."

    local failed=false

    # 检查 ESLint
    if ! check_eslint; then
        failed=true
    fi

    # 检查 Prettier
    if ! check_prettier; then
        failed=true
    fi

    # 检查 TypeScript
    if ! check_typescript; then
        failed=true
    fi

    # 运行测试
    if ! run_tests; then
        failed=true
    fi

    if [ "$failed" = true ]; then
        echo "❌ 代码质量检查失败"
        return 1
    else
        echo "🎉 所有代码质量检查通过！"
    fi
}

# 生成代码质量报告
generate_quality_report() {
    echo "📝 生成代码质量报告..."

    REPORT_FILE="quality-report-$(date +%Y%m%d-%H%M%S).md"

    cat > "$REPORT_FILE" << EOF
# SuperSub 代码质量报告

生成时间: $(date)

## ESLint 规则合规性

### 启用的主要规则
- **TypeScript**: 严格类型检查、接口定义规范
- **Vue 3**: 组合式 API 最佳实践、组件命名规范
- **代码风格**: 统一的代码格式和命名约定
- **ES2022**: 现代 JavaScript 特性使用规范

### 自定义规则
- 组件命名使用 PascalCase
- 事件命名使用 camelCase
- 接口使用 I 前缀
- 优先使用箭头函数
- 禁用 var 声明
- 强制使用 const/let

## Prettier 代码格式化

### 配置标准
- 单引号
- 不使用分号
- 2 个空格缩进
- 100 字符行宽
- LF 换行符

## TypeScript 类型检查

### 类型系统
- 严格的类型检查
- 接口优于类型别名
- 明确的函数返回类型
- 空值检查和类型守卫

## 测试覆盖率

### 测试框架
- Vitest + Vue Test Utils
- 覆盖率目标: 70%
- 测试环境: jsdom

### 测试类型
- 单元测试
- 组件测试
- Composable 测试
- 集成测试

## 建议改进

1. **组件拆分**
   - 持续监控组件大小
   - 遵循单一职责原则
   - 提高组件可复用性

2. **性能优化**
   - 监控组件渲染性能
   - 优化包大小
   - 实现更好的懒加载

3. **类型安全**
   - 减少 any 类型使用
   - 完善接口定义
   - 改进类型推断

EOF

    echo "✅ 代码质量报告已生成: $REPORT_FILE"
}

# 主菜单
main_menu() {
    echo ""
    echo "请选择操作："
    echo "1) 检查 ESLint 规则"
    echo "2) 检查 Prettier 格式"
    echo "3) 检查 TypeScript 类型"
    echo "4) 运行测试"
    echo "5) 检查测试覆盖率"
    echo "6) 修复所有可修复问题"
    echo "7) 运行完整质量检查"
    echo "8) 生成质量报告"
    echo "0) 退出"
    echo ""

    read -p "请输入选项 (0-8): " choice

    case $choice in
        1) check_eslint ;;
        2) check_prettier ;;
        3) check_typescript ;;
        4) run_tests ;;
        5) check_coverage ;;
        6) fix_all ;;
        7) run_full_check ;;
        8) generate_quality_report ;;
        0) echo "👋 退出程序"; exit 0 ;;
        *) echo "❌ 无效选项，请重新选择"; main_menu ;;
    esac
}

# 命令行参数处理
case "${1:-}" in
    "eslint") check_eslint ;;
    "prettier") check_prettier ;;
    "typescript") check_typescript ;;
    "test") run_tests ;;
    "coverage") check_coverage ;;
    "fix") fix_all ;;
    "full") run_full_check ;;
    "report") generate_quality_report ;;
    *) main_menu ;;
esac