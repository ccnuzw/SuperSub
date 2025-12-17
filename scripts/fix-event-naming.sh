#!/bin/bash

# SuperSub 事件命名规范修复脚本

echo "🔧 SuperSub 事件命名规范修复工具"

# 查找需要修复的事件名称
find_vue_files() {
    echo "🔍 搜索 Vue 文件中不规范的事件名称..."

    # 查找所有Vue文件
    find src -name "*.vue" -type f | while read -r file; do
        echo "检查文件: $file"

        # 查找不符合规范的@click事件
        echo "  不规范的点击事件:"
        grep -n "@click=\"handle[^\"]*\"" "$file" | grep -v "On" | head -5

        # 查找不符合规范的methods
        echo "  不规范的方法名:"
        grep -n "handle[A-Za-z]*:" "$file" | grep -v "On" | head -5

        echo ""
    done
}

# 生成修复建议
generate_fix_suggestions() {
    echo "💡 修复建议示例:"
    echo ""
    echo "  handleSave → handleClickOnSave"
    echo "  handleEdit → handleEditOnClick"
    echo "  handleDelete → handleDeleteOnClick"
    echo "  handleAdd → handleAddOnClick"
    echo "  handleUpdate → handleUpdateOnClick"
    echo "  handleCancel → handleCancelOnClick"
    echo "  handleSubmit → handleSubmitOnForm"
    echo "  handleReset → handleResetOnForm"
    echo "  handleSearch → handleInputOnSearch"
    echo "  handleFilter → handleChangeOnFilter"
    echo ""
}

# 创建事件名称映射
create_event_mapping() {
    echo "📋 事件名称映射表:"
    echo ""

    cat > "event-fix-mapping.json" << 'EOF'
{
  "handleSave": "handleClickOnSave",
  "handleEdit": "handleEditOnClick",
  "handleDelete": "handleDeleteOnClick",
  "handleAdd": "handleAddOnClick",
  "handleUpdate": "handleUpdateOnClick",
  "handleCancel": "handleCancelOnClick",
  "handleSubmit": "handleSubmitOnForm",
  "handleReset": "handleResetOnForm",
  "handleSearch": "handleInputOnSearch",
  "handleFilter": "handleChangeOnFilter",
  "handleSelect": "handleSelectOnChange",
  "handleToggle": "handleToggleOnChange",
  "handleOpen": "handleClickOnOpen",
  "handleClose": "handleClickOnClose",
  "handleRefresh": "handleClickOnRefresh",
  "handleRetry": "handleClickOnRetry",
  "handleCopy": "handleClickOnCopy",
  "handlePaste": "handleClickOnPaste",
  "handleDownload": "handleClickOnDownload",
  "handleUpload": "handleClickOnUpload",
  "handleImport": "handleClickOnImport",
  "handleExport": "handleClickOnExport"
}
EOF

    echo "✅ 已创建 event-fix-mapping.json 映射文件"
}

# 自动修复文件
auto_fix_files() {
    echo "🔧 自动修复文件 (模拟)..."

    # 这里只是一个示例，实际修复需要更复杂的解析
    echo "注意: 自动修复需要手动执行，因为需要考虑上下文"
    echo ""
    echo "建议使用以下方式手动修复:"
    echo "1. 在 VS Code 中使用查找替换功能"
    echo "2. 使用正则表达式批量替换"
    echo "3. 逐个文件检查并修复"
    echo ""

    echo "常用正则表达式替换:"
    echo "  查找: @click=\"handle([A-Z][a-zA-Z]*)\""
    echo "  替换: @click=\"handleClickOn\$1\""
    echo ""
}

# 验证修复结果
verify_fixes() {
    echo "✅ 验证修复结果..."

    echo "检查是否还有不规范的事件名称:"

    find src -name "*.vue" -type f -exec grep -l "@click=\"handle[^\"]*\"" {} \; | while read -r file; do
        echo "文件: $file"
        grep -n "@click=\"handle[^\"]*\"" "$file" | grep -v "On" | head -3
        echo ""
    done
}

# 生成修复报告
generate_report() {
    echo "📊 生成修复报告..."

    REPORT_FILE="event-naming-report-$(date +%Y%m%d-%H%M%S).md"

    cat > "$REPORT_FILE" << EOF
# 事件命名规范修复报告

生成时间: $(date)

## 修复标准

事件命名必须遵循: \`handle + action + on + target\` 模式

### 例子
- \`handleClickOnSave\`
- \`handleEditOnNode\`
- \`handleSubmitOnForm\`
- \`handleInputOnSearch\`

## 常见问题

### 1. 缺少 'on' 关键字
- ❌ \`handleSave\`
- ✅ \`handleClickOnSave\`

### 2. 动作描述不准确
- ❌ \`handleEdit\`
- ✅ \`handleEditOnClick\`

### 3. 目标描述不明确
- ❌ \`handleSubmit\`
- ✅ \`handleSubmitOnForm\`

## 修复进度

- [ ] 查找所有不规范的事件名称
- [ ] 生成修复映射表
- [ ] 批量替换模板事件
- [ ] 手动检查和修复复杂情况
- [ ] 验证修复结果
- [ ] 更新相关文档

## 工具和脚本

### ESLint 规则
已创建自定义 ESLint 规则: \`.eslintrc/rules/eventNamingRule.ts\`

### 事件名称生成器
已创建工具类: \`src/utils/eventNameGenerator.ts\`

### 映射文件
已创建映射文件: \`event-fix-mapping.json\`

## 下一步

1. 在实际修复前先备份代码
2. 使用脚本生成修复建议
3. 逐个文件检查并修复
4. 运行 ESLint 验证结果
5. 添加单元测试验证事件名称

EOF

    echo "✅ 报告已生成: $REPORT_FILE"
}

# 主菜单
main_menu() {
    echo ""
    echo "请选择操作："
    echo "1) 查找不规范的事件名称"
    echo "2) 生成修复建议"
    echo "3) 创建事件名称映射"
    echo "4) 自动修复文件 (模拟)"
    echo "5) 验证修复结果"
    echo "6) 生成修复报告"
    echo "7) 执行完整流程"
    echo "0) 退出"
    echo ""

    read -p "请输入选项 (0-7): " choice

    case $choice in
        1) find_vue_files ;;
        2) generate_fix_suggestions ;;
        3) create_event_mapping ;;
        4) auto_fix_files ;;
        5) verify_fixes ;;
        6) generate_report ;;
        7)
            find_vue_files
            echo ""
            generate_fix_suggestions
            echo ""
            create_event_mapping
            echo ""
            auto_fix_files
            echo ""
            generate_report
            ;;
        0) echo "👋 退出程序"; exit 0 ;;
        *) echo "❌ 无效选项，请重新选择"; main_menu ;;
    esac
}

# 命令行参数处理
case "${1:-}" in
    "find") find_vue_files ;;
    "suggest") generate_fix_suggestions ;;
    "mapping") create_event_mapping ;;
    "fix") auto_fix_files ;;
    "verify") verify_fixes ;;
    "report") generate_report ;;
    "all")
        find_vue_files
        echo ""
        generate_fix_suggestions
        echo ""
        create_event_mapping
        echo ""
        auto_fix_files
        echo ""
        generate_report
        ;;
    *) main_menu ;;
esac