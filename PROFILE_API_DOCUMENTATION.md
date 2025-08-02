# Profile 页面 API 接口文档

## 概述

Profile 页面需要两个核心接口来获取用户信息和统计数据。这些接口需要用户认证（Bearer Token）。

## 接口列表

### 1. 获取用户基本信息

**接口地址：** `GET /api/user/profile`

**请求头：**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**请求参数：** 无

**响应格式：**
```json
{
  "code": 200,
  "message": "获取用户信息成功",
  "data": {
    "id": 1,
    "name": "张三",
    "nickname": "小张",
    "username": "zhangsan",
    "phone": "13800138000",
    "avatar": "/uploads/avatar/user_1.jpg",
    "avatarUrl": "/uploads/avatar/user_1.jpg",
    "email": "zhangsan@example.com",
    "gender": "male",
    "birthday": "1990-01-01",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**字段说明：**
- `name`: 用户真实姓名（优先显示）
- `nickname`: 用户昵称（备选显示）
- `username`: 用户名（备选显示）
- `phone`: 手机号（用于脱敏显示）
- `avatar` / `avatarUrl`: 头像URL（支持相对路径）

**错误响应：**
```json
{
  "code": 401,
  "message": "未授权访问",
  "data": null
}
```

### 2. 获取用户统计信息

**接口地址：** `GET /api/user/stats`

**请求头：**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**请求参数：** 无

**响应格式：**
```json
{
  "code": 200,
  "message": "获取用户统计信息成功",
  "data": {
    "totalRecords": 15,
    "photoRecords": 15,
    "totalReports": 8,
    "reportRecords": 8,
    "familyMembers": 3,
    "profileRecords": 3,
    "totalDetections": 25,
    "detectionCount": 25,
    "unreadMessages": 2,
    "unreadCount": 2
  }
}
```

**字段说明：**
- `totalRecords` / `photoRecords`: 拍照记录总数
- `totalReports` / `reportRecords`: 报告记录总数
- `familyMembers` / `profileRecords`: 建档记录总数
- `totalDetections` / `detectionCount`: 总检测次数
- `unreadMessages` / `unreadCount`: 未读消息数量

**错误响应：**
```json
{
  "code": 401,
  "message": "未授权访问",
  "data": null
}
```

## 数据库表结构建议

### 用户表 (users)
```sql
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(50) COMMENT '真实姓名',
  nickname VARCHAR(50) COMMENT '昵称',
  username VARCHAR(50) UNIQUE COMMENT '用户名',
  phone VARCHAR(20) COMMENT '手机号',
  avatar VARCHAR(255) COMMENT '头像URL',
  email VARCHAR(100) COMMENT '邮箱',
  gender ENUM('male', 'female', 'other') COMMENT '性别',
  birthday DATE COMMENT '生日',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### 检测记录表 (detection_records)
```sql
CREATE TABLE detection_records (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  type ENUM('photo', 'report') DEFAULT 'photo',
  status ENUM('pending', 'processing', 'completed', 'failed') DEFAULT 'pending',
  result_data JSON COMMENT '检测结果数据',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### 用户档案表 (user_profiles)
```sql
CREATE TABLE user_profiles (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  name VARCHAR(50) COMMENT '档案姓名',
  relationship VARCHAR(20) COMMENT '与用户关系',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### 消息表 (messages)
```sql
CREATE TABLE messages (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  title VARCHAR(100) COMMENT '消息标题',
  content TEXT COMMENT '消息内容',
  type VARCHAR(20) COMMENT '消息类型',
  is_read BOOLEAN DEFAULT FALSE COMMENT '是否已读',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

## 统计查询示例

### 获取用户统计信息的 SQL 查询
```sql
SELECT 
  (SELECT COUNT(*) FROM detection_records WHERE user_id = ? AND type = 'photo') as totalRecords,
  (SELECT COUNT(*) FROM detection_records WHERE user_id = ? AND type = 'report') as totalReports,
  (SELECT COUNT(*) FROM user_profiles WHERE user_id = ?) as familyMembers,
  (SELECT COUNT(*) FROM detection_records WHERE user_id = ?) as totalDetections,
  (SELECT COUNT(*) FROM messages WHERE user_id = ? AND is_read = FALSE) as unreadMessages
FROM users WHERE id = ?;
```

## 实现注意事项

1. **认证机制**：两个接口都需要验证 JWT Token
2. **数据兼容性**：支持多种字段名称，提高接口灵活性
3. **错误处理**：返回标准的错误码和错误信息
4. **性能优化**：统计信息可以使用缓存，避免频繁查询
5. **数据安全**：手机号等敏感信息需要脱敏处理

## 测试用例

### 成功场景
```bash
# 获取用户信息
curl -X GET "http://localhost:3001/api/user/profile" \
  -H "Authorization: Bearer <valid_token>"

# 获取统计信息
curl -X GET "http://localhost:3001/api/user/stats" \
  -H "Authorization: Bearer <valid_token>"
```

### 失败场景
```bash
# 未授权访问
curl -X GET "http://localhost:3001/api/user/profile"

# Token 过期
curl -X GET "http://localhost:3001/api/user/profile" \
  -H "Authorization: Bearer <expired_token>"
```

## 前端适配说明

前端代码已经做好了数据兼容性处理，支持以下字段名称的任意组合：

- 用户姓名：`name`, `nickname`, `username`
- 头像：`avatar`, `avatarUrl`
- 拍照记录：`totalRecords`, `photoRecords`
- 报告记录：`totalReports`, `reportRecords`
- 建档记录：`familyMembers`, `profileRecords`
- 检测次数：`totalDetections`, `detectionCount`
- 未读消息：`unreadMessages`, `unreadCount`

这样设计可以确保前端能够正确显示数据，即使后端返回的字段名称略有不同。 