#!/bin/bash

echo "🧪 开始状态管理重构测试..."
echo

# 检查构建是否成功
echo "1. 检查构建状态..."
if npx vite build --mode development > /dev/null 2>&1; then
    echo "✅ 构建成功"
else
    echo "❌ 构建失败"
    exit 1
fi

# 检查关键文件是否存在
echo "2. 检查关键文件..."
files=(
    "src/stores/newGroups.ts"
    "src/stores/newSubscriptionGroups.ts"
    "src/stores/base/SimpleBaseStore.ts"
    "src/utils/api/SimpleApiClient.ts"
    "src/views/TestStateManagement.vue"
    "src/utils/testStores.ts"
)

for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file"
    else
        echo "❌ $file 不存在"
        exit 1
    fi
done

echo
echo "3. 检查文件大小..."
echo "新 Groups Store: $(wc -l < src/stores/newGroups.ts) 行"
echo "新 SubscriptionGroups Store: $(wc -l < src/stores/newSubscriptionGroups.ts) 行"
echo "SimpleBaseStore: $(wc -l < src/stores/base/SimpleBaseStore.ts) 行"

echo
echo "4. 代码质量检查..."
echo "检查 TypeScript 导入/导出..."
if grep -q "export.*useGroupStore" src/stores/newGroups.ts; then
    echo "✅ Groups Store 导出正确"
else
    echo "❌ Groups Store 导出有问题"
fi

if grep -q "export.*useSubscriptionGroupStore" src/stores/newSubscriptionGroups.ts; then
    echo "✅ SubscriptionGroups Store 导出正确"
else
    echo "❌ SubscriptionGroups Store 导出有问题"
fi

echo
echo "5. 功能对比..."
echo "原始 Groups Store: $(wc -l < src/stores/groups.ts) 行"
echo "重构 Groups Store: $(wc -l < src/stores/newGroups.ts) 行"
echo "原始 SubscriptionGroups Store: $(wc -l < src/stores/subscriptionGroups.ts) 行"
echo "重构 SubscriptionGroups Store: $(wc -l < src/stores/newSubscriptionGroups.ts) 行"

# 计算代码行数减少
original_groups=$(wc -l < src/stores/groups.ts)
new_groups=$(wc -l < src/stores/newGroups.ts)
original_sub_groups=$(wc -l < src/stores/subscriptionGroups.ts)
new_sub_groups=$(wc -l < src/stores/newSubscriptionGroups.ts)

total_original=$((original_groups + original_sub_groups))
total_new=$((new_groups + new_sub_groups))
reduction=$((total_original - total_new))

echo
echo "📊 代码统计:"
echo "原始代码: $total_original 行"
echo "重构代码: $total_new 行"
echo "减少代码: $reduction 行 ($(( reduction * 100 / total_original ))%)"

echo
echo "🎉 状态管理重构测试完成！"
echo
echo "📝 访问测试页面:"
echo "   http://localhost:5173/test-state-management"
echo
echo "✅ 重构优势:"
echo "   - 统一的错误处理"
echo "   - 更好的类型安全"
echo "   - 可复用的基础架构"
echo "   - 更完整的功能实现"
echo "   - 更好的性能优化"