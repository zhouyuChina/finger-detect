// API接口封装
const request = require('./request.js')
const config = require('./config.js')

// 用户相关API
const userApi = {
  // 用户登录
  login(data) {
    return request.post(config.api.user.login, data)
  },

  // 用户注册
  register(data) {
    return request.post(config.api.user.register, data)
  },

  // 小程序用户注册（自动注册）
  miniProgramRegister(wxUserInfo) {
    return request.post(config.api.user.register, wxUserInfo, { needToken: false })
  },

  // 微信登录
  wxLogin(data) {
    return request.post(config.api.user.wxLogin, data)
  },

  // 获取用户信息
  getProfile() {
    // 检查用户是否已登录
    const storage = require('./storage.js')
    const userInfo = storage.getUserInfo()
    const openId = storage.getOpenId()
    
    if (!userInfo || !openId) {
      return Promise.resolve({
        success: false,
        code: 401,
        message: '用户未登录',
        data: null
      })
    }
    
    return request.get(config.api.user.profile)
  },

  // 更新用户信息
  updateProfile(data) {
    return request.put(config.api.user.updateProfile, data)
  },

  // 同步用户完整信息（用户授权后调用）
  syncProfile(userInfo) {
    return request.post(config.api.user.syncProfile, userInfo)
  },

  // 用户登出
  logout() {
    return request.post(config.api.user.logout)
  },

  // 刷新token
  refreshToken() {
    return request.post(config.api.user.refreshToken)
  },

  // 获取小程序token
  getToken() {
    return request.get(config.api.user.getToken, {}, { needToken: false })
  },

  // 获取用户统计信息
  getStats() {
    // 检查用户是否已登录
    const storage = require('./storage.js')
    const userInfo = storage.getUserInfo()
    const openId = storage.getOpenId()
    
    if (!userInfo || !openId) {
      return Promise.resolve({
        success: false,
        code: 401,
        message: '用户未登录',
        data: null
      })
    }
    
    return request.get(config.api.user.stats)
  },

  // 获取子用户列表
  getUsers() {
    // 检查用户是否已登录
    const storage = require('./storage.js')
    const userInfo = storage.getUserInfo()
    const openId = storage.getOpenId()
    
    if (!userInfo || !openId) {
      return Promise.resolve({
        success: false,
        code: 401,
        message: '用户未登录',
        data: null
      })
    }
    
    return request.get(config.api.user.getUsers)
  },

  // 创建子用户
  createSubUser(data) {
    return request.post(config.api.user.createSubUser, data)
  },

  // 获取单个子用户信息
  getSubUser(id) {
    return request.get(`${config.api.user.getSubUser}/${id}`)
  },

  // 更新子用户信息
  updateSubUser(id, data) {
    return request.put(`${config.api.user.updateSubUser}/${id}`, data)
  }
}

// 检测相关API
const detectionApi = {
  // 获取检测记录列表
  getList(params = {}) {
    return request.get(config.api.detection.list, params)
  },

  // 创建检测记录（不显示加载提示，因为页面已有扫描动画）
  create(data) {
    return request.post(config.api.detection.create, data, { showLoading: false })
  },

  // 上传检测图片
  upload(filePath, data = {}) {
    return request.upload(filePath, {
      url: config.api.detection.upload,
      formData: data
    })
  },

  // 保存图片记录
  savePhotoRecord(data) {
    return request.post(config.api.detection.photoRecord, data)
  },

  // 获取检测结果
  getResult(id) {
    return request.get(`${config.api.detection.result}/${id}`)
  },

  // 获取检测历史
  getHistory(params = {}) {
    return request.get(config.api.detection.history, params)
  },

  // 检测结果对比
  compare(data) {
    return request.post(config.api.detection.compare, data)
  },

  // 删除检测记录
  delete(id) {
    return request.delete(`${config.api.detection.delete}/${id}`)
  },

  // AI分析检测
  analyze(data) {
    return request.post(config.api.detection.analyze, data)
  }
}

// 消息相关API
const messageApi = {
  // 获取消息列表
  getList(params = {}) {
    // 如果请求置顶信息，添加相应的参数
    if (params.isTop) {
      params.types = params.types || []
      if (!params.types.includes('置顶')) {
        params.types.push('置顶')
      }
    }
    return request.get(config.api.message.list, params)
  },

  // 获取消息详情
  getDetail(id) {
    return request.get(`${config.api.message.detail}/${id}`)
  },

  // 获取新闻详情
  getNewsDetail(id) {
    return request.get(`${config.api.message.detail}/${id}`)
  },

  // 提交留言
  submit(data) {
    return request.post(config.api.message.submit, data)
  },

  // 标记消息为已读
  markRead(id) {
    return request.put(`${config.api.message.markRead}/${id}`)
  },

  // 全部标记为已读
  markAllRead() {
    return request.put(config.api.message.markAllRead)
  },

  // 删除消息
  delete(id) {
    return request.delete(`${config.api.message.delete}/${id}`)
  },

  // 获取未读消息数量
  getUnreadCount() {
    // 检查用户是否已登录
    const storage = require('./storage.js')
    const userInfo = storage.getUserInfo()
    const openId = storage.getOpenId()
    
    if (!userInfo || !openId) {
      return Promise.resolve({
        success: true,
        data: { count: 0, unreadCount: 0 }
      })
    }
    
    return request.get(config.api.message.unreadCount)
  },

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
}

