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

  // 获取用户信息
  getProfile() {
    return request.get(config.api.user.profile)
  },

  // 更新用户信息
  updateProfile(data) {
    return request.put(config.api.user.updateProfile, data)
  },

  // 用户登出
  logout() {
    return request.post(config.api.user.logout)
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
  }
}

module.exports = {
  user: userApi,
  detection: detectionApi,
  message: messageApi,
  coupon: couponApi,
  system: systemApi
} 