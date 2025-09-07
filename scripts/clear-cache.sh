#!/bin/bash

echo "🧹 清理微信开发者工具缓存..."

# 删除可能的缓存文件
find . -name "*.wxss.map" -delete 2>/dev/null || true
find . -name "*.js.map" -delete 2>/dev/null || true
find . -name ".DS_Store" -delete 2>/dev/null || true

# 清理 miniprogram_npm 目录的隐藏文件
find miniprogram_npm -name ".*" -not -name ".." -not -name "." -delete 2>/dev/null || true

# 确保组件目录权限正确
chmod -R 755 miniprogram_npm/

# 验证关键组件
echo "✅ 验证组件结构..."
for component in "badge" "icon" "tabs" "sticky"; do
    if [ -d "miniprogram_npm/$component" ] && [ -f "miniprogram_npm/$component/$component.json" ]; then
        echo "  ✓ $component"
    else
        echo "  ✗ $component - 缺失"
    fi
done

echo ""
echo "📋 下一步操作："
echo "1. 在微信开发者工具中选择 '工具' -> '清除缓存' -> '清除全部'"
echo "2. 重新构建 npm (工具 -> 构建 npm)"
echo "3. 如果仍有问题，请重启微信开发者工具"