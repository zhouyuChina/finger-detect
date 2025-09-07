#!/bin/bash

# 微信小程序TDesign组件构建脚本
# 用于将TDesign组件复制到正确的miniprogram_npm目录

echo "🚀 开始构建小程序npm依赖..."

# 清理旧的构建文件和缓存
echo "🧹 清理旧的构建文件和缓存..."
rm -rf miniprogram_npm
rm -rf .wxapkg

# 创建miniprogram_npm目录
mkdir -p miniprogram_npm

# 复制TDesign组件到miniprogram_npm目录
echo "📦 复制TDesign组件..."
cp -r node_modules/tdesign-miniprogram/miniprogram_dist/* ./miniprogram_npm/

# 修复可能的权限问题
echo "🔧 修复文件权限..."
chmod -R 755 miniprogram_npm/

# 验证关键组件
echo "✅ 验证组件完整性..."
critical_components=("button" "cell" "badge" "icon" "tabs" "popup")
for component in "${critical_components[@]}"; do
    if [ -d "miniprogram_npm/$component" ]; then
        echo "  ✓ $component"
    else
        echo "  ✗ $component (缺失)"
    fi
done

echo "✅ 构建完成！"
echo "📂 TDesign组件已安装到 miniprogram_npm/ 目录"

# 显示安装的组件数量
component_count=$(find miniprogram_npm -maxdepth 1 -type d | grep -v '^\.$' | wc -l)
echo "🎉 共安装了 $component_count 个组件"

echo "💡 请在微信开发者工具中清理缓存并重新编译"