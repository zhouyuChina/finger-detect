// API配置文件
const config = {
  // 环境配置
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

  // 当前环境
  currentEnv: 'development',

  // 获取当前环境配置
  getCurrentConfig() {
    return this.env[this.currentEnv] || this.env.development
  },

  // API接口地址
  api: {
    // 用户相关
    user: {
      login: '/user/login',
      register: '/user/register',
      profile: '/user/profile',
      updateProfile: '/user/profile/update',
      logout: '/user/logout'
    },

    // 检测相关
    detection: {
      create: '/detection/create',
      upload: '/detection/upload',
      result: '/detection/result',
      history: '/detection/history',
      compare: '/detection/compare',
      delete: '/detection/delete'
    },

    // 消息相关
    message: {
      list: '/message/list',
      detail: '/message/detail',
      markRead: '/message/mark-read',
      markAllRead: '/message/mark-all-read',
      delete: '/message/delete'
    },

    // 优惠券相关
    coupon: {
      list: '/coupon/list',
      use: '/coupon/use',
      receive: '/coupon/receive'
    },

    // 系统相关
    system: {
      banner: '/system/banner',
      config: '/system/config',
      version: '/system/version'
    }
  },

  // 请求超时时间
  timeout: 10000,

  // 请求重试次数
  retryCount: 3,

  // 文件上传配置
  upload: {
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/jpg'],
    quality: 0.8
  },

  // 缓存配置
  cache: {
    // 缓存过期时间（毫秒）
    expireTime: {
      userInfo: 24 * 60 * 60 * 1000, // 24小时
      banner: 60 * 60 * 1000, // 1小时
      config: 24 * 60 * 60 * 1000, // 24小时
      message: 5 * 60 * 1000 // 5分钟
    }
  },

  // 错误码配置
  errorCodes: {
    SUCCESS: 200,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    SERVER_ERROR: 500,
    NETWORK_ERROR: -1,
    TIMEOUT_ERROR: -2
  },

  // 错误信息
  errorMessages: {
    401: '登录已过期，请重新登录',
    403: '没有权限访问',
    404: '请求的资源不存在',
    500: '服务器内部错误',
    '-1': '网络连接失败',
    '-2': '请求超时',
    'default': '操作失败，请稍后重试'
  }
}

module.exports = config 