// 本地存储工具类
const config = require('./config.js')

class Storage {
  constructor() {
    this.cache = new Map() // 内存缓存
  }

  // 设置缓存
  set(key, value, expireTime = null) {
    const data = {
      value: value,
      timestamp: Date.now(),
      expireTime: expireTime
    }

    // 设置内存缓存
    this.cache.set(key, data)

    // 设置本地存储
    try {
      wx.setStorageSync(key, data)
    } catch (error) {
      console.error('设置缓存失败:', error)
    }
  }

  // 获取缓存
  get(key, defaultValue = null) {
    // 先从内存缓存获取
    if (this.cache.has(key)) {
      const data = this.cache.get(key)
      if (this.isExpired(data)) {
        this.remove(key)
        return defaultValue
      }
      return data.value
    }

    // 从本地存储获取
    try {
      const data = wx.getStorageSync(key)
      if (data && !this.isExpired(data)) {
        // 更新内存缓存
        this.cache.set(key, data)
        return data.value
      } else {
        // 缓存过期，删除
        this.remove(key)
        return defaultValue
      }
    } catch (error) {
      console.error('获取缓存失败:', error)
      return defaultValue
    }
  }

  // 检查是否过期
  isExpired(data) {
    if (!data || !data.expireTime) {
      return false
    }
    return Date.now() - data.timestamp > data.expireTime
  }

  // 删除缓存
  remove(key) {
    // 删除内存缓存
    this.cache.delete(key)

    // 删除本地存储
    try {
      wx.removeStorageSync(key)
    } catch (error) {
      console.error('删除缓存失败:', error)
    }
  }

  // 清空所有缓存
  clear() {
    // 清空内存缓存
    this.cache.clear()

    // 清空本地存储
    try {
      wx.clearStorageSync()
    } catch (error) {
      console.error('清空缓存失败:', error)
    }
  }

  // 获取缓存大小
  getSize() {
    try {
      const info = wx.getStorageInfoSync()
      return info.currentSize
    } catch (error) {
      console.error('获取缓存大小失败:', error)
      return 0
    }
  }

  // 获取缓存信息
  getInfo() {
    try {
      return wx.getStorageInfoSync()
    } catch (error) {
      console.error('获取缓存信息失败:', error)
      return null
    }
  }

  // 设置用户信息缓存
  setUserInfo(userInfo) {
    this.set('userInfo', userInfo, config.cache.expireTime.userInfo)
  }

  // 获取用户信息缓存
  getUserInfo() {
    return this.get('userInfo')
  }

  // 设置轮播图缓存
  setBanner(banner) {
    this.set('banner', banner, config.cache.expireTime.banner)
  }

  // 获取轮播图缓存
  getBanner() {
    return this.get('banner', [])
  }

  // 设置轮播图配置缓存
  setBannerConfig(config) {
    this.set('bannerConfig', config, config.cache.expireTime.banner)
  }

  // 获取轮播图配置缓存
  getBannerConfig() {
    return this.get('bannerConfig', {
      autoplay: true,
      interval: 3000,
      circular: true,
      indicatorDots: true
    })
  }

  // 设置系统配置缓存
  setSystemConfig(config) {
    this.set('systemConfig', config, config.cache.expireTime.config)
  }

  // 获取系统配置缓存
  getSystemConfig() {
    return this.get('systemConfig', {})
  }

  // 设置消息缓存
  setMessages(messages) {
    this.set('messages', messages, config.cache.expireTime.message)
  }

  // 获取消息缓存
  getMessages() {
    return this.get('messages', [])
  }

  // 设置token
  setToken(token) {
    this.set('token', token)
  }

  // 获取token
  getToken() {
    return this.get('token')
  }

  // 设置refreshToken
  setRefreshToken(refreshToken) {
    this.set('refreshToken', refreshToken)
  }

  // 获取refreshToken
  getRefreshToken() {
    return this.get('refreshToken')
  }

  // 清除用户相关缓存
  clearUserData() {
    this.remove('userInfo')
    this.remove('token')
    this.remove('refreshToken')
  }

  // 检查是否登录
  isLoggedIn() {
    return !!this.getToken()
  }
}

// 创建单例实例
const storage = new Storage()

module.exports = storage 