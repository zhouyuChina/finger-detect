#!/bin/bash

# 微信小程序TDesign组件构建脚本
# 用于将TDesign组件复制到正确的miniprogram_npm目录并优化大小

echo "🚀 开始构建小程序npm依赖..."

# 清理旧的构建文件和缓存
echo "🧹 清理旧的构建文件和缓存..."
rm -rf miniprogram_npm
rm -rf .wxapkg

# 创建miniprogram_npm目录
mkdir -p miniprogram_npm

# 源目录
SOURCE_DIR="node_modules/tdesign-miniprogram/miniprogram_dist"

if [ ! -d "$SOURCE_DIR" ]; then
    echo "❌ 错误: 找不到TDesign源目录，请先运行 npm install"
    exit 1
fi

# 第一步：复制TDesign组件到miniprogram_npm目录，排除嵌套的miniprogram_npm目录
echo "📦 复制TDesign组件..."
for item in "$SOURCE_DIR"/*; do
    # 获取文件/目录名
    basename=$(basename "$item")

    # 跳过嵌套的miniprogram_npm目录和隐藏文件
    if [ "$basename" != "miniprogram_npm" ] && [[ "$basename" != .* ]]; then
        cp -r "$item" ./miniprogram_npm/
    fi
done

echo "  ✓ 已复制TDesign组件"

# 第二步：复制依赖包（dayjs、tinycolor2、tslib等）
echo "📦 复制依赖包..."
if [ -d "$SOURCE_DIR/miniprogram_npm" ]; then
    # 复制嵌套目录中的依赖包到顶层miniprogram_npm
    for dep in "$SOURCE_DIR/miniprogram_npm"/*; do
        dep_name=$(basename "$dep")
        if [ ! -d "./miniprogram_npm/$dep_name" ]; then
            cp -r "$dep" ./miniprogram_npm/
            echo "  ✓ $dep_name"
        fi
    done

    # 第三步：创建嵌套目录的符号链接（兼容某些组件内部的引用路径）
    echo "🔗 创建符号链接..."
    mkdir -p ./miniprogram_npm/miniprogram_npm

    # 保存当前目录
    CURRENT_DIR=$(pwd)
    cd ./miniprogram_npm/miniprogram_npm

    # 为每个依赖包创建符号链接
    ln -sf ../dayjs dayjs 2>/dev/null
    ln -sf ../tinycolor2 tinycolor2 2>/dev/null
    ln -sf ../tslib tslib 2>/dev/null

    echo "  ✓ dayjs 符号链接"
    echo "  ✓ tinycolor2 符号链接"
    echo "  ✓ tslib 符号链接"

    cd "$CURRENT_DIR"
else
    echo "  ! 未找到依赖包目录"
fi

# 优化：删除不必要的文件以减小体积
echo "🧹 删除不必要的文件..."

# 删除文档和示例文件
find miniprogram_npm -type f \( -name "*.md" -o -name "README*" -o -name "demo.*" -o -name "example.*" \) -delete

# 删除sourcemap文件
find miniprogram_npm -type f -name "*.map" -delete

# 删除TypeScript源文件（保留编译后的js）
find miniprogram_npm -type f -name "*.ts" ! -name "*.d.ts" -delete

# 删除.DS_Store文件
find miniprogram_npm -type f -name ".DS_Store" -delete

echo "  ✓ 已删除文档、示例和临时文件"

# 修复可能的权限问题
echo "🔧 修复文件权限..."
chmod -R 755 miniprogram_npm/

# 统计信息
component_count=$(find miniprogram_npm -maxdepth 1 -type d | wc -l)
component_count=$((component_count - 1))
npm_size=$(du -sh miniprogram_npm 2>/dev/null | cut -f1)

echo ""
echo "✅ 构建完成！"
echo "📊 统计信息:"
echo "   - 组件和依赖包数量: $component_count 个"
echo "   - 目录大小: $npm_size"

echo ""
echo "💡 提示:"
echo "   1. 请在微信开发者工具中清理缓存并重新编译"
echo "   2. 实际上传时会自动压缩，最终代码包会小于显示的大小"