// 优惠券相关API
const couponApi = {
  // 获取当前用户拥有的优惠券信息
  getUserCoupons(params = {}) {
    return request.get(config.api.coupon.list, params)
  }
}

// 系统相关API
const systemApi = {
  // 获取轮播图
  getBanner() {
    return request.get(config.api.system.banner)
  },

  // 获取系统配置
  getConfig() {
    return request.get(config.api.system.config)
  },

  // 获取版本信息
  getVersion() {
    return request.get(config.api.system.version)
  },

  // 健康检查
  health() {
    return request.get(config.api.system.health)
  }
}

// 系统消息相关API
const systemMessagesApi = {
  // 获取系统消息列表
  getList(params = {}) {
    return request.get(config.api.systemMessages.list, params)
  },

  // 获取系统消息详情
  getDetail(id) {
    return request.get(`${config.api.systemMessages.detail}/${id}`)
  },

  // 获取未读系统消息数量
  getUnreadCount() {
    // 检查用户是否已登录
    const storage = require('./storage.js')
    const userInfo = storage.getUserInfo()
    const openId = storage.getOpenId()
    
    if (!userInfo || !openId) {
      return Promise.resolve({
        success: true,
        data: { unreadCount: 0, count: 0 }
      })
    }
    
    return request.get(config.api.systemMessages.unreadCount)
  },

  // 批量标记系统消息已读
  markRead(count = 1) {
    return request.post(config.api.systemMessages.markRead, { count })
  }
}

// 关于我们相关API
const aboutApi = {
  // 获取关于我们信息
  getInfo() {
    return request.get(config.api.about.info)
  }
}

// 档案相关API
const profileApi = {
  // 获取档案列表
  getList(params = {}) {
    return request.get(config.api.profile.list, params)
  },

  // 获取用户档案列表（新接口）
  getArchives(subUserId, params = {}, options = {}) {
    const queryParams = {
      subUserId: subUserId,
      ...params
    }
    return request.get(config.api.profile.list, queryParams, options)
  },

  // 创建档案
  create(data) {
    return request.post(config.api.profile.create, data)
  },

  // 更新档案
  update(id, data) {
    return request.put(`${config.api.profile.update}/${id}`, data)
  },

  // 删除档案
  delete(id) {
    return request.delete(`${config.api.profile.delete}/${id}`)
  },

  // 获取档案详情
  getDetail(id) {
    return request.get(`${config.api.profile.detail}/${id}`)
  },

  // 获取所有档案列表（包括本人和其他用户）
  getAllArchives(params = {}) {
    // 检查用户是否已登录
    const storage = require('./storage.js')
    const userInfo = storage.getUserInfo()
    const openId = storage.getOpenId()
    
    if (!userInfo || !openId) {
      return Promise.resolve({
        success: false,
        code: 401,
        message: '用户未登录',
        data: {
          ownArchives: [],
          otherArchives: [],
          totalOwn: 0,
          totalOthers: 0,
          totalAll: 0,
          subUsers: [],
          ownSubUserId: ''
        }
      })
    }
    
    return request.get(config.api.profile.allArchives, params)
  },

  // 获取档案检测记录
  getArchiveDetections(params = {}) {
    return request.get(config.api.profile.archiveDetections, params)
  },

  // 获取子用户列表
  getUser() {
    return request.get(config.api.profile.getUser)
  }
}

// 记录相关API
const recordApi = {
  // 获取记录列表
  getList(params = {}) {
    return request.get(config.api.record.list, params)
  },

  // 创建记录
  create(data) {
    return request.post(config.api.record.create, data)
  },

  // 更新记录
  update(id, data) {
    return request.put(`${config.api.record.update}/${id}`, data)
  },

  // 删除记录
  delete(id) {
    return request.delete(`${config.api.record.delete}/${id}`)
  },

  // 获取记录详情
  getDetail(id) {
    return request.get(`${config.api.record.detail}/${id}`)
  },

  // 记录对比
  compare(data) {
    return request.post(config.api.record.compare, data)
  }
}

// 反馈相关API
const feedbackApi = {
  // 获取反馈列表
  getList(params = {}) {
    return request.get(config.api.feedback.list, params)
  },

  // 提交反馈
  submit(data) {
    return request.post(config.api.feedback.submit, data)
  },

  // 获取反馈详情
  getDetail(id) {
    return request.get(`${config.api.feedback.detail}/${id}`)
  },

  // 获取反馈详情（使用查询参数）
  getDetailByQuery(id) {
    return request.get(config.api.feedback.detail, { id })
  }
}

module.exports = {
  user: userApi,
  detection: detectionApi,
  message: messageApi,
  coupon: couponApi,
  system: systemApi,
  systemMessages: systemMessagesApi,
  about: aboutApi,
  profile: profileApi,
  record: recordApi,
  feedback: feedbackApi
} 