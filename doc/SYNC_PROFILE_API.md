# 同步用户信息接口文档

## 接口概述

**接口路径：** `POST /api/miniprogram/profile/sync`

**接口用途：** 在用户授权的情况下，获取用户的完整信息并同步到后端数据库

**调用时机：** 用户通过 `wx.getUserProfile` 授权获取真实信息后调用

## 请求参数

### 请求头
```
Content-Type: application/json
Authorization: Bearer {token}  // 可选，如果后端需要验证
```

### 请求体
```json
{
  "nickName": "用户昵称",
  "avatarUrl": "头像URL",
  "gender": 0,  // 性别：0-未知，1-男，2-女
  "country": "国家",
  "province": "省份",
  "city": "城市",
  "language": "语言"
}
```

## 响应格式

### 成功响应
```json
{
  "code": 200,
  "success": true,
  "message": "用户信息同步成功",
  "data": {
    "userId": "用户ID",
    "updatedAt": "2024-01-15T10:30:00.000Z",
    "profile": {
      "nickName": "用户昵称",
      "avatarUrl": "头像URL",
      "gender": 0,
      "country": "国家",
      "province": "省份",
      "city": "城市"
    }
  }
}
```

### 错误响应
```json
{
  "code": 400,
  "success": false,
  "message": "参数错误",
  "error": "具体错误信息"
}
```

## 使用场景

### 1. 用户首次授权
- 用户点击"立即授权"按钮
- 通过 `wx.getUserProfile` 获取真实信息
- 调用注册接口创建用户
- 调用同步接口更新完整信息

### 2. 用户信息更新
- 用户主动更新个人信息
- 调用同步接口更新后端数据

### 3. 数据一致性
- 确保前端显示的用户信息与后端数据库一致
- 提供更准确的用户画像

## 实现逻辑

### 后端处理流程
1. 验证请求参数
2. 根据 openId 查找用户
3. 更新用户信息字段
4. 记录更新时间
5. 返回更新结果

### 前端调用示例
```javascript
// 在授权页面中调用
if (userInfo && userInfo.nickName !== '微信用户') {
  try {
    const syncResponse = await api.user.syncProfile(userInfo)
    console.log('同步用户信息成功:', syncResponse.data)
  } catch (error) {
    console.warn('同步用户信息失败:', error)
  }
}
```

## 注意事项

1. **调用时机**：只有在用户提供真实信息时才调用
2. **错误处理**：同步失败不应影响用户正常使用
3. **数据验证**：后端需要验证用户信息的有效性
4. **权限控制**：确保只有授权用户才能调用此接口

## 数据库表结构建议

```sql
-- 用户信息表
CREATE TABLE user_profiles (
  id INT PRIMARY KEY AUTO_INCREMENT,
  open_id VARCHAR(100) UNIQUE NOT NULL,
  nick_name VARCHAR(100),
  avatar_url TEXT,
  gender TINYINT DEFAULT 0,
  country VARCHAR(50),
  province VARCHAR(50),
  city VARCHAR(50),
  language VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_open_id (open_id)
);
```

## 测试用例

### 测试数据
```json
{
  "nickName": "张三",
  "avatarUrl": "https://example.com/avatar.jpg",
  "gender": 1,
  "country": "中国",
  "province": "广东省",
  "city": "深圳市",
  "language": "zh_CN"
}
```

### 预期结果
- 状态码：200
- 用户信息成功更新到数据库
- 返回更新后的用户信息 