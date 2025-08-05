# 留言反馈页面实现文档

## 概述

根据需求，将原本的留言反馈弹窗改为独立的页面形式，并添加tab标签分为留言和反馈两个板块。

## 功能特性

### 1. Tab标签页
- ✅ 留言板块：包含留言表单和留言列表
- ✅ 反馈板块：显示用户反馈记录列表

### 2. 留言板块功能
- ✅ 留言表单：提交标题和内容
- ✅ 留言列表：显示所有留言
- ✅ 支持分页加载和下拉刷新
- ✅ 空状态和加载状态

### 3. 反馈板块功能
- ✅ 显示用户反馈记录列表
- ✅ 点击反馈项查看详情（弹窗形式）
- ✅ 反馈类型和状态显示
- ✅ 支持分页加载和下拉刷新

### 4. Tab切换
- ✅ 切换时不发送请求，只是切换显示内容
- ✅ 页面加载时同时获取两个板块的数据

## 文件结构

```
pages/
└── feedback/           # 留言反馈页面
    ├── feedback.js     # 页面逻辑
    ├── feedback.wxml   # 页面结构
    ├── feedback.wxss   # 页面样式
    └── feedback.json   # 页面配置

utils/
├── config.js          # API配置（新增反馈相关配置）
└── api.js             # API接口封装（新增反馈相关接口）
```

## API接口

### 反馈相关接口
```javascript
// 获取反馈列表
const response = await api.feedback.getList(params);

// 获取反馈详情
const response = await api.feedback.getDetail(id);
```

### 留言相关接口
```javascript
// 获取留言列表
const response = await api.message.getList(params);

// 提交留言
const response = await api.message.submit(data);
```

## 页面功能

### 1. Tab切换
- 使用TDesign的`t-tabs`和`t-tab-panel`组件
- 支持留言和反馈两个标签页
- 切换时自动加载对应数据

### 2. 留言板块
- 顶部显示留言表单，包含标题和内容输入
- 下方显示留言列表，包含标题、内容、时间、阅读量等信息
- 表单验证和提交功能
- 下拉刷新和上拉加载更多
- 空状态和加载状态处理

### 3. 反馈板块
- 显示用户反馈记录列表
- 反馈类型图标和状态标签
- 支持点击查看反馈详情（弹窗形式）
- 下拉刷新和上拉加载更多
- 空状态和加载状态处理

### 4. 反馈详情弹窗
- 显示反馈的完整内容
- 反馈类型和状态标签
- 创建时间显示
- 关闭按钮

## 数据结构

### 留言数据结构
```javascript
{
  id: "留言ID",
  title: "留言标题",
  content: "留言内容",
  image: "图片URL",
  views: 阅读量,
  createdAt: "创建时间"
}
```

### 反馈数据结构
```javascript
{
  id: "反馈ID",
  type: "反馈类型", // bug, suggestion, other
  content: "反馈内容",
  status: "处理状态", // pending, processing, completed
  createdAt: "创建时间"
}
```

## 样式设计

### 1. 整体布局
- 使用TDesign的Tab组件
- 统一的卡片式设计
- 响应式布局

### 2. 留言列表
- 卡片式布局
- 标题、时间、内容分层显示
- 图片和阅读量信息
- 点击效果和阴影

### 3. 反馈列表
- 卡片式布局
- 类型图标和状态标签
- 时间显示
- 点击效果

### 4. 反馈表单
- 弹窗形式
- 类型选择按钮
- 文本域和输入框
- 字符计数显示

## 交互体验

### 1. 加载状态
- 首次加载显示loading
- 下拉刷新显示loading
- 上拉加载更多显示loading

### 2. 空状态
- 留言为空时显示空状态
- 反馈为空时显示空状态
- 提供刷新或提交反馈的快捷操作

### 3. 反馈提交
- 表单验证
- 提交中loading状态
- 成功/失败提示
- 提交成功后刷新列表

## 更新内容

### 1. 新增文件
- `pages/feedback/feedback.js` - 页面逻辑
- `pages/feedback/feedback.wxml` - 页面结构
- `pages/feedback/feedback.wxss` - 页面样式
- `pages/feedback/feedback.json` - 页面配置

### 2. 修改文件
- `app.json` - 添加新页面路由
- `utils/config.js` - 添加反馈API配置
- `utils/api.js` - 添加反馈API接口
- `pages/profile/profile.js` - 移除弹窗逻辑，改为页面跳转
- `pages/profile/profile.wxml` - 移除弹窗结构
- `pages/profile/profile.wxss` - 移除弹窗样式

### 3. 移除功能
- 原有的留言反馈弹窗
- 弹窗相关的数据和方法
- 弹窗相关的样式

## 使用示例

### 1. 页面跳转
```javascript
// 从profile页面跳转到留言反馈页面
onFeedback() {
  wx.navigateTo({
    url: '/pages/feedback/feedback'
  });
}
```

### 2. 获取留言列表
```javascript
async loadMessages(refresh = false) {
  const params = {
    page: refresh ? 1 : this.data.messagePage,
    limit: this.data.messageLimit
  };
  
  const response = await api.message.getList(params);
  // 处理响应数据
}
```

### 3. 提交反馈
```javascript
async submitFeedback() {
  const data = {
    type: this.data.feedbackType,
    content: this.data.feedbackContent,
    contact: this.data.contactInfo
  };
  
  const response = await api.feedback.submit(data);
  // 处理响应
}
```

## 注意事项

1. **API接口**: 需要后端提供对应的反馈相关接口
2. **权限控制**: 反馈列表只显示当前用户的反馈记录
3. **数据缓存**: 可以考虑对留言列表进行缓存优化
4. **错误处理**: 完善的错误处理和用户提示
5. **性能优化**: 分页加载避免一次性加载过多数据

## 总结

新的留言反馈页面实现了以下改进：

1. **更好的用户体验**: 独立的页面提供更大的操作空间
2. **功能分离**: 留言和反馈功能清晰分离
3. **更丰富的功能**: 支持查看反馈记录和状态
4. **更好的交互**: Tab切换、下拉刷新、分页加载等
5. **更清晰的代码结构**: 功能模块化，便于维护

该实现遵循了微信小程序的最佳实践，提供了良好的用户体验和代码可维护性。 