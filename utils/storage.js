// 本地存储工具类
const config = require('./config.js')

const MAX_CACHE_SIZE = 100

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

    // 设置内存缓存（超过上限时清理最早的条目）
    if (this.cache.size >= MAX_CACHE_SIZE && !this.cache.has(key)) {
      const firstKey = this.cache.keys().next().value
      this.cache.delete(firstKey)
    }
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
    if (!data) {
      return true
    }
    // 如果没有设置过期时间，默认24小时后过期
    const expireTime = data.expireTime || (24 * 60 * 60 * 1000)
    return Date.now() - data.timestamp > expireTime
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
    const userInfo = this.get('userInfo')
    // 如果用户信息过期，返回 null
    if (!userInfo) {
      return null
    }
    return userInfo
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
  setBannerConfig(bannerConfig) {
    this.set('bannerConfig', bannerConfig, config.cache.expireTime.banner)
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
  setSystemConfig(systemConfigData) {
    this.set('systemConfig', systemConfigData, config.cache.expireTime.config)
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

  // 设置openId
  setOpenId(openId) {
    // 设置30天过期时间（与用户信息保持一致）
    const expireTime = 30 * 24 * 60 * 60 * 1000 // 30天
    this.set('openId', openId, expireTime)
  }

  // 获取openId
  getOpenId() {
    const openId = this.get('openId')
    // 如果openId过期或无效，返回 null
    if (!openId || openId === 'undefined' || openId === 'null') {
      return null
    }
    return openId
  }

  // 清除用户相关缓存
  clearUserData() {
    
    // 清除所有用户相关的缓存
    const userKeys = [
      'userInfo', 'token', 'refreshToken', 'openId', 
      'subUsers', 'currentSubUser', 'userProfiles', 
      'userRecords', 'userMessages', 'userSettings'
    ]
    
    userKeys.forEach(key => {
      this.remove(key)
    })
    
    // 清除内存缓存
    this.cache.clear()
    
    // 强制清除微信本地存储中的用户数据
    this.clearWechatStorage()
    
  }

  // 清除微信本地存储中的用户数据
  clearWechatStorage() {
    try {
      const storageInfo = wx.getStorageInfoSync()
      const keys = storageInfo.keys || []
      
      // 查找并清除所有可能包含用户数据的键
      const userDataKeys = keys.filter(key => 
        key.includes('user') || 
        key.includes('User') || 
        key.includes('profile') || 
        key.includes('Profile') ||
        key.includes('record') ||
        key.includes('Record') ||
        key.includes('auth') ||
        key.includes('Auth') ||
        key.includes('login') ||
        key.includes('Login')
      )
      
      userDataKeys.forEach(key => {
        try {
          wx.removeStorageSync(key)
        } catch (error) {
          console.warn(`清除微信存储失败: ${key}`, error)
        }
      })
    } catch (error) {
      console.error('获取微信存储信息失败:', error)
    }
  }

  // 检查用户是否真正已登录
  isUserLoggedIn() {
    const userInfo = this.getUserInfo()
    const openId = this.getOpenId()

    // 必须同时有有效的用户信息和openId
    // openId可以来自userInfo.openid或独立的openId存储
    return !!(userInfo && openId)
  }

  // 强制清除所有过期数据
  clearExpiredData() {
    const keys = ['userInfo', 'token', 'refreshToken', 'openId', 'subUsers', 'currentSubUser']
    keys.forEach(key => {
      // 直接读取原始存储包装对象（含 timestamp/expireTime）
      let rawData = this.cache.get(key)
      if (!rawData) {
        try {
          rawData = wx.getStorageSync(key)
        } catch (e) {
          return
        }
      }
      if (rawData && this.isExpired(rawData)) {
        this.remove(key)
      }
    })
  }

  // 检查用户信息是否完整（性别、年龄、地址）
  isUserInfoComplete() {
    const userInfo = this.getUserInfo()
    
    // 主要检查当前用户信息是否完整
    if (!userInfo) {
      return false
    }

    
    if (userInfo.currentSubUser) {
    } else {
    }

    // 检查性别（0-未知，1-男，2-女）
    const hasGender = userInfo.currentSubUser && userInfo.currentSubUser.gender !== undefined && userInfo.currentSubUser.gender !== null && userInfo.currentSubUser.gender !== '' && userInfo.currentSubUser.gender !== 0 && userInfo.currentSubUser.gender !== '0'
    
    // 检查年龄（通过出生年份计算）
    const hasAge = userInfo.currentSubUser && userInfo.currentSubUser.age !== undefined && userInfo.currentSubUser.age !== null && userInfo.currentSubUser.age !== '' && userInfo.currentSubUser.age !== 0 && userInfo.currentSubUser.age !== '0'
    
    // 检查地址（省市）
    const hasAddress = userInfo.currentSubUser && userInfo.currentSubUser.address !== undefined && userInfo.currentSubUser.address !== null && userInfo.currentSubUser.address !== '' && userInfo.currentSubUser.address !== 0 && userInfo.currentSubUser.address !== '0'


    return hasGender && hasAge && hasAddress
  }

  // 获取缺失的用户信息字段
  getMissingUserInfoFields() {
    const userInfo = this.getUserInfo()
    if (!userInfo) {
      return ['gender', 'birthYear', 'province', 'city']
    }

    const missingFields = []

    // 检查性别（0-未知，1-男，2-女）
    if (!userInfo.gender || userInfo.gender === '' || userInfo.gender === 0 || userInfo.gender === '0') {
      missingFields.push('gender')
    }
    
    // 检查年龄（出生年份）
    if (!userInfo.birthYear || userInfo.birthYear === '') {
      missingFields.push('birthYear')
    }
    
    // 检查地址（省市）
    if (!userInfo.province || userInfo.province === '') {
      missingFields.push('province')
    }
    if (!userInfo.city || userInfo.city === '') {
      missingFields.push('city')
    }

    return missingFields
  }

  // 检查是否登录
  isLoggedIn() {
    return !!this.getToken()
  }

  // 设置文章详情缓存
  setArticleDetail(id, detail) {
    this.set(`article_${id}`, detail, config.cache.expireTime.message)
  }

  // 获取文章详情缓存
  getArticleDetail(id) {
    return this.get(`article_${id}`)
  }

  // 设置子用户列表
  setSubUsers(subUsers) {
    this.set('subUsers', subUsers)
  }

  // 获取子用户列表
  getSubUsers() {
    return this.get('subUsers', [])
  }

  // 设置当前子用户
  setCurrentSubUser(currentSubUser) {
    this.set('currentSubUser', currentSubUser)
  }

  // 获取当前子用户
  getCurrentSubUser() {
    return this.get('currentSubUser')
  }

  // 检查授权状态
  checkAuthStatus() {
    const userInfo = this.getUserInfo()
    const openId = this.getOpenId()
    
    return {
      isAuthorized: !!(userInfo && openId),
      hasUserInfo: !!userInfo,
      hasOpenId: !!openId,
      userInfoExpired: !userInfo,
      openIdExpired: !openId,
      // 计算剩余有效期（天）
      userInfoRemainingDays: userInfo ? this.getRemainingDays('userInfo') : 0,
      openIdRemainingDays: openId ? this.getRemainingDays('openId') : 0
    }
  }

  // 获取缓存剩余天数
  getRemainingDays(key) {
    try {
      const data = wx.getStorageSync(key)
      if (!data || !data.expireTime) {
        return 0
      }
      
      const remainingTime = data.expireTime - (Date.now() - data.timestamp)
      return Math.max(0, Math.ceil(remainingTime / (24 * 60 * 60 * 1000)))
    } catch (error) {
      console.error('获取剩余天数失败:', error)
      return 0
    }
  }

  // 获取授权状态描述
  getAuthStatusDescription() {
    const status = this.checkAuthStatus()
    
    if (status.isAuthorized) {
      const minDays = Math.min(status.userInfoRemainingDays, status.openIdRemainingDays)
      if (minDays > 7) {
        return `授权有效，剩余${minDays}天`
      } else if (minDays > 0) {
        return `授权即将过期，剩余${minDays}天`
      } else {
        return '授权已过期'
      }
    } else {
      return '未授权'
    }
  }

  // 延长授权有效期（可选功能）
  extendAuthValidity() {
    const userInfo = this.getUserInfo()
    const openId = this.getOpenId()
    
    if (userInfo) {
      // 重新设置用户信息，延长30天有效期
      this.setUserInfo(userInfo)
    }
    
    if (openId) {
      // 重新设置openId，延长30天有效期
      this.setOpenId(openId)
    }
  }
}

// 创建单例实例
const storage = new Storage()

module.exports = storage
