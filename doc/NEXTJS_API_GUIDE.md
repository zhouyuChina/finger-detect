# Next.js后台接口对接指南

## 📋 概述

微信小程序可以直接调用Next.js管理后台的API接口，但需要正确配置域名白名单和CORS设置。

## 🔧 Next.js后台配置

### 1. 域名白名单配置

在微信小程序管理后台配置合法域名：

**开发环境：**
- `http://localhost:3001`

**生产环境：**
- `https://your-production-domain.com`

### 2. Next.js CORS配置

在Next.js项目中安装并配置CORS：

```bash
npm install cors
```

**pages/api/_middleware.js** 或 **middleware.js**：
```javascript
import Cors from 'cors'

const cors = Cors({
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
  origin: [
    'http://localhost:3001',
    'https://your-production-domain.com',
    // 微信小程序开发工具域名
    'https://servicewechat.com'
  ]
})

export default function handler(req, res) {
  return new Promise((resolve, reject) => {
    cors(req, res, (result) => {
      if (result instanceof Error) {
        return reject(result)
      }
      return resolve(result)
    })
  })
}
```

### 3. API路由结构

建议的Next.js API路由结构：

```
pages/api/
├── auth/
│   ├── login.js
│   ├── register.js
│   ├── logout.js
│   ├── refresh.js
│   └── wx-login.js
├── user/
│   └── profile.js
├── detection/
│   ├── create.js
│   ├── upload.js
│   ├── result.js
│   ├── history.js
│   ├── compare.js
│   ├── delete.js
│   └── analyze.js
├── message/
│   ├── list.js
│   ├── detail.js
│   ├── mark-read.js
│   ├── mark-all-read.js
│   ├── delete.js
│   └── unread-count.js
├── coupon/
│   ├── list.js
│   ├── use.js
│   ├── receive.js
│   └── my-coupons.js
├── system/
│   ├── banner.js
│   ├── config.js
│   ├── version.js
│   └── health.js
├── profile/
│   ├── list.js
│   ├── create.js
│   ├── update.js
│   ├── delete.js
│   └── detail.js
├── record/
│   ├── list.js
│   ├── create.js
│   ├── update.js
│   ├── delete.js
│   ├── detail.js
│   └── compare.js
└── upload.js
```

## 📝 API接口规范

### 统一响应格式

```javascript
// 成功响应
{
  "code": 200,
  "message": "操作成功",
  "data": {
    // 具体数据
  }
}

// 错误响应
{
  "code": 400,
  "message": "请求参数错误",
  "data": null
}
```

### 示例API实现

**pages/api/auth/login.js**：
```javascript
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      code: 405,
      message: '方法不允许',
      data: null
    })
  }

  try {
    const { username, password } = req.body

    // 验证逻辑
    if (!username || !password) {
      return res.status(400).json({
        code: 400,
        message: '用户名和密码不能为空',
        data: null
      })
    }

    // 登录逻辑
    const user = await loginUser(username, password)
    
    if (!user) {
      return res.status(401).json({
        code: 401,
        message: '用户名或密码错误',
        data: null
      })
    }

    // 生成token
    const token = generateToken(user)
    const refreshToken = generateRefreshToken(user)

    res.status(200).json({
      code: 200,
      message: '登录成功',
      data: {
        user: {
          id: user.id,
          username: user.username,
          name: user.name,
          avatar: user.avatar
        },
        token,
        refreshToken
      }
    })
  } catch (error) {
    console.error('登录失败:', error)
    res.status(500).json({
      code: 500,
      message: '服务器内部错误',
      data: null
    })
  }
}
```

**pages/api/detection/upload.js**：
```javascript
import formidable from 'formidable'
import fs from 'fs'

export const config = {
  api: {
    bodyParser: false,
  },
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      code: 405,
      message: '方法不允许',
      data: null
    })
  }

  try {
    const form = new formidable.IncomingForm()
    form.uploadDir = './public/uploads'
    form.keepExtensions = true

    form.parse(req, async (err, fields, files) => {
      if (err) {
        return res.status(400).json({
          code: 400,
          message: '文件上传失败',
          data: null
        })
      }

      const file = files.file
      const filePath = file.filepath
      const fileName = file.originalFilename

      // 处理文件逻辑
      const result = await processUploadedFile(filePath, fileName, fields)

      res.status(200).json({
        code: 200,
        message: '上传成功',
        data: {
          fileUrl: `/uploads/${fileName}`,
          filePath,
          result
        }
      })
    })
  } catch (error) {
    console.error('文件上传失败:', error)
    res.status(500).json({
      code: 500,
      message: '服务器内部错误',
      data: null
    })
  }
}
```

## 🔐 认证机制

### JWT Token认证

```javascript
// middleware/auth.js
import jwt from 'jsonwebtoken'

export function verifyToken(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '')

  if (!token) {
    return res.status(401).json({
      code: 401,
      message: '未提供认证token',
      data: null
    })
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.user = decoded
    next()
  } catch (error) {
    return res.status(401).json({
      code: 401,
      message: 'token无效或已过期',
      data: null
    })
  }
}
```

### 使用中间件

```javascript
// pages/api/user/profile.js
import { verifyToken } from '../../../middleware/auth'

export default async function handler(req, res) {
  // 验证token
  verifyToken(req, res, async () => {
    try {
      const userId = req.user.id
      const user = await getUserById(userId)

      res.status(200).json({
        code: 200,
        message: '获取成功',
        data: user
      })
    } catch (error) {
      res.status(500).json({
        code: 500,
        message: '服务器内部错误',
        data: null
      })
    }
  })
}
```

## 🚀 部署注意事项

### 1. 环境变量配置

```bash
# .env.local
JWT_SECRET=your-jwt-secret
DATABASE_URL=your-database-url
NEXTAUTH_SECRET=your-nextauth-secret
NEXTAUTH_URL=http://localhost:3001
```

### 2. 生产环境配置

```javascript
// next.config.js
module.exports = {
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,DELETE,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
        ],
      },
    ]
  },
}
```

### 3. 微信小程序配置

在微信小程序管理后台：
1. 开发 → 开发管理 → 开发设置
2. 服务器域名 → request合法域名
3. 添加您的生产域名

## 🧪 测试接口

### 健康检查接口

```javascript
// pages/api/system/health.js
export default function handler(req, res) {
  res.status(200).json({
    code: 200,
    message: '服务正常',
    data: {
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      environment: process.env.NODE_ENV
    }
  })
}
```

### 测试命令

```bash
# 测试健康检查
curl http://localhost:3001/api/system/health

# 测试登录接口
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"123456"}'
```

## 📱 小程序调用示例

```javascript
// 在小程序中使用
const api = require('../../utils/api.js')

// 登录
try {
  const response = await api.user.login({
    username: 'test',
    password: '123456'
  })
  console.log('登录成功:', response.data)
} catch (error) {
  console.error('登录失败:', error)
}

// 上传文件
try {
  const response = await api.detection.upload(filePath, {
    type: 'finger',
    userId: '123'
  })
  console.log('上传成功:', response.data)
} catch (error) {
  console.error('上传失败:', error)
}
```

## 🔧 常见问题

### 1. 跨域问题
确保Next.js正确配置了CORS，并且微信小程序后台添加了合法域名。

### 2. 文件上传失败
检查文件大小限制和上传目录权限。

### 3. Token过期
实现token自动刷新机制。

### 4. 网络超时
适当调整请求超时时间，建议15-30秒。

## 📞 技术支持

如果遇到问题，请检查：
1. 网络连接是否正常
2. Next.js服务是否启动
3. 域名配置是否正确
4. API接口是否正常响应 