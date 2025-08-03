# 新闻阅读接口问题分析

## 当前问题

根据后端返回的错误信息：
```
{"success":false,"data":null,"message":"缺少articleIds参数，请提供要查询的文章ID列表（用逗号分隔）","code":400}
```

## 接口配置现状

当前配置中，两个不同的功能指向同一个接口：
```javascript
// utils/config.js
message: {
  getReadStatus: '/miniprogram/news/read',    // 获取阅读状态
  markArticleRead: '/miniprogram/news/read'   // 标记已读
}
```

## 问题分析

### 1. 参数格式问题
- **后端期望**: `articleIds` (用逗号分隔的字符串)
- **前端当前**: `articleId` (单个ID)

### 2. 接口功能混淆
- **getReadStatus**: 应该获取阅读状态 (GET请求)
- **markArticleRead**: 应该标记已读 (POST请求)

## 需要确认的后端接口设计

### 方案1: 单一接口，通过HTTP方法区分
```
GET  /api/miniprogram/news/read?articleIds=1,2,3    // 获取阅读状态
POST /api/miniprogram/news/read                      // 标记已读
```

### 方案2: 分离接口
```
GET  /api/miniprogram/news/read-status?articleIds=1,2,3  // 获取阅读状态
POST /api/miniprogram/news/mark-read                      // 标记已读
```

## 当前修改

已修改 `markArticleRead` 方法使用正确的参数格式：
```javascript
// 修改前
markArticleRead(articleId) {
  return request.post(config.api.message.markArticleRead, { articleId })
}

// 修改后
markArticleRead(articleId) {
  return request.post(config.api.message.markArticleRead, { articleIds: articleId.toString() })
}
```

## 需要后端确认的问题

1. **接口路径**: 是否需要分离 `getReadStatus` 和 `markArticleRead` 的接口路径？
2. **参数格式**: 
   - `getReadStatus`: 是否使用 `articleIds` 查询参数？
   - `markArticleRead`: 是否使用 `articleIds` 请求体参数？
3. **响应格式**: 两个接口的响应格式是否一致？

## 建议的接口设计

### 获取阅读状态 (GET)
```
GET /api/miniprogram/news/read-status?articleIds=1,2,3
```

**响应格式:**
```json
{
  "code": 200,
  "success": true,
  "data": [
    {
      "articleId": 1,
      "isRead": true,
      "readAt": "2024-01-15T10:30:00.000Z"
    },
    {
      "articleId": 2,
      "isRead": false,
      "readAt": null
    }
  ]
}
```

### 标记已读 (POST)
```
POST /api/miniprogram/news/mark-read
```

**请求体:**
```json
{
  "articleIds": "1,2,3"
}
```

**响应格式:**
```json
{
  "code": 200,
  "success": true,
  "message": "标记成功",
  "data": {
    "markedCount": 3,
    "articleIds": [1, 2, 3]
  }
}
```

## 下一步行动

1. **确认后端接口设计** - 需要后端开发者确认接口路径和参数格式
2. **更新前端配置** - 根据后端确认的设计更新 `config.js`
3. **测试接口** - 验证修改后的接口是否正常工作 