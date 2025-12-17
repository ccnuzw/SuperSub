#!/bin/bash

# SuperSub 项目性能监控和优化脚本

echo "🚀 SuperSub 性能监控和优化工具"

# 构建分析
analyze_bundle() {
    echo "📦 开始分析构建产物..."
    NODE_ENV=analyze npm run build

    if [ -f "dist/stats.html" ]; then
        echo "✅ 构建分析完成，已打开浏览器查看报告"
        open dist/stats.html
    else
        echo "❌ 构建分析失败"
    fi
}

# 开发环境性能监控
monitor_performance() {
    echo "🔍 启动开发环境性能监控..."
    echo "监控包括："
    echo "  - Web Vitals 指标 (FCP, LCP, FID, CLS)"
    echo "  - 内存使用情况"
    echo "  - 组件渲染时间"
    echo "  - 资源加载时间"
    echo "  - 路由切换性能"
    echo ""
    echo "💡 在浏览器控制台查看实时性能报告"
    npm run dev
}

# 运行性能测试
run_performance_tests() {
    echo "⚡ 运行性能测试..."

    # 安装 Lighthouse CI（如果未安装）
    if ! command -v lhci &> /dev/null; then
        echo "📥 安装 Lighthouse CI..."
        npm install -g @lhci/cli
    fi

    # 运行 Lighthouse 分析
    lhci autorun

    echo "📊 性能测试完成，查看 .lighthouseci/ 目录获取详细报告"
}

# 检查依赖包大小
check_bundle_size() {
    echo "📏 检查依赖包大小..."

    if ! command -v webpack-bundle-analyzer &> /dev/null; then
        echo "📥 安装 webpack-bundle-analyzer..."
        npm install --save-dev webpack-bundle-analyzer
    fi

    # 分析 bundle
    npx vite-bundle-analyzer dist --mode json
    echo "📈 Bundle 分析完成"
}

# 运行内存泄漏检测
detect_memory_leaks() {
    echo "🧠 运行内存泄漏检测..."

    echo "请在浏览器中："
    echo "1. 打开开发者工具 → Performance"
    echo "2. 开始录制"
    echo "3. 在应用中执行各种操作"
    echo "4. 停止录制并查看内存使用情况"
    echo ""
    echo "💡 关注："
    echo "  - 内存使用是否持续增长"
    echo "  - DOM 节点数量是否异常"
    echo "  - 事件监听器是否正确清理"

    npm run dev
}

# 生成性能报告
generate_performance_report() {
    echo "📝 生成性能报告..."

    REPORT_FILE="performance-report-$(date +%Y%m%d-%H%M%S).md"

    cat > "$REPORT_FILE" << EOF
# SuperSub 性能报告

生成时间: $(date)

## 构建优化

### 代码分割
- [x] 基础框架分离 (vue-vendor)
- [x] UI组件库分离 (ui-vendor)
- [x] 工具库分离 (utils-vendor)
- [x] 基础组件分离 (base-components)
- [x] 业务组件按需加载
- [x] 页面组件路由级别分离

### 资源优化
- [x] Gzip/Brotli 压缩
- [x] Tree-shaking
- [x] 代码压缩 (Terser)
- [x] CSS 代码分割
- [x] 图片/字体资源分离

## 运行时优化

### 组件优化
- [x] 组件懒加载
- [x] 关键组件预加载
- [x] 组件渲染性能监控
- [x] 组件拆分优化

### 性能监控
- [x] Web Vitals 监控
- [x] 内存使用监控
- [x] 资源加载监控
- [x] 路由切换监控

### 建议的优化点

1. **图片优化**
   - 使用 WebP 格式
   - 实现图片懒加载
   - 添加占位符

2. **缓存策略**
   - 实现客户端缓存
   - 设置合适的缓存头
   - 使用 Service Worker

3. **网络优化**
   - 启用 HTTP/2
   - 实现资源预加载
   - 优化 API 请求

4. **用户体验**
   - 添加加载状态
   - 实现骨架屏
   - 优化首屏渲染

EOF

    echo "✅ 性能报告已生成: $REPORT_FILE"
}

# 主菜单
main_menu() {
    echo ""
    echo "请选择操作："
    echo "1) 分析构建产物"
    echo "2) 启动性能监控"
    echo "3) 运行性能测试"
    echo "4) 检查依赖包大小"
    echo "5) 内存泄漏检测"
    echo "6) 生成性能报告"
    echo "0) 退出"
    echo ""

    read -p "请输入选项 (0-6): " choice

    case $choice in
        1) analyze_bundle ;;
        2) monitor_performance ;;
        3) run_performance_tests ;;
        4) check_bundle_size ;;
        5) detect_memory_leaks ;;
        6) generate_performance_report ;;
        0) echo "👋 退出程序"; exit 0 ;;
        *) echo "❌ 无效选项，请重新选择"; main_menu ;;
    esac
}

# 命令行参数处理
case "${1:-}" in
    "analyze") analyze_bundle ;;
    "monitor") monitor_performance ;;
    "test") run_performance_tests ;;
    "bundle-size") check_bundle_size ;;
    "memory") detect_memory_leaks ;;
    "report") generate_performance_report ;;
    *) main_menu ;;
esac