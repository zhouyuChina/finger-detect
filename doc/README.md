# 微信小程序接口文档索引

## 概述

本目录包含微信小程序与后端 API 对接的所有接口文档和开发指南。

## 文档列表

### 📋 API 接口文档

#### 1. [Profile 页面 API 接口文档](./PROFILE_API_DOCUMENTATION.md)
- **用途**：Profile 页面的用户信息和统计数据接口
- **接口**：
  - `GET /api/user/profile` - 获取用户基本信息
  - `GET /api/user/stats` - 获取用户统计信息
- **状态**：✅ 已完成

#### 2. [小程序自动注册接口文档](./MINIPROGRAM_REGISTER_API.md)
- **用途**：用户进入小程序时的自动注册接口
- **接口**：`POST /api/miniprogram/register`
- **状态**：✅ 已完成

#### 3. [Banner API 格式文档](./BANNER_API_FORMAT.md)
- **用途**：首页轮播图接口格式说明
- **接口**：`GET /api/miniprogram/banners`
- **状态**：✅ 已完成

### 🔧 开发指南

#### 4. [Next.js 后端集成指南](./NEXTJS_API_GUIDE.md)
- **用途**：微信小程序与 Next.js 后端集成的完整指南
- **内容**：
  - CORS 配置
  - API 路由结构
  - 认证机制
  - 部署说明
- **状态**：✅ 已完成

#### 5. [开发者工具已知问题](./DEVELOPER_TOOLS_KNOWN_ISSUES.md)
- **用途**：微信开发者工具的常见问题和解决方案
- **内容**：
  - AB Test API 警告
  - 开发环境配置
  - 调试技巧
- **状态**：✅ 已完成

## 接口状态总览

| 页面 | 接口 | 状态 | 文档 |
|------|------|------|------|
| 小程序启动 | 自动注册 | ✅ 已完成 | [注册 API](./MINIPROGRAM_REGISTER_API.md) |
| 首页 | Banner | ✅ 已完成 | [Banner API](./BANNER_API_FORMAT.md) |
| 首页 | 消息列表 | ✅ 已完成 | 待补充 |
| 首页 | 消息已读 | ✅ 已完成 | 待补充 |
| Profile | 用户信息 | ✅ 已完成 | [Profile API](./PROFILE_API_DOCUMENTATION.md) |
| Profile | 统计数据 | ✅ 已完成 | [Profile API](./PROFILE_API_DOCUMENTATION.md) |

## 开发规范

### 接口响应格式
```json
{
  "code": 200,
  "message": "操作成功",
  "data": {
    // 具体数据
  }
}
```

### 错误码规范
- `200`: 成功
- `400`: 请求参数错误
- `401`: 未授权
- `403`: 禁止访问
- `404`: 资源不存在
- `500`: 服务器内部错误

### 认证机制
- 使用 JWT Bearer Token
- Token 通过 `Authorization: Bearer <token>` 头部传递
- Token 自动刷新机制

## 快速开始

1. **查看接口文档**：根据页面需求查看对应的 API 文档
2. **后端实现**：按照文档格式实现对应的接口
3. **前端对接**：使用 `utils/api.js` 中的方法调用接口
4. **测试验证**：使用文档中的 curl 命令测试接口

## 注意事项

1. **环境配置**：开发和生产环境使用不同的 API 地址
2. **错误处理**：前端已实现统一的错误处理机制
3. **数据兼容**：支持多种字段名称，提高接口灵活性
4. **性能优化**：建议对统计类接口使用缓存

## 更新日志

- **2024-01-XX**: 创建文档结构，整理 Profile 页面接口
- **2024-01-XX**: 添加 Banner 接口文档
- **2024-01-XX**: 添加 Next.js 集成指南
- **2024-01-XX**: 添加开发者工具问题说明

---

如有问题，请查看对应的详细文档或联系开发团队。 