// 环境配置 - 可以在这里切换环境
const ENV_CONFIG = {
  LOCAL: {
    baseUrl: 'localhost:4000',
    name: '本地环境'
  },
  TEST: {
    baseUrl: 'test.yiloud.com',
    name: '测试环境'
  },
  PRODUCTION: {
    baseUrl: 'nail.yiloud.com',
    name: '生产环境'
  }
}

// 当前使用的环境 - 修改这里来切换环境
const CURRENT_ENV = 'PRODUCTION' // 可选: 'LOCAL', 'TEST', 'PRODUCTION'

const baseUrl = ENV_CONFIG[CURRENT_ENV].baseUrl

// API配置文件
const config = {
  // 环境配置
  env: {
    development: {
      baseUrl: `https://${baseUrl}/api`,
      uploadUrl: `https://${baseUrl}/api/upload`,
      wsUrl: `wss://${baseUrl}`,
      staticUrl: `https://${baseUrl}` // 静态资源基础URL
    },
    production: {
      baseUrl: `https://${baseUrl}/api`,
      uploadUrl: `https://${baseUrl}/api/upload`,
      wsUrl: `wss://${baseUrl}`,
      staticUrl: `https://${baseUrl}` // 静态资源基础URL
    }
  },

  // 当前环境
  currentEnv: 'production',

  // 获取当前环境配置
  getCurrentConfig() {
    return this.env[this.currentEnv] || this.env.development
  },

  // API接口地址 - 适配Next.js后台
  api: {
    // 用户相关
    user: {
      login: '/auth/login',
      register: '/miniprogram/register', // 小程序用户注册
      profile: '/miniprogram/profile',
      updateProfile: '/miniprogram/profile/update',
      syncProfile: '/miniprogram/profile/sync', // 同步用户完整信息
      logout: '/auth/logout',
      refreshToken: '/auth/refresh',
      wxLogin: '/auth/wx-login',
      getToken: '/miniprogram/auth',
      stats: '/miniprogram/stats', // 用户统计信息
      getUsers: '/miniprogram/users', // 获取子用户列表
      createSubUser: '/miniprogram/users', // 创建子用户
      getSubUser: '/miniprogram/subusers', // 获取单个子用户信息
      updateSubUser: '/miniprogram/subusers' // 更新子用户信息
    },

    // 检测相关
    detection: {
      list: '/miniprogram/detection', // 获取检测记录列表
      create: '/miniprogram/detection-real', // 创建检测记录
      photoRecord: '/miniprogram/photo-record', // 保存图片记录
      upload: '/detection/upload',
      result: '/detection/result',
      history: '/detection/history',
      compare: '/detection/compare',
      delete: '/detection/delete',
      analyze: '/detection/analyze'
    },

    // 消息相关
    message: {
      list: '/miniprogram/news',
      detail: '/miniprogram/news', // 新闻详情接口
      submit: '/miniprogram/messages', // 提交留言
      markRead: '/message/mark-read',
      markAllRead: '/miniprogram/news/read-all', // 一键已读
      delete: '/message/delete',
      unreadCount: '/miniprogram/news/unread-count', // 未读数量
      getReadStatus: '/miniprogram/news/read', // 获取阅读状态
      markArticleRead: '/miniprogram/news/read' // 标记单个已读
    },

    // 系统消息相关
    systemMessages: {
      list: '/miniprogram/system-messages', // 获取系统消息列表
      detail: '/miniprogram/system-messages', // 获取系统消息详情（自动标记已读）
      unreadCount: '/miniprogram/system-messages/unread-count', // 获取未读系统消息数量
      markRead: '/miniprogram/system-messages/mark-read' // 批量标记消息已读
    },

    // 关于我们相关
    about: {
      info: '/miniprogram/about' // 获取关于我们信息
    },

    // 优惠券相关
    coupon: {
      list: '/miniprogram/coupons' // 获取当前用户拥有的优惠券信息
    },

    // 系统相关
    system: {
      banner: '/miniprogram/banners',
      config: '/system/config',
      version: '/system/version',
      health: '/system/health'
    },

    // 档案相关
    profile: {
      list: '/miniprogram/archives', // 获取用户档案列表
      create: '/miniprogram/archives', // 创建档案
      update: '/miniprogram/archives', // 更新档案
      delete: '/miniprogram/archives', // 删除档案
      detail: '/miniprogram/archives', // 获取档案详情
      allArchives: '/miniprogram/all-archives', // 获取所有档案列表（包括本人和其他用户）
      archiveDetections: '/miniprogram/archive-detections', // 获取档案检测记录
      getUser: '/miniprogram/user' // 获取子用户列表
    },

    // 记录相关
    record: {
      list: '/record/list',
      create: '/record/create',
      update: '/record/update',
      delete: '/record/delete',
      detail: '/record/detail',
      compare: '/record/compare'
    },

    // 反馈相关
    feedback: {
      list: '/miniprogram/feedback', // 获取反馈列表
      submit: '/miniprogram/feedback', // 提交反馈
      detail: '/miniprogram/feedback' // 获取反馈详情
    }
  },

  // 请求超时时间
  timeout: 15000,

  // 请求重试次数
  retryCount: 3,

  // 文件上传配置
  upload: {
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/jpg'],
    quality: 0.8,
    // Next.js上传配置
    fieldName: 'file',
    multiple: false
  },

  // 缓存配置
  cache: {
    // 缓存过期时间（毫秒）
    expireTime: {
      userInfo: 30 * 24 * 60 * 60 * 1000, // 30天（原来是24小时）
      banner: 60 * 60 * 1000, // 1小时
      config: 24 * 60 * 60 * 1000, // 24小时
      message: 5 * 60 * 1000, // 5分钟
      profile: 30 * 60 * 1000, // 30分钟
      record: 10 * 60 * 1000 // 10分钟
    }
  },

  // UI组件默认配置
  ui: {
    // Banner轮播图默认配置
    banner: {
      autoplay: true,
      interval: 3000,
      circular: true,
      indicatorDots: true,
      duration: 500,
      easingFunction: 'default'
    },
    // 消息列表默认配置
    message: {
      pageSize: 10,
      showAvatar: true,
      showTime: true,
      showCategory: true
    },
    // 图片默认配置
    image: {
      lazyLoad: true,
      showMenuByLongpress: true,
      mode: 'aspectFill'
    }
  },

  // 错误码配置
  errorCodes: {
    SUCCESS: 200,
    CREATED: 201,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    SERVER_ERROR: 500,
    NETWORK_ERROR: -1,
    TIMEOUT_ERROR: -2,
    VALIDATION_ERROR: 422,
    RATE_LIMIT: 429
  },

  // 错误信息
  errorMessages: {
    401: '登录已过期，请重新登录',
    403: '没有权限访问',
    404: '请求的资源不存在',
    422: '请求参数错误',
    429: '请求过于频繁，请稍后重试',
    500: '服务器内部错误',
    '-1': '网络连接失败',
    '-2': '请求超时',
    'default': '操作失败，请稍后重试'
  },

  // Next.js特定配置
  nextjs: {
    // API路由前缀
    apiPrefix: '/api',
    // 文件上传路径
    uploadPath: '/api/upload',
    // 静态文件路径
    staticPath: '/static',
    // 认证相关
    auth: {
      tokenKey: 'Authorization',
      refreshTokenKey: 'Refresh-Token',
      tokenPrefix: 'Bearer '
    }
  }
}

module.exports = config 