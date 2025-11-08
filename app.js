// app.js
const storage = require('./utils/storage.js')
const common = require('./utils/common.js')
const config = require('./utils/config.js')

App({
  onLaunch() {
    // 展示本地存储能力
    const logs = wx.getStorageSync('logs') || []
    logs.unshift(Date.now())
    wx.setStorageSync('logs', logs)

    // 初始化应用
    this.initApp()
  },

  // 初始化应用
  async initApp() {
    try {
      // 检查网络状态
      const isConnected = await common.checkNetwork()
      if (!isConnected) {
        common.showError('网络连接失败，请检查网络设置')
      }

      // 获取系统信息
      const systemInfo = await common.getSystemInfo()
      this.globalData.systemInfo = systemInfo

      // 检查更新
      this.checkUpdate()

      // 检查登录状态（不自动登录）
      this.checkLoginStatus()

      // 应用初始化完成

    } catch (error) {
      console.error('应用初始化失败:', error)
    }
  },

  // 获取小程序token
  async getAppToken() {
    try {
      const api = require('./utils/api.js')
      await api.user.getToken()
    } catch (error) {
      console.error('应用启动时获取token失败:', error)
      // 不阻止应用启动，后续请求时会重试
    }
  },

  // 检查更新
  checkUpdate() {
    if (wx.canIUse('getUpdateManager')) {
      const updateManager = wx.getUpdateManager()

      updateManager.onCheckForUpdate((res) => {
        if (res.hasUpdate) {
          updateManager.onUpdateReady(() => {
            wx.showModal({
              title: '更新提示',
              content: '新版本已经准备好，是否重启应用？',
              success: (res) => {
                if (res.confirm) {
                  updateManager.applyUpdate()
                }
              }
            })
          })

          updateManager.onUpdateFailed(() => {
            wx.showModal({
              title: '更新失败',
              content: '新版本下载失败，请检查网络后重试',
              showCancel: false
            })
          })
        }
      })
    }
  },

  // 检查登录状态（不再自动登录）
  checkLoginStatus() {
    try {
      const userInfo = storage.getUserInfo()
      const openId = storage.getOpenId()
      
      
      if (userInfo && openId) {
        this.globalData.userInfo = userInfo
        this.globalData.isLoggedIn = true
      } else {
        this.globalData.userInfo = null
        this.globalData.isLoggedIn = false
      }
    } catch (error) {
      console.error('检查登录状态失败:', error)
    }
  },

  // 静默刷新用户信息（可选功能）
  async silentRefreshUserInfo() {
    try {
      // 只在网络良好的情况下尝试静默刷新
      const networkType = await new Promise((resolve) => {
        wx.getNetworkType({
          success: (res) => resolve(res.networkType),
          fail: () => resolve('unknown')
        })
      })
      
      if (networkType === 'wifi' || networkType === '4g' || networkType === '5g') {
        // 这里可以调用后端API获取最新的用户信息
        // 但不强制要求用户重新授权
        // const api = require('./utils/api.js')
        // const response = await api.user.getProfile()
        // if (response.success) {
        //   storage.setUserInfo(response.data)
        //   this.globalData.userInfo = response.data
        // }
      }
    } catch (error) {
      // 静默刷新失败不影响正常使用
    }
  },

  // 微信登录并自动注册
  async wxLoginAndRegister() {
    try {
      const api = require('./utils/api.js')
      
      // 1. 获取微信登录code
      const loginRes = await new Promise((resolve, reject) => {
        wx.login({
          success: resolve,
          fail: reject
        })
      })

      if (!loginRes.code) {
        throw new Error('获取微信登录code失败')
      }


      // 2. 获取用户信息（如果用户授权）
      let userInfo = null
      try {
        const settingRes = await new Promise((resolve, reject) => {
          wx.getSetting({
            success: resolve,
            fail: reject
          })
        })

        if (settingRes.authSetting['scope.userInfo']) {
          const userInfoRes = await new Promise((resolve, reject) => {
            wx.getUserInfo({
              success: resolve,
              fail: reject
            })
          })
          userInfo = userInfoRes.userInfo
        }
      } catch (error) {
      }

      // 如果没有获取到用户信息，不进行注册
      if (!userInfo) {
        console.log('用户未授权，跳过自动注册')
        return
      }

      // 3. 获取系统信息
      const systemInfo = this.globalData.systemInfo || await common.getSystemInfo()

      // 4. 构建注册数据
      const registerData = {
        code: loginRes.code,
        userInfo: userInfo ? { ...userInfo, nickName: '' } : null,
        systemInfo: {
          platform: systemInfo.platform,
          system: systemInfo.system,
          version: systemInfo.version,
          SDKVersion: systemInfo.SDKVersion,
          brand: systemInfo.brand,
          model: systemInfo.model,
          screenWidth: systemInfo.screenWidth,
          screenHeight: systemInfo.screenHeight,
          windowWidth: systemInfo.windowWidth,
          windowHeight: systemInfo.windowHeight,
          pixelRatio: systemInfo.pixelRatio,
          language: systemInfo.language
        },
        registerTime: new Date().toISOString(),
        appVersion: this.globalData.appConfig.version
      }

      
      const response = await api.user.miniProgramRegister(registerData)
      
      
      if (response.success || response.code === 200) {
        
        // 保存用户信息（新接口格式）
        const responseData = response.data || response
        
        // 从新接口格式中提取数据
        const user = responseData.user
        if (user) {
          // 保存openId（从user.openid获取）
          if (user.openid) {
            storage.setOpenId(user.openid)
            // 确保userInfo对象中也包含openid
            user.openid = user.openid
          }

          // 保存用户信息（使用user对象，确保包含openid）
          storage.setUserInfo(user)
          this.globalData.userInfo = user
          this.globalData.isLoggedIn = true

          // 保存子用户列表
          if (user.subUsers) {
            storage.setSubUsers(user.subUsers)
          }

          // 保存当前子用户
          if (user.currentSubUser) {
            storage.setCurrentSubUser(user.currentSubUser)
          }
        }
        
        // 验证保存的数据
        const savedUserInfo = storage.getUserInfo()
        const savedOpenId = storage.getOpenId()
        const savedSubUsers = storage.getSubUsers()
        const savedCurrentSubUser = storage.getCurrentSubUser()
        
        // 显示欢迎信息
        wx.showToast({
          title: '欢迎使用健康检测',
          icon: 'success',
          duration: 2000
        })
      } else {
        console.error('用户注册失败:', response.message)
        // 注册失败不影响应用使用，用户可以在后续操作中手动注册
      }

    } catch (error) {
      console.error('注册失败:', error.message || error)
      
      // 如果是500错误，显示更友好的提示
      if (error.code === 500) {
        wx.showToast({
          title: '服务器暂时不可用，请稍后重试',
          icon: 'none',
          duration: 3000
        })
      }
      
      // 登录失败不影响应用使用
    }
  },

  // 微信登录（保留原方法，用于其他场景）
  async wxLogin() {
    try {
      const loginRes = await new Promise((resolve, reject) => {
        wx.login({
          success: resolve,
          fail: reject
        })
      })

      if (loginRes.code) {
        // 发送 res.code 到后台换取 openId, sessionKey, unionId
        // 这里可以调用后端API进行登录
        // const response = await api.user.login({ code: loginRes.code })
        // if (response.code === 200) {
        //   storage.setToken(response.data.token)
        //   storage.setUserInfo(response.data.userInfo)
        //   this.globalData.userInfo = response.data.userInfo
        //   this.globalData.isLoggedIn = true
        // }
      }
    } catch (error) {
      console.error('微信登录失败:', error)
    }
  },

  // 全局错误处理
  onError(error) {
    console.error('应用错误:', error)
    // 这里可以上报错误到服务器
  },

  // 全局未处理的Promise拒绝
  onUnhandledRejection(res) {
    console.error('未处理的Promise拒绝:', res.reason)
    // 这里可以上报错误到服务器
  },

  // 全局数据
  globalData: {
    userInfo: null,
    isLoggedIn: false,
    systemInfo: null,
    // 应用配置
    appConfig: {
      name: '健康检测',
      version: '1.0.0',
      buildNumber: '1',
      // 功能开关
      features: {
        enablePhotoDetection: true,
        enableMessagePush: true,
        enableAutoLogin: true
      }
    }
  },

  // 获取用户信息
  getUserInfo() {
    return this.globalData.userInfo
  },

  // 设置用户信息
  setUserInfo(userInfo) {
    this.globalData.userInfo = userInfo
    this.globalData.isLoggedIn = true
    storage.setUserInfo(userInfo)
  },

  // 清除用户信息
  clearUserInfo() {
    // 清除全局数据
    this.globalData.userInfo = null
    this.globalData.isLoggedIn = false
    
    // 清除存储数据
    storage.clearUserData()
    
    // 清除Tab栏红点
    this.clearTabBarBadge()
    
    // 清除所有页面的用户相关数据
    this.clearAllPagesUserData()
    
  },

  // 清除所有页面的用户相关数据
  clearAllPagesUserData() {
    try {
      const pages = getCurrentPages()
      pages.forEach(page => {
        if (page && page.route) {
          
          // 根据页面类型清除相应的用户数据
          if (page.route.includes('index')) {
            // 首页
            if (page.setData) {
              page.setData({
                userInfo: null,
                isLoggedIn: false
              })
            }
          } else if (page.route.includes('profile')) {
            // 档案页面
            if (page.setData) {
              page.setData({
                userInfo: null,
                currentUser: null,
                userProfiles: [],
                loading: false
              })
            }
          } else if (page.route.includes('records')) {
            // 记录页面
            if (page.setData) {
              page.setData({
                userInfo: null,
                records: [],
                loading: false
              })
            }
          }
        }
      })
    } catch (error) {
      console.error('清除页面数据失败:', error)
    }
  },

  // 检查登录状态
  isLoggedIn() {
    return this.globalData.isLoggedIn && storage.isLoggedIn()
  },

  // 获取系统信息
  getSystemInfo() {
    return this.globalData.systemInfo
  },

  // 获取应用配置
  getAppConfig() {
    return this.globalData.appConfig
  },

  // 检查功能是否启用
  isFeatureEnabled(featureName) {
    return this.globalData.appConfig.features[featureName] || false
  },

  // 获取openId
  getOpenId() {
    return storage.getOpenId()
  },

  // 检查是否有有效的openId
  hasValidOpenId() {
    return !!storage.getOpenId()
  },

  // 检查并更新Tab栏未读红点
  async checkAndUpdateTabBarBadge() {
    try {
      // 检查用户是否已登录
      if (!this.isLoggedIn()) {
        // 未登录时清除所有红点
        this.clearTabBarBadge()
        return
      }

      const api = require('./utils/api.js')

      // 获取文章未读数量和系统消息未读数量（留言反馈未读数量暂时注释，等待接口）
      const [articleUnreadRes, systemUnreadRes/*, feedbackUnreadRes*/] = await Promise.all([
        api.message.getUnreadCount().catch(() => ({ data: { count: 0 } })),
        api.systemMessages.getUnreadCount().catch(() => ({ data: { unreadCount: 0 } }))
        // api.feedback.getUnreadCount().catch(() => ({ data: { unreadCount: 0 } }))
      ])

      // 文章未读数量
      const articleUnread = articleUnreadRes?.data?.count || articleUnreadRes?.data?.unreadCount || 0

      // 系统消息未读数量
      const systemUnread = systemUnreadRes?.data?.unreadCount || systemUnreadRes?.data?.count || 0

      // 留言反馈未读数量（暂时注释，等待接口）
      // const feedbackUnread = feedbackUnreadRes?.data?.unreadCount || feedbackUnreadRes?.data?.count || 0
      const feedbackUnread = 0

      // 处理消息中心Tab（index: 2）- 对应文章未读
      if (articleUnread > 0) {
        wx.showTabBarRedDot({
          index: 2,
          success: () => {},
          fail: (err) => {
            console.error('显示消息中心红点失败:', err)
          }
        })
      } else {
        wx.hideTabBarRedDot({
          index: 2,
          success: () => {},
          fail: (err) => {
            console.error('隐藏消息中心红点失败:', err)
          }
        })
      }

      // 处理"我的"Tab（index: 3）- 对应留言反馈未读（系统消息未读也会显示红点）
      const totalUnreadForProfile = systemUnread + feedbackUnread
      if (totalUnreadForProfile > 0) {
        wx.showTabBarRedDot({
          index: 3,
          success: () => {
          },
          fail: (err) => {
            console.error('显示"我的"红点失败:', err)
          }
        })
      } else {
        wx.hideTabBarRedDot({
          index: 3,
          success: () => {
          },
          fail: (err) => {
            console.error('隐藏"我的"红点失败:', err)
          }
        })
      }
    } catch (error) {
      console.error('检查未读消息失败:', error)
    }
  },

  // 清除Tab栏红点
  clearTabBarBadge() {
    // 清除消息中心红点
    wx.hideTabBarRedDot({
      index: 2,
      success: () => {
      }
    })
    
    // 清除"我的"红点
    wx.hideTabBarRedDot({
      index: 3,
      success: () => {
      }
    })
  }
})
