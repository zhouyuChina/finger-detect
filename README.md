# 健康检测小程序

## 项目结构

```
finger-detect/
├── app.js                 # 应用入口文件
├── app.json              # 应用配置文件
├── app.wxss              # 应用全局样式
├── utils/                # 工具类目录
│   ├── config.js         # API配置文件
│   ├── request.js        # HTTP请求工具类
│   ├── api.js           # API接口封装
│   ├── storage.js       # 本地存储工具类
│   ├── common.js        # 通用工具方法
│   └── util.js          # 原有工具方法
├── pages/               # 页面目录
│   ├── index/           # 首页
│   ├── about/           # 关于页面
│   ├── create-profile/  # 创建档案页面
│   ├── detection-result/ # 检测结果页面
│   ├── message/         # 消息页面
│   ├── message-detail/  # 消息详情页面
│   ├── my-coupons/      # 我的优惠券页面
│   ├── my-profile/      # 我的档案页面
│   ├── photo-detection/ # 拍照检测页面
│   ├── profile/         # 档案页面
│   ├── record-gallery/  # 记录画廊页面
│   ├── records/         # 记录页面
│   ├── records-compare/ # 记录对比页面
│   ├── system-messages/ # 系统消息页面
│   └── user-records/    # 用户记录页面
└── images/              # 图片资源目录
```

## 通用方法使用说明

### 1. 配置文件 (config.js)

统一管理API地址、环境配置、错误码等。

```javascript
const config = require('../../utils/config.js')

// 获取当前环境配置
const currentConfig = config.getCurrentConfig()

// 获取API地址
const loginUrl = config.api.user.login

// 获取错误信息
const errorMsg = config.errorMessages[401]
```

### 2. HTTP请求工具 (request.js)

统一处理网络请求、错误处理、重试机制、token刷新等。

```javascript
const request = require('../../utils/request.js')

// GET请求
request.get('/api/user/profile')

// POST请求
request.post('/api/user/login', { username: 'test', password: '123456' })

// 文件上传
request.upload(filePath, {
  url: '/api/upload',
  formData: { type: 'avatar' }
})
```

### 3. API接口封装 (api.js)

统一管理所有API调用，按模块分类。

```javascript
const api = require('../../utils/api.js')

// 用户相关API
api.user.login({ username: 'test', password: '123456' })
api.user.getProfile()
api.user.updateProfile({ name: '张三' })

// 检测相关API
api.detection.create({ type: 'finger' })
api.detection.upload(filePath, { type: 'finger' })
api.detection.getResult(id)

// 消息相关API
api.message.getList({ limit: 10 })
api.message.markRead(id)
api.message.markAllRead()

// 系统相关API
api.system.getBanner()
api.system.getConfig()
```

### 4. 本地存储工具 (storage.js)

统一管理缓存和本地数据存储，支持过期时间。

```javascript
const storage = require('../../utils/storage.js')

// 设置缓存（带过期时间）
storage.set('userInfo', userInfo, 24 * 60 * 60 * 1000) // 24小时

// 获取缓存
const userInfo = storage.get('userInfo')

// 用户相关缓存方法
storage.setUserInfo(userInfo)
storage.getUserInfo()
storage.setToken(token)
storage.getToken()
storage.isLoggedIn()
storage.clearUserData()
```

### 5. 通用工具方法 (common.js)

提供常用的工具函数。

```javascript
const common = require('../../utils/common.js')

// 时间格式化
common.formatTime(new Date(), 'YYYY-MM-DD HH:mm:ss')

// 验证方法
common.validatePhone('13800138000')
common.validateEmail('test@example.com')

// 提示方法
common.showSuccess('操作成功')
common.showError('操作失败')
common.showLoading('加载中...')
common.hideLoading()

// 对话框
const confirmed = await common.showConfirm('确认', '确定要删除吗？')
const tapIndex = await common.showActionSheet(['选项1', '选项2'])

// 文件操作
const images = await common.chooseImage(1, ['compressed'], ['album', 'camera'])
common.previewImage(['url1', 'url2'], 'url1')
```

## 在页面中使用

### 基本使用

```javascript
// pages/example/example.js
const api = require('../../utils/api.js')
const storage = require('../../utils/storage.js')
const common = require('../../utils/common.js')

Page({
  data: {
    userInfo: null,
    loading: false
  },

  onLoad() {
    this.loadUserInfo()
  },

  async loadUserInfo() {
    try {
      this.setData({ loading: true })
      
      // 从缓存获取
      let userInfo = storage.getUserInfo()
      
      if (!userInfo) {
        // 从服务器获取
        const response = await api.user.getProfile()
        userInfo = response.data
        storage.setUserInfo(userInfo)
      }
      
      this.setData({ userInfo })
    } catch (error) {
      console.error('加载用户信息失败:', error)
      common.showError('加载失败')
    } finally {
      this.setData({ loading: false })
    }
  },

  async updateUserInfo() {
    try {
      const response = await api.user.updateProfile({
        name: '新名字',
        phone: '13800138000'
      })
      
      common.showSuccess('更新成功')
      this.loadUserInfo() // 重新加载
    } catch (error) {
      console.error('更新用户信息失败:', error)
      common.showError('更新失败')
    }
  }
})
```

### 错误处理

```javascript
// 统一错误处理
try {
  const response = await api.user.login(loginData)
  // 处理成功响应
} catch (error) {
  // 错误已经在request.js中统一处理
  // 这里可以添加额外的错误处理逻辑
  console.error('登录失败:', error)
}
```

### 缓存策略

```javascript
// 先检查缓存，缓存不存在或过期时从服务器获取
async loadData() {
  let data = storage.get('cacheKey')
  
  if (!data) {
    const response = await api.getData()
    data = response.data
    storage.set('cacheKey', data, 60 * 60 * 1000) // 1小时过期
  }
  
  this.setData({ data })
}
```

## 环境配置

在 `utils/config.js` 中配置不同环境的API地址：

```javascript
const config = {
  env: {
    development: {
      baseUrl: 'http://localhost:3000/api',
      uploadUrl: 'http://localhost:3000/upload'
    },
    production: {
      baseUrl: 'https://your-production-domain.com/api',
      uploadUrl: 'https://your-production-domain.com/upload'
    }
  },
  currentEnv: 'development' // 切换环境
}
```

## 注意事项

1. **错误处理**: 所有API请求都有统一的错误处理，包括网络错误、服务器错误、token过期等。

2. **缓存策略**: 合理使用缓存可以减少网络请求，提升用户体验。

3. **登录状态**: 使用 `storage.isLoggedIn()` 检查登录状态，使用 `storage.getToken()` 获取token。

4. **文件上传**: 使用 `api.detection.upload()` 上传文件，支持进度回调。

5. **网络检查**: 在关键操作前使用 `common.checkNetwork()` 检查网络状态。

6. **防抖节流**: 对于频繁触发的事件，使用 `common.debounce()` 和 `common.throttle()` 优化性能。

## 扩展开发

当需要添加新的API接口时：

1. 在 `config.js` 中添加API地址
2. 在 `api.js` 中添加对应的接口方法
3. 在页面中调用新的API方法

这样可以保持代码的一致性和可维护性。 