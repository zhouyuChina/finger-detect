# 新闻接口更新文档

## 接口变更概述

根据后端接口变更，更新了新闻相关的接口实现，主要包括：

1. **获取阅读状态** - 改为POST请求，使用articleIds数组
2. **标记单个已读** - 使用articleId参数
3. **一键已读** - 新增接口，标记所有文章为已读
4. **未读数量** - 新增接口，获取未读文章统计
5. **请求头** - 新增X-Openid头部

## 接口详情

### 1. 获取阅读状态

**接口路径**: `POST /api/miniprogram/news/read`

**请求头**:
```
Content-Type: application/json
X-Openid: {openid}
```

**请求体**:
```json
{
  "articleIds": ["cmdvcvv7l0006pl21rjj362tk", "cmdvcvv7l0006pl21rjj362tl"]
}
```

**响应格式**:
```json
{
  "success": true,
  "data": [
    {
      "articleId": "cmdvcvv7l0006pl21rjj362tk",
      "isRead": true,
      "readAt": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

### 2. 标记单个已读

**接口路径**: `POST /api/miniprogram/news/read`

**请求头**:
```
Content-Type: application/json
X-Openid: {openid}
```

**请求体**:
```json
{
  "articleId": "cmdvcvv7l0006pl21rjj362tk"
}
```

**响应格式**:
```json
{
  "success": true,
  "message": "标记成功"
}
```

### 3. 一键已读

**接口路径**: `POST /api/miniprogram/news/read-all`

**请求头**:
```
Content-Type: application/json
X-Openid: {openid}
```

**请求体**: 无

**响应格式**:
```json
{
  "success": true,
  "data": {
    "markedCount": 5,
    "totalArticles": 5,
    "message": "成功标记 5 篇文章为已读"
  }
}
```

### 4. 未读数量

**接口路径**: `GET /api/miniprogram/news/unread-count`

**请求头**:
```
X-Openid: {openid}
```

**响应格式**:
```json
{
  "success": true,
  "data": {
    "unreadCount": 3,
    "totalArticles": 5,
    "readArticles": 2
  }
}
```

## 前端实现更新

### 1. 配置文件更新 (utils/config.js)

```javascript
// 消息相关
message: {
  list: '/miniprogram/news',
  detail: '/message/detail',
  markRead: '/message/mark-read',
  markAllRead: '/miniprogram/news/read-all', // 一键已读
  delete: '/message/delete',
  unreadCount: '/miniprogram/news/unread-count', // 未读数量
  getReadStatus: '/miniprogram/news/read', // 获取阅读状态
  markArticleRead: '/miniprogram/news/read' // 标记单个已读
}
```

### 2. API方法更新 (utils/api.js)

```javascript
// 获取资讯阅读状态
getReadStatus(articleIds = []) {
  return request.post(config.api.message.getReadStatus, { articleIds })
},

// 标记单个资讯已读
markArticleRead(articleId) {
  return request.post(config.api.message.markArticleRead, { articleId })
},

// 一键标记所有已读
markAllRead() {
  return request.post(config.api.message.markAllRead)
},

// 获取未读数量
getUnreadCount() {
  return request.get(config.api.message.unreadCount)
}
```

### 3. 请求头更新 (utils/request.js)

```javascript
getHeaders() {
  const headers = {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest'
  }

  // 添加token
  const token = storage.getToken()
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  // 添加openId
  const openId = storage.getOpenId()
  if (openId) {
    headers['X-Openid'] = openId
  }

  return headers
}
```

### 4. 页面功能更新 (pages/index/index.js)

#### 一键已读功能
```javascript
async markAllAsRead() {
  try {
    const unreadMessages = this.data.messages.filter(msg => !msg.isRead)
    
    if (unreadMessages.length === 0) {
      common.showSuccess('没有未读消息')
      return
    }

    // 调用一键已读接口
    const response = await api.message.markAllRead()
    
    if (response.success && response.data) {
      const { markedCount, totalArticles, message } = response.data
      
      // 更新本地状态
      const messages = this.data.messages.map(msg => ({
        ...msg,
        isRead: true,
        readAt: msg.readAt || new Date().toISOString()
      }))
      
      this.setData({ messages })
      this.calculateUnreadCount()
      storage.setMessages(messages)
      
      common.showSuccess(message || `已标记 ${markedCount} 条消息为已读`)
    }
  } catch (error) {
    console.error('全部标记已读失败:', error)
    common.showError('标记已读失败')
  }
}
```

#### 未读数量获取
```javascript
async fetchUnreadCount() {
  try {
    const response = await api.message.getUnreadCount()
    
    if (response.success && response.data) {
      const { unreadCount, totalArticles, readArticles } = response.data
      this.setData({ 
        unreadCount: unreadCount || 0,
        totalArticles: totalArticles || 0,
        readArticles: readArticles || 0
      })
    }
  } catch (error) {
    console.warn('获取未读数量失败，使用本地计算:', error)
    this.calculateUnreadCount()
  }
}
```

## 使用场景

### 1. 页面初始化
- 加载消息列表
- 获取阅读状态
- 获取未读数量统计

### 2. 用户交互
- 点击消息：标记单个已读
- 一键已读：批量标记所有未读消息
- 下拉刷新：重新获取所有数据

### 3. 数据同步
- 本地状态与服务器状态保持一致
- 实时更新未读数量
- 缓存机制保证性能

## 注意事项

1. **X-Openid头部**: 所有新闻相关接口都需要在请求头中包含X-Openid
2. **错误处理**: 接口失败时使用本地计算作为备选方案
3. **数据一致性**: 确保本地状态与服务器状态同步
4. **性能优化**: 使用并行请求提高加载速度

## 测试建议

1. **正常流程测试**:
   - 页面加载时获取未读数量
   - 点击消息标记已读
   - 一键标记所有已读

2. **异常情况测试**:
   - 网络异常时的降级处理
   - 接口返回错误时的用户提示
   - 数据格式异常时的容错处理

3. **性能测试**:
   - 大量消息时的加载性能
   - 频繁操作时的响应速度
   - 内存使用情况 