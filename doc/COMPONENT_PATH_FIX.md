# 组件路径修复说明

## 问题描述

在优惠券功能开发过程中，发现TDesign组件的路径配置错误，导致微信小程序无法找到组件文件。

**错误信息**:
```
component not found in the path: /Users/zhouyu/www/work/WeChatProjects/finger-detect/pages/my-coupons/tdesign-miniprogram/button/button
```

## 问题原因

在页面JSON配置文件中，TDesign组件的路径配置错误：
- **错误路径**: `"tdesign-miniprogram/button/button"`
- **正确路径**: `"../../miniprogram_npm/button/button"`

## 修复内容

### 1. 修复的页面文件

#### pages/my-coupons/my-coupons.json
```json
{
  "navigationBarTitleText": "我的优惠券",
  "enablePullDownRefresh": true,
  "backgroundColor": "#f5f5f5",
  "usingComponents": {
    "t-button": "../../miniprogram_npm/button/button",
    "t-empty": "../../miniprogram_npm/empty/empty",
    "t-loading": "../../miniprogram_npm/loading/loading"
  }
}
```

#### pages/available-coupons/available-coupons.json
```json
{
  "navigationBarTitleText": "可领取优惠券",
  "enablePullDownRefresh": true,
  "backgroundColor": "#f5f5f5",
  "usingComponents": {
    "t-button": "../../miniprogram_npm/button/button",
    "t-loading": "../../miniprogram_npm/loading/loading",
    "t-empty": "../../miniprogram_npm/empty/empty"
  }
}
```

#### pages/coupon-use-demo/coupon-use-demo.json
```json
{
  "navigationBarTitleText": "优惠券使用",
  "backgroundColor": "#f5f5f5",
  "usingComponents": {
    "t-button": "../../miniprogram_npm/button/button",
    "t-empty": "../../miniprogram_npm/empty/empty",
    "t-loading": "../../miniprogram_npm/loading/loading"
  }
}
```

### 2. 页面注册

在 `app.json` 中添加了新创建的页面：

```json
{
  "pages": [
    // ... 其他页面
    "pages/my-coupons/my-coupons",
    "pages/available-coupons/available-coupons",
    "pages/coupon-use-demo/coupon-use-demo",
    // ... 其他页面
  ]
}
```

## 路径说明

### 相对路径规则

在微信小程序中，组件路径是相对于当前页面文件的相对路径：

- **页面位置**: `pages/my-coupons/my-coupons.js`
- **组件位置**: `miniprogram_npm/button/button.js`
- **相对路径**: `../../miniprogram_npm/button/button`

### 路径计算

```
pages/my-coupons/          # 当前页面目录
├── my-coupons.js
├── my-coupons.wxml
├── my-coupons.wxss
└── my-coupons.json

miniprogram_npm/           # 组件目录
├── button/
│   └── button.js
├── empty/
│   └── empty.js
└── loading/
    └── loading.js
```

从 `pages/my-coupons/` 到 `miniprogram_npm/button/` 的路径：
- 向上两级：`../../`
- 进入miniprogram_npm：`miniprogram_npm/`
- 进入button目录：`button/`
- 最终路径：`../../miniprogram_npm/button/button`

## 验证方法

### 1. 检查组件文件是否存在
```bash
ls -la miniprogram_npm/button/button.js
ls -la miniprogram_npm/empty/empty.js
ls -la miniprogram_npm/loading/loading.js
```

### 2. 检查JSON配置
```bash
grep -A 5 "usingComponents" pages/my-coupons/my-coupons.json
```

### 3. 检查是否有错误的路径配置
```bash
grep -r "tdesign-miniprogram" pages/ --include="*.json"
```

## 注意事项

1. **路径区分**: 
   - 页面JSON文件：使用相对路径 `../../miniprogram_npm/`
   - 全局app.json：使用绝对路径 `miniprogram_npm/`

2. **组件依赖**: TDesign组件之间可能有依赖关系，需要确保所有依赖组件都已正确配置

3. **版本兼容**: 确保TDesign组件版本与项目兼容

4. **构建工具**: 如果使用构建工具，可能需要重新构建项目

## 修复结果

✅ 所有优惠券相关页面的组件路径已修复
✅ 新页面已正确注册到app.json
✅ 组件文件存在且可访问
✅ 无错误的路径配置残留

现在优惠券功能应该可以正常运行，不会再出现组件找不到的错误。 