# 小程序自动注册 API 接口文档

## 概述

当用户首次进入微信小程序时，系统会自动调用注册接口，将用户信息存入数据库并创建会员账户。

**接口地址：** `POST /api/miniprogram/register`

## 请求格式

### 请求头
```
Content-Type: application/json
```

### 请求参数
```json
{
  "code": "微信登录临时凭证（5分钟有效期）",
  "userInfo": {
    "nickName": "用户昵称",
    "avatarUrl": "头像URL",
    "gender": 0,
    "country": "国家",
    "province": "省份",
    "city": "城市"
  },
  "systemInfo": {
    "platform": "平台",
    "system": "系统版本",
    "version": "微信版本",
    "SDKVersion": "SDK版本",
    "brand": "设备品牌",
    "model": "设备型号",
    "screenWidth": 屏幕宽度,
    "screenHeight": 屏幕高度,
    "windowWidth": 窗口宽度,
    "windowHeight": 窗口高度,
    "pixelRatio": 像素比,
    "language": "语言"
  },
  "registerTime": "注册时间",
  "appVersion": "应用版本"
}
```

**重要说明：**
- `code` 是微信登录临时凭证，不是 openId
- 后端需要使用 `code` 调用微信官方接口换取 openId
- openId 将在响应数据中返回给前端

## 响应格式

### 成功响应
```json
{
  "code": 200,
  "message": "注册成功",
  "data": {
    "userId": 123,
    "openId": "oWx123456789",
    "unionId": "oUx123456789",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "userInfo": {
      "id": 123,
      "nickName": "用户昵称",
      "avatarUrl": "/uploads/avatar/user_123.jpg",
      "gender": 1,
      "country": "中国",
      "province": "广东",
      "city": "深圳",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    },
    "isNewUser": true
  }
}
```

**前端处理：**
- `openId` 会自动保存到 localStorage，过期时间 7 天
- 可以通过 `getApp().getOpenId()` 获取
- 可以通过 `getApp().hasValidOpenId()` 检查是否有效

## 数据库表结构

### 用户表 (users)
```sql
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  open_id VARCHAR(100) UNIQUE NOT NULL COMMENT '微信openId',
  union_id VARCHAR(100) UNIQUE COMMENT '微信unionId',
  nick_name VARCHAR(100) COMMENT '用户昵称',
  avatar_url VARCHAR(500) COMMENT '头像URL',
  gender TINYINT DEFAULT 0 COMMENT '性别：0-未知，1-男，2-女',
  country VARCHAR(50) COMMENT '国家',
  province VARCHAR(50) COMMENT '省份',
  city VARCHAR(50) COMMENT '城市',
  phone VARCHAR(20) COMMENT '手机号',
  email VARCHAR(100) COMMENT '邮箱',
  status TINYINT DEFAULT 1 COMMENT '状态：0-禁用，1-正常',
  register_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '注册时间',
  last_login_time DATETIME COMMENT '最后登录时间',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

## 实现逻辑

1. **接收注册请求**：接收前端发送的 code 和用户信息
2. **微信登录验证**：使用 code 调用微信官方接口换取 openId 和 sessionKey
3. **用户查询**：根据 openId 查询用户是否存在
4. **用户创建/更新**：新用户插入，老用户更新信息
5. **Token 生成**：生成 JWT Token 返回给前端
6. **设备信息记录**：记录用户的设备信息

### 微信官方接口调用
```javascript
// 后端需要调用微信官方接口
const wxResult = await wx.code2Session({
  appid: 'your_app_id',
  secret: 'your_app_secret', 
  js_code: code,  // 前端传来的临时code
  grant_type: 'authorization_code'
})

// 从微信返回的数据中获取
const openId = wxResult.openid        // 用户唯一标识
const sessionKey = wxResult.session_key  // 会话密钥
const unionId = wxResult.unionid      // 跨应用标识（可选）
```

## 前端调用

```javascript
// 在 app.js 中自动调用
const response = await api.user.miniProgramRegister(registerData)
if (response.code === 200) {
  storage.setToken(response.data.token)
  storage.setUserInfo(response.data.userInfo)
}
``` 