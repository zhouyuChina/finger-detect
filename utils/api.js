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
    return request.get(config.api.user.stats)
  }
}

// 检测相关API
const detectionApi = {
  // 创建检测
  create(data) {
    return request.post(config.api.detection.create, data)
  },

  // 上传检测图片
  upload(filePath, data = {}) {
    return request.upload(filePath, {
      url: config.api.detection.upload,
      formData: data
    })
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
    return request.get(config.api.message.list, params)
  },

  // 获取消息详情
  getDetail(id) {
    return request.get(`${config.api.message.detail}/${id}`)
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
  // 获取优惠券列表
  getList(params = {}) {
    return request.get(config.api.coupon.list, params)
  },

  // 使用优惠券
  use(id) {
    return request.post(`${config.api.coupon.use}/${id}`)
  },

  // 领取优惠券
  receive(id) {
    return request.post(`${config.api.coupon.receive}/${id}`)
  },

  // 获取我的优惠券
  getMyCoupons(params = {}) {
    return request.get(config.api.coupon.myCoupons, params)
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

// 档案相关API
const profileApi = {
  // 获取档案列表
  getList(params = {}) {
    return request.get(config.api.profile.list, params)
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

module.exports = {
  user: userApi,
  detection: detectionApi,
  message: messageApi,
  coupon: couponApi,
  system: systemApi,
  profile: profileApi,
  record: recordApi
} 